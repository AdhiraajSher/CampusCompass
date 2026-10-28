"""Supabase client initialisation for CampusCompass backend.

Connects to the Supabase instance (https://dvbwgjmvzyyingygbsfx.supabase.co)
using the service role key. If credentials are not yet configured in .env,
it gracefully falls back so the server starts without crashing.
"""
import os
import warnings
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Project URL from Supabase dashboard
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dvbwgjmvzyyingygbsfx.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = None
db = None

if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        from supabase import Client, create_client
        supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        db = supabase
    except Exception as exc:
        warnings.warn(f"Failed to connect to Supabase: {exc}. Running in fallback/seed mode.")
        supabase = None
        db = None
