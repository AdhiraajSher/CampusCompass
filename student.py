"""Validated API contract matching the shared fictional fixture."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["teacher", "manager", "mentor"]


class Identity(BaseModel):
    id: str
    name: str
    role: Role


class Intervention(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    title: str
    issue: str
    status: Literal["Proposed", "Active", "Successful", "Failed", "Rejected"]
    source: Literal["staff", "mentor"]
    date: str
    owner: str
    reviewDays: int = Field(ge=1, le=90)


class Student(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    name: str
    initials: str
    cohort: str
    mentorId: str
    mentorName: str
    note: str
    risk: int | None = Field(default=None, ge=0, le=100)
    trend: list[int] | None = None
    attendance: list[int] | None = None
    grades: list[int] | None = None
    missing: int | None = Field(default=None, ge=0)
    issue: str
    newAlert: bool
    due: bool
    history: list[Intervention]
    recommendation: str
    rationale: str
