USE eepl;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active' AFTER course_interest;

ALTER TABLE trainers
    ADD COLUMN IF NOT EXISTS status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active' AFTER qualification;

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active' AFTER role;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS trainer_id INT NULL AFTER instructor_id;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS is_popular TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS discount_type VARCHAR(30) NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS discount_status TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS home_popups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    image_url LONGTEXT,
    button_text VARCHAR(100),
    button_link VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    popup_type VARCHAR(50) NOT NULL DEFAULT 'announcement',
    page_key VARCHAR(100) NOT NULL DEFAULT 'home',
    position VARCHAR(50) NOT NULL DEFAULT 'center',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_home_popup_status_dates (status, start_date, end_date),
    INDEX idx_home_popup_page (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE home_popups
    ADD COLUMN IF NOT EXISTS page_key VARCHAR(100) NOT NULL DEFAULT 'home',
    ADD COLUMN IF NOT EXISTS position VARCHAR(50) NOT NULL DEFAULT 'center';

INSERT INTO home_popups (title,message,image_url,button_text,button_link,status,popup_type,page_key,position)
SELECT 'Limited Time Offer!',
       'Enroll now and kickstart your career journey with our industry-ready full-stack programme.',
       'assets/images/popup-offer.jpg',
       'Enroll Now',
       'courses.html?course=java-fullstack&category=computer#all-courses',
       'active',
       'course_discount',
       'home',
       'center'
WHERE NOT EXISTS (SELECT 1 FROM home_popups);

CREATE TABLE IF NOT EXISTS batches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    batch_name VARCHAR(150) NOT NULL,
    course_id INT NOT NULL,
    trainer_id INT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    schedule_text VARCHAR(255) NULL,
    status ENUM('draft','active','completed','cancelled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_batches_course (course_id),
    INDEX idx_batches_trainer (trainer_id),
    CONSTRAINT fk_batches_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_batches_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE batches
    ADD COLUMN IF NOT EXISTS course_id INT NULL,
    ADD COLUMN IF NOT EXISTS trainer_id INT NULL,
    ADD COLUMN IF NOT EXISTS start_date DATE NULL,
    ADD COLUMN IF NOT EXISTS end_date DATE NULL,
    ADD COLUMN IF NOT EXISTS schedule_text VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('draft','active','completed','cancelled') NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE enrollments
    ADD COLUMN IF NOT EXISTS batch_id INT NULL AFTER course_id,
    ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER amount_paid,
    ADD COLUMN IF NOT EXISTS status ENUM('pending','active','completed','cancelled') NOT NULL DEFAULT 'active' AFTER progress_percentage;

ALTER TABLE certificates
    ADD COLUMN IF NOT EXISTS verification_url VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS certificate_file VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS batch_id INT NULL,
    ADD COLUMN IF NOT EXISTS student_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS course_title VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('active','revoked','pending') NOT NULL DEFAULT 'active';

ALTER TABLE certificates
    MODIFY COLUMN status ENUM('active','revoked','pending') NOT NULL DEFAULT 'active';

ALTER TABLE quizzes
    ADD COLUMN IF NOT EXISTS batch_id INT NULL AFTER course_id,
    ADD COLUMN IF NOT EXISTS assessment_date DATETIME NULL AFTER duration,
    ADD COLUMN IF NOT EXISTS status ENUM('draft','published','completed','cancelled') NOT NULL DEFAULT 'published' AFTER assessment_date;

CREATE TABLE IF NOT EXISTS assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    batch_id INT NULL,
    trainer_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date DATETIME NULL,
    max_marks DECIMAL(8,2) NOT NULL DEFAULT 100.00,
    status ENUM('draft','published','closed') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assignments_course (course_id),
    INDEX idx_assignments_batch (batch_id),
    INDEX idx_assignments_trainer (trainer_id),
    INDEX idx_assignments_due (due_date),
    CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_assignments_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS course_id INT NULL,
    ADD COLUMN IF NOT EXISTS batch_id INT NULL,
    ADD COLUMN IF NOT EXISTS trainer_id INT NULL,
    ADD COLUMN IF NOT EXISTS description TEXT NULL,
    ADD COLUMN IF NOT EXISTS due_date DATETIME NULL,
    ADD COLUMN IF NOT EXISTS max_marks DECIMAL(8,2) NOT NULL DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS status ENUM('draft','published','closed') NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS created_by INT NULL,
    ADD COLUMN IF NOT EXISTS created_by_role ENUM('admin','trainer') NOT NULL DEFAULT 'admin',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_path VARCHAR(500) NULL,
    submission_text TEXT NULL,
    marks DECIMAL(8,2) NULL,
    feedback TEXT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME NULL,
    status ENUM('submitted','late','graded','returned') NOT NULL DEFAULT 'submitted',
    UNIQUE KEY uq_assignment_student (assignment_id, student_id),
    INDEX idx_submissions_student (student_id),
    INDEX idx_submissions_status (status),
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    batch_id INT NULL,
    trainer_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    assessment_date DATETIME NULL,
    duration_minutes INT NULL,
    max_marks DECIMAL(8,2) NOT NULL DEFAULT 100.00,
    status ENUM('draft','published','completed','cancelled') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assessments_course (course_id),
    INDEX idx_assessments_batch (batch_id),
    INDEX idx_assessments_trainer (trainer_id),
    INDEX idx_assessments_date (assessment_date),
    CONSTRAINT fk_assessments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessments_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_assessments_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS assessment_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    marks DECIMAL(8,2) NULL,
    percentage DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    attempted_at DATETIME NULL,
    status ENUM('pending','submitted','graded','absent') NOT NULL DEFAULT 'pending',
    UNIQUE KEY uq_assessment_student (assessment_id, student_id),
    INDEX idx_results_student (student_id),
    CONSTRAINT fk_results_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    batch_id INT NULL,
    course_id INT NOT NULL,
    trainer_id INT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present','absent','late','excused') NOT NULL DEFAULT 'present',
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_student_course_date (student_id, course_id, attendance_date),
    INDEX idx_attendance_batch (batch_id),
    INDEX idx_attendance_trainer (trainer_id),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_attendance_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS live_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    batch_id INT NULL,
    trainer_id INT NULL,
    title VARCHAR(255) NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NULL,
    meeting_url VARCHAR(500) NULL,
    recording_url VARCHAR(500) NULL,
    status ENUM('scheduled','live','completed','cancelled') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_live_course (course_id),
    INDEX idx_live_batch (batch_id),
    INDEX idx_live_trainer (trainer_id),
    INDEX idx_live_starts (starts_at),
    CONSTRAINT fk_live_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_live_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_live_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS study_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    batch_id INT NULL,
    trainer_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    material_type ENUM('pdf','video','link','document','archive','other') NOT NULL DEFAULT 'document',
    file_url VARCHAR(500) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_material_course (course_id),
    INDEX idx_material_batch (batch_id),
    INDEX idx_material_trainer (trainer_id),
    CONSTRAINT fk_material_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_material_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_material_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_role ENUM('admin','trainer','user') NOT NULL,
    sender_id INT NOT NULL,
    recipient_role ENUM('admin','trainer','user') NOT NULL,
    recipient_id INT NOT NULL,
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_sender (sender_role, sender_id),
    INDEX idx_messages_recipient (recipient_role, recipient_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    enrollment_id INT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NULL,
    transaction_id VARCHAR(255) NULL,
    status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payments_student (student_id),
    INDEX idx_payments_enrollment (enrollment_id),
    INDEX idx_payments_status (status),
    CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role ENUM('all','admin','trainer','user') NOT NULL DEFAULT 'all',
    created_by_role ENUM('admin','trainer') NOT NULL DEFAULT 'admin',
    created_by_id INT NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_announcements_target (target_role, status),
    INDEX idx_announcements_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS target_role ENUM('all','admin','trainer','user') NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS created_by_role ENUM('admin','trainer') NOT NULL DEFAULT 'admin',
    ADD COLUMN IF NOT EXISTS created_by_id INT NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS published_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS target_type ENUM('all','batch','course','trainer','user') NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS batch_id INT NULL,
    ADD COLUMN IF NOT EXISTS course_id INT NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_role ENUM('admin','trainer','user') NOT NULL,
    user_id INT NOT NULL,
    course_id INT NULL,
    activity_text VARCHAR(500) NOT NULL,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activities_user (user_role, user_id, created_at),
    INDEX idx_activities_course (course_id),
    CONSTRAINT fk_activities_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist_student_course (student_id, course_id),
    INDEX idx_wishlist_course (course_id),
    CONSTRAINT fk_wishlist_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_role ENUM('admin','trainer','user') NOT NULL,
    recipient_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500) NULL,
    link_url VARCHAR(500) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_recipient (recipient_role, recipient_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
