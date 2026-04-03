import json
from datetime import datetime, timezone


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


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))
