import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
import json

from .config import HOST, PORT, STATIC_DIR, SYNC_INTERVAL_SECONDS
from .service import FEWSDemoService


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


class SyncWorker:
    def __init__(self, service, interval_seconds=SYNC_INTERVAL_SECONDS):
        self.service = service
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()
        self._thread = None

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._run, daemon=True, name="fews-sync-worker")
        self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)

    def _run(self):
        self.service.sync_once()
        while not self._stop_event.wait(self.interval_seconds):
            self.service.sync_once()


def create_handler(service):
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
                json_response(self, service.health())
                return

            if path == "/api/fuentes":
                json_response(self, {"items": service.source_statuses()})
                return

            if path == "/api/overview":
                json_response(self, service.get_overview())
                return

            if path == "/api/estaciones":
                stations = self.filter_stations(service.localized_stations(language), query)
                json_response(self, {"items": stations, "total": len(stations)})
                return

            if path.startswith("/api/estaciones/") and path.endswith("/pronostico"):
                station_id = path.split("/")[3]
                station = service.get_station_by_id(station_id)
                if not station:
                    json_response(self, {"error": "Station not found"}, HTTPStatus.NOT_FOUND)
                    return
                json_response(self, {"stationId": station_id, "items": station.get("forecastSummary") or []})
                return

            if path.startswith("/api/estaciones/"):
                station_id = path.split("/")[3]
                station = service.get_station_by_id(station_id)
                if not station:
                    json_response(self, {"error": "Station not found"}, HTTPStatus.NOT_FOUND)
                    return
                station_copy = dict(station)
                station_copy["statusLabel"] = station_copy.get("statusLabel") or station_copy.get("status")
                json_response(self, station_copy)
                return

            if path == "/api/alertas/subzonas":
                json_response(self, {"items": service.localized_alerts(language)})
                return

            if path == "/api/embalses":
                json_response(self, {"items": service.get_reservoirs()})
                return

            if path == "/api/map-summary":
                json_response(self, service.get_map_summary())
                return

            if path == "/api/admin/sync":
                payload = service.sync_once()
                json_response(self, {"status": "ok", "generatedAt": payload["meta"]["generatedAt"]})
                return

            json_response(self, {"error": "Not found"}, HTTPStatus.NOT_FOUND)

        def filter_stations(self, stations, query):
            status_filter = (query.get("status") or [""])[0]
            department_filter = (query.get("department") or [""])[0]
            municipality_filter = (query.get("municipality") or [""])[0]
            zone_filter = (query.get("zone") or [""])[0]
            subzone_filter = (query.get("subzone") or [""])[0]
            river_filter = (query.get("river") or [""])[0]

            items = []
            for station in stations:
                if status_filter and station["status"] != status_filter:
                    continue
                if department_filter and station["department"] != department_filter:
                    continue
                if municipality_filter and station["municipality"] != municipality_filter:
                    continue
                if zone_filter and station["zoneName"] != zone_filter:
                    continue
                if subzone_filter and station["subzoneName"] != subzone_filter:
                    continue
                if river_filter and station["riverName"] != river_filter:
                    continue
                items.append(station)
            return items

        def log_message(self, format, *args):  # noqa: A003
            return

    return FEWSRequestHandler


def create_server(host=HOST, port=PORT):
    service = FEWSDemoService()
    worker = SyncWorker(service)
    worker.start()
    handler = create_handler(service)
    server = ThreadingHTTPServer((host, port), handler)
    server.service = service  # type: ignore[attr-defined]
    server.sync_worker = worker  # type: ignore[attr-defined]
    return server
