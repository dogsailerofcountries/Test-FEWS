import csv
import json
import ssl
import threading
import time
import urllib.request

from .config import FETCH_TIMEOUT_SECONDS
from .geometry import extract_simplified_rings
from .sources import SOURCES
from .store import SnapshotStore
from .utils import STATUS_PRIORITY, localize_status, normalize_status, now_iso, parse_float


class FEWSDemoService:
    def __init__(self, store=None):
        self.store = store or SnapshotStore()
        persisted = self.store.load_all()
        self._state = persisted
        self._lock = threading.Lock()
        self._ssl_context = ssl._create_unverified_context()

    def _download(self, source):
        with urllib.request.urlopen(
            source.url,
            timeout=FETCH_TIMEOUT_SECONDS,
            context=self._ssl_context,
        ) as response:
            payload = response.read().decode("utf-8", "ignore")
        if source.source_type == "geojson":
            return json.loads(payload)
        return list(csv.DictReader(payload.splitlines(), delimiter=";"))

    def sync_once(self):
        started_at = now_iso()
        with self._lock:
            raw_sources = dict(self._state.get("raw_sources") or {})
            previous_meta = self._state.get("meta") or {}

        source_statuses = []
        for key, source in SOURCES.items():
            started = time.time()
            try:
                raw_payload = self._download(source)
                raw_sources[key] = {
                    "fetchedAt": now_iso(),
                    "data": raw_payload,
                }
                source_statuses.append(
                    {
                        "id": key,
                        "name": source.url,
                        "status": "ok",
                        "lastAttemptAt": now_iso(),
                        "lastSuccessAt": now_iso(),
                        "latencyMs": round((time.time() - started) * 1000, 2),
                        "snapshotAgeSeconds": 0,
                        "error": None,
                    }
                )
            except Exception as error:  # noqa: BLE001
                previous = next((item for item in previous_meta.get("sourceStatuses", []) if item.get("id") == key), None)
                last_success_at = previous.get("lastSuccessAt") if previous else None
                status = "degraded" if key in raw_sources else "down"
                snapshot_age = None
                if key in raw_sources and raw_sources[key].get("fetchedAt"):
                    snapshot_age = max(0, int(time.time() - self._iso_to_epoch(raw_sources[key]["fetchedAt"])))
                source_statuses.append(
                    {
                        "id": key,
                        "name": source.url,
                        "status": status,
                        "lastAttemptAt": now_iso(),
                        "lastSuccessAt": last_success_at,
                        "latencyMs": round((time.time() - started) * 1000, 2),
                        "snapshotAgeSeconds": snapshot_age,
                        "error": str(error),
                    }
                )

        stations = self._build_stations(raw_sources.get("stations", {}).get("data"), raw_sources.get("forecast_hq", {}).get("data"))
        alerts = self._build_alerts(raw_sources.get("alerts_subzones", {}).get("data"))
        reservoirs = self._build_reservoirs(raw_sources.get("reservoirs", {}).get("data"))
        map_summary = self._build_map_summary(
            stations,
            alerts,
            raw_sources.get("subzone_pobs", {}).get("data"),
            raw_sources.get("water_shortage", {}).get("data"),
        )
        overview = self._build_overview(stations, alerts, reservoirs, source_statuses)

        payload = {
            "meta": {
                "generatedAt": started_at,
                "sourceStatuses": source_statuses,
                "datasets": {
                    "stations": len(stations),
                    "alerts": len(alerts),
                    "reservoirs": len(reservoirs),
                },
            },
            "raw_sources": raw_sources,
            "overview": overview,
            "stations": stations,
            "alerts": alerts,
            "reservoirs": reservoirs,
            "map_summary": map_summary,
        }
        self.store.save_all(payload)
        with self._lock:
            self._state = payload
        return payload

    def _iso_to_epoch(self, iso_value):
        from datetime import datetime

        return datetime.fromisoformat(iso_value).timestamp()

    def get_meta(self):
        with self._lock:
            return dict(self._state.get("meta") or {})

    def get_overview(self):
        with self._lock:
            return dict(self._state.get("overview") or {})

    def get_stations(self):
        with self._lock:
            return list(self._state.get("stations") or [])

    def get_station_by_id(self, station_id):
        for station in self.get_stations():
            if station.get("stationId") == station_id:
                return station
        return None

    def get_alerts(self):
        with self._lock:
            return list(self._state.get("alerts") or [])

    def get_reservoirs(self):
        with self._lock:
            return list(self._state.get("reservoirs") or [])

    def get_map_summary(self):
        with self._lock:
            payload = dict(self._state.get("map_summary") or {})
            payload.setdefault("extraLayers", [])
            return payload

    def source_statuses(self):
        return list((self.get_meta() or {}).get("sourceStatuses") or [])

    def health(self):
        statuses = self.source_statuses()
        overall = "down"
        if any(item["status"] == "ok" for item in statuses):
            overall = "ok"
        if statuses and all(item["status"] == "degraded" for item in statuses if item["status"] != "down"):
            overall = "degraded"
        if any(item["status"] == "degraded" for item in statuses):
            overall = "degraded"
        return {"status": overall, "generatedAt": now_iso(), "sources": statuses}

    def localized_stations(self, language):
        items = []
        for station in self.get_stations():
            station_copy = dict(station)
            station_copy["statusLabel"] = localize_status(station_copy.get("status"), language)
            items.append(station_copy)
        return items

    def localized_alerts(self, language):
        items = []
        for alert in self.get_alerts():
            alert_copy = dict(alert)
            alert_copy["severityLabel"] = localize_status(alert_copy.get("severity"), language)
            items.append(alert_copy)
        return items

    def _build_forecast_index(self, forecast_rows):
        by_station = {}
        for row in forecast_rows or []:
            station_id = row.get("ID_ESTACION")
            if not station_id:
                continue
            item = {
                "stationId": station_id,
                "forecastAt": row.get("FECHA_HORA"),
                "forecastLevel": parse_float(row.get("NIVEL_PRONS")),
                "forecastFlow": parse_float(row.get("CAUDAL_PRONS")),
            }
            by_station.setdefault(station_id, []).append(item)
        for series in by_station.values():
            series.sort(key=lambda entry: entry.get("forecastAt") or "")
        return by_station

    def _build_stations(self, stations_geojson, forecast_rows):
        forecast_by_station = self._build_forecast_index(forecast_rows)
        items = []
        for feature in (stations_geojson or {}).get("features", []):
            props = feature.get("properties") or {}
            coords = ((feature.get("geometry") or {}).get("coordinates") or [None, None])
            station_id = props.get("id")
            status = normalize_status(props.get("Estado"))
            items.append(
                {
                    "stationId": station_id,
                    "stationName": props.get("nombre"),
                    "stationCode": station_id,
                    "riverName": props.get("corriente"),
                    "subzoneName": props.get("subzona"),
                    "zoneName": props.get("zona"),
                    "populationCenter": props.get("cenpoblado"),
                    "municipality": props.get("municipio"),
                    "department": props.get("depart"),
                    "category": props.get("ctg"),
                    "altitude": parse_float(props.get("altitud")),
                    "longitude": parse_float(coords[0]),
                    "latitude": parse_float(coords[1]),
                    "currentLevelSensor": parse_float(props.get("ultimonivelsen")),
                    "currentLevelObserved": parse_float(props.get("ultimonivelobs")),
                    "thresholds": {
                        "yellow": parse_float(props.get("uamarilla")),
                        "orange": parse_float(props.get("unaranja")),
                        "red": parse_float(props.get("uroja")),
                        "low": parse_float(props.get("ubajos")),
                        "historicalMax": parse_float(props.get("umaxhis")),
                    },
                    "status": status,
                    "forecastSummary": forecast_by_station.get(station_id, [])[:12],
                }
            )
        items.sort(key=lambda station: (-STATUS_PRIORITY.get(station["status"], 0), station["department"] or "", station["stationName"] or ""))
        return items

    def _build_alerts(self, alerts_geojson):
        items = []
        for feature in (alerts_geojson or {}).get("features", []):
            props = feature.get("properties") or {}
            severity = normalize_status(props.get("umbralaler"))
            items.append(
                {
                    "subzoneId": str(props.get("SZH") or props.get("id")),
                    "subzoneName": props.get("NOMSZH"),
                    "zoneName": props.get("NOMZH"),
                    "macroAreaName": props.get("NOMAH"),
                    "issuedAt": props.get("Fecha"),
                    "severity": severity,
                    "severityCode": props.get("Alerta"),
                    "observedMetric": parse_float(props.get("pobsszh")),
                    "feature": feature,
                }
            )
        items.sort(key=lambda alert: (-STATUS_PRIORITY.get(alert["severity"], 0), alert["zoneName"] or "", alert["subzoneName"] or ""))
        return items

    def _build_reservoirs(self, rows):
        items = []
        for row in rows or []:
            items.append(
                {
                    "reservoirId": row.get("ID_Embalse"),
                    "timestamp": row.get("FECHA"),
                    "usefulVolumeMass": parse_float(row.get("Vol.util.masa")),
                    "usefulVolumePct": parse_float(row.get("Vol.util.porcentaje")),
                    "spillVolume": parse_float(row.get("Vol.ver")),
                    "dischargeVolume": parse_float(row.get("Vol.des")),
                    "capacityVolume": parse_float(row.get("Vol.cap")),
                    "turbineVolume": parse_float(row.get("Vol.tur")),
                    "observedPrecipitation": parse_float(row.get("P.observada")),
                    "forecastPrecipitation": parse_float(row.get("P.pronosticada")),
                    "forecastUsefulVolumeMass": parse_float(row.get("Vol.util.pro")),
                    "forecastUsefulVolumePct": parse_float(row.get("Vol.util.porcetaje.pro")),
                }
            )
        items.sort(key=lambda item: item["reservoirId"] or "")
        return items

    def _build_overview(self, stations, alerts, reservoirs, source_statuses):
        counts = {key: 0 for key in ["red", "orange", "yellow", "normal", "no_data"]}
        for station in stations:
            counts[station["status"]] = counts.get(station["status"], 0) + 1
        return {
            "generatedAt": now_iso(),
            "stationCounts": counts,
            "stationTotal": len(stations),
            "highlightedStations": stations[:12],
            "activeAlerts": alerts[:10],
            "reservoirTotal": len(reservoirs),
            "sourceStatuses": source_statuses,
        }

    def _normalize_extra_layer(self, layer_id, title, features_geojson, visible=False, style_hint="polygon"):
        normalized_features = []
        for feature in (features_geojson or {}).get("features", []):
            geometry = feature.get("geometry") or {}
            properties = feature.get("properties") or {}
            geometry_type = geometry.get("type")

            if geometry_type in {"Polygon", "MultiPolygon"}:
                rings = extract_simplified_rings(geometry)
                if not rings:
                    continue
                feature_type = "polygon"
                payload_geometry = {"rings": rings}
            elif geometry_type == "Point":
                coordinates = geometry.get("coordinates") or [None, None]
                x = parse_float(coordinates[0])
                y = parse_float(coordinates[1])
                if x is None or y is None:
                    continue
                feature_type = "point"
                payload_geometry = {"coordinates": [x, y]}
            else:
                continue

            normalized_features.append(
                {
                    "id": str(
                        properties.get("id")
                        or properties.get("ID")
                        or properties.get("OBJECTID")
                        or properties.get("CODIGO")
                        or properties.get("NOM_MPIO")
                        or len(normalized_features) + 1
                    ),
                    "label": (
                        properties.get("NOMSZH")
                        or properties.get("NOM_MPIO")
                        or properties.get("municipio")
                        or properties.get("nombre")
                        or title
                    ),
                    "geometryType": feature_type,
                    "geometry": payload_geometry,
                    "properties": properties,
                }
            )

        return {
            "id": layer_id,
            "title": title,
            "visibleByDefault": visible,
            "styleHint": style_hint,
            "featureCount": len(normalized_features),
            "features": normalized_features,
        }

    def _build_map_summary(self, stations, alerts, subzone_pobs_geojson, water_shortage_geojson):
        map_stations = []
        for station in stations:
            if station["longitude"] is None or station["latitude"] is None:
                continue
            map_stations.append(
                {
                    "stationId": station["stationId"],
                    "stationName": station["stationName"],
                    "status": station["status"],
                    "longitude": station["longitude"],
                    "latitude": station["latitude"],
                    "riverName": station["riverName"],
                }
            )

        map_alerts = []
        for alert in alerts:
            geometry = (alert["feature"] or {}).get("geometry") or {}
            rings = extract_simplified_rings(geometry)
            if not rings:
                continue
            min_x = min_y = max_x = max_y = None
            vertex_count = 0
            sum_x = 0.0
            sum_y = 0.0
            for ring in rings:
                for x, y in ring:
                    vertex_count += 1
                    sum_x += x
                    sum_y += y
                    min_x = x if min_x is None else min(min_x, x)
                    max_x = x if max_x is None else max(max_x, x)
                    min_y = y if min_y is None else min(min_y, y)
                    max_y = y if max_y is None else max(max_y, y)
            if vertex_count == 0:
                continue
            map_alerts.append(
                {
                    "subzoneId": alert["subzoneId"],
                    "subzoneName": alert["subzoneName"],
                    "zoneName": alert["zoneName"],
                    "severity": alert["severity"],
                    "issuedAt": alert["issuedAt"],
                    "vertexCount": vertex_count,
                    "rings": rings,
                    "bbox": {"minX": min_x, "maxX": max_x, "minY": min_y, "maxY": max_y},
                    "centroid": {"x": sum_x / vertex_count, "y": sum_y / vertex_count},
                }
            )
        extra_layers = [
            self._normalize_extra_layer(
                "subzone_pobs",
                "Precipitacion observada por subzona",
                subzone_pobs_geojson,
                visible=False,
                style_hint="pobs",
            ),
            self._normalize_extra_layer(
                "water_shortage",
                "Desabastecimiento por municipio",
                water_shortage_geojson,
                visible=False,
                style_hint="water_shortage",
            ),
            {
                "id": "runap",
                "title": "RUNAP",
                "visibleByDefault": False,
                "styleHint": "service",
                "featureCount": None,
                "serviceUrl": "https://mapas.parquesnacionales.gov.co/arcgis/rest/services/pnn/runap/MapServer",
                "layerId": 0,
            },
        ]
        return {
            "generatedAt": now_iso(),
            "stations": map_stations,
            "alerts": map_alerts,
            "extraLayers": extra_layers,
        }
