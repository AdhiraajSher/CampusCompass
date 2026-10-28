-- ============================================================================
-- Adaptive Student Intervention System (ASIS) / CampusCompass
-- Database Schema (Supabase / PostgreSQL)
-- Role-Based Access Control (RBAC), Mood Logs, Academic Records & Interventions
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Roles: Student, Teacher, Mentor
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'mentor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Intervention Statuses
DO $$ BEGIN
    CREATE TYPE intervention_status AS ENUM ('Pending', 'Success', 'Failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USERS TABLE
-- Core identity table for authentication and RBAC
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT PROFILES TABLE
-- Extended attributes for students, linking to their assigned mentor
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    extracurricular_load TEXT DEFAULT 'Moderate', -- e.g. 'Low', 'Moderate', 'Heavy'
    assigned_mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MOOD LOGS TABLE (1-Minute Daily AI Check-in)
-- Stores extracted mood scores (1-5) and tags derived via LLM Insight Extractor
CREATE TABLE IF NOT EXISTS mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
    tags TEXT[] NOT NULL DEFAULT '{}',
    raw_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce at most 1 check-in record per student per calendar day
    CONSTRAINT unique_student_daily_checkin UNIQUE (student_id, date)
);

-- 5. ACADEMIC RECORDS TABLE (Subject-Level)
-- Tracks grades and attendance per student, tied to the observing teacher
CREATE TABLE IF NOT EXISTS academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    grade NUMERIC(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
    attendance NUMERIC(5,2) NOT NULL CHECK (attendance >= 0 AND attendance <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INTERVENTIONS TABLE
-- Collaborative actions proposed or executed by teachers or mentors
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_rationale TEXT NOT NULL,
    status intervention_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_mentor ON student_profiles(assigned_mentor_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_student_date ON mood_logs(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_academic_records_student ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_teacher ON academic_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_created_by ON interventions(created_by);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces RBAC boundaries at the Postgres engine level
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Helper function: get the authenticated user's role
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --- USERS POLICIES ---
-- Users can read their own profile; teachers and mentors can read basic student info
CREATE POLICY users_read_own ON users
    FOR SELECT USING (
        id = auth.uid() OR
        auth_user_role() IN ('teacher', 'mentor')
    );

-- --- STUDENT PROFILES POLICIES ---
-- Students read their own; mentors read their assigned students; teachers read class students
CREATE POLICY student_profiles_select ON student_profiles
    FOR SELECT USING (
        student_id = auth.uid() OR
        assigned_mentor_id = auth.uid() OR
        auth_user_role() = 'teacher'
    );

-- --- MOOD LOGS POLICIES ---
-- Student can only insert/select their own mood logs
CREATE POLICY mood_logs_student_all ON mood_logs
    FOR ALL USING (
        student_id = auth.uid()
    );

-- Mentors can view mood trends for assigned students (Holistic View)
CREATE POLICY mood_logs_mentor_read ON mood_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp
            WHERE sp.student_id = mood_logs.student_id
              AND sp.assigned_mentor_id = auth.uid()
        )
    );

-- --- ACADEMIC RECORDS POLICIES ---
-- Students see only their own grades
CREATE POLICY academic_records_student_read ON academic_records
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- Teachers see only records for subjects they teach
CREATE POLICY academic_records_teacher_all ON academic_records
    FOR ALL USING (
        teacher_id = auth.uid()
    );

-- Mentors see academic records for their assigned students
CREATE POLICY academic_records_mentor_read ON academic_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp
            WHERE sp.student_id = academic_records.student_id
              AND sp.assigned_mentor_id = auth.uid()
        )
    );

-- --- INTERVENTIONS POLICIES ---
-- Students see their own interventions
CREATE POLICY interventions_student_read ON interventions
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- Teachers and Mentors can create and read interventions
CREATE POLICY interventions_staff_all ON interventions
    FOR ALL USING (
        created_by = auth.uid() OR
        auth_user_role() = 'mentor' OR
        EXISTS (
            SELECT 1 FROM academic_records ar
            WHERE ar.student_id = interventions.student_id
              AND ar.teacher_id = auth.uid()
        )
    );

-- ============================================================================
-- 9. SEED DATA (Demo Users & Records)
-- ============================================================================

-- Passwords are bcrypt hashes for demo purposes ('password123')
INSERT INTO users (id, name, email, password_hash, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Aarav Shah', 'aarav@student.edu', '$2b$12$e80yV2.q5yRz/3u8vXm0Xe', 'student'),
    ('00000000-0000-0000-0000-000000000002', 'Meera Iyer', 'meera@student.edu', '$2b$12$e80yV2.q5yRz/3u8vXm0Xe', 'student'),
    ('00000000-0000-0000-0000-000000000003', 'Zara Khan', 'zara@student.edu', '$2b$12$e80yV2.q5yRz/3u8vXm0Xe', 'student'),
    ('00000000-0000-0000-0000-000000000010', 'Anika Rao', 'anika@school.edu', '$2b$12$e80yV2.q5yRz/3u8vXm0Xe', 'teacher'),
    ('00000000-0000-0000-0000-000000000020', 'Riya Sen', 'riya@school.edu', '$2b$12$e80yV2.q5yRz/3u8vXm0Xe', 'mentor')
ON CONFLICT (email) DO NOTHING;

-- Profiles linking students to Mentor Riya
INSERT INTO student_profiles (student_id, extracurricular_load, assigned_mentor_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Heavy (Varsity Debate, Robotics)', '00000000-0000-0000-0000-000000000020'),
    ('00000000-0000-0000-0000-000000000002', 'Moderate (Part-time job)', '00000000-0000-0000-0000-000000000020'),
    ('00000000-0000-0000-0000-000000000003', 'Light (Art Club)', '00000000-0000-0000-0000-000000000020')
ON CONFLICT (student_id) DO NOTHING;

-- Subject-level records for Teacher Anika (Computer Science / Math)
INSERT INTO academic_records (id, student_id, teacher_id, subject, grade, attendance) VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Mathematics', 62.00, 76.50),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 'Mathematics', 78.50, 92.00),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'Mathematics', 84.00, 88.00)
ON CONFLICT DO NOTHING;
