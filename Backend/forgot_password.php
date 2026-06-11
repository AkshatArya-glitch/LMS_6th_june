<?php

require_once __DIR__ . '/includes/session_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = auth_request_data();
auth_verify_csrf($data);
$email = strtolower(auth_clean_string($data['email'] ?? '', 100));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    auth_json(['success' => false, 'message' => 'Enter a valid email address.'], 422);
}

auth_json([
    'success' => true,
    'message' => 'If an account uses this email, password reset instructions will be sent when email delivery is connected.',
]);

