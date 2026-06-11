<?php
require_once __DIR__ . '/../../Backend/includes/session_auth.php';
auth_require_role('admin');

$csrfToken = auth_csrf_token();
$html = file_get_contents(__DIR__ . '/index.html');
$head = '<meta name="csrf-token" content="' . htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') . '">' . "\n"
    . '<script>window.MESSAGES_API_BASE = "../../Backend/api";</script>';
$html = str_replace('</head>', $head . "\n</head>", $html);

header('Content-Type: text/html; charset=utf-8');
echo $html;
