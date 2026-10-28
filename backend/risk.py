"""Risk scoring. The schema has no risk_score column, so it is computed on the fly (0-100)."""


def compute_risk_score(student: dict, grades: dict | None, interventions: list[dict]) -> float:
    attendance = student.get("attendance_rate") or 0
    absences = student.get("consecutive_absences") or 0

    # Attendance gap below 100% (max 35 pts, saturates at a 40-point gap)
    attendance_pts = min(max(100 - attendance, 0), 40) / 40 * 35

    # Consecutive absences (max 20 pts, saturates at 8)
    absence_pts = min(absences, 8) / 8 * 20

    # Grades (max 30 pts): blend of average and weakest subject, vs. a 75 baseline
    grade_pts = 0.0
    if grades:
        scores = [
            grades[k]
            for k in ("math_grade", "english_grade", "science_grade")
            if grades.get(k) is not None
        ]
        if scores:
            basis = 0.6 * (sum(scores) / len(scores)) + 0.4 * min(scores)
            grade_pts = min(max(75 - basis, 0), 40) / 40 * 30

    # Failed interventions (max 15 pts, saturates at 3)
    failed = sum(1 for i in interventions if (i.get("status") or "").lower() == "failed")
    failed_pts = min(failed, 3) / 3 * 15

    return round(attendance_pts + absence_pts + grade_pts + failed_pts, 1)
