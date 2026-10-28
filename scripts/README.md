# Repository scripts

Run scripts from the repository root with the Python environment active.

- `python scripts/export_openapi.py`: writes the API's real schema to `shared/contracts/openapi.json`.
- `python scripts/export_openapi.py --check`: exits unsuccessfully if the checked-in schema differs from the running API definition; used by CI.

Dependency installation and development commands are documented in the root README. These scripts do not create commits or contact GitHub.
