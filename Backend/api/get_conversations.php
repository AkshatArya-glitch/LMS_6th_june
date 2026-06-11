<?php

require_once __DIR__ . '/../includes/messaging_repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $pdo = db_connect();
    messaging_ensure_schema($pdo);
    $current = messaging_current_user();
    $box = messaging_clean_text($_GET['box'] ?? 'all', 30);
    $search = messaging_clean_text($_GET['search'] ?? '', 120);
    $roleFilter = messaging_clean_text($_GET['role_filter'] ?? ($_GET['filter_role'] ?? ''), 20);

    $allowedBoxes = ['all', 'inbox', 'sent', 'unread', 'support'];
    if (!in_array($box, $allowedBoxes, true)) {
        $box = 'all';
    }

    $conversations = messaging_get_conversations($pdo, $current, $box, $search, $roleFilter);
    auth_json(['success' => true, 'data' => ['conversations' => $conversations]]);
} catch (Throwable $exception) {
    auth_json(['success' => false, 'message' => 'Conversations could not be loaded.'], 500);
}
