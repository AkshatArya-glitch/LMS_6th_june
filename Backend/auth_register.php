<?php

require_once __DIR__ . '/includes/session_auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = auth_request_data();
auth_verify_csrf($data);

$role = strtolower(auth_clean_string($data['role'] ?? '', 20));
$fullName = auth_clean_string($data['full_name'] ?? '', 100);
$email = strtolower(auth_clean_string($data['email'] ?? '', 100));
$phone = auth_clean_string($data['phone'] ?? '', 20);
$username = strtolower(auth_clean_string($data['username'] ?? '', 100));
$password = (string) ($data['password'] ?? '');
$confirmPassword = (string) ($data['confirm_password'] ?? '');
$terms = filter_var($data['terms'] ?? false, FILTER_VALIDATE_BOOLEAN);

if (!in_array($role, ['trainer', 'user'], true)) {
    auth_json(['success' => false, 'message' => 'Only trainer and user registration is available.'], 422);
}

if ($fullName === '' || $email === '' || $username === '' || $password === '' || $confirmPassword === '') {
    auth_json(['success' => false, 'message' => 'Complete all required fields.'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    auth_json(['success' => false, 'message' => 'Enter a valid email address.', 'field' => 'email'], 422);
}
if (!preg_match('/^[a-z0-9._-]{3,100}$/i', $username)) {
    auth_json(['success' => false, 'message' => 'Username must be at least 3 characters and use only letters, numbers, dots, underscores, or hyphens.', 'field' => 'username'], 422);
}
if (strlen($password) < 8) {
    auth_json(['success' => false, 'message' => 'Password must be at least 8 characters.', 'field' => 'password'], 422);
}
if ($password !== $confirmPassword) {
    auth_json(['success' => false, 'message' => 'Password and confirm password do not match.', 'field' => 'confirm_password'], 422);
}
if (!$terms) {
    auth_json(['success' => false, 'message' => 'Accept the terms and conditions to continue.', 'field' => 'terms'], 422);
}

$pdo = db_connect();
$duplicate = auth_identifier_exists($pdo, $email, $username);
if ($duplicate) {
    auth_json(['success' => false, 'message' => $duplicate['message'], 'field' => $duplicate['field']], 409);
}

$profilePath = null;
if (!empty($_FILES['profile_image']['name'])) {
    $upload = $_FILES['profile_image'];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        auth_json(['success' => false, 'message' => 'The profile image could not be uploaded.', 'field' => 'profile_image'], 422);
    }
    if ($upload['size'] > 3 * 1024 * 1024) {
        auth_json(['success' => false, 'message' => 'Profile image must be smaller than 3 MB.', 'field' => 'profile_image'], 422);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($extensions[$mime]) || !getimagesize($upload['tmp_name'])) {
        auth_json(['success' => false, 'message' => 'Upload a valid JPG, PNG, or WebP image.', 'field' => 'profile_image'], 422);
    }

    $uploadDir = dirname(__DIR__) . '/Frontend/uploads/profile_images';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        auth_json(['success' => false, 'message' => 'Profile image storage is unavailable.'], 500);
    }

    $filename = $role . '-' . bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($upload['tmp_name'], $uploadDir . '/' . $filename)) {
        auth_json(['success' => false, 'message' => 'The profile image could not be saved.'], 500);
    }
    $profilePath = 'uploads/profile_images/' . $filename;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo->beginTransaction();

    if ($role === 'trainer') {
        $specialization = auth_clean_string($data['specialization'] ?? '', 150);
        $qualification = auth_clean_string($data['qualification'] ?? '', 150);
        $experience = filter_var($data['experience_years'] ?? null, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 0, 'max_range' => 80],
        ]);

        if ($specialization === '' || $qualification === '' || $experience === false) {
            throw new InvalidArgumentException('Complete the trainer expertise, experience, and qualification fields.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO trainers
            (full_name, email, phone, username, password, role, profile_image, specialization, experience_years, qualification, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $fullName, $email, $phone ?: null, $username, $passwordHash, 'trainer',
            $profilePath, $specialization, $experience, $qualification, 'active',
        ]);
    } else {
        $courseInterest = auth_clean_string($data['course_interest'] ?? '', 150);
        if ($courseInterest === '') {
            throw new InvalidArgumentException('Select a course interest.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO students (name, username, email, password, phone, profile_image, course_interest, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $fullName, $username, $email, $passwordHash, $phone ?: null, $profilePath, $courseInterest, 'active',
        ]);
    }

    $pdo->commit();
} catch (InvalidArgumentException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($profilePath) {
        @unlink(dirname(__DIR__) . '/Frontend/' . $profilePath);
    }
    auth_json(['success' => false, 'message' => $exception->getMessage()], 422);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($profilePath) {
        @unlink(dirname(__DIR__) . '/Frontend/' . $profilePath);
    }
    auth_json(['success' => false, 'message' => 'Registration could not be completed. Please try again.'], 500);
}

auth_json([
    'success' => true,
    'message' => ucfirst($role) . ' account created successfully. You can now sign in.',
    'redirect_url' => auth_login_url($role),
], 201);
