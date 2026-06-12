-- ============================================================
-- EEPL LMS - Admin-managed home hero slides
-- Run this once against the `eepl` database.
-- ============================================================

USE eepl;

CREATE TABLE IF NOT EXISTS hero_slides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    accent_text VARCHAR(255) NULL,
    description TEXT NULL,
    primary_button_text VARCHAR(100) NULL,
    primary_button_link VARCHAR(500) NULL,
    secondary_button_text VARCHAR(100) NULL,
    secondary_button_link VARCHAR(500) NULL,
    image_path VARCHAR(500) NULL,
    image_alt VARCHAR(255) NULL,
    badges_json LONGTEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hero_slides_active_order (is_active, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preserve the current CMS hero as the first slide. This inserts only when
-- hero_slides is empty, so re-running the migration does not duplicate data.
INSERT INTO hero_slides (
    title,
    accent_text,
    description,
    primary_button_text,
    primary_button_link,
    secondary_button_text,
    secondary_button_link,
    image_path,
    image_alt,
    badges_json,
    sort_order,
    is_active
)
SELECT
    ps.title,
    JSON_UNQUOTE(JSON_EXTRACT(ps.content_json, '$.highlight')),
    ps.subtitle,
    JSON_UNQUOTE(JSON_EXTRACT(ps.content_json, '$.cta_primary_text')),
    JSON_UNQUOTE(JSON_EXTRACT(ps.content_json, '$.cta_primary_url')),
    JSON_UNQUOTE(JSON_EXTRACT(ps.content_json, '$.cta_secondary_text')),
    JSON_UNQUOTE(JSON_EXTRACT(ps.content_json, '$.cta_secondary_url')),
    JSON_UNQUOTE(JSON_EXTRACT(ps.content_json, '$.image_url')),
    'Student learning',
    JSON_EXTRACT(ps.content_json, '$.badges'),
    ps.sort_order,
    ps.is_active
FROM page_sections ps
INNER JOIN pages p ON p.id = ps.page_id
WHERE p.page_key = 'home'
  AND ps.section_key = 'hero'
  AND NOT EXISTS (SELECT 1 FROM hero_slides)
ORDER BY ps.id
LIMIT 1;
