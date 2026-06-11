<?php

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

function auth_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name('eepl_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function auth_json(array $payload, int $status = 200): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function auth_request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
        return is_array($data) ? $data : [];
    }

    return $_POST;
}

function auth_csrf_token(): string
{
    auth_start_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function auth_verify_csrf(array $data): void
{
    auth_start_session();
    $submitted = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($data['csrf_token'] ?? '');
    $stored = $_SESSION['csrf_token'] ?? '';

    if (!$stored || !$submitted || !hash_equals($stored, (string) $submitted)) {
        auth_json(['success' => false, 'message' => 'Your session expired. Refresh the page and try again.'], 419);
    }
}

function auth_clean_string($value, int $maxLength = 255): string
{
    $value = trim((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }
    return substr($value, 0, $maxLength);
}

function auth_frontend_base(): string
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    foreach (['/Frontend/', '/Backend/'] as $marker) {
        $position = stripos($script, $marker);
        if ($position !== false) {
            return substr($script, 0, $position) . '/Frontend';
        }
    }
    return '/Frontend';
}

function auth_frontend_url(string $path = ''): string
{
    return rtrim(auth_frontend_base(), '/') . '/' . ltrim($path, '/');
}

function auth_role_redirect(string $role): string
{
    $paths = [
        'admin' => 'admin/dashboard.php',
        'trainer' => 'trainer-dashboard/index.php',
        'user' => 'user-dashboard/index.php',
    ];
    return auth_frontend_url($paths[$role] ?? 'login.php');
}

function auth_login_url(string $role = 'user'): string
{
    return auth_frontend_url('login.php?role=' . rawurlencode($role));
}

function auth_token_payload(int $id, string $email, string $role): array
{
    $ttl = (int) env('JWT_TTL', 60);
    return [
        'id' => $id,
        'email' => $email,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + ($ttl * 60),
    ];
}

function auth_find_account(PDO $pdo, string $role, string $identifier): ?array
{
    if ($role === 'admin') {
        $stmt = $pdo->prepare(
            'SELECT id, name AS full_name, email, username, password, role, NULL AS profile_image, status
             FROM admins WHERE email = ? OR username = ? LIMIT 1'
        );
    } elseif ($role === 'trainer') {
        $stmt = $pdo->prepare(
            'SELECT id, full_name, email, username, password, role, profile_image, status
             FROM trainers WHERE email = ? OR username = ? LIMIT 1'
        );
    } else {
        $stmt = $pdo->prepare(
            "SELECT id, name AS full_name, email, username, password, 'user' AS role, profile_image, status
             FROM students WHERE email = ? OR username = ? LIMIT 1"
        );
    }

    $stmt->execute([$identifier, $identifier]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);
    return $account ?: null;
}

function auth_identifier_role(PDO $pdo, string $identifier): ?string
{
    $checks = [
        'admin' => 'SELECT id FROM admins WHERE email = ? OR username = ? LIMIT 1',
        'trainer' => 'SELECT id FROM trainers WHERE email = ? OR username = ? LIMIT 1',
        'user' => 'SELECT id FROM students WHERE email = ? OR username = ? LIMIT 1',
    ];

    foreach ($checks as $role => $sql) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$identifier, $identifier]);
        if ($stmt->fetchColumn()) {
            return $role;
        }
    }
    return null;
}

function auth_identifier_exists(PDO $pdo, string $email, string $username): array
{
    $tables = ['admins', 'trainers', 'students'];
    foreach ($tables as $table) {
        $emailStmt = $pdo->prepare("SELECT id FROM {$table} WHERE email = ? LIMIT 1");
        $emailStmt->execute([$email]);
        if ($emailStmt->fetchColumn()) {
            return ['field' => 'email', 'message' => 'An account with this email already exists.'];
        }

        $usernameStmt = $pdo->prepare("SELECT id FROM {$table} WHERE username = ? LIMIT 1");
        $usernameStmt->execute([$username]);
        if ($usernameStmt->fetchColumn()) {
            return ['field' => 'username', 'message' => 'This username is already in use.'];
        }
    }
    return [];
}

function auth_establish_session(array $account, bool $remember = false): void
{
    auth_start_session();
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int) $account['id'];
    $_SESSION['full_name'] = $account['full_name'];
    $_SESSION['email'] = $account['email'];
    $_SESSION['role'] = $account['role'];
    $_SESSION['profile_image'] = $account['profile_image'] ?? null;
    $_SESSION['last_activity'] = time();

    if ($remember) {
        $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        setcookie(session_name(), session_id(), [
            'expires' => time() + (30 * 24 * 60 * 60),
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

function auth_account_response(array $account): array
{
    $data = [
        'id' => (int) $account['id'],
        'name' => $account['full_name'],
        'full_name' => $account['full_name'],
        'email' => $account['email'],
        'username' => $account['username'] ?? null,
        'role' => $account['role'],
        'profile_image' => $account['profile_image'] ?? null,
    ];

    if ($account['role'] === 'admin') {
        $data['token'] = jwt_encode(auth_token_payload((int) $account['id'], $account['email'], 'admin'));
    }

    return $data;
}

function auth_require_role(string $requiredRole): void
{
    auth_start_session();
    $currentRole = $_SESSION['role'] ?? null;

    if (!$currentRole) {
        header('Location: ' . auth_login_url($requiredRole));
        exit;
    }

    if ($currentRole !== $requiredRole) {
        header('Location: ' . auth_role_redirect($currentRole));
        exit;
    }

    if (!empty($_SESSION['last_activity']) && time() - (int) $_SESSION['last_activity'] > 86400) {
        auth_destroy_session();
        header('Location: ' . auth_login_url($requiredRole) . '&expired=1');
        exit;
    }

    $_SESSION['last_activity'] = time();
}

function auth_destroy_session(): void
{
    auth_start_session();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
    }
    session_destroy();
}
