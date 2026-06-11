<?php

require_once __DIR__ . '/includes/session_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = auth_request_data();
auth_verify_csrf($data);

$identifier = auth_clean_string($data['identifier'] ?? '', 150);
$password = (string) ($data['password'] ?? '');
$role = strtolower(auth_clean_string($data['role'] ?? '', 20));
$remember = filter_var($data['remember'] ?? false, FILTER_VALIDATE_BOOLEAN);

if (!in_array($role, ['admin', 'trainer', 'user'], true)) {
    auth_json(['success' => false, 'message' => 'Select a valid login role.'], 422);
}

if ($identifier === '' || $password === '') {
    auth_json(['success' => false, 'message' => 'Email or username and password are required.'], 422);
}

$pdo = db_connect();
$account = auth_find_account($pdo, $role, $identifier);

if (!$account) {
    $actualRole = auth_identifier_role($pdo, $identifier);
    if ($actualRole && $actualRole !== $role) {
        auth_json(['success' => false, 'message' => 'Invalid login role selected.'], 403);
    }
    auth_json(['success' => false, 'message' => 'Invalid username/email or password.'], 401);
}

if (!password_verify($password, $account['password'])) {
    auth_json(['success' => false, 'message' => 'Invalid username/email or password.'], 401);
}

if (($account['status'] ?? 'active') !== 'active') {
    auth_json(['success' => false, 'message' => 'This account is inactive. Please contact the administrator.'], 403);
}

$account['role'] = $role;
auth_establish_session($account, $remember);
$user = auth_account_response($account);

auth_json([
    'success' => true,
    'message' => 'Login successful.',
    'redirect_url' => auth_role_redirect($role),
    'data' => [
        'user' => $user,
        'token' => $user['token'] ?? null,
    ],
]);
