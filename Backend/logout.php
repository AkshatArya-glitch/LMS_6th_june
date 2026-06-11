<?php

require_once __DIR__ . '/includes/session_auth.php';

$role = $_SESSION['role'] ?? 'user';
auth_destroy_session();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    auth_json(['success' => true, 'message' => 'You have been signed out.']);
}

header('Location: ' . auth_login_url(in_array($role, ['admin', 'trainer', 'user'], true) ? $role : 'user'));
exit;
