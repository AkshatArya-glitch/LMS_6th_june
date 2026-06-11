<?php
require_once 'includes/bootstrap.php';
try {
    $pdo = db_connect();
    $result = $pdo->query('SELECT COUNT(*) FROM students');
    echo "✓ DB connected. Students: " . $result->fetchColumn() . "\n";
} catch(Exception $e) {
    echo "✗ DB Error: " . $e->getMessage() . "\n";
}




