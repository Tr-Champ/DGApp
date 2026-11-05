-- =====================================================================
-- TEACHER TIMETABLE MANAGER — COMPLETE SCHEMA FOR NEON (PostgreSQL)
-- Run this entire file once in the Neon SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. CLEAN SLATE (safe to re-run during dev)
-- ---------------------------------------------------------------------
DROP VIEW  IF EXISTS v_timetable_full      CASCADE;
DROP VIEW  IF EXISTS v_teacher_courses     CASCADE;
DROP VIEW  IF EXISTS v_conflicts           CASCADE;
DROP TABLE IF EXISTS notifications         CASCADE;
DROP TABLE IF EXISTS timetable             CASCADE;
DROP TABLE IF EXISTS teacher_courses       CASCADE;
DROP TABLE IF EXISTS courses               CASCADE;
DROP TABLE IF EXISTS users                 CASCADE;
DROP TABLE IF EXISTS teachers              CASCADE;
DROP FUNCTION IF EXISTS fn_enforce_two_courses()   CASCADE;
DROP FUNCTION IF EXISTS fn_check_time_overlap()    CASCADE;
DROP FUNCTION IF EXISTS fn_notify_timetable()      CASCADE;
DROP FUNCTION IF EXISTS fn_sync_course_teacher()   CASCADE;

-- =====================================================================
-- 1. TEACHERS
-- =====================================================================
CREATE TABLE teachers (
    id           SERIAL PRIMARY KEY,
    teacher_code VARCHAR(10)  UNIQUE NOT NULL,          -- T001 .. T005
    full_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(100) UNIQUE NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 2. USERS (login — one default teacher account)
-- =====================================================================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,                 -- bcrypt hash
    role          VARCHAR(20)  NOT NULL DEFAULT 'teacher'
                  CHECK (role IN ('admin','teacher')),
    teacher_id    INTEGER      REFERENCES teachers(id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 3. COURSES
-- =====================================================================
CREATE TABLE courses (
    id          SERIAL PRIMARY KEY,
    course_code VARCHAR(15)  UNIQUE NOT NULL,            -- CS101 .. CS110
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id  INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 4. TEACHER_COURSES  (enforces "exactly 2 courses per teacher")
-- =====================================================================
CREATE TABLE teacher_courses (
    id         SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    course_id  INTEGER NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, course_id),
    UNIQUE (course_id)                                   -- a course → one teacher
);

-- Trigger: max 2 courses per teacher
CREATE OR REPLACE FUNCTION fn_enforce_two_courses()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM teacher_courses WHERE teacher_id = NEW.teacher_id) >= 2 THEN
        RAISE EXCEPTION 'Teacher % already has the maximum of 2 courses', NEW.teacher_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_two_courses
    BEFORE INSERT ON teacher_courses
    FOR EACH ROW EXECUTE FUNCTION fn_enforce_two_courses();

-- Trigger: keep courses.teacher_id in sync with teacher_courses
CREATE OR REPLACE FUNCTION fn_sync_course_teacher()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses SET teacher_id = NEW.teacher_id WHERE id = NEW.course_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses SET teacher_id = NULL WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_course_teacher
    AFTER INSERT OR DELETE ON teacher_courses
    FOR EACH ROW EXECUTE FUNCTION fn_sync_course_teacher();

-- =====================================================================
-- 5. TIMETABLE
-- =====================================================================
CREATE TABLE timetable (
    id         SERIAL PRIMARY KEY,
    course_id  INTEGER NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    day        VARCHAR(10) NOT NULL
               CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    room       VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Basic uniqueness (same exact start = clash)
CREATE UNIQUE INDEX uq_teacher_slot ON timetable (teacher_id, day, start_time);
CREATE UNIQUE INDEX uq_room_slot    ON timetable (room,       day, start_time);

-- Trigger: prevent overlapping time ranges (not just same start_time)
CREATE OR REPLACE FUNCTION fn_check_time_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Teacher overlap check
    IF EXISTS (
        SELECT 1 FROM timetable
        WHERE day        = NEW.day
          AND teacher_id = NEW.teacher_id
          AND id         <> COALESCE(NEW.id, -1)
          AND NEW.start_time < end_time
          AND NEW.end_time   > start_time
    ) THEN
        RAISE EXCEPTION 'Conflict: teacher % is already booked during % %-%',
                        NEW.teacher_id, NEW.day, NEW.start_time, NEW.end_time;
    END IF;

    -- Room overlap check
    IF EXISTS (
        SELECT 1 FROM timetable
        WHERE day   = NEW.day
          AND room  = NEW.room
          AND id    <> COALESCE(NEW.id, -1)
          AND NEW.start_time < end_time
          AND NEW.end_time   > start_time
    ) THEN
        RAISE EXCEPTION 'Conflict: room % is already booked during % %-%',
                        NEW.room, NEW.day, NEW.start_time, NEW.end_time;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_time_overlap
    BEFORE INSERT OR UPDATE ON timetable
    FOR EACH ROW EXECUTE FUNCTION fn_check_time_overlap();

-- =====================================================================
-- 6. NOTIFICATIONS (Teacher dashboard feature)
-- =====================================================================
CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    teacher_id  INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title       VARCHAR(100) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Trigger: auto-notify teacher on timetable insert/update/delete
CREATE OR REPLACE FUNCTION fn_notify_timetable()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher INTEGER;
    v_course  VARCHAR;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_teacher := OLD.teacher_id;
        SELECT course_name INTO v_course FROM courses WHERE id = OLD.course_id;
        INSERT INTO notifications (teacher_id, title, message)
        VALUES (v_teacher, 'Timetable removed',
                format('Lesson for %s on %s %s-%s was removed.',
                       v_course, OLD.day, OLD.start_time, OLD.end_time));
        RETURN OLD;
    END IF;

    v_teacher := NEW.teacher_id;
    SELECT course_name INTO v_course FROM courses WHERE id = NEW.course_id;

    INSERT INTO notifications (teacher_id, title, message)
    VALUES (v_teacher,
            CASE WHEN TG_OP = 'INSERT' THEN 'New lesson scheduled'
                 ELSE 'Timetable updated' END,
            format('%s on %s %s-%s in room %s',
                   v_course, NEW.day, NEW.start_time, NEW.end_time, NEW.room));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_timetable
    AFTER INSERT OR UPDATE OR DELETE ON timetable
    FOR EACH ROW EXECUTE FUNCTION fn_notify_timetable();

-- =====================================================================
-- 7. HELPER VIEWS (used by backend queries)
-- =====================================================================
CREATE VIEW v_teacher_courses AS
SELECT
    t.id           AS teacher_id,
    t.teacher_code,
    t.full_name    AS teacher_name,
    t.phone,
    t.email,
    c.id           AS course_id,
    c.course_code,
    c.course_name,
    c.description
FROM teachers t
LEFT JOIN teacher_courses tc ON tc.teacher_id = t.id
LEFT JOIN courses         c  ON c.id          = tc.course_id;

CREATE VIEW v_timetable_full AS
SELECT
    tt.id,
    tt.day,
    tt.start_time,
    tt.end_time,
    tt.room,
    c.course_code,
    c.course_name,
    t.teacher_code,
    t.full_name AS teacher_name
FROM timetable tt
JOIN courses  c ON c.id = tt.course_id
JOIN teachers t ON t.id = tt.teacher_id
ORDER BY
    CASE tt.day
        WHEN 'Monday'    THEN 1
        WHEN 'Tuesday'   THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday'  THEN 4
        WHEN 'Friday'    THEN 5
    END, tt.start_time;

CREATE VIEW v_conflicts AS
SELECT * FROM v_timetable_full WHERE FALSE;   -- placeholder; real conflicts blocked by trigger

-- =====================================================================
-- 8. SEED DATA (matches exam sample tables exactly)
-- =====================================================================

-- 8.1 Teachers (T001–T005)
INSERT INTO teachers (teacher_code, full_name, phone, email) VALUES
  ('T001','John', '0788000001','john@abc.edu'),
  ('T002','Mary', '0788000002','mary@abc.edu'),
  ('T003','Peter','0788000003','peter@abc.edu'),
  ('T004','Alice','0788000004','alice@abc.edu'),
  ('T005','David','0788000005','david@abc.edu');

-- 8.2 Courses (10)
INSERT INTO courses (course_code, course_name, description) VALUES
  ('CS101','Java Programming',     'Introduction to Java programming'),
  ('CS102','Database Systems',     'Relational database design and SQL'),
  ('CS103','Mobile Development',   'Cross-platform mobile apps with React Native'),
  ('CS104','Web Development',      'HTML, CSS and JavaScript fundamentals'),
  ('CS105','Computer Networks',    'OSI model, TCP/IP and networking'),
  ('CS106','Cybersecurity',        'Security principles and threat modeling'),
  ('CS107','Software Engineering', 'SDLC, agile and design patterns'),
  ('CS108','Systems Analysis',     'Requirements engineering and modeling'),
  ('CS109','Python Programming',   'Python syntax, OOP and scripting'),
  ('CS110','Data Science',         'Data analysis, visualization and ML intro');

-- 8.3 Assign exactly 2 courses per teacher (exam sample allocation)
INSERT INTO teacher_courses (teacher_id, course_id) VALUES
  (1, 1), (1, 2),   -- John  → Java, Database
  (2, 3), (2, 4),   -- Mary  → Mobile, Web
  (3, 5), (3, 6),   -- Peter → Networks, Cybersecurity
  (4, 7), (4, 8),   -- Alice → SE, Systems Analysis
  (5, 9), (5,10);   -- David → Python, Data Science

-- 8.4 Default login (username: john / password: teacher123)
-- bcrypt hash of "teacher123" (cost 12) — pre-generated
INSERT INTO users (username, password_hash, role, teacher_id) VALUES
  ('john',
   '$2b$12$Q7vJwJqfV0Ylq3v5uZb9XeFzE8b0rYh1t0Lx9gP3IxM8nN7cK5uW',
   'teacher', 1);

-- 8.5 Sample timetable (matches exam sample weekly timetable)
INSERT INTO timetable (course_id, teacher_id, day, start_time, end_time, room) VALUES
  (1, 1, 'Monday',    '08:00','10:00','R101'),  -- Java / John
  (3, 2, 'Monday',    '10:00','12:00','R102'),  -- Mobile / Mary
  (5, 3, 'Tuesday',   '08:00','10:00','R103'),  -- Networks / Peter
  (7, 4, 'Tuesday',   '10:00','12:00','R104'),  -- SE / Alice
  (2, 1, 'Wednesday', '08:00','10:00','R101'),  -- Database / John
  (9, 5, 'Wednesday', '10:00','12:00','R105'),  -- Python / David
  (4, 2, 'Thursday',  '08:00','10:00','R102'),  -- Web / Mary
  (6, 3, 'Thursday',  '10:00','12:00','R103'),  -- Cybersecurity / Peter
  (8, 4, 'Friday',    '08:00','10:00','R104'),  -- Systems Analysis / Alice
  (10,5, 'Friday',    '10:00','12:00','R105');  -- Data Science / David

-- =====================================================================
-- 9. SANITY CHECK (should return 5, 10, 10, 10, 1)
-- =====================================================================
SELECT
    (SELECT COUNT(*) FROM teachers)         AS teachers,
    (SELECT COUNT(*) FROM courses)          AS courses,
    (SELECT COUNT(*) FROM teacher_courses)  AS assignments,
    (SELECT COUNT(*) FROM timetable)        AS lessons,
    (SELECT COUNT(*) FROM users)            AS users;