<?php

require_once __DIR__ . '/../includes/messaging_repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $pdo = db_connect();
    messaging_ensure_schema($pdo);
    $current = messaging_current_user();
    $data = auth_request_data();
    auth_verify_csrf($data);
    $conversationId = messaging_clean_text($data['conversation_id'] ?? '', 100);

    if ($conversationId === '') {
        auth_json(['success' => false, 'message' => 'Conversation is required.'], 422);
    }

    $unread = messaging_mark_read($pdo, $current, $conversationId);
    auth_json(['success' => true, 'data' => ['unread_count' => $unread]]);
} catch (Throwable $exception) {
    auth_json(['success' => false, 'message' => 'Messages could not be marked as read.'], 500);
}
