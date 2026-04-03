from api_demo.app import create_server


def main():
    httpd = create_server()
    try:
        host, port = httpd.server_address
        print(f"FEWS demo API listening on http://{host}:{port}")
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        sync_worker = getattr(httpd, "sync_worker", None)
        if sync_worker is not None:
            sync_worker.stop()
        httpd.server_close()


if __name__ == "__main__":
    main()
    raise SystemExit(0)

"""


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
HOST = os.environ.get("FEWS_HOST", "127.0.0.1")
PORT = int(os.environ.get("FEWS_PORT", "8000"))
FETCH_TIMEOUT_SECONDS = 25
MAX_SIMPLIFIED_RING_VERTICES = 320


class DataSource:
    def __init__(self, key, url, source_type, ttl_seconds):
        self.key = key
        self.url = url
        self.source_type = source_type
        self.ttl_seconds = ttl_seconds


SOURCES = {
    "stations": DataSource(
        "stations",
        "https://fews.ideam.gov.co/visorfews/descargas/ReporteTablaEstaciones.json",
        "geojson",
        10 * 60,
    ),
    "alerts_subzones": DataSource(
        "alerts_subzones",
        "https://fews.ideam.gov.co/visorfews/descargas/SZH_Alertas_Pobs.json",
        "geojson",
        15 * 60,
    ),
    "forecast_hq": DataSource(
        "forecast_hq",
        "https://fews.ideam.gov.co/visorfews/descargas/SeriesPronosticoHQ.csv",
        "csv",
        30 * 60,
    ),
    "reservoirs": DataSource(
        "reservoirs",
        "https://fews.ideam.gov.co/visorfews/descargas/SeriesEmbalses.csv",
        "csv",
        30 * 60,
    ),
}

STATUS_MAP = {
    "normal": "normal",
    "amarilla": "yellow",
    "naranja": "orange",
    "roja": "red",
}

STATUS_PRIORITY = {"red": 4, "orange": 3, "yellow": 2, "normal": 1, "no_data": 0}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def parse_float(value):
    if value in (None, "", "null"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_status(raw_value):
    if not raw_value:
        return "no_data"
    return STATUS_MAP.get(str(raw_value).strip().lower(), "no_data")


def _point_sq_distance(point_a, point_b):
    dx = point_a[0] - point_b[0]
    dy = point_a[1] - point_b[1]
    return dx * dx + dy * dy


def _segment_sq_distance(point, start, end):
    x, y = start[0], start[1]
    dx = end[0] - x
    dy = end[1] - y
    if dx != 0 or dy != 0:
        t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy)
        if t > 1:
            x = end[0]
            y = end[1]
        elif t > 0:
            x += dx * t
            y += dy * t
    dx = point[0] - x
    dy = point[1] - y
    return dx * dx + dy * dy


def _douglas_peucker(points, tolerance_sq):
    if len(points) <= 2:
        return points[:]
    max_distance = tolerance_sq
    index = None
    for point_index in range(1, len(points) - 1):
        distance = _segment_sq_distance(points[point_index], points[0], points[-1])
        if distance > max_distance:
            index = point_index
            max_distance = distance
    if index is None:
        return [points[0], points[-1]]
    left = _douglas_peucker(points[: index + 1], tolerance_sq)
    right = _douglas_peucker(points[index:], tolerance_sq)
    return left[:-1] + right


def simplify_ring(points, max_vertices=MAX_SIMPLIFIED_RING_VERTICES):
    clean_points = []
    for point in points:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            continue
        x = parse_float(point[0])
        y = parse_float(point[1])
        if x is None or y is None:
            continue
        clean_points.append([x, y])

    if len(clean_points) < 4:
        return clean_points

    is_closed = clean_points[0] == clean_points[-1]
    open_points = clean_points[:-1] if is_closed else clean_points[:]
    if len(open_points) <= max_vertices:
        simplified = open_points
    else:
        tolerance_sq = 0.0
        simplified = open_points
        for step in range(1, 13):
            candidate = _douglas_peucker(open_points, tolerance_sq)
            simplified = candidate
            if len(candidate) <= max_vertices:
                break
            tolerance_sq = 10 ** (step - 6)

    if simplified and simplified[0] != simplified[-1]:
        simplified = simplified + [simplified[0]]
    if len(simplified) < 4 and clean_points:
        fallback = open_points[:3] if len(open_points) >= 3 else open_points[:]
        if fallback and fallback[0] != fallback[-1]:
            fallback = fallback + [fallback[0]]
        return fallback
    return simplified


def extract_simplified_rings(geometry):
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    rings = []
    if geometry_type == "Polygon":
        polygon_rings = coordinates if isinstance(coordinates, list) else []
        for ring in polygon_rings:
            simplified = simplify_ring(ring)
            if simplified:
                rings.append(simplified)
    elif geometry_type == "MultiPolygon":
        for polygon in coordinates:
            for ring in polygon or []:
                simplified = simplify_ring(ring)
                if simplified:
                    rings.append(simplified)
    return rings


def localize_status(status, language):
    labels = {
        "es": {
            "normal": "Normal",
            "yellow": "Amarilla",
            "orange": "Naranja",
            "red": "Roja",
            "no_data": "Sin dato",
        },
        "en": {
            "normal": "Normal",
            "yellow": "Yellow",
            "orange": "Orange",
            "red": "Red",
            "no_data": "No data",
        },
    }
    return labels.get(language, labels["es"]).get(status, status)


class FEWSRepository:
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()
        self._ssl_context = ssl._create_unverified_context()

    def _download_text(self, source):
        with urllib.request.urlopen(
            source.url,
            timeout=FETCH_TIMEOUT_SECONDS,
            context=self._ssl_context,
        ) as response:
            return response.read().decode("utf-8", "ignore")

    def _fetch_source(self, source):
        started_at = time.time()
        snapshot = {
            "status": "down",
            "lastAttemptAt": now_iso(),
            "lastSuccessAt": None,
            "latencyMs": None,
            "error": None,
            "data": None,
        }
        try:
            payload = self._download_text(source)
            data = json.loads(payload) if source.source_type == "geojson" else list(csv.DictReader(payload.splitlines(), delimiter=";"))
            snapshot.update(
                {
                    "status": "ok",
                    "lastSuccessAt": now_iso(),
                    "latencyMs": round((time.time() - started_at) * 1000, 2),
                    "data": data,
                }
            )
        except Exception as error:  # noqa: BLE001
            snapshot.update(
                {
                    "status": "down",
                    "latencyMs": round((time.time() - started_at) * 1000, 2),
                    "error": str(error),
                }
            )
        return snapshot

    def get_snapshot(self, source_key):
        source = SOURCES[source_key]
        with self._lock:
            cached = self._cache.get(source_key)
            if cached and time.time() - cached["fetchedAtEpoch"] <= source.ttl_seconds:
                return cached

        fresh = self._fetch_source(source)
        fresh["fetchedAtEpoch"] = time.time()
        with self._lock:
            previous = self._cache.get(source_key)
            if fresh["status"] == "ok":
                self._cache[source_key] = fresh
                return fresh
            if previous and previous.get("data") is not None:
                previous_copy = dict(previous)
                previous_copy["status"] = "degraded"
                previous_copy["error"] = fresh["error"]
                previous_copy["lastAttemptAt"] = fresh["lastAttemptAt"]
                previous_copy["latencyMs"] = fresh["latencyMs"]
                return previous_copy
            self._cache[source_key] = fresh
            return fresh

    def source_statuses(self):
        items = []
        for key, source in SOURCES.items():
            snapshot = self.get_snapshot(key)
            items.append(
                {
                    "id": key,
                    "name": source.url,
                    "status": snapshot["status"],
                    "lastAttemptAt": snapshot["lastAttemptAt"],
                    "lastSuccessAt": snapshot["lastSuccessAt"],
                    "latencyMs": snapshot["latencyMs"],
                    "error": snapshot["error"],
                }
            )
        return items

    def _build_forecast_index(self):
        snapshot = self.get_snapshot("forecast_hq")
        by_station = {}
        for row in snapshot.get("data") or []:
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

    def stations(self):
        snapshot = self.get_snapshot("stations")
        forecast_by_station = self._build_forecast_index()
        items = []
        for feature in (snapshot.get("data") or {}).get("features", []):
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

    def station_by_id(self, station_id):
        for station in self.stations():
            if station["stationId"] == station_id:
                return station
        return None

    def alerts(self):
        snapshot = self.get_snapshot("alerts_subzones")
        items = []
        for feature in (snapshot.get("data") or {}).get("features", []):
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

    def reservoirs(self):
        snapshot = self.get_snapshot("reservoirs")
        items = []
        for row in snapshot.get("data") or []:
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

    def overview(self):
        stations = self.stations()
        alerts = self.alerts()
        reservoirs = self.reservoirs()
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
            "sourceStatuses": self.source_statuses(),
        }

    def map_summary(self):
        stations = []
        for station in self.stations():
            if station["longitude"] is None or station["latitude"] is None:
                continue
            stations.append(
                {
                    "stationId": station["stationId"],
                    "stationName": station["stationName"],
                    "status": station["status"],
                    "longitude": station["longitude"],
                    "latitude": station["latitude"],
                    "riverName": station["riverName"],
                }
            )

        alerts = []
        for alert in self.alerts():
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
            alerts.append(
                {
                    "subzoneId": alert["subzoneId"],
                    "subzoneName": alert["subzoneName"],
                    "zoneName": alert["zoneName"],
                    "severity": alert["severity"],
                    "issuedAt": alert["issuedAt"],
                    "vertexCount": vertex_count,
                    "rings": rings,
                    "bbox": {
                        "minX": min_x,
                        "maxX": max_x,
                        "minY": min_y,
                        "maxY": max_y,
                    },
                    "centroid": {
                        "x": sum_x / vertex_count,
                        "y": sum_y / vertex_count,
                    },
                }
            )

        return {
            "generatedAt": now_iso(),
            "stations": stations,
            "alerts": alerts,
        }


REPOSITORY = FEWSRepository()


def json_response(handler, payload, status=HTTPStatus.OK):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def file_response(handler, file_path):
    if not file_path.exists() or not file_path.is_file():
        handler.send_error(HTTPStatus.NOT_FOUND, "Not Found")
        return
    content = file_path.read_bytes()
    mime = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }.get(file_path.suffix.lower(), "application/octet-stream")
    handler.send_response(HTTPStatus.OK)
    handler.send_header("Content-Type", mime)
    handler.send_header("Content-Length", str(len(content)))
    handler.end_headers()
    handler.wfile.write(content)


class FEWSRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api(parsed)
            return
        if parsed.path == "/":
            preferred_entry = STATIC_DIR / "app-shell.html"
            file_response(self, preferred_entry if preferred_entry.exists() else STATIC_DIR / "index.html")
            return
        file_response(self, STATIC_DIR / parsed.path.lstrip("/"))

    def handle_api(self, parsed):
        path = parsed.path
        query = parse_qs(parsed.query)
        language = (query.get("lang") or ["es"])[0]

        if path == "/api/health":
            statuses = REPOSITORY.source_statuses()
            overall = "down"
            if any(item["status"] == "ok" for item in statuses):
                overall = "ok"
            if any(item["status"] == "degraded" for item in statuses):
                overall = "degraded"
            json_response(self, {"status": overall, "generatedAt": now_iso(), "sources": statuses})
            return

        if path == "/api/fuentes":
            json_response(self, {"items": REPOSITORY.source_statuses()})
            return

        if path == "/api/overview":
            json_response(self, REPOSITORY.overview())
            return

        if path == "/api/estaciones":
            stations = self.filter_stations(REPOSITORY.stations(), query)
            items = []
            for station in stations:
                station_copy = dict(station)
                station_copy["statusLabel"] = localize_status(station["status"], language)
                items.append(station_copy)
            json_response(self, {"items": items, "total": len(items)})
            return

        if path.startswith("/api/estaciones/") and path.endswith("/pronostico"):
            station_id = path.split("/")[3]
            station = REPOSITORY.station_by_id(station_id)
            if not station:
                json_response(self, {"error": "Station not found"}, HTTPStatus.NOT_FOUND)
                return
            json_response(self, {"stationId": station_id, "items": station["forecastSummary"]})
            return

        if path.startswith("/api/estaciones/"):
            station_id = path.split("/")[3]
            station = REPOSITORY.station_by_id(station_id)
            if not station:
                json_response(self, {"error": "Station not found"}, HTTPStatus.NOT_FOUND)
                return
            payload = dict(station)
            payload["statusLabel"] = localize_status(station["status"], language)
            json_response(self, payload)
            return

        if path == "/api/alertas/subzonas":
            items = []
            for alert in REPOSITORY.alerts():
                alert_copy = dict(alert)
                alert_copy["severityLabel"] = localize_status(alert["severity"], language)
                items.append(alert_copy)
            json_response(self, {"items": items, "total": len(items)})
            return

        if path == "/api/mapa/estaciones":
            features = []
            for station in REPOSITORY.stations():
                features.append(
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [station["longitude"], station["latitude"]]},
                        "properties": {
                            "stationId": station["stationId"],
                            "stationName": station["stationName"],
                            "status": station["status"],
                            "statusLabel": localize_status(station["status"], language),
                            "riverName": station["riverName"],
                        },
                    }
                )
            json_response(self, {"type": "FeatureCollection", "features": features})
            return

        if path == "/api/map-summary":
            json_response(self, REPOSITORY.map_summary())
            return

        if path == "/api/mapa/alertas":
            features = []
            for alert in REPOSITORY.alerts():
                feature = dict(alert["feature"])
                feature.setdefault("properties", {})
                feature["properties"]["severityNormalized"] = alert["severity"]
                feature["properties"]["severityLabel"] = localize_status(alert["severity"], language)
                features.append(feature)
            json_response(self, {"type": "FeatureCollection", "features": features})
            return

        if path == "/api/embalses":
            items = REPOSITORY.reservoirs()
            json_response(self, {"items": items, "total": len(items)})
            return

        if path.startswith("/api/embalses/"):
            reservoir_id = path.split("/")[3]
            for reservoir in REPOSITORY.reservoirs():
                if reservoir["reservoirId"] == reservoir_id:
                    json_response(self, reservoir)
                    return
            json_response(self, {"error": "Reservoir not found"}, HTTPStatus.NOT_FOUND)
            return

        json_response(self, {"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def filter_stations(self, stations, query):
        filters = {
            "status": "status",
            "department": "department",
            "municipality": "municipality",
            "zone": "zoneName",
            "subzone": "subzoneName",
            "river": "riverName",
        }
        result = stations
        for query_key, field_name in filters.items():
            raw_value = (query.get(query_key) or [""])[0].strip().lower()
            if raw_value:
                result = [station for station in result if str(station.get(field_name) or "").strip().lower() == raw_value]
        search = (query.get("search") or [""])[0].strip().lower()
        if search:
            result = [
                station
                for station in result
                if any(
                    search in str(station.get(field_name) or "").lower()
                    for field_name in ["stationId", "stationName", "riverName", "municipality", "department", "subzoneName"]
                )
            ]
        return result

    def log_message(self, format, *args):  # noqa: A003
        return


def main():
    server = ThreadingHTTPServer((HOST, PORT), FEWSRequestHandler)
    print(f"FEWS Web Nuevo available at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
"""
