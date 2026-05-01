from .db import SQLiteStore

class SnapshotStore:
    def __init__(self):
        self.store = SQLiteStore()

    def load(self, name, default):
        return self.store.get(name, default)

    def save(self, name, payload):
        self.store.set(name, payload)

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
