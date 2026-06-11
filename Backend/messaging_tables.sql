-- Messaging system tables for the EEPL LMS.
-- Run against the same database used by Backend/includes/db.php (default: eepl).

CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    participant_one_id INT NOT NULL,
    participant_one_role ENUM('admin','trainer','user') NOT NULL,
    participant_two_id INT NOT NULL,
    participant_two_role ENUM('admin','trainer','user') NOT NULL,
    subject VARCHAR(255) NULL,
    last_message TEXT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conversations_participant_one (participant_one_role, participant_one_id),
    INDEX idx_conversations_participant_two (participant_two_role, participant_two_id),
    INDEX idx_conversations_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    sender_role ENUM('admin','trainer','user') NOT NULL,
    receiver_id INT NOT NULL,
    receiver_role ENUM('admin','trainer','user') NOT NULL,
    recipient_id INT NOT NULL,
    recipient_role ENUM('admin','trainer','user') NOT NULL,
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    conversation_id VARCHAR(100) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_messages_sender (sender_role, sender_id),
    INDEX idx_messages_receiver (receiver_role, receiver_id, is_read),
    INDEX idx_messages_recipient (recipient_role, recipient_id, is_read),
    INDEX idx_messages_conversation (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Compatibility upgrade for older flat inbox tables that used recipient_* columns.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INT NULL AFTER sender_id;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_role ENUM('admin','trainer','user') NULL AFTER receiver_id;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id INT NULL AFTER receiver_role;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_role ENUM('admin','trainer','user') NULL AFTER recipient_id;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(100) NULL AFTER message;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE messages
SET receiver_id = recipient_id
WHERE (receiver_id IS NULL OR receiver_id = 0) AND recipient_id IS NOT NULL;

UPDATE messages
SET recipient_id = receiver_id
WHERE (recipient_id IS NULL OR recipient_id = 0) AND receiver_id IS NOT NULL;

UPDATE messages
SET receiver_role = recipient_role
WHERE (receiver_role IS NULL OR receiver_role = '') AND recipient_role IS NOT NULL;

UPDATE messages
SET recipient_role = receiver_role
WHERE (recipient_role IS NULL OR recipient_role = '') AND receiver_role IS NOT NULL;

UPDATE messages
SET conversation_id = CONCAT('legacy-', id)
WHERE conversation_id IS NULL OR conversation_id = '';

INSERT IGNORE INTO conversations (
    conversation_id,
    participant_one_id,
    participant_one_role,
    participant_two_id,
    participant_two_role,
    subject,
    last_message,
    last_message_at,
    created_at
)
SELECT conversation_id, sender_id, sender_role, receiver_id, receiver_role,
       subject, message, created_at, created_at
FROM messages
WHERE conversation_id IS NOT NULL
  AND receiver_id IS NOT NULL
  AND receiver_role IS NOT NULL;
