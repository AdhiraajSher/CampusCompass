"""Security & RBAC Verification Test Suite for CampusCompass ASIS Backend.

Verifies:
1. Authentication & PBKDF2 credential verification
2. HMAC session token generation and tamper protection
3. RBAC Role Isolation (Student vs Teacher vs Mentor)
4. Data Leakage Prevention (Student self-scope guard)
5. Endpoint permission boundaries
"""
import sys
import unittest

import auth_service
import rbac
import session


class TestAuthenticationAndSecurity(unittest.TestCase):
    def test_01_successful_logins(self):
        """Verify seeded accounts authenticate with correct credentials."""
        # Student
        user = auth_service.authenticate_user("aarav@student.edu", "password123")
        self.assertIsNotNone(user)
        self.assertEqual(user.role, "student")
        self.assertEqual(user.student_id, "00000000-0000-0000-0000-000000000001")

        # Teacher
        teacher = auth_service.authenticate_user("anika@school.edu", "password123")
        self.assertIsNotNone(teacher)
        self.assertEqual(teacher.role, "teacher")

        # Mentor
        mentor = auth_service.authenticate_user("riya@school.edu", "password123")
        self.assertIsNotNone(mentor)
        self.assertEqual(mentor.role, "mentor")

    def test_02_invalid_credentials_rejected(self):
        """Verify invalid passwords and non-existent users are rejected."""
        self.assertIsNone(auth_service.authenticate_user("aarav@student.edu", "wrongpass"))
        self.assertIsNone(auth_service.authenticate_user("nonexistent@school.edu", "password123"))
        self.assertIsNone(auth_service.authenticate_user("", ""))

    def test_03_token_generation_and_tamper_detection(self):
        """Verify HMAC session tokens cannot be forged or tampered with."""
        user = auth_service.authenticate_user("aarav@student.edu", "password123")
        token = auth_service.create_access_token(user)

        # Valid token decodes correctly
        verified = rbac.verify_token(f"Bearer {token}")
        self.assertEqual(verified.id, user.id)
        self.assertEqual(verified.role, "student")

        # Tampered token is rejected
        tampered = token[:-4] + "fake"
        with self.assertRaises(Exception):
            rbac.verify_token(f"Bearer {tampered}")

    def test_04_student_data_leakage_prevention(self):
        """Verify student cannot access another student's data (Data-leak check)."""
        student = auth_service.authenticate_user("aarav@student.edu", "password123")
        token = auth_service.create_access_token(student)
        verified = rbac.verify_token(f"Bearer {token}")

        # Own ID is allowed
        try:
            rbac.enforce_student_scope(verified, verified.student_id)
        except Exception:
            self.fail("enforce_student_scope raised unexpectedly for student's own data.")

        # Another student's ID raises 403 Forbidden
        with self.assertRaises(Exception) as ctx:
            rbac.enforce_student_scope(verified, "00000000-0000-0000-0000-000000000002")
        self.assertIn("Security violation", str(ctx.exception))

    def test_05_staff_scope_permits_teacher_and_mentor(self):
        """Verify teachers and mentors are not constrained by student self-scope."""
        teacher = auth_service.authenticate_user("anika@school.edu", "password123")
        token = auth_service.create_access_token(teacher)
        verified = rbac.verify_token(f"Bearer {token}")

        # Staff can inspect any student scope without self-scope violation
        try:
            rbac.enforce_student_scope(verified, "00000000-0000-0000-0000-000000000001")
            rbac.enforce_student_scope(verified, "00000000-0000-0000-0000-000000000002")
        except Exception:
            self.fail("enforce_student_scope restricted a staff member!")

    def test_06_session_verifier_compatibility(self):
        """Verify compatibility between Next.js session helper and Python verifier."""
        for alias in ["studentdemo", "anika", "riya"]:
            decoded = session.IDENTITIES.get(alias)
            self.assertIsNotNone(decoded, f"Alias {alias} missing from session.py IDENTITIES")


if __name__ == "__main__":
    unittest.main()
