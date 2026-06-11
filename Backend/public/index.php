<?php
// Lightweight front controller to handle API routes without Laravel
require_once __DIR__ . '/../includes/bootstrap.php';

use App\Core\Router;

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router();

require_once __DIR__ . '/../includes/routes.php';
require_once __DIR__ . '/../includes/cms_routes.php';
require_once __DIR__ . '/../includes/cms_extra_routes.php';

$router->dispatch();
