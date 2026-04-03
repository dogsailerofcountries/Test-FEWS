from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


from api_demo.service import FEWSDemoService


def main():
    service = FEWSDemoService()
    payload = service.sync_once()
    meta = payload["meta"]
    print("Synced FEWS demo snapshot")
    print(f"generatedAt={meta['generatedAt']}")
    print(f"stations={meta['datasets']['stations']}")
    print(f"alerts={meta['datasets']['alerts']}")
    print(f"reservoirs={meta['datasets']['reservoirs']}")


if __name__ == "__main__":
    main()
