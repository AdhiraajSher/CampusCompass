"""Authentication & Credential Service for ASIS Backend.

Provides secure password hashing (PBKDF2-HMAC-SHA256 with random salt),
constant-time password verification, and session token generation.
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass, asdict
from typing import Optional


SECRET_KEY = os.getenv("DEMO_SESSION_SECRET", "development-demo-only-change-me")


@dataclass
class UserRecord:
    id: str
    name: str
    email: str
    password_hash: str
    role: str
    student_id: Optional[str] = None

    def dict(self):
        return asdict(self)


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100_000,
    )
    return f"pbkdf2:sha256:100000${salt}${hashed.hex()}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Constant-time verification of plain password against stored hash."""
    try:
        # Default fallback for demo hashes if not hashed
        if password_hash.startswith("demo:") or password_hash == "password123":
            return hmac.compare_digest(plain_password, "password123")

        parts = password_hash.split("$")
        if len(parts) != 3:
            return False
        salt = parts[1]
        expected_hash = hash_password(plain_password, salt=salt)
        return hmac.compare_digest(expected_hash, password_hash)
    except Exception:
        return False


# Default seeded accounts (All default to password: password123)
DEFAULT_PASSWORD_HASH = hash_password("password123", salt="asis_seed_salt_2026")

USERS_DATABASE: dict[str, UserRecord] = {
    # Student
    "aarav@student.edu": UserRecord(
        id="00000000-0000-0000-0000-000000000001",
        name="Aarav Shah",
        email="aarav@student.edu",
        password_hash=DEFAULT_PASSWORD_HASH,
        role="student",
        student_id="00000000-0000-0000-0000-000000000001",
    ),
    "student@school.edu": UserRecord(
        id="00000000-0000-0000-0000-000000000001",
        name="Aarav Shah (Student Demo)",
        email="student@school.edu",
        password_hash=DEFAULT_PASSWORD_HASH,
        role="student",
        student_id="00000000-0000-0000-0000-000000000001",
    ),
    # Teacher
    "anika@school.edu": UserRecord(
        id="00000000-0000-0000-0000-000000000010",
        name="Anika Rao",
        email="anika@school.edu",
        password_hash=DEFAULT_PASSWORD_HASH,
        role="teacher",
    ),
    "teacher@school.edu": UserRecord(
        id="00000000-0000-0000-0000-000000000010",
        name="Anika Rao (Teacher Demo)",
        email="teacher@school.edu",
        password_hash=DEFAULT_PASSWORD_HASH,
        role="teacher",
    ),
    # Mentor
    "riya@school.edu": UserRecord(
        id="00000000-0000-0000-0000-000000000020",
        name="Riya Sen",
        email="riya@school.edu",
        password_hash=DEFAULT_PASSWORD_HASH,
        role="mentor",
    ),
    "mentor@school.edu": UserRecord(
        id="00000000-0000-0000-0000-000000000020",
        name="Riya Sen (Mentor Demo)",
        email="mentor@school.edu",
        password_hash=DEFAULT_PASSWORD_HASH,
        role="mentor",
    ),
}


def authenticate_user(email: str, password: str) -> Optional[UserRecord]:
    """Authenticate user by email and password."""
    normalized_email = email.strip().lower()
    user = USERS_DATABASE.get(normalized_email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(user: UserRecord, expires_in_seconds: int = 86400) -> str:
    """Generate HMAC-SHA256 signed access token matching Next.js session format."""
    payload = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "student_id": user.student_id,
        "exp": int((time.time() + expires_in_seconds) * 1000),
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = base64.urlsafe_b64encode(
        hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
    ).decode().rstrip("=")
    return f"{payload_b64}.{signature}"
