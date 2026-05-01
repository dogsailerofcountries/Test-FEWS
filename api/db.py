import sqlite3
import json
from datetime import datetime
from pathlib import Path
from .config import DB_FILE_PATH

def get_connection():
    # Ensure data directory exists
    DB_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_FILE_PATH), check_same_thread=False)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS snapshots (
            key TEXT PRIMARY KEY,
            payload_json TEXT,
            updated_at TIMESTAMP
        )
    ''')
    conn.commit()
    return conn

class SQLiteStore:
    def __init__(self):
        self._conn = get_connection()

    def get(self, key: str, default=None):
        cursor = self._conn.execute('SELECT payload_json FROM snapshots WHERE key = ?', (key,))
        row = cursor.fetchone()
        if row:
            try:
                return json.loads(row[0])
            except json.JSONDecodeError:
                return default
        return default

    def set(self, key: str, payload):
        payload_str = json.dumps(payload, ensure_ascii=False)
        self._conn.execute('''
            INSERT INTO snapshots (key, payload_json, updated_at) 
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET 
            payload_json=excluded.payload_json, 
            updated_at=excluded.updated_at
        ''', (key, payload_str, datetime.utcnow()))
        self._conn.commit()
