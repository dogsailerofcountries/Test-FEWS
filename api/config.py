from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data" / "latest"
HOST = os.environ.get("FEWS_HOST", "127.0.0.1")
PORT = int(os.environ.get("FEWS_PORT", "8001"))
FETCH_TIMEOUT_SECONDS = int(os.environ.get("FEWS_FETCH_TIMEOUT_SECONDS", "25"))
SYNC_INTERVAL_SECONDS = int(os.environ.get("FEWS_SYNC_INTERVAL_SECONDS", str(15 * 60)))
MAX_SIMPLIFIED_RING_VERTICES = int(os.environ.get("FEWS_MAX_SIMPLIFIED_RING_VERTICES", "320"))
DB_FILE_PATH = DATA_DIR / "fews_data.sqlite"
