-- ============================================================
-- EEPL LMS - Admin-managed public media gallery
-- Run this once against the `eepl` database.
-- ============================================================

USE eepl;

ALTER TABLE media_assets
    ADD COLUMN IF NOT EXISTS gallery_category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER alt_text,
    ADD COLUMN IF NOT EXISTS gallery_sort_order INT NOT NULL DEFAULT 0 AFTER gallery_category,
    ADD COLUMN IF NOT EXISTS is_gallery TINYINT(1) NOT NULL DEFAULT 0 AFTER gallery_sort_order,
    ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER is_gallery;

CREATE INDEX IF NOT EXISTS idx_media_gallery_public
    ON media_assets (is_gallery, is_active, gallery_sort_order, id);

UPDATE media_assets
SET is_gallery = 1
WHERE file_type = 'image'
  AND is_gallery = 0;
