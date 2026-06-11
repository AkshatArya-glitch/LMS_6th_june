<?php

require_once __DIR__ . '/../includes/messaging_repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $pdo = db_connect();
    messaging_ensure_schema($pdo);
    $current = messaging_current_user();
    $conversationId = messaging_clean_text($_GET['conversation_id'] ?? '', 100);

    if ($conversationId === '') {
        auth_json(['success' => false, 'message' => 'Conversation is required.'], 422);
    }

    auth_json(['success' => true, 'data' => messaging_get_thread($pdo, $current, $conversationId)]);
} catch (Throwable $exception) {
    auth_json(['success' => false, 'message' => 'Messages could not be loaded.'], 500);
}
