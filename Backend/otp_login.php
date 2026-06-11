<?php

require_once __DIR__ . '/includes/session_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = auth_request_data();
auth_verify_csrf($data);

$action = strtolower(auth_clean_string($data['action'] ?? '', 20));
$identifier = auth_clean_string($data['identifier'] ?? '', 150);
$role = strtolower(auth_clean_string($data['role'] ?? '', 20));

if (!in_array($role, ['admin', 'trainer', 'user'], true) || $identifier === '') {
    auth_json(['success' => false, 'message' => 'Enter your registered email or username.'], 422);
}

$pdo = db_connect();
$account = auth_find_account($pdo, $role, $identifier);

if ($action === 'send') {
    if (!$account) {
        auth_json(['success' => false, 'message' => 'No account was found for the selected role.'], 404);
    }

    $otp = (string) random_int(100000, 999999);
    $_SESSION['auth_otp'] = [
        'hash' => password_hash($otp, PASSWORD_DEFAULT),
        'identifier' => $identifier,
        'role' => $role,
        'expires' => time() + 300,
    ];

    auth_json([
        'success' => true,
        'message' => 'Demo OTP generated. Connect an SMS or email provider before production use.',
        'demo_otp' => $otp,
    ]);
}

if ($action === 'verify') {
    $otp = auth_clean_string($data['otp'] ?? '', 6);
    $stored = $_SESSION['auth_otp'] ?? null;

    if (!$stored || $stored['identifier'] !== $identifier || $stored['role'] !== $role || $stored['expires'] < time()) {
        auth_json(['success' => false, 'message' => 'The OTP has expired. Request a new one.'], 422);
    }
    if (!preg_match('/^\d{6}$/', $otp) || !password_verify($otp, $stored['hash'])) {
        auth_json(['success' => false, 'message' => 'Enter the correct 6-digit OTP.'], 401);
    }
    if (!$account) {
        auth_json(['success' => false, 'message' => 'Account not found.'], 404);
    }

    unset($_SESSION['auth_otp']);
    $account['role'] = $role;
    auth_establish_session($account);
    $user = auth_account_response($account);

    auth_json([
        'success' => true,
        'message' => 'OTP verified.',
        'redirect_url' => auth_role_redirect($role),
        'data' => [
            'user' => $user,
            'token' => $user['token'] ?? null,
        ],
    ]);
}

auth_json(['success' => false, 'message' => 'Invalid OTP action.'], 422);

