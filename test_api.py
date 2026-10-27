"""Exercise real routes, authentication and data projections without network services."""

import base64
import hashlib
import hmac
import json
import os
import time

from app.main import app
from app.repositories.students import FIXTURE
from fastapi.testclient import TestClient

client = TestClient(app)


def token(identity: str, expires: float | None = None) -> dict[str, str]:
    payload = base64.urlsafe_b64encode(
        json.dumps(
            {"id": identity, "exp": expires or (time.time() + 3600) * 1000}
        ).encode()
    ).rstrip(b"=")
    secret = os.getenv("DEMO_SESSION_SECRET", "development-demo-only-change-me")
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), payload, hashlib.sha256).digest()
    ).rstrip(b"=")
    return {"Authorization": f"Bearer {payload.decode()}.{signature.decode()}"}


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_staff_students_use_shared_seed() -> None:
    response = client.get("/students", headers=token("anika"))
    assert response.status_code == 200
    assert response.json() == sorted(
        json.loads(FIXTURE.read_text()), key=lambda row: -row["risk"]
    )


def test_mentor_cannot_receive_staff_evidence_or_other_caseloads() -> None:
    response = client.get("/students", headers=token("riya"))
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 3
    for row in rows:
        assert row["mentorId"] == "riya"
        assert all(
            field not in row
            for field in ["risk", "trend", "attendance", "grades", "missing"]
        )
        assert all(item["source"] == "mentor" for item in row["history"])
    assert "Assignment reminder email" not in response.text
    assert client.get("/students/ST-003", headers=token("riya")).status_code == 404


def test_rejects_missing_forged_expired_and_unknown_sessions() -> None:
    assert client.get("/students").status_code == 401
    assert (
        client.get(
            "/students", headers={"Authorization": "Bearer forged.token"}
        ).status_code
        == 401
    )
    assert client.get("/students", headers=token("anika", 1)).status_code == 401
    assert client.get("/students", headers=token("unknown")).status_code == 401


def test_batch_manager_can_review_mentor_updates() -> None:
    rows = client.get("/students", headers=token("sam")).json()
    assert len(rows) == 4
    assert any(item["source"] == "mentor" for item in rows[0]["history"])
