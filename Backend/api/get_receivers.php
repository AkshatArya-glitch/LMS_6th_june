<?php

require_once __DIR__ . '/../includes/messaging_repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $pdo = db_connect();
    messaging_ensure_schema($pdo);
    $current = messaging_current_user();
    $role = messaging_clean_text($_GET['role'] ?? '', 20);

    if ($role !== '' && !in_array($role, messaging_allowed_receiver_roles($current['role']), true)) {
        auth_json(['success' => false, 'message' => 'Receiver role is not allowed for your account.'], 403);
    }

    $receivers = messaging_get_receivers($pdo, $current, $role);
    auth_json([
        'success' => true,
        'data' => [
            'roles' => messaging_allowed_receiver_roles($current['role']),
            'receivers' => $receivers,
        ],
    ]);
} catch (Throwable $exception) {
    auth_json(['success' => false, 'message' => 'Receivers could not be loaded.'], 500);
}
