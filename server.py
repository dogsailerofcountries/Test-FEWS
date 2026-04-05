import os
import sys
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api_demo.config import HOST, PORT

def main():
    print(f"Starting FastAPI server on http://{HOST}:{PORT}")
    uvicorn.run("api_demo.app:app", host=HOST, port=PORT, log_level="info")

if __name__ == "__main__":
    main()
