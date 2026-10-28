"""Export FastAPI's real OpenAPI contract; --check detects contract drift."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "backend"))


def main() -> int:
    from app.main import app

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    target = ROOT / "shared" / "contracts" / "openapi.json"
    content = json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"
    if args.check:
        if not target.exists() or target.read_text() != content:
            print("API contract changed. Run: python scripts/export_openapi.py")
            return 1
    else:
        target.write_text(content)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
