-- ============================================================
-- EEPL LMS CMS Migration — Phase 1
-- Run this in phpMyAdmin or MySQL CLI against the `eepl` database
-- ============================================================

USE eepl;

-- ---------------------------------------------------------------
-- 1. PAGES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'home|courses|webinar|articles|certification|contact',
    title VARCHAR(255),
    slug VARCHAR(255),
    status ENUM('draft','published') DEFAULT 'published',
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO pages (page_key, title, slug, status) VALUES
('home','Home Page','/',  'published'),
('courses','Courses','courses','published'),
('webinar','Webinars','webinar','published'),
('articles','Articles','articles','published'),
('certification','Certification','certification','published'),
('contact','Contact','contact','published');

-- ---------------------------------------------------------------
-- 2. PAGE SECTIONS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_id INT NOT NULL,
    section_key VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    subtitle TEXT,
    content_json LONGTEXT,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ps_page (page_id),
    CONSTRAINT fk_ps_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 3. MEDIA ASSETS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('image','video','pdf','document') DEFAULT 'image',
    mime_type VARCHAR(100),
    size BIGINT DEFAULT 0,
    alt_text VARCHAR(255),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_media_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 4. SITE SETTINGS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value LONGTEXT,
    setting_type ENUM('text','image','json','boolean','number') DEFAULT 'text',
    group_name VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, group_name) VALUES
('site_name','EEPL Classroom','text','general'),
('site_logo','','image','general'),
('site_favicon','','image','general'),
('contact_email','info@eepl.in','text','contact'),
('contact_phone','+91 9999999999','text','contact'),
('contact_whatsapp','+91 9999999999','text','contact'),
('contact_address','Ranchi, Jharkhand, India','text','contact'),
('social_facebook','','text','social'),
('social_instagram','','text','social'),
('social_youtube','','text','social'),
('social_linkedin','','text','social'),
('social_twitter','','text','social'),
('seo_default_title','EEPL Classroom — Learn Today. Lead Tomorrow.','text','seo'),
('seo_default_description','Industry-relevant online courses in Data Analytics, Java, Spoken English and more.','text','seo'),
('maintenance_mode','0','boolean','general'),
('google_analytics_id','','text','google'),
('razorpay_key_id','','text','payment');

-- ---------------------------------------------------------------
-- 5. NAVIGATION MENUS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS navigation_menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location ENUM('header','footer','mobile') DEFAULT 'header',
    label VARCHAR(100) NOT NULL,
    url VARCHAR(500),
    parent_id INT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nav_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO navigation_menus (location, label, url, sort_order, is_active) VALUES
('header','Home','/index.html',1,1),
('header','Courses','/courses.html',2,1),
('header','Webinars','/webinar.html',3,1),
('header','Articles','/articles.html',4,1),
('header','Certification','/certification.html',5,1),
('header','Contact','/contact.html',6,1);

-- ---------------------------------------------------------------
-- 6. TESTIMONIALS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    company_or_course VARCHAR(255),
    quote TEXT NOT NULL,
    rating TINYINT DEFAULT 5,
    image_url VARCHAR(500),
    is_featured TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 7. HOME PAGE POPUPS
-- ---------------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- ---------------------------------------------------------------
-- 8. TRUSTED PARTNERS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trusted_partners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 8. FAQS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_key VARCHAR(100) DEFAULT 'home',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_faq_page (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 9. COUNTERS / STATS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS counters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(50) NOT NULL,
    suffix VARCHAR(50),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO counters (label, value, suffix, icon, sort_order, is_active) VALUES
('Students Enrolled','5000','+','👨‍🎓',1,1),
('Courses Available','50','+','📚',2,1),
('Expert Instructors','20','+','🏆',3,1),
('Success Rate','95','%','✅',4,1);

-- ---------------------------------------------------------------
-- 10. COURSE CATEGORIES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 11. EXTEND COURSES TABLE
-- ---------------------------------------------------------------
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS discount_type VARCHAR(30) NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS discount_status TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS level ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
    ADD COLUMN IF NOT EXISTS badge VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_popular TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS category_id INT DEFAULT NULL;

-- ---------------------------------------------------------------
-- 12. COURSE FEATURES & FAQS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_features (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    INDEX idx_cf_course (course_id),
    CONSTRAINT fk_cf_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS course_faqs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    INDEX idx_cofaq_course (course_id),
    CONSTRAINT fk_cofaq_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 13. WEBINARS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webinars (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    speaker_name VARCHAR(255),
    speaker_role VARCHAR(255),
    speaker_image_url VARCHAR(500),
    banner_url VARCHAR(500),
    category VARCHAR(100),
    starts_at DATETIME,
    ends_at DATETIME,
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    seats_limit INT DEFAULT 0,
    seats_left INT DEFAULT 0,
    registration_enabled TINYINT(1) DEFAULT 1,
    meet_url VARCHAR(500),
    status ENUM('draft','published','completed','cancelled') DEFAULT 'draft',
    is_featured TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE webinars
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS webinar_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    student_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    status ENUM('registered','attended','cancelled') DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wr_webinar (webinar_id),
    CONSTRAINT fk_wr_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS webinar_recordings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    title VARCHAR(255),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    recorded_at DATE,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_wrec_webinar (webinar_id),
    CONSTRAINT fk_wrec_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 14. BLOG / ARTICLE CONTENT CATEGORIES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    type ENUM('blog','article','both') DEFAULT 'both',
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('blog','article') DEFAULT 'blog',
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    excerpt TEXT,
    content LONGTEXT,
    featured_image_url VARCHAR(500),
    author_admin_id INT,
    category_id INT,
    tags_json TEXT,
    reading_time INT DEFAULT 5,
    status ENUM('draft','published','scheduled') DEFAULT 'draft',
    is_featured TINYINT(1) DEFAULT 0,
    published_at TIMESTAMP NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_posts_type (type),
    INDEX idx_posts_status (status),
    INDEX idx_posts_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 15. CERTIFICATE TEMPLATES  + EXTEND CERTIFICATES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    template_image_url VARCHAR(500),
    html_template LONGTEXT,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE certificates
    ADD COLUMN IF NOT EXISTS template_id INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS batch_id INT NULL,
    ADD COLUMN IF NOT EXISTS student_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS course_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS certificate_file VARCHAR(500),
    ADD COLUMN IF NOT EXISTS verification_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS status ENUM('active','revoked','pending') DEFAULT 'active';

ALTER TABLE certificates
    MODIFY COLUMN status ENUM('active','revoked','pending') DEFAULT 'active';

-- ---------------------------------------------------------------
-- 16. CONTACT LEADS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    subject VARCHAR(255),
    message TEXT,
    source_page VARCHAR(255),
    status ENUM('new','contacted','converted','closed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- 17. HOME PAGE HERO CONFIG (stored in page_sections)
-- ---------------------------------------------------------------
INSERT IGNORE INTO page_sections (page_id, section_key, title, subtitle, content_json, sort_order, is_active)
SELECT id, 'hero', 'Learn Today. Lead Tomorrow.', 'Industry-relevant skills for the digital age.',
'{"cta_primary_text":"Explore Courses","cta_primary_url":"/courses.html","cta_secondary_text":"Free Counselling","cta_secondary_url":"/contact.html","badges":[{"icon":"🎓","text":"5000+ Students"},{"icon":"✅","text":"Certified Courses"},{"icon":"🏆","text":"Expert Instructors"}]}',
1, 1
FROM pages WHERE page_key = 'home';

-- Prevent long CDN URLs and data URLs from being silently truncated.
ALTER TABLE courses
    MODIFY COLUMN thumbnail_url LONGTEXT NULL,
    MODIFY COLUMN banner_url LONGTEXT NULL;

ALTER TABLE course_categories
    MODIFY COLUMN image_url LONGTEXT NULL;

ALTER TABLE webinars
    MODIFY COLUMN speaker_image_url LONGTEXT NULL,
    MODIFY COLUMN banner_url LONGTEXT NULL;

ALTER TABLE webinar_recordings
    MODIFY COLUMN thumbnail_url LONGTEXT NULL;

ALTER TABLE testimonials
    MODIFY COLUMN image_url LONGTEXT NULL;

ALTER TABLE trusted_partners
    MODIFY COLUMN logo_url LONGTEXT NULL;

ALTER TABLE posts
    MODIFY COLUMN featured_image_url LONGTEXT NULL;
