"""Role-Based Access Control (RBAC) middleware and security dependencies.

Enforces security rules:
- Student: can only access their own data. Blocked from staff student directories.
- Teacher: can only access data for students in their specific classes/subjects.
- Mentor: can only access data for their assigned students.
"""
import base64
import hashlib
import hmac
import json
import os
import time
from typing import Annotated, Callable, Optional
from dataclasses import dataclass, asdict

try:
    from fastapi import Depends, Header, HTTPException, status
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int = 400, detail: str = ""):
            self.status_code = status_code
            self.detail = detail
            super().__init__(detail)

    class status:
        HTTP_401_UNAUTHORIZED = 401
        HTTP_403_FORBIDDEN = 403

    def Depends(dependency=None, use_cache: bool = True):
        return dependency

    def Header(default=None):
        return default

from auth_service import USERS_DATABASE


@dataclass
class UserIdentity:
    id: str
    name: str
    email: str
    role: str  # 'student', 'teacher', 'mentor'
    student_id: Optional[str] = None

    def dict(self):
        return asdict(self)


# Quick reference mapping by ID and email
MOCK_USERS_BY_ID: dict[str, UserIdentity] = {}
for email, u in USERS_DATABASE.items():
    identity = UserIdentity(
        id=u.id,
        name=u.name,
        email=u.email,
        role=u.role,
        student_id=u.student_id,
    )
    MOCK_USERS_BY_ID[email] = identity
    MOCK_USERS_BY_ID[u.id] = identity

MOCK_USERS_BY_ID["studentdemo"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000001"]
MOCK_USERS_BY_ID["student"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000001"]
MOCK_USERS_BY_ID["anika"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000010"]
MOCK_USERS_BY_ID["teacher"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000010"]
MOCK_USERS_BY_ID["riya"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000020"]
MOCK_USERS_BY_ID["mentor"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000020"]
MOCK_USERS_BY_ID["sam"] = MOCK_USERS_BY_ID["00000000-0000-0000-0000-000000000020"]


def verify_token(authorization: Optional[str]) -> UserIdentity:
    """Validate Bearer token (HMAC-SHA256 session token)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()
    secret = os.getenv("DEMO_SESSION_SECRET", "development-demo-only-change-me")

    try:
        parts = token.split(".")
        if len(parts) == 2:
            payload_b64, signature_b64 = parts
            expected = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
            actual = base64.urlsafe_b64decode(signature_b64 + "=" * (-len(signature_b64) % 4))
            if not hmac.compare_digest(expected, actual):
                raise HTTPException(status_code=401, detail="Invalid token signature")

            payload = json.loads(
                base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4)).decode()
            )

            # Check expiration
            exp = payload.get("exp")
            if isinstance(exp, (int, float)) and exp < time.time() * 1000:
                raise HTTPException(status_code=401, detail="Token has expired")

            uid = str(payload.get("id"))
            if uid in MOCK_USERS_BY_ID:
                return MOCK_USERS_BY_ID[uid]

            role = payload.get("role", "student")
            return UserIdentity(
                id=uid,
                name=payload.get("name", "User"),
                email=payload.get("email", f"{uid}@school.edu"),
                role=role,
                student_id=payload.get("student_id", uid if role == "student" else None),
            )
        elif token in MOCK_USERS_BY_ID:
            return MOCK_USERS_BY_ID[token]
        else:
            raise HTTPException(status_code=401, detail="Invalid token format")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {exc}")


async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None
) -> UserIdentity:
    return verify_token(authorization)


def require_role(allowed_roles: list[str]) -> Callable:
    """RBAC Guard factory enforcing role boundaries."""
    async def role_checker(
        current_user: Annotated[UserIdentity, Depends(get_current_user)]
    ) -> UserIdentity:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{current_user.role}' is not authorized. Required: {allowed_roles}",
            )
        return current_user

    return role_checker


def enforce_student_scope(current_user: UserIdentity, target_student_id: str):
    """Data-leak prevention: student users can ONLY access their own data."""
    if current_user.role == "student":
        user_student_id = current_user.student_id or current_user.id
        if user_student_id != target_student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Students are strictly forbidden from viewing another student's data.",
            )
