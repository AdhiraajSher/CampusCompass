#!/usr/bin/env bash
# CampusCompass — start both backend and frontend in development mode.
# Usage: ./dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CampusCompass — Development Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ensure backend .env exists
if [ ! -f "$ROOT/backend/.env" ]; then
  if [ -f "$ROOT/backend/.env.example" ]; then
    echo "→ Creating backend/.env from .env.example"
    cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  fi
fi

# Ensure frontend .env exists
if [ ! -f "$ROOT/frontend/.env" ]; then
  if [ -f "$ROOT/frontend/.env.example" ]; then
    echo "→ Creating frontend/.env from .env.example"
    cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"
  fi
fi

echo ""
echo "  Backend  → http://127.0.0.1:8000  (FastAPI + Uvicorn)"
echo "  Frontend → http://127.0.0.1:5174  (Next.js)"
echo "  API Docs → http://127.0.0.1:8000/docs (Swagger UI)"
echo ""
echo "  Supabase: https://dvbwgjmvzyyingygbsfx.supabase.co"
echo "  OpenRouter: https://openrouter.ai/api/v1 (model: openrouter/free)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cleanup() {
  echo ""
  echo "Shutting down..."
  kill 0 2>/dev/null || true
}
trap cleanup EXIT

# 1. Start backend
cd "$ROOT/backend"
if [ -d ".venv" ]; then
  source .venv/bin/activate
fi
python3 -m uvicorn main:app --reload --host "${BACKEND_HOST:-127.0.0.1}" --port "${BACKEND_PORT:-8000}" &

# 2. Start frontend
cd "$ROOT/frontend"
npm run dev -- -p "${FRONTEND_PORT:-5174}" &

wait
