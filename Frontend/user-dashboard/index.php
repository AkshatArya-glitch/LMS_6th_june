<?php
require_once __DIR__ . '/../../Backend/includes/session_auth.php';
require_once __DIR__ . '/../../Backend/includes/dashboard_repository.php';
auth_require_role('user');

$dashboardData = dashboard_student_data(db_connect(), (int) $_SESSION['user_id']);
$csrfToken = auth_csrf_token();
$bootstrapData = json_encode($dashboardData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$html = file_get_contents(__DIR__ . '/index.html');
$head = '<meta name="csrf-token" content="' . htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') . '">' . "\n"
    . '<script>window.USER_DASHBOARD_DATA = ' . $bootstrapData . ';'
    . 'window.DASHBOARD_API_URL = "../../Backend/dashboard_api.php";'
    . 'window.MESSAGES_API_BASE = "../../Backend/api";</script>';
$html = str_replace('</head>', $head . "\n</head>", $html);

header('Content-Type: text/html; charset=utf-8');
echo $html;
