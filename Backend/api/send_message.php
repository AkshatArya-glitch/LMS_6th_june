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

    $result = messaging_send($pdo, $current, $data);
    auth_json(['success' => true, 'message' => 'Message sent successfully.', 'data' => $result]);
} catch (Throwable $exception) {
    auth_json(['success' => false, 'message' => 'Message could not be sent.'], 500);
}
