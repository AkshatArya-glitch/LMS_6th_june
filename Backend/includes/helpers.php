<?php
function env($key, $default = null) {
    static $vars = null;
    if ($vars === null) {
        $vars = [];
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                [$k, $v] = array_map('trim', explode('=', $line, 2) + [1 => '']);
                $vars[$k] = trim($v, " \t\n\r\0\x0B\"'");
            }
        }
    }
    return $vars[$key] ?? $default;
}

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_bearer_token() {
    $h = null;
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $h = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $h = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if ($h && preg_match('/Bearer\s+(.*)$/i', $h, $m)) return $m[1];

    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input) && !empty($input['token'])) {
        return $input['token'];
    }

    if (!empty($_GET['token'])) {
        return $_GET['token'];
    }

    return null;
}
