<?php

require_once __DIR__ . '/includes/session_auth.php';
require_once __DIR__ . '/includes/dashboard_repository.php';

auth_start_session();

$role = $_SESSION['role'] ?? null;
$userId = (int) ($_SESSION['user_id'] ?? 0);
if (!$role || !$userId) {
    auth_json(['success' => false, 'message' => 'Authentication required.'], 401);
}

$pdo = db_connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $view = auth_clean_string($_GET['view'] ?? '', 80);
    try {
        if ($role === 'user') {
            $data = $view ? dashboard_student_view($pdo, $userId, $view) : dashboard_student_data($pdo, $userId);
        } elseif ($role === 'trainer') {
            $data = $view ? dashboard_trainer_view($pdo, $userId, $view) : dashboard_trainer_data($pdo, $userId);
        } else {
            auth_json(['success' => false, 'message' => 'Use the protected admin API for admin dashboard data.'], 403);
        }
        auth_json(['success' => true, 'data' => $data]);
    } catch (Throwable $exception) {
        auth_json(['success' => false, 'message' => 'Dashboard data could not be loaded.'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    auth_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = auth_request_data();
auth_verify_csrf($data);
$action = auth_clean_string($data['action'] ?? '', 40);

function trainer_course_allowed(PDO $pdo, int $trainerId, int $courseId, ?int $batchId = null): bool
{
    if ($courseId <= 0) return false;
    if ($batchId) {
        $stmt = $pdo->prepare('SELECT id FROM batches WHERE id=? AND course_id=? AND trainer_id=? LIMIT 1');
        $stmt->execute([$batchId, $courseId, $trainerId]);
        if ($stmt->fetchColumn()) return true;
    }
    $stmt = $pdo->prepare('SELECT id FROM courses WHERE id=? AND trainer_id=? LIMIT 1');
    $stmt->execute([$courseId, $trainerId]);
    if ($stmt->fetchColumn()) return true;
    $stmt = $pdo->prepare('SELECT id FROM batches WHERE course_id=? AND trainer_id=? LIMIT 1');
    $stmt->execute([$courseId, $trainerId]);
    return (bool)$stmt->fetchColumn();
}

if ($role === 'trainer' && in_array($action, ['save_assignment','delete_assignment','save_announcement','delete_announcement'], true)) {
    if ($action === 'save_assignment') {
        $id = (int)($data['id'] ?? 0);
        $courseId = (int)($data['course_id'] ?? 0);
        $batchId = !empty($data['batch_id']) ? (int)$data['batch_id'] : null;
        $title = auth_clean_string($data['title'] ?? '', 255);
        if ($title === '' || !trainer_course_allowed($pdo, $userId, $courseId, $batchId)) {
            auth_json(['success' => false, 'message' => 'Choose one of your assigned courses or batches.'], 422);
        }
        $payload = [
            $courseId,
            $batchId,
            $userId,
            $title,
            auth_clean_string($data['description'] ?? '', 5000) ?: null,
            !empty($data['due_date']) ? str_replace('T', ' ', (string)$data['due_date']) : null,
            $data['status'] ?? 'published',
        ];
        if ($id > 0) {
            $payload[] = $id;
            $payload[] = $userId;
            $stmt = $pdo->prepare('UPDATE assignments SET course_id=?,batch_id=?,trainer_id=?,title=?,description=?,due_date=?,status=?,updated_at=NOW() WHERE id=? AND trainer_id=?');
            $stmt->execute($payload);
        } else {
            $stmt = $pdo->prepare('INSERT INTO assignments (course_id,batch_id,trainer_id,title,description,due_date,status,created_by,created_by_role) VALUES (?,?,?,?,?,?,?,?,?)');
            $stmt->execute(array_merge($payload, [$userId, 'trainer']));
        }
        auth_json(['success' => true, 'message' => 'Assignment saved.']);
    }

    if ($action === 'delete_assignment') {
        $stmt = $pdo->prepare('DELETE FROM assignments WHERE id=? AND trainer_id=?');
        $stmt->execute([(int)($data['id'] ?? 0), $userId]);
        auth_json(['success' => true, 'message' => 'Assignment deleted.']);
    }

    if ($action === 'save_announcement') {
        $id = (int)($data['id'] ?? 0);
        $targetType = auth_clean_string($data['target_type'] ?? 'all', 20);
        $courseId = !empty($data['course_id']) ? (int)$data['course_id'] : 0;
        $batchId = !empty($data['batch_id']) ? (int)$data['batch_id'] : null;
        if ($targetType === 'batch' && $batchId && $courseId <= 0) {
            $batchCourse = $pdo->prepare('SELECT course_id FROM batches WHERE id=? AND trainer_id=? LIMIT 1');
            $batchCourse->execute([$batchId, $userId]);
            $courseId = (int)$batchCourse->fetchColumn();
        }
        $title = auth_clean_string($data['title'] ?? '', 255);
        $message = auth_clean_string($data['message'] ?? '', 5000);
        if ($title === '' || $message === '') {
            auth_json(['success' => false, 'message' => 'Title and message are required.'], 422);
        }
        if (!in_array($targetType, ['course', 'batch'], true)) {
            auth_json(['success' => false, 'message' => 'Choose one of your assigned courses or batches.'], 422);
        }
        if (!trainer_course_allowed($pdo, $userId, $courseId, $batchId)) {
            auth_json(['success' => false, 'message' => 'Choose one of your assigned courses or batches.'], 422);
        }
        $status = $data['status'] ?? 'published';
        if ($id > 0) {
            $stmt = $pdo->prepare('UPDATE announcements SET title=?,message=?,target_type=?,batch_id=?,course_id=?,target_role=?,status=?,published_at=?,updated_at=NOW() WHERE id=? AND created_by_role=\'trainer\' AND created_by_id=?');
            $stmt->execute([$title, $message, $targetType, $batchId, $courseId ?: null, 'user', $status, $status === 'published' ? date('Y-m-d H:i:s') : null, $id, $userId]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO announcements (title,message,target_type,batch_id,course_id,target_role,created_by_role,created_by_id,status,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
            $stmt->execute([$title, $message, $targetType, $batchId, $courseId ?: null, 'user', 'trainer', $userId, $status, $status === 'published' ? date('Y-m-d H:i:s') : null]);
        }
        auth_json(['success' => true, 'message' => 'Announcement saved.']);
    }

    if ($action === 'delete_announcement') {
        $stmt = $pdo->prepare('DELETE FROM announcements WHERE id=? AND created_by_role=\'trainer\' AND created_by_id=?');
        $stmt->execute([(int)($data['id'] ?? 0), $userId]);
        auth_json(['success' => true, 'message' => 'Announcement deleted.']);
    }
}

if ($action !== 'update_profile') {
    auth_json(['success' => false, 'message' => 'Unsupported dashboard action.'], 422);
}

$name = auth_clean_string($data['name'] ?? $data['full_name'] ?? '', 100);
$email = strtolower(auth_clean_string($data['email'] ?? '', 100));
$phone = auth_clean_string($data['phone'] ?? '', 20);
$currentPassword = (string) ($data['current_password'] ?? '');
$newPassword = (string) ($data['new_password'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    auth_json(['success' => false, 'message' => 'Enter a valid name and email address.'], 422);
}

$table = $role === 'trainer' ? 'trainers' : 'students';
$nameColumn = $role === 'trainer' ? 'full_name' : 'name';
$duplicate = $pdo->prepare("SELECT id FROM {$table} WHERE email = ? AND id <> ?");
$duplicate->execute([$email, $userId]);
if ($duplicate->fetchColumn()) {
    auth_json(['success' => false, 'message' => 'That email address is already in use.'], 409);
}

$sets = ["{$nameColumn} = ?", 'email = ?', 'phone = ?'];
$values = [$name, $email, $phone ?: null];

if ($newPassword !== '') {
    if (strlen($newPassword) < 8) {
        auth_json(['success' => false, 'message' => 'The new password must be at least 8 characters.'], 422);
    }
    $passwordStmt = $pdo->prepare("SELECT password FROM {$table} WHERE id = ?");
    $passwordStmt->execute([$userId]);
    $passwordHash = $passwordStmt->fetchColumn();
    if (!$currentPassword || !$passwordHash || !password_verify($currentPassword, $passwordHash)) {
        auth_json(['success' => false, 'message' => 'Your current password is incorrect.'], 401);
    }
    $sets[] = 'password = ?';
    $values[] = password_hash($newPassword, PASSWORD_DEFAULT);
}

if ($role === 'trainer') {
    $sets[] = 'specialization = ?';
    $sets[] = 'qualification = ?';
    $sets[] = 'experience_years = ?';
    $values[] = auth_clean_string($data['specialization'] ?? '', 150) ?: null;
    $values[] = auth_clean_string($data['qualification'] ?? '', 150) ?: null;
    $experience = filter_var($data['experience_years'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 80]]);
    $values[] = $experience === false ? null : $experience;
} else {
    $sets[] = 'course_interest = ?';
    $sets[] = 'bio = ?';
    $values[] = auth_clean_string($data['course_interest'] ?? '', 150) ?: null;
    $values[] = auth_clean_string($data['bio'] ?? '', 2000) ?: null;
}

if (!empty($_FILES['profile_image']['name'])) {
    $upload = $_FILES['profile_image'];
    if ($upload['error'] !== UPLOAD_ERR_OK || $upload['size'] > 3 * 1024 * 1024) {
        auth_json(['success' => false, 'message' => 'Profile image must be a valid image smaller than 3 MB.'], 422);
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($extensions[$mime]) || !getimagesize($upload['tmp_name'])) {
        auth_json(['success' => false, 'message' => 'Upload a JPG, PNG, or WebP profile image.'], 422);
    }
    $uploadDir = dirname(__DIR__) . '/Frontend/uploads/profile_images';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $filename = $role . '-' . bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($upload['tmp_name'], $uploadDir . '/' . $filename)) {
        auth_json(['success' => false, 'message' => 'The profile image could not be saved.'], 500);
    }
    $sets[] = 'profile_image = ?';
    $values[] = 'uploads/profile_images/' . $filename;
    $_SESSION['profile_image'] = 'uploads/profile_images/' . $filename;
}

$values[] = $userId;
$stmt = $pdo->prepare("UPDATE {$table} SET " . implode(', ', $sets) . ' WHERE id = ?');
$stmt->execute($values);

$_SESSION['full_name'] = $name;
$_SESSION['email'] = $email;
auth_json(['success' => true, 'message' => 'Profile updated successfully.']);
