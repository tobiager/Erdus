-- School Management System Schema
-- Generated for Erdus Phase 2 Examples

-- Academic departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    head_teacher_id INTEGER,
    building VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers/Faculty
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    department_id INTEGER,
    title VARCHAR(100), -- Professor, Associate Professor, etc.
    specialization VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE NOT NULL,
    enrollment_date DATE NOT NULL,
    graduation_date DATE,
    major VARCHAR(100),
    minor VARCHAR(100),
    gpa DECIMAL(3,2) DEFAULT 0.00,
    total_credits INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, graduated, suspended, withdrawn
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic semesters/terms
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Spring 2025, Fall 2024
    code VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start DATE,
    registration_end DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses (curriculum)
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- CS101, MATH201
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    department_id INTEGER NOT NULL,
    prerequisites TEXT, -- JSON array of course codes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- Classes (course instances per semester)
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL, -- A, B, C
    room VARCHAR(50),
    schedule VARCHAR(100), -- "MWF 9:00-10:00"
    max_capacity INTEGER DEFAULT 30,
    enrolled_count INTEGER DEFAULT 0,
    start_time TIME,
    end_time TIME,
    days_of_week VARCHAR(20), -- JSON array ["MON", "WED", "FRI"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    UNIQUE(course_id, semester_id, section)
);

-- Student enrollments in classes
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'enrolled', -- enrolled, dropped, completed
    final_grade VARCHAR(5), -- A, B+, C, etc.
    grade_points DECIMAL(3,2), -- 4.0, 3.7, etc.
    attendance_percentage DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id)
);

-- Assignments
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50) DEFAULT 'homework', -- homework, quiz, exam, project
    total_points INTEGER NOT NULL DEFAULT 100,
    due_date TIMESTAMP NOT NULL,
    instructions TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Student submissions
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    submission_text TEXT,
    file_url VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, returned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, student_id)
);

-- Grades for submissions
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL,
    points_earned DECIMAL(5,2) NOT NULL,
    points_possible DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    letter_grade VARCHAR(5),
    feedback TEXT,
    graded_by INTEGER, -- teacher_id
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES teachers(id) ON DELETE SET NULL
);

-- Add the foreign key for department head after teachers table is created
ALTER TABLE departments ADD CONSTRAINT fk_departments_head_teacher 
    FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_teachers_department_id ON teachers(department_id);
CREATE INDEX idx_courses_department_id ON courses(department_id);
CREATE INDEX idx_classes_course_id ON classes(course_id);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_semester_id ON classes(semester_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_grades_submission_id ON grades(submission_id);