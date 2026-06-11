<?php
function db_connect() {
    static $pdo = null;
    if ($pdo) return $pdo;
    $host = env('DB_HOST', '127.0.0.1');
    $db = env('DB_DATABASE', 'eepl');
    $user = env('DB_USERNAME', 'root');
    $pass = env('DB_PASSWORD', '');
    $port = env('DB_PORT', 3306);
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        return $pdo;
    } catch (Throwable $e) {
        error_log(sprintf(
            'Database connection failed: %s in %s:%d',
            $e->getMessage(),
            $e->getFile(),
            $e->getLine()
        ));
        json_response([
            'success' => false,
            'message' => 'Unable to connect to the database. Please check the database configuration.',
        ], 500);
    }
}
