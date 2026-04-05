import threading
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional

from .config import STATIC_DIR, SYNC_INTERVAL_SECONDS
from .service import FEWSDemoService

app = FastAPI()
service = FEWSDemoService()

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

worker = SyncWorker(service)

@app.on_event("startup")
def startup_event():
    worker.start()

@app.on_event("shutdown")
def shutdown_event():
    worker.stop()

@app.get("/api/health")
def get_health():
    return JSONResponse(content=service.health())

@app.get("/api/fuentes")
def get_fuentes():
    return JSONResponse(content={"items": service.source_statuses()})

@app.get("/api/overview")
def get_overview():
    return JSONResponse(content=service.get_overview())

@app.get("/api/estaciones")
def get_estaciones(
    lang: str = "es", 
    status: str = "", 
    department: str = "", 
    municipality: str = "", 
    zone: str = "", 
    subzone: str = "", 
    river: str = ""
):
    stations = service.localized_stations(lang)
    items = []
    for station in stations:
        if status and station["status"] != status: continue
        if department and station["department"] != department: continue
        if municipality and station["municipality"] != municipality: continue
        if zone and station["zoneName"] != zone: continue
        if subzone and station["subzoneName"] != subzone: continue
        if river and station["riverName"] != river: continue
        items.append(station)
    return JSONResponse(content={"items": items, "total": len(items)})

@app.get("/api/estaciones/{station_id}/pronostico")
def get_estacion_pronostico(station_id: str):
    station = service.get_station_by_id(station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return JSONResponse(content={"stationId": station_id, "items": station.get("forecastSummary") or []})

@app.get("/api/estaciones/{station_id}")
def get_estacion(station_id: str):
    station = service.get_station_by_id(station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    station_copy = dict(station)
    station_copy["statusLabel"] = station_copy.get("statusLabel") or station_copy.get("status")
    return JSONResponse(content=station_copy)

@app.get("/api/alertas/subzonas")
def get_alertas_subzonas(lang: str = "es"):
    return JSONResponse(content={"items": service.localized_alerts(lang)})

@app.get("/api/embalses")
def get_embalses():
    return JSONResponse(content={"items": service.get_reservoirs()})

@app.get("/api/map-summary")
def get_map_summary():
    return JSONResponse(content=service.get_map_summary())

@app.get("/api/admin/sync")
def admin_sync():
    payload = service.sync_once()
    return JSONResponse(content={"status": "ok", "generatedAt": payload["meta"]["generatedAt"]})

# Serve static files and fallback to index.html/app-shell.html
from starlette.responses import FileResponse

@app.get("/")
def catch_root():
    preferred_entry = STATIC_DIR / "app-shell.html"
    if preferred_entry.exists():
        return FileResponse(preferred_entry)
    return FileResponse(STATIC_DIR / "index.html")

app.mount("/", StaticFiles(directory=STATIC_DIR), name="static")
