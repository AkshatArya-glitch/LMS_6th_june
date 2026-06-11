<?php
require_once __DIR__ . '/includes/bootstrap.php';
$pdo = db_connect();
echo "Create admin user\n";
$email = $argv[1] ?? readline('Email: ');
$pass = $argv[2] ?? readline('Password: ');
$name = $argv[3] ?? readline('Name (optional): ');
$pw = password_hash($pass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('SELECT id FROM admins WHERE email = ?');
$stmt->execute([$email]);
$existing = $stmt->fetchColumn();
if ($existing) {
    echo "Admin already exists with id: " . $existing . "\n";
    exit;
}
$stmt = $pdo->prepare('INSERT INTO admins (name,email,password,role) VALUES (?,?,?,?)');
$stmt->execute([$name ?: 'Admin',$email,$pw,'admin']);
echo "Admin created with id: " . $pdo->lastInsertId() . "\n";
