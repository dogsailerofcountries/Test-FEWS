from .config import DATA_DIR
from .utils import read_json, write_json


class SnapshotStore:
    def __init__(self, base_dir=DATA_DIR):
        self.base_dir = base_dir

    def _path(self, name):
        return self.base_dir / f"{name}.json"

    def load(self, name, default):
        return read_json(self._path(name), default)

    def save(self, name, payload):
        write_json(self._path(name), payload)

    def load_all(self):
        return {
            "meta": self.load("meta", {"generatedAt": None, "sourceStatuses": [], "datasets": {}}),
            "raw_sources": self.load("raw_sources", {}),
            "overview": self.load("overview", {"generatedAt": None, "stationCounts": {}, "stationTotal": 0, "highlightedStations": [], "activeAlerts": [], "reservoirTotal": 0, "sourceStatuses": []}),
            "stations": self.load("stations", []),
            "alerts": self.load("alerts", []),
            "reservoirs": self.load("reservoirs", []),
            "map_summary": self.load("map_summary", {"generatedAt": None, "stations": [], "alerts": [], "extraLayers": []}),
        }

    def save_all(self, payload):
        self.save("meta", payload["meta"])
        self.save("raw_sources", payload["raw_sources"])
        self.save("overview", payload["overview"])
        self.save("stations", payload["stations"])
        self.save("alerts", payload["alerts"])
        self.save("reservoirs", payload["reservoirs"])
        self.save("map_summary", payload["map_summary"])
