"""Authenticated read endpoints; inaccessible records return 404."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_identity
from app.repositories.students import load_students
from app.schemas.student import Identity, Student
from app.services.students import visible_students

router = APIRouter()
Staff = Annotated[Identity, Depends(current_identity)]


@router.get(
    "/students",
    response_model=list[Student],
    response_model_exclude_none=True,
    tags=["students"],
)
def list_students(identity: Staff) -> list[Student]:
    return visible_students(load_students(), identity)


@router.get(
    "/students/{student_id}",
    response_model=Student,
    response_model_exclude_none=True,
    tags=["students"],
)
def get_student(student_id: str, identity: Staff) -> Student:
    rows = visible_students(load_students(), identity)
    student = next((row for row in rows if row.id == student_id), None)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
