"""Demo session token verification for the backend.

The Next.js frontend creates HMAC-signed demo tokens and forwards them
as Bearer tokens.  This module verifies those tokens so the backend can
trust the identity.
"""
import hmac
import hashlib
import json
import base64
import os
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DEMO_SESSION_SECRET = os.getenv("DEMO_SESSION_SECRET", "development-demo-only-change-me")

# Canonical identity list — must match the frontend's lib/domain.ts
IDENTITIES = {
    "studentdemo": {
        "id": "studentdemo",
        "name": "Aarav Shah",
        "role": "student",
        "title": "Student · Daily Check-in & Self-Tracking",
        "student_id": "00000000-0000-0000-0000-000000000001",
    },
    "anika": {"id": "anika", "name": "Anika Rao", "role": "teacher", "title": "Teacher / Instructor"},
    "sam":   {"id": "sam",   "name": "Sam Thomas", "role": "manager", "title": "Batch Manager"},
    "riya":  {"id": "riya",  "name": "Riya Sen",   "role": "mentor",  "title": "Mentor"},
}


def verify_demo_token(token: str) -> dict | None:
    """Verify an HMAC-SHA256 signed demo token.

    Token format (same as the Next.js session module):
        base64url(JSON payload) . base64url(HMAC-SHA256 signature)

    Returns the matching identity dict or None.
    """
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None

        payload_b64, signature_b64 = parts
        expected = hmac.new(
            DEMO_SESSION_SECRET.encode(),
            payload_b64.encode(),
            hashlib.sha256,
        ).digest()

        # Decode the provided signature
        # base64url uses - and _ instead of + and /, no padding
        actual = base64.urlsafe_b64decode(signature_b64 + "==")

        if not hmac.compare_digest(expected, actual):
            return None

        # Decode and parse the payload
        payload_json = base64.urlsafe_b64decode(payload_b64 + "==").decode()
        payload = json.loads(payload_json)

        # Check expiry
        exp = payload.get("exp")
        if not isinstance(exp, (int, float)) or exp < time.time() * 1000:
            # The frontend uses Date.now() which is milliseconds
            return None

        identity_id = payload.get("id")
        if identity_id in IDENTITIES:
            return IDENTITIES[identity_id]
        if "role" in payload:
            return {
                "id": str(identity_id),
                "name": payload.get("name", "User"),
                "role": payload.get("role", "student"),
                "student_id": payload.get("student_id"),
                "title": payload.get("title", f"Role: {payload.get('role')}"),
                "email": payload.get("email"),
            }
        return None

    except Exception:
        return None
