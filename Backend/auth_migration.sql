USE eepl;

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL AFTER name;

ALTER TABLE admins
    ADD UNIQUE INDEX IF NOT EXISTS uq_admin_username (username);

UPDATE admins
SET username = CONCAT('admin', id)
WHERE username IS NULL OR username = '';

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL AFTER name,
    ADD COLUMN IF NOT EXISTS course_interest VARCHAR(150) NULL AFTER bio;

UPDATE students
SET username = CONCAT('student', id)
WHERE username IS NULL OR username = '';

ALTER TABLE students
    MODIFY username VARCHAR(100) NOT NULL,
    ADD UNIQUE INDEX IF NOT EXISTS uq_student_username (username);

CREATE TABLE IF NOT EXISTS trainers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'trainer',
    profile_image VARCHAR(255) NULL,
    specialization VARCHAR(150) NULL,
    experience_years INT UNSIGNED NULL,
    qualification VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trainers_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

