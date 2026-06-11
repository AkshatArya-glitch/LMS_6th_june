<?php

require_once __DIR__ . '/../includes/messaging_repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $pdo = db_connect();
    messaging_ensure_schema($pdo);
    $current = messaging_current_user();
    auth_json(['success' => true, 'data' => ['unread_count' => messaging_unread_count($pdo, $current)]]);
} catch (Throwable $exception) {
    auth_json(['success' => false, 'message' => 'Unread count could not be loaded.'], 500);
}
