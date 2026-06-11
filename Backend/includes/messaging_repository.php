<?php

require_once __DIR__ . '/session_auth.php';

function messaging_current_user(): array
{
    auth_start_session();
    $role = $_SESSION['role'] ?? '';
    $userId = (int) ($_SESSION['user_id'] ?? 0);

    if (!in_array($role, ['admin', 'trainer', 'user'], true) || $userId <= 0) {
        auth_json(['success' => false, 'message' => 'Authentication required.'], 401);
    }

    return ['id' => $userId, 'role' => $role];
}

function messaging_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute([$table, $column]);
    return (int) $stmt->fetchColumn() > 0;
}

function messaging_index_exists(PDO $pdo, string $table, string $index): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?'
    );
    $stmt->execute([$table, $index]);
    return (int) $stmt->fetchColumn() > 0;
}

function messaging_add_column(PDO $pdo, string $table, string $column, string $definition): void
{
    if (!messaging_column_exists($pdo, $table, $column)) {
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$definition}");
    }
}

function messaging_add_index(PDO $pdo, string $table, string $index, string $definition): void
{
    if (!messaging_index_exists($pdo, $table, $index)) {
        $pdo->exec("CREATE INDEX {$index} ON {$table} {$definition}");
    }
}

function messaging_ensure_schema(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    messaging_add_column($pdo, 'messages', 'receiver_id', 'receiver_id INT NULL AFTER sender_id');
    messaging_add_column($pdo, 'messages', 'receiver_role', "receiver_role ENUM('admin','trainer','user') NULL AFTER receiver_id");
    messaging_add_column($pdo, 'messages', 'recipient_id', 'recipient_id INT NULL AFTER receiver_role');
    messaging_add_column($pdo, 'messages', 'recipient_role', "recipient_role ENUM('admin','trainer','user') NULL AFTER recipient_id");
    messaging_add_column($pdo, 'messages', 'conversation_id', 'conversation_id VARCHAR(100) NULL AFTER message');
    messaging_add_column($pdo, 'messages', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    if (messaging_column_exists($pdo, 'messages', 'recipient_id') && messaging_column_exists($pdo, 'messages', 'receiver_id')) {
        $pdo->exec('UPDATE messages SET receiver_id = recipient_id WHERE (receiver_id IS NULL OR receiver_id = 0) AND recipient_id IS NOT NULL');
        $pdo->exec('UPDATE messages SET recipient_id = receiver_id WHERE (recipient_id IS NULL OR recipient_id = 0) AND receiver_id IS NOT NULL');
    }

    if (messaging_column_exists($pdo, 'messages', 'recipient_role') && messaging_column_exists($pdo, 'messages', 'receiver_role')) {
        $pdo->exec("UPDATE messages SET receiver_role = recipient_role WHERE (receiver_role IS NULL OR receiver_role = '') AND recipient_role IS NOT NULL");
        $pdo->exec("UPDATE messages SET recipient_role = receiver_role WHERE (recipient_role IS NULL OR recipient_role = '') AND receiver_role IS NOT NULL");
    }

    $pdo->exec("UPDATE messages SET conversation_id = CONCAT('legacy-', id) WHERE conversation_id IS NULL OR conversation_id = ''");

    messaging_add_index($pdo, 'messages', 'idx_messages_receiver', '(receiver_role, receiver_id, is_read)');
    messaging_add_index($pdo, 'messages', 'idx_messages_recipient', '(recipient_role, recipient_id, is_read)');
    messaging_add_index($pdo, 'messages', 'idx_messages_conversation', '(conversation_id, created_at)');

    $pdo->exec("
        INSERT IGNORE INTO conversations (
            conversation_id, participant_one_id, participant_one_role,
            participant_two_id, participant_two_role, subject, last_message, last_message_at, created_at
        )
        SELECT conversation_id, sender_id, sender_role, receiver_id, receiver_role,
               subject, message, created_at, created_at
        FROM messages
        WHERE conversation_id IS NOT NULL
          AND receiver_id IS NOT NULL
          AND receiver_role IS NOT NULL
    ");

    $pdo->exec("
        UPDATE conversations c
        SET
            last_message = (
                SELECT m.message FROM messages m
                WHERE m.conversation_id = c.conversation_id
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT 1
            ),
            last_message_at = COALESCE((
                SELECT m.created_at FROM messages m
                WHERE m.conversation_id = c.conversation_id
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT 1
            ), c.last_message_at)
    ");

    $ready = true;
}

function messaging_clean_text($value, int $maxLength): string
{
    $value = trim((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }
    return substr($value, 0, $maxLength);
}

function messaging_account_table(string $role): array
{
    return match ($role) {
        'admin' => ['admins', 'name'],
        'trainer' => ['trainers', 'full_name'],
        default => ['students', 'name'],
    };
}

function messaging_account(PDO $pdo, string $role, int $id): ?array
{
    if (!in_array($role, ['admin', 'trainer', 'user'], true) || $id <= 0) {
        return null;
    }

    [$table, $nameColumn] = messaging_account_table($role);
    $stmt = $pdo->prepare("
        SELECT id, {$nameColumn} AS name, email
        FROM {$table}
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return null;
    }

    return [
        'id' => (int) $row['id'],
        'role' => $role,
        'name' => $row['name'] ?: ucfirst($role),
        'email' => $row['email'] ?? '',
    ];
}

function messaging_accounts_by_role(PDO $pdo, string $role, array $ids): array
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $ids))));
    if (!$ids) {
        return [];
    }

    [$table, $nameColumn] = messaging_account_table($role);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, {$nameColumn} AS name, email FROM {$table} WHERE id IN ({$placeholders})");
    $stmt->execute($ids);

    $accounts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $accounts[(int) $row['id']] = [
            'id' => (int) $row['id'],
            'role' => $role,
            'name' => $row['name'] ?: ucfirst($role),
            'email' => $row['email'] ?? '',
        ];
    }
    return $accounts;
}

function messaging_hydrate_accounts(PDO $pdo, array $conversations): array
{
    $idsByRole = ['admin' => [], 'trainer' => [], 'user' => []];
    foreach ($conversations as $conversation) {
        $idsByRole[$conversation['participant_one_role']][] = (int) $conversation['participant_one_id'];
        $idsByRole[$conversation['participant_two_role']][] = (int) $conversation['participant_two_id'];
    }

    return [
        'admin' => messaging_accounts_by_role($pdo, 'admin', $idsByRole['admin']),
        'trainer' => messaging_accounts_by_role($pdo, 'trainer', $idsByRole['trainer']),
        'user' => messaging_accounts_by_role($pdo, 'user', $idsByRole['user']),
    ];
}

function messaging_user_can_message(PDO $pdo, string $senderRole, int $senderId, string $receiverRole, int $receiverId): bool
{
    if (!messaging_account($pdo, $receiverRole, $receiverId)) {
        return false;
    }

    if ($senderRole === 'admin') {
        return in_array($receiverRole, ['user', 'trainer', 'admin'], true);
    }

    if ($senderRole === 'user') {
        if ($receiverRole === 'admin') {
            return true;
        }

        if ($receiverRole !== 'trainer') {
            return false;
        }

        $stmt = $pdo->prepare("
            SELECT 1
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            LEFT JOIN batches b ON b.id = e.batch_id
            WHERE e.student_id = ?
              AND COALESCE(b.trainer_id, c.trainer_id) = ?
            LIMIT 1
        ");
        $stmt->execute([$senderId, $receiverId]);
        return (bool) $stmt->fetchColumn();
    }

    if ($senderRole === 'trainer') {
        if ($receiverRole === 'admin') {
            return true;
        }

        if ($receiverRole !== 'user') {
            return false;
        }

        $stmt = $pdo->prepare("
            SELECT 1
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            LEFT JOIN batches b ON b.id = e.batch_id
            WHERE e.student_id = ?
              AND (c.trainer_id = ? OR b.trainer_id = ?)
            LIMIT 1
        ");
        $stmt->execute([$receiverId, $senderId, $senderId]);
        return (bool) $stmt->fetchColumn();
    }

    return false;
}

function messaging_conversation_access(PDO $pdo, string $conversationId, array $current): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM conversations WHERE conversation_id = ? LIMIT 1');
    $stmt->execute([$conversationId]);
    $conversation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$conversation) {
        return null;
    }

    $isParticipant = (
        ($conversation['participant_one_role'] === $current['role'] && (int) $conversation['participant_one_id'] === $current['id'])
        || ($conversation['participant_two_role'] === $current['role'] && (int) $conversation['participant_two_id'] === $current['id'])
    );

    if (!$isParticipant && $current['role'] !== 'admin') {
        auth_json(['success' => false, 'message' => 'You cannot access this conversation.'], 403);
    }

    $conversation['is_participant'] = $isParticipant;
    return $conversation;
}

function messaging_other_participant(array $conversation, array $current): ?array
{
    if ($conversation['participant_one_role'] === $current['role'] && (int) $conversation['participant_one_id'] === $current['id']) {
        return ['role' => $conversation['participant_two_role'], 'id' => (int) $conversation['participant_two_id']];
    }

    if ($conversation['participant_two_role'] === $current['role'] && (int) $conversation['participant_two_id'] === $current['id']) {
        return ['role' => $conversation['participant_one_role'], 'id' => (int) $conversation['participant_one_id']];
    }

    return null;
}

function messaging_create_conversation(PDO $pdo, array $current, string $receiverRole, int $receiverId, string $subject): array
{
    $conversationId = 'conv_' . bin2hex(random_bytes(16));
    $stmt = $pdo->prepare("
        INSERT INTO conversations (
            conversation_id, participant_one_id, participant_one_role,
            participant_two_id, participant_two_role, subject, last_message, last_message_at
        ) VALUES (?, ?, ?, ?, ?, ?, '', NOW())
    ");
    $stmt->execute([$conversationId, $current['id'], $current['role'], $receiverId, $receiverRole, $subject ?: null]);

    return [
        'conversation_id' => $conversationId,
        'participant_one_id' => $current['id'],
        'participant_one_role' => $current['role'],
        'participant_two_id' => $receiverId,
        'participant_two_role' => $receiverRole,
        'subject' => $subject,
        'is_participant' => true,
    ];
}

function messaging_send(PDO $pdo, array $current, array $data): array
{
    $message = messaging_clean_text($data['message'] ?? '', 5000);
    if ($message === '') {
        auth_json(['success' => false, 'message' => 'Message cannot be empty.'], 422);
    }

    $conversationId = messaging_clean_text($data['conversation_id'] ?? '', 100);
    $subject = messaging_clean_text($data['subject'] ?? '', 255);

    if ($conversationId !== '') {
        $conversation = messaging_conversation_access($pdo, $conversationId, $current);
        if (!$conversation) {
            auth_json(['success' => false, 'message' => 'Conversation not found.'], 404);
        }

        $receiver = messaging_other_participant($conversation, $current);
        if (!$receiver) {
            auth_json(['success' => false, 'message' => 'Admins can view this conversation but cannot reply unless they are a participant.'], 403);
        }

        $receiverRole = $receiver['role'];
        $receiverId = $receiver['id'];
        $subject = $conversation['subject'] ?: $subject;
    } else {
        $receiverRole = messaging_clean_text($data['receiver_role'] ?? '', 20);
        $receiverId = (int) ($data['receiver_id'] ?? 0);

        if (!in_array($receiverRole, ['admin', 'trainer', 'user'], true) || $receiverId <= 0) {
            auth_json(['success' => false, 'message' => 'Choose a valid receiver.'], 422);
        }

        if (!messaging_user_can_message($pdo, $current['role'], $current['id'], $receiverRole, $receiverId)) {
            auth_json(['success' => false, 'message' => 'You do not have permission to message this receiver.'], 403);
        }

        $conversation = messaging_create_conversation($pdo, $current, $receiverRole, $receiverId, $subject);
        $conversationId = $conversation['conversation_id'];
    }

    $stmt = $pdo->prepare("
        INSERT INTO messages (
            sender_id, sender_role, receiver_id, receiver_role,
            recipient_id, recipient_role, subject, message, conversation_id, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ");
    $stmt->execute([
        $current['id'],
        $current['role'],
        $receiverId,
        $receiverRole,
        $receiverId,
        $receiverRole,
        $subject ?: null,
        $message,
        $conversationId,
    ]);

    $update = $pdo->prepare("
        UPDATE conversations
        SET subject = COALESCE(NULLIF(subject, ''), ?),
            last_message = ?,
            last_message_at = NOW(),
            updated_at = NOW()
        WHERE conversation_id = ?
    ");
    $update->execute([$subject ?: null, $message, $conversationId]);

    return [
        'message_id' => (int) $pdo->lastInsertId(),
        'conversation_id' => $conversationId,
    ];
}

function messaging_receiver_rows(PDO $pdo, array $current, string $targetRole): array
{
    if (!in_array($targetRole, ['admin', 'trainer', 'user'], true)) {
        return [];
    }

    if ($current['role'] === 'admin') {
        if ($targetRole === 'admin') {
            $stmt = $pdo->prepare("SELECT id, name, email, 'admin' AS role FROM admins WHERE id <> ? ORDER BY name");
            $stmt->execute([$current['id']]);
        } elseif ($targetRole === 'trainer') {
            $stmt = $pdo->query("SELECT id, full_name AS name, email, 'trainer' AS role FROM trainers WHERE status = 'active' ORDER BY full_name");
        } else {
            $stmt = $pdo->query("SELECT id, name, email, 'user' AS role FROM students WHERE status = 'active' ORDER BY name");
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if ($targetRole === 'admin') {
        return $pdo->query("SELECT id, name, email, 'admin' AS role FROM admins WHERE status = 'active' ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
    }

    if ($current['role'] === 'user' && $targetRole === 'trainer') {
        $stmt = $pdo->prepare("
            SELECT DISTINCT t.id, t.full_name AS name, t.email, 'trainer' AS role
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            LEFT JOIN batches b ON b.id = e.batch_id
            JOIN trainers t ON t.id = COALESCE(b.trainer_id, c.trainer_id)
            WHERE e.student_id = ? AND t.status = 'active'
            ORDER BY t.full_name
        ");
        $stmt->execute([$current['id']]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if ($current['role'] === 'trainer' && $targetRole === 'user') {
        $stmt = $pdo->prepare("
            SELECT DISTINCT s.id, s.name, s.email, 'user' AS role
            FROM enrollments e
            JOIN students s ON s.id = e.student_id
            JOIN courses c ON c.id = e.course_id
            LEFT JOIN batches b ON b.id = e.batch_id
            WHERE (c.trainer_id = ? OR b.trainer_id = ?) AND s.status = 'active'
            ORDER BY s.name
        ");
        $stmt->execute([$current['id'], $current['id']]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    return [];
}

function messaging_allowed_receiver_roles(string $role): array
{
    return match ($role) {
        'admin' => ['user', 'trainer'],
        'trainer' => ['admin', 'user'],
        default => ['admin', 'trainer'],
    };
}

function messaging_get_receivers(PDO $pdo, array $current, string $targetRole = ''): array
{
    $roles = $targetRole ? [$targetRole] : messaging_allowed_receiver_roles($current['role']);
    $receivers = [];

    foreach ($roles as $role) {
        foreach (messaging_receiver_rows($pdo, $current, $role) as $row) {
            $receivers[] = [
                'id' => (int) $row['id'],
                'role' => $row['role'],
                'name' => $row['name'] ?: ucfirst($row['role']),
                'email' => $row['email'] ?? '',
                'label' => trim(($row['name'] ?: ucfirst($row['role'])) . (($row['email'] ?? '') ? ' - ' . $row['email'] : '')),
            ];
        }
    }

    return $receivers;
}

function messaging_conversation_where(array $current, string $box, string $roleFilter): array
{
    $where = [];
    $params = [];

    if ($current['role'] !== 'admin') {
        $where[] = '((c.participant_one_role = ? AND c.participant_one_id = ?) OR (c.participant_two_role = ? AND c.participant_two_id = ?))';
        array_push($params, $current['role'], $current['id'], $current['role'], $current['id']);
    }

    if ($box === 'inbox') {
        $where[] = 'EXISTS (SELECT 1 FROM messages mi WHERE mi.conversation_id = c.conversation_id AND mi.receiver_role = ? AND mi.receiver_id = ?)';
        array_push($params, $current['role'], $current['id']);
    } elseif ($box === 'sent') {
        $where[] = 'EXISTS (SELECT 1 FROM messages ms WHERE ms.conversation_id = c.conversation_id AND ms.sender_role = ? AND ms.sender_id = ?)';
        array_push($params, $current['role'], $current['id']);
    } elseif ($box === 'unread') {
        $where[] = 'EXISTS (SELECT 1 FROM messages mu WHERE mu.conversation_id = c.conversation_id AND mu.receiver_role = ? AND mu.receiver_id = ? AND mu.is_read = 0)';
        array_push($params, $current['role'], $current['id']);
    } elseif ($box === 'support') {
        $where[] = "(LOWER(COALESCE(c.subject, '')) REGEXP 'support|query|payment|enrollment|certificate|course|issue' OR LOWER(COALESCE(c.last_message, '')) REGEXP 'support|query|payment|enrollment|certificate|course|issue')";
    }

    if (in_array($roleFilter, ['admin', 'trainer', 'user'], true)) {
        $where[] = '(c.participant_one_role = ? OR c.participant_two_role = ?)';
        array_push($params, $roleFilter, $roleFilter);
    }

    return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
}

function messaging_get_conversations(PDO $pdo, array $current, string $box = 'all', string $search = '', string $roleFilter = ''): array
{
    [$whereSql, $params] = messaging_conversation_where($current, $box, $roleFilter);
    $stmt = $pdo->prepare("
        SELECT c.*,
            (SELECT COUNT(*) FROM messages m
             WHERE m.conversation_id = c.conversation_id
               AND m.receiver_role = ?
               AND m.receiver_id = ?
               AND m.is_read = 0) AS unread_count,
            (SELECT GROUP_CONCAT(SUBSTRING(m.message, 1, 500) SEPARATOR ' ')
             FROM messages m
             WHERE m.conversation_id = c.conversation_id) AS message_blob
        FROM conversations c
        {$whereSql}
        ORDER BY c.last_message_at DESC, c.id DESC
        LIMIT 200
    ");
    $stmt->execute(array_merge([$current['role'], $current['id']], $params));
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $accounts = messaging_hydrate_accounts($pdo, $rows);
    $search = strtolower(trim($search));
    $result = [];

    foreach ($rows as $row) {
        $one = $accounts[$row['participant_one_role']][(int) $row['participant_one_id']]
            ?? ['id' => (int) $row['participant_one_id'], 'role' => $row['participant_one_role'], 'name' => ucfirst($row['participant_one_role']), 'email' => ''];
        $two = $accounts[$row['participant_two_role']][(int) $row['participant_two_id']]
            ?? ['id' => (int) $row['participant_two_id'], 'role' => $row['participant_two_role'], 'name' => ucfirst($row['participant_two_role']), 'email' => ''];

        $isOne = $one['role'] === $current['role'] && $one['id'] === $current['id'];
        $isTwo = $two['role'] === $current['role'] && $two['id'] === $current['id'];
        $counterpart = $isOne ? $two : ($isTwo ? $one : [
            'id' => 0,
            'role' => 'admin',
            'name' => $one['name'] . ' / ' . $two['name'],
            'email' => trim($one['role'] . ' to ' . $two['role']),
        ]);

        $haystack = strtolower(implode(' ', [
            $row['subject'] ?? '',
            $row['last_message'] ?? '',
            $row['message_blob'] ?? '',
            $one['name'],
            $one['email'],
            $two['name'],
            $two['email'],
        ]));

        if ($search !== '' && !str_contains($haystack, $search)) {
            continue;
        }

        $result[] = [
            'conversation_id' => $row['conversation_id'],
            'subject' => $row['subject'] ?: 'No subject',
            'last_message' => $row['last_message'] ?: '',
            'last_message_at' => $row['last_message_at'],
            'created_at' => $row['created_at'],
            'unread_count' => (int) $row['unread_count'],
            'participant_one' => $one,
            'participant_two' => $two,
            'counterpart' => $counterpart,
            'can_reply' => $isOne || $isTwo,
        ];
    }

    return $result;
}

function messaging_get_thread(PDO $pdo, array $current, string $conversationId): array
{
    $conversation = messaging_conversation_access($pdo, $conversationId, $current);
    if (!$conversation) {
        auth_json(['success' => false, 'message' => 'Conversation not found.'], 404);
    }

    $accounts = messaging_hydrate_accounts($pdo, [$conversation]);
    $one = $accounts[$conversation['participant_one_role']][(int) $conversation['participant_one_id']]
        ?? ['id' => (int) $conversation['participant_one_id'], 'role' => $conversation['participant_one_role'], 'name' => ucfirst($conversation['participant_one_role']), 'email' => ''];
    $two = $accounts[$conversation['participant_two_role']][(int) $conversation['participant_two_id']]
        ?? ['id' => (int) $conversation['participant_two_id'], 'role' => $conversation['participant_two_role'], 'name' => ucfirst($conversation['participant_two_role']), 'email' => ''];

    $stmt = $pdo->prepare("
        SELECT id, sender_id, sender_role, receiver_id, receiver_role, subject, message, is_read, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at, id
    ");
    $stmt->execute([$conversationId]);
    $messages = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $sender = $row['sender_role'] === $one['role'] && (int) $row['sender_id'] === $one['id'] ? $one : $two;
        $receiver = $row['receiver_role'] === $one['role'] && (int) $row['receiver_id'] === $one['id'] ? $one : $two;
        $messages[] = [
            'id' => (int) $row['id'],
            'sender' => $sender,
            'receiver' => $receiver,
            'subject' => $row['subject'] ?: ($conversation['subject'] ?: 'No subject'),
            'message' => $row['message'],
            'is_read' => (bool) $row['is_read'],
            'is_mine' => $row['sender_role'] === $current['role'] && (int) $row['sender_id'] === $current['id'],
            'created_at' => $row['created_at'],
        ];
    }

    $isParticipant = (bool) ($conversation['is_participant'] ?? false);

    return [
        'conversation' => [
            'conversation_id' => $conversation['conversation_id'],
            'subject' => $conversation['subject'] ?: 'No subject',
            'participant_one' => $one,
            'participant_two' => $two,
            'can_reply' => $isParticipant,
        ],
        'messages' => $messages,
    ];
}

function messaging_mark_read(PDO $pdo, array $current, string $conversationId): int
{
    messaging_conversation_access($pdo, $conversationId, $current);
    $stmt = $pdo->prepare("
        UPDATE messages
        SET is_read = 1, updated_at = NOW()
        WHERE conversation_id = ?
          AND receiver_role = ?
          AND receiver_id = ?
          AND is_read = 0
    ");
    $stmt->execute([$conversationId, $current['role'], $current['id']]);

    return messaging_unread_count($pdo, $current);
}

function messaging_unread_count(PDO $pdo, array $current): int
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM messages WHERE receiver_role = ? AND receiver_id = ? AND is_read = 0');
    $stmt->execute([$current['role'], $current['id']]);
    return (int) $stmt->fetchColumn();
}
