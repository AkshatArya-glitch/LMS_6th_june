<?php
// Additional CMS compatibility routes. This file is loaded after the base
// route files so these routes can safely override older duplicate endpoints.

function cms_extra_decode_section($row) {
    if (!$row) return $row;
    $row['content'] = !empty($row['content_json']) ? json_decode($row['content_json'], true) : null;
    return $row;
}

function cms_extra_slug($value) {
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim((string)$value)));
    return trim($slug, '-') ?: ('item-' . time());
}

function cms_extra_reorder($pdo, $table, $items) {
    if (!is_array($items)) return;
    $column = $pdo->query("SHOW COLUMNS FROM $table LIKE 'sort_order'")->fetch(PDO::FETCH_ASSOC);
    if (!$column) return;
    $stmt = $pdo->prepare("UPDATE $table SET sort_order=? WHERE id=?");
    foreach ($items as $index => $item) {
        $id = is_array($item) ? ($item['id'] ?? null) : $item;
        if ($id) $stmt->execute([$index + 1, $id]);
    }
}

function cms_extra_public_path($path) {
    $segments = explode('/', $path);
    return implode('/', array_map('rawurlencode', $segments));
}

function cms_extra_has_column(PDO $pdo, string $table, string $column): bool {
    $stmt = $pdo->prepare("SHOW COLUMNS FROM {$table} LIKE ?");
    $stmt->execute([$column]);
    return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
}

function cms_extra_ids($value): array {
    if (!is_array($value)) return [];
    return array_values(array_unique(array_filter(array_map('intval', $value), fn($id) => $id > 0)));
}

function cms_extra_sync_batch_students(PDO $pdo, int $batchId, int $courseId, array $studentIds): void {
    if (!cms_extra_has_column($pdo, 'enrollments', 'batch_id')) return;
    $studentIds = cms_extra_ids($studentIds);
    $pdo->prepare('UPDATE enrollments SET batch_id=NULL, updated_at=NOW() WHERE batch_id=?')->execute([$batchId]);
    if (!$studentIds) return;
    $columns = array_column($pdo->query('SHOW COLUMNS FROM enrollments')->fetchAll(PDO::FETCH_ASSOC), 'Field');
    $hasStatus = in_array('status', $columns, true);
    $fields = ['student_id', 'course_id', 'batch_id'];
    $values = ['?', '?', '?'];
    if ($hasStatus) {
        $fields[] = 'status';
        $values[] = '?';
    }
    $sql = 'INSERT INTO enrollments (' . implode(',', $fields) . ') VALUES (' . implode(',', $values) . ')
            ON DUPLICATE KEY UPDATE batch_id=VALUES(batch_id), updated_at=NOW()';
    $stmt = $pdo->prepare($sql);
    foreach ($studentIds as $studentId) {
        $params = [$studentId, $courseId, $batchId];
        if ($hasStatus) $params[] = 'active';
        $stmt->execute($params);
    }
}

function cms_extra_lms_options(PDO $pdo): array {
    return [
        'courses' => $pdo->query("SELECT id,title FROM courses ORDER BY title")->fetchAll(PDO::FETCH_ASSOC),
        'trainers' => $pdo->query("SELECT id,full_name AS name FROM trainers ORDER BY full_name")->fetchAll(PDO::FETCH_ASSOC),
        'students' => $pdo->query("SELECT id,name,email FROM students ORDER BY name")->fetchAll(PDO::FETCH_ASSOC),
        'batches' => $pdo->query("SELECT id,batch_name AS name,course_id,trainer_id FROM batches ORDER BY batch_name")->fetchAll(PDO::FETCH_ASSOC),
    ];
}

function cms_extra_certificate_list_config(PDO $pdo): array {
    $title = cms_extra_has_column($pdo, 'certificates', 'title')
        ? "COALESCE(NULLIF(ce.title,''),'Certificate')"
        : "'Certificate'";
    $studentName = cms_extra_has_column($pdo, 'certificates', 'student_name')
        ? "COALESCE(s.name,NULLIF(ce.student_name,''),'Student')"
        : "COALESCE(s.name,'Student')";
    $courseTitle = cms_extra_has_column($pdo, 'certificates', 'course_title')
        ? "COALESCE(c.title,NULLIF(ce.course_title,''),'Course')"
        : "COALESCE(c.title,'Course')";
    $file = cms_extra_has_column($pdo, 'certificates', 'certificate_file')
        ? "COALESCE(ce.certificate_file,'')"
        : "''";
    $status = cms_extra_has_column($pdo, 'certificates', 'status')
        ? "COALESCE(ce.status,'active')"
        : "'active'";

    return [
        'title' => 'Certificates',
        'columns' => ['ID','Certificate','Title','Student','Course','Issued','File','Status'],
        'sql' => "SELECT ce.id AS ID,ce.certificate_number AS Certificate,$title AS Title,$studentName AS Student,$courseTitle AS Course,DATE_FORMAT(ce.issued_date,'%d %b %Y') AS Issued,$file AS File,$status AS Status FROM certificates ce LEFT JOIN students s ON s.id=ce.student_id LEFT JOIN courses c ON c.id=ce.course_id ORDER BY ce.issued_date DESC,ce.id DESC",
    ];
}

function cms_extra_lms_resources(PDO $pdo): array {
    return [
        'users' => [
            'title' => 'Manage Users',
            'columns' => ['ID','Name','Email','Username','Status','Registered'],
            'sql' => "SELECT id AS ID,name AS Name,email AS Email,username AS Username,status AS Status,DATE_FORMAT(created_at,'%d %b %Y') AS Registered FROM students ORDER BY created_at DESC",
        ],
        'trainers' => [
            'title' => 'Manage Trainers',
            'columns' => ['ID','Name','Email','Specialization','Experience','Status'],
            'sql' => "SELECT id AS ID,full_name AS Name,email AS Email,COALESCE(specialization,'') AS Specialization,CONCAT(COALESCE(experience_years,0),' years') AS Experience,status AS Status FROM trainers ORDER BY created_at DESC",
        ],
        'batches' => [
            'title' => 'Manage Batches',
            'columns' => ['ID','Batch','Course','Trainer','Schedule','Students','Status'],
            'sql' => "SELECT b.id AS ID,b.batch_name AS Batch,COALESCE(c.title,'Unlinked') AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,COALESCE(b.schedule_text,'Not scheduled') AS Schedule,COUNT(DISTINCT e.student_id) AS Students,b.status AS Status FROM batches b LEFT JOIN courses c ON c.id=b.course_id LEFT JOIN trainers t ON t.id=b.trainer_id LEFT JOIN enrollments e ON e.batch_id=b.id GROUP BY b.id ORDER BY b.created_at DESC",
        ],
        'enrollments' => [
            'title' => 'Enrollments',
            'columns' => ['ID','Student','Course','Batch','Progress','Payment','Status'],
            'sql' => "SELECT e.id AS ID,COALESCE(s.name,'Unknown student') AS Student,COALESCE(c.title,'Unknown course') AS Course,COALESCE(b.batch_name,'Not assigned') AS Batch,CONCAT(ROUND(COALESCE(e.progress_percentage,0)),'%') AS Progress,e.payment_status AS Payment,e.status AS Status FROM enrollments e LEFT JOIN students s ON s.id=e.student_id LEFT JOIN courses c ON c.id=e.course_id LEFT JOIN batches b ON b.id=e.batch_id ORDER BY e.enrollment_date DESC",
        ],
        'assignments' => [
            'title' => 'Assignments',
            'columns' => ['ID','Assignment','Course','Batch','Trainer','Due Date','Submissions','Status'],
            'sql' => "SELECT a.id AS ID,a.title AS Assignment,COALESCE(c.title,'Unlinked') AS Course,COALESCE(b.batch_name,'All batches') AS Batch,COALESCE(t.full_name,'Unassigned') AS Trainer,COALESCE(DATE_FORMAT(a.due_date,'%d %b %Y %h:%i %p'),'No due date') AS `Due Date`,COUNT(s.id) AS Submissions,a.status AS Status FROM assignments a LEFT JOIN courses c ON c.id=a.course_id LEFT JOIN batches b ON b.id=a.batch_id LEFT JOIN trainers t ON t.id=a.trainer_id LEFT JOIN assignment_submissions s ON s.assignment_id=a.id GROUP BY a.id ORDER BY a.due_date IS NULL,a.due_date DESC",
        ],
        'assessments' => [
            'title' => 'Assessments',
            'columns' => ['ID','Assessment','Course','Trainer','Date','Results','Status'],
            'sql' => "SELECT a.id AS ID,a.title AS Assessment,COALESCE(c.title,'Unlinked') AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,COALESCE(DATE_FORMAT(a.assessment_date,'%d %b %Y %h:%i %p'),'Not scheduled') AS Date,COUNT(r.id) AS Results,a.status AS Status FROM assessments a LEFT JOIN courses c ON c.id=a.course_id LEFT JOIN trainers t ON t.id=a.trainer_id LEFT JOIN assessment_results r ON r.assessment_id=a.id GROUP BY a.id ORDER BY a.assessment_date",
        ],
        'certificates' => cms_extra_certificate_list_config($pdo),
        'materials' => [
            'title' => 'Study Materials',
            'columns' => ['ID','Material','Course','Trainer','Type','Status'],
            'sql' => "SELECT sm.id AS ID,sm.title AS Material,COALESCE(c.title,'Unlinked') AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,sm.material_type AS Type,sm.status AS Status FROM study_materials sm LEFT JOIN courses c ON c.id=sm.course_id LEFT JOIN trainers t ON t.id=sm.trainer_id ORDER BY sm.created_at DESC",
        ],
        'payments' => [
            'title' => 'Payments',
            'columns' => ['ID','Student','Amount','Method','Transaction','Status','Paid'],
            'sql' => "SELECT p.id AS ID,COALESCE(s.name,'Unknown student') AS Student,CONCAT('INR ',FORMAT(p.amount,2)) AS Amount,COALESCE(p.payment_method,'') AS Method,COALESCE(p.transaction_id,'') AS Transaction,p.status AS Status,COALESCE(DATE_FORMAT(p.paid_at,'%d %b %Y'),'Not paid') AS Paid FROM payments p LEFT JOIN students s ON s.id=p.student_id ORDER BY p.created_at DESC",
        ],
        'messages' => [
            'title' => 'Messages',
            'columns' => ['ID','From Role','From ID','To Role','To ID','Subject','Status','Sent'],
            'sql' => "SELECT id AS ID,sender_role AS `From Role`,sender_id AS `From ID`,recipient_role AS `To Role`,recipient_id AS `To ID`,COALESCE(subject,'No subject') AS Subject,IF(is_read=1,'Read','New') AS Status,DATE_FORMAT(created_at,'%d %b %Y %h:%i %p') AS Sent FROM messages ORDER BY created_at DESC",
        ],
        'announcements' => [
            'title' => 'Announcements',
            'columns' => ['ID','Title','Target','Audience','Status','Published'],
            'sql' => "SELECT a.id AS ID,a.title AS Title,COALESCE(a.target_type,'all') AS Target,a.target_role AS Audience,a.status AS Status,COALESCE(DATE_FORMAT(a.published_at,'%d %b %Y'),DATE_FORMAT(a.created_at,'%d %b %Y')) AS Published FROM announcements a ORDER BY a.created_at DESC",
        ],
        'reports' => [
            'title' => 'Reports',
            'columns' => ['Metric','Value'],
            'sql' => "SELECT 'Active Students' AS Metric,COUNT(*) AS Value FROM students WHERE status='active'
                      UNION ALL SELECT 'Active Trainers',COUNT(*) FROM trainers WHERE status='active'
                      UNION ALL SELECT 'Published Courses',COUNT(*) FROM courses WHERE status='published'
                      UNION ALL SELECT 'Active Enrollments',COUNT(*) FROM enrollments WHERE status='active'
                      UNION ALL SELECT 'Paid Revenue',COALESCE(SUM(amount),0) FROM payments WHERE status='paid'",
        ],
    ];
}

$router->add('GET', '/v1/pages/{pageKey}', function($pageKey) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM pages WHERE page_key=? AND status='published' LIMIT 1");
    $stmt->execute([$pageKey]);
    $page = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$page) return json_response(['success' => false, 'message' => 'Page not found'], 404);
    json_response(['success' => true, 'data' => $page]);
});

$router->add('GET', '/v1/pages/{pageKey}/sections', function($pageKey) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT id FROM pages WHERE page_key=? AND status='published' LIMIT 1");
    $stmt->execute([$pageKey]);
    $pageId = $stmt->fetchColumn();
    if (!$pageId) return json_response(['success' => false, 'message' => 'Page not found'], 404);

    $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE page_id=? AND is_active=1 ORDER BY sort_order,id');
    $stmt->execute([$pageId]);
    $rows = array_map('cms_extra_decode_section', $stmt->fetchAll(PDO::FETCH_ASSOC));
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/courses', function() {
    $pdo = db_connect();
    $where = ["status='published'"];
    $values = [];

    if (!empty($_GET['category'])) {
        $where[] = 'category = ?';
        $values[] = $_GET['category'];
    }
    if (isset($_GET['featured'])) $where[] = 'is_featured=1';
    if (isset($_GET['popular'])) $where[] = 'is_popular=1';
    if (!empty($_GET['q'])) {
        $term = '%' . $_GET['q'] . '%';
        $where[] = '(title LIKE ? OR description LIKE ? OR short_description LIKE ?)';
        array_push($values, $term, $term, $term);
    }

    $sql = "SELECT id,title,slug,description,short_description,category,price,discount_type,discount_value,discounted_price,discount_status,thumbnail_url,banner_url,duration,level,badge,is_featured,is_popular,sort_order,seo_title,seo_description FROM courses WHERE " . implode(' AND ', $where) . " ORDER BY sort_order,id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET', '/v1/courses/{slug}', function($slug) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM courses WHERE (slug=? OR id=?) AND status='published' LIMIT 1");
    $stmt->execute([$slug, ctype_digit((string)$slug) ? (int)$slug : 0]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Course not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('GET', '/v1/webinars/{slug}', function($slug) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM webinars WHERE (slug=? OR id=?) AND status='published' LIMIT 1");
    $stmt->execute([$slug, ctype_digit((string)$slug) ? (int)$slug : 0]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Webinar not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('GET', '/v1/posts/{slug}', function($slug) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE (slug=? OR id=?) AND status='published' LIMIT 1");
    $stmt->execute([$slug, ctype_digit((string)$slug) ? (int)$slug : 0]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Post not found'], 404);
    if (!empty($row['tags_json'])) $row['tags'] = json_decode($row['tags_json'], true);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/admin/media/upload', function() {
    $admin = require_admin();
    if (empty($_FILES['file'])) return json_response(['success' => false, 'message' => 'No file uploaded'], 400);
    $file = $_FILES['file'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return json_response(['success' => false, 'message' => 'Upload failed. Please choose another file.'], 400);
    }

    $folder = strtolower(trim((string)($_POST['folder'] ?? 'media')));
    $imageFolders = [
        'hero' => 'hero',
        'courses' => 'course',
        'webinars' => 'webinar',
        'articles' => 'article',
        'partners' => 'partner',
        'testimonials' => 'testimonial',
        'popups' => 'popup',
        'gallery' => 'gallery',
    ];
    $isSectionImage = isset($imageFolders[$folder]);
    $allowedTypes = $isSectionImage
        ? ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp']
        : ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];
    $maxSize = $isSectionImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        return json_response(['success' => false, 'message' => 'File too large (max ' . ($isSectionImage ? '5MB' : '10MB') . ')'], 400);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? finfo_file($finfo, $file['tmp_name']) : null;
    if ($finfo) finfo_close($finfo);
    if (!$mime || !isset($allowedTypes[$mime])) {
        return json_response(['success' => false, 'message' => $isSectionImage ? 'Only JPG, JPEG, PNG, and WEBP images are allowed' : 'File type not allowed'], 400);
    }
    if (strpos($mime, 'image/') === 0 && !@getimagesize($file['tmp_name'])) {
        return json_response(['success' => false, 'message' => 'Invalid image file'], 400);
    }

    $relativeDir = $isSectionImage ? ('uploads/' . $folder . '/') : 'assets/uploads/';
    $uploadDir = __DIR__ . '/../../Frontend/' . $relativeDir;
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        return json_response(['success' => false, 'message' => 'Upload folder could not be created'], 500);
    }

    $prefix = $isSectionImage ? $imageFolders[$folder] : 'media';
    $random = bin2hex(random_bytes(4));
    $ext = $allowedTypes[$mime];
    $fileName = $prefix . '_' . time() . '_' . $random . '.' . $ext;
    $filePath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        return json_response(['success' => false, 'message' => 'Upload failed'], 500);
    }

    $fileUrl = $relativeDir . $fileName;
    $fileType = strpos($mime, 'image') !== false ? 'image' : (strpos($mime, 'pdf') !== false ? 'pdf' : 'document');
    $altText = trim(preg_replace('/[^a-zA-Z0-9 _-]/', '', pathinfo($file['name'], PATHINFO_FILENAME)));
    if ($altText === '') $altText = $prefix;

    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO media_assets (file_name,file_path,file_url,file_type,mime_type,size,alt_text,uploaded_by) VALUES (?,?,?,?,?,?,?,?)');
    $stmt->execute([$fileName, $filePath, $fileUrl, $fileType, $mime, $file['size'], $altText, $admin['id']]);

    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM media_assets WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('GET', '/v1/certificates/{id}/download', function($id) {
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM certificates WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $certificate = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$certificate) return json_response(['success' => false, 'message' => 'Certificate not found'], 404);
    json_response(['success' => true, 'data' => $certificate]);
});

$router->add('GET', '/v1/faqs/{pageKey}', function($pageKey) {
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM faqs WHERE page_key=? AND is_active=1 ORDER BY sort_order,id');
    $stmt->execute([$pageKey]);
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET', '/v1/media-gallery', function() {
    $pdo = db_connect();
    if (cms_extra_has_column($pdo, 'media_assets', 'is_gallery')) {
        $rows = $pdo->query(
            "SELECT id,file_url,file_type,alt_text,gallery_category AS category,
                    gallery_sort_order AS sort_order,created_at
             FROM media_assets
             WHERE file_type='image' AND is_gallery=1 AND is_active=1
             ORDER BY gallery_sort_order ASC,id DESC"
        )->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $rows = $pdo->query(
            "SELECT id,file_url,file_type,alt_text,'General' AS category,0 AS sort_order,created_at
             FROM media_assets
             WHERE file_type='image'
             ORDER BY created_at DESC"
        )->fetchAll(PDO::FETCH_ASSOC);
    }
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/admin/lms/options', function() {
    require_admin();
    json_response(['success' => true, 'data' => cms_extra_lms_options(db_connect())]);
});

$router->add('GET', '/v1/admin/lms/{resource}', function($resource) {
    require_admin();
    $pdo = db_connect();
    $resources = cms_extra_lms_resources($pdo);
    if (!isset($resources[$resource])) {
        return json_response(['success' => false, 'message' => 'This admin section is not available.'], 404);
    }
    $config = $resources[$resource];
    try {
        $rows = $pdo->query($config['sql'])->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        error_log("LMS resource query failed for {$resource}: " . $e->getMessage());
        return json_response(['success' => false, 'message' => 'Unable to load this section. Please check the database configuration.'], 500);
    }
    json_response(['success' => true, 'data' => [
        'title' => $config['title'],
        'columns' => $config['columns'],
        'rows' => $rows,
    ]]);
});

$router->add('GET', '/v1/admin/lms/{resource}/{id}', function($resource, $id) {
    require_admin();
    $pdo = db_connect();
    $id = (int)$id;
    if ($resource === 'batches') {
        $stmt = $pdo->prepare('SELECT * FROM batches WHERE id=?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return json_response(['success' => false, 'message' => 'Batch not found'], 404);
        $students = [];
        if (cms_extra_has_column($pdo, 'enrollments', 'batch_id')) {
            $studentStmt = $pdo->prepare('SELECT student_id FROM enrollments WHERE batch_id=?');
            $studentStmt->execute([$id]);
            $students = array_map('intval', $studentStmt->fetchAll(PDO::FETCH_COLUMN));
        }
        $row['student_ids'] = $students;
        return json_response(['success' => true, 'data' => $row]);
    }
    if ($resource === 'assignments') {
        $stmt = $pdo->prepare('SELECT * FROM assignments WHERE id=?');
    } elseif ($resource === 'announcements') {
        $stmt = $pdo->prepare('SELECT * FROM announcements WHERE id=?');
    } elseif ($resource === 'certificates') {
        $stmt = $pdo->prepare('SELECT * FROM certificates WHERE id=?');
    } else {
        return json_response(['success' => false, 'message' => 'This admin section is not available.'], 404);
    }
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Record not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/admin/lms/{resource}', function($resource) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();

    if ($resource === 'batches') {
        if (empty($in['batch_name']) || empty($in['course_id'])) return json_response(['success' => false, 'message' => 'Batch name and course are required'], 422);
        $stmt = $pdo->prepare('INSERT INTO batches (batch_name,course_id,trainer_id,start_date,end_date,schedule_text,status) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([
            trim($in['batch_name']),
            (int)$in['course_id'],
            !empty($in['trainer_id']) ? (int)$in['trainer_id'] : null,
            $in['start_date'] ?: null,
            $in['end_date'] ?: null,
            $in['schedule_text'] ?? null,
            $in['status'] ?? 'active',
        ]);
        $id = (int)$pdo->lastInsertId();
        cms_extra_sync_batch_students($pdo, $id, (int)$in['course_id'], $in['student_ids'] ?? []);
        return json_response(['success' => true, 'data' => ['id' => $id]], 201);
    }

    if ($resource === 'assignments') {
        if (empty($in['title']) || empty($in['course_id'])) return json_response(['success' => false, 'message' => 'Assignment title and course are required'], 422);
        $stmt = $pdo->prepare('INSERT INTO assignments (course_id,batch_id,trainer_id,title,description,due_date,attachment_url,max_marks,status,created_by,created_by_role) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([
            (int)$in['course_id'],
            !empty($in['batch_id']) ? (int)$in['batch_id'] : null,
            !empty($in['trainer_id']) ? (int)$in['trainer_id'] : null,
            trim($in['title']),
            $in['description'] ?? null,
            $in['due_date'] ?: null,
            $in['attachment_url'] ?? null,
            $in['max_marks'] ?? 100,
            $in['status'] ?? 'published',
            $admin['id'] ?? null,
            'admin',
        ]);
        return json_response(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]], 201);
    }

    if ($resource === 'announcements') {
        if (empty($in['title']) || empty($in['message'])) return json_response(['success' => false, 'message' => 'Announcement title and message are required'], 422);
        $status = $in['status'] ?? 'published';
        $stmt = $pdo->prepare('INSERT INTO announcements (title,message,target_type,batch_id,course_id,target_role,created_by_role,created_by_id,status,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
        $targetType = $in['target_type'] ?? 'all';
        $stmt->execute([
            trim($in['title']),
            trim($in['message']),
            $targetType,
            !empty($in['batch_id']) ? (int)$in['batch_id'] : null,
            !empty($in['course_id']) ? (int)$in['course_id'] : null,
            $in['target_role'] ?? ($targetType === 'trainer' ? 'trainer' : 'user'),
            'admin',
            $admin['id'] ?? null,
            $status,
            $status === 'published' ? date('Y-m-d H:i:s') : null,
        ]);
        return json_response(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]], 201);
    }

    if ($resource === 'certificates') {
        if (empty($in['student_id']) || empty($in['course_id'])) return json_response(['success' => false, 'message' => 'Student and course are required'], 422);
        $number = trim($in['certificate_number'] ?? '') ?: ('CERT-' . strtoupper(bin2hex(random_bytes(4))));
        $studentName = trim($in['student_name'] ?? '');
        $courseTitle = trim($in['course_title'] ?? '');
        if ($studentName === '') {
            $s = $pdo->prepare('SELECT name FROM students WHERE id=?');
            $s->execute([(int)$in['student_id']]);
            $studentName = (string)$s->fetchColumn();
        }
        if ($courseTitle === '') {
            $c = $pdo->prepare('SELECT title FROM courses WHERE id=?');
            $c->execute([(int)$in['course_id']]);
            $courseTitle = (string)$c->fetchColumn();
        }
        $stmt = $pdo->prepare('INSERT INTO certificates (student_id,course_id,batch_id,certificate_number,title,student_name,course_title,issued_date,certificate_file,status) VALUES (?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([
            (int)$in['student_id'],
            (int)$in['course_id'],
            !empty($in['batch_id']) ? (int)$in['batch_id'] : null,
            $number,
            $in['title'] ?? 'Course Completion Certificate',
            $studentName,
            $courseTitle,
            !empty($in['issued_date']) ? $in['issued_date'] : date('Y-m-d H:i:s'),
            $in['certificate_file'] ?? null,
            $in['status'] ?? 'active',
        ]);
        return json_response(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]], 201);
    }

    json_response(['success' => false, 'message' => 'This admin section is not available.'], 404);
});

$router->add('PATCH', '/v1/admin/lms/{resource}/{id}', function($resource, $id) {
    require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $id = (int)$id;
    $tables = [
        'batches' => ['table' => 'batches', 'allowed' => ['batch_name','course_id','trainer_id','start_date','end_date','schedule_text','status']],
        'assignments' => ['table' => 'assignments', 'allowed' => ['course_id','batch_id','trainer_id','title','description','due_date','attachment_url','max_marks','status']],
        'announcements' => ['table' => 'announcements', 'allowed' => ['title','message','target_type','batch_id','course_id','target_role','status']],
        'certificates' => ['table' => 'certificates', 'allowed' => ['student_id','course_id','batch_id','certificate_number','title','student_name','course_title','issued_date','certificate_file','status']],
    ];
    if (!isset($tables[$resource])) return json_response(['success' => false, 'message' => 'This admin section is not available.'], 404);
    $sets = [];
    $values = [];
    foreach ($tables[$resource]['allowed'] as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field=?";
            $values[] = $in[$field] === '' ? null : $in[$field];
        }
    }
    if ($resource === 'announcements' && array_key_exists('status', $in)) {
        $sets[] = 'published_at=?';
        $values[] = $in['status'] === 'published' ? date('Y-m-d H:i:s') : null;
    }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $values[] = $id;
    $pdo->prepare('UPDATE ' . $tables[$resource]['table'] . ' SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($values);
    if ($resource === 'batches' && !empty($in['course_id'])) {
        cms_extra_sync_batch_students($pdo, $id, (int)$in['course_id'], $in['student_ids'] ?? []);
    }
    json_response(['success' => true, 'message' => 'Record updated']);
});

$router->add('DELETE', '/v1/admin/lms/{resource}/{id}', function($resource, $id) {
    require_admin();
    $tables = [
        'batches' => 'batches',
        'assignments' => 'assignments',
        'announcements' => 'announcements',
        'certificates' => 'certificates',
    ];
    if (!isset($tables[$resource])) return json_response(['success' => false, 'message' => 'This admin section is not available.'], 404);
    $stmt = db_connect()->prepare('DELETE FROM ' . $tables[$resource] . ' WHERE id=?');
    $stmt->execute([(int)$id]);
    json_response(['success' => true, 'message' => 'Record deleted']);
});

$router->add('PATCH', '/v1/admin/lms/{resource}/{id}/status', function($resource, $id) {
    require_admin();
    $input = request_json() ?? [];
    $status = $input['status'] ?? '';
    $resources = [
        'users' => ['table' => 'students', 'allowed' => ['active','inactive','suspended']],
        'trainers' => ['table' => 'trainers', 'allowed' => ['active','inactive','suspended']],
        'batches' => ['table' => 'batches', 'allowed' => ['draft','active','completed','cancelled']],
        'assignments' => ['table' => 'assignments', 'allowed' => ['draft','published','closed']],
        'assessments' => ['table' => 'assessments', 'allowed' => ['draft','published','completed','cancelled']],
        'certificates' => ['table' => 'certificates', 'allowed' => ['active','pending','revoked']],
        'materials' => ['table' => 'study_materials', 'allowed' => ['draft','published','archived']],
        'payments' => ['table' => 'payments', 'allowed' => ['pending','paid','failed','refunded']],
        'announcements' => ['table' => 'announcements', 'allowed' => ['draft','published','archived']],
    ];
    if (!isset($resources[$resource]) || !in_array($status, $resources[$resource]['allowed'], true)) {
        return json_response(['success' => false, 'message' => 'Invalid status update'], 422);
    }
    $stmt = db_connect()->prepare('UPDATE ' . $resources[$resource]['table'] . ' SET status=?, updated_at=NOW() WHERE id=?');
    $stmt->execute([$status, (int)$id]);
    json_response(['success' => true, 'message' => 'Status updated']);
});

$router->add('POST', '/v1/webinars/{id}/register', function($id) {
    $in = request_json() ?? [];
    if (empty($in['name']) || empty($in['email'])) {
        return json_response(['success' => false, 'message' => 'Name and email required'], 400);
    }

    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,seats_limit,seats_left,registration_enabled FROM webinars WHERE id=?');
    $stmt->execute([$id]);
    $webinar = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$webinar) return json_response(['success' => false, 'message' => 'Webinar not found'], 404);
    if (!$webinar['registration_enabled']) return json_response(['success' => false, 'message' => 'Registration closed'], 400);
    if ((int)$webinar['seats_limit'] > 0 && (int)$webinar['seats_left'] <= 0) {
        return json_response(['success' => false, 'message' => 'No seats left'], 400);
    }

    $stmt = $pdo->prepare('INSERT INTO webinar_registrations (webinar_id,student_id,name,email,phone,status) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$id, $in['student_id'] ?? null, $in['name'], $in['email'], $in['phone'] ?? null, 'registered']);

    if ((int)$webinar['seats_limit'] > 0) {
        $pdo->prepare('UPDATE webinars SET seats_left=GREATEST(seats_left-1,0) WHERE id=?')->execute([$id]);
    }

    json_response(['success' => true, 'message' => 'Registered successfully'], 201);
});

$router->add('GET', '/v1/admin/pages', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM pages ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/pages', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['page_key'])) return json_response(['success' => false, 'message' => 'Page key required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO pages (page_key,title,slug,status,seo_title,seo_description,seo_keywords) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['page_key'],
        $in['title'] ?? $in['page_key'],
        $in['slug'] ?? cms_extra_slug($in['page_key']),
        $in['status'] ?? 'published',
        $in['seo_title'] ?? null,
        $in['seo_description'] ?? null,
        $in['seo_keywords'] ?? null,
    ]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM pages WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('GET', '/v1/admin/pages/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM pages WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Page not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('PATCH', '/v1/admin/pages/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['page_key','title','slug','status','seo_title','seo_description','seo_keywords'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field=?";
            $values[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);

    $pdo = db_connect();
    $values[] = $id;
    $pdo->prepare('UPDATE pages SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($values);
    $stmt = $pdo->prepare('SELECT * FROM pages WHERE id=?');
    $stmt->execute([$id]);
    json_response(['success' => true, 'data' => $stmt->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/pages/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM pages WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

$router->add('GET', '/v1/admin/pages/{id}/sections', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE page_id=? ORDER BY sort_order,id');
    $stmt->execute([$id]);
    $rows = array_map('cms_extra_decode_section', $stmt->fetchAll(PDO::FETCH_ASSOC));
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/pages/{id}/sections', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['section_key'])) return json_response(['success' => false, 'message' => 'Section key required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO page_sections (page_id,section_key,title,subtitle,content_json,sort_order,is_active) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([
        $id,
        $in['section_key'],
        $in['title'] ?? null,
        $in['subtitle'] ?? null,
        isset($in['content']) ? json_encode($in['content']) : ($in['content_json'] ?? null),
        $in['sort_order'] ?? 0,
        isset($in['is_active']) ? (int)$in['is_active'] : 1,
    ]);
    $sectionId = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM page_sections WHERE id=?');
    $row->execute([$sectionId]);
    json_response(['success' => true, 'data' => cms_extra_decode_section($row->fetch(PDO::FETCH_ASSOC))], 201);
});

$router->add('PATCH', '/v1/admin/sections/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['section_key','title','subtitle','sort_order','is_active'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field=?";
            $values[] = $in[$field];
        }
    }
    if (array_key_exists('content', $in)) {
        $sets[] = 'content_json=?';
        $values[] = json_encode($in['content']);
    } elseif (array_key_exists('content_json', $in)) {
        $sets[] = 'content_json=?';
        $values[] = $in['content_json'];
    }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);

    $pdo = db_connect();
    $values[] = $id;
    $pdo->prepare('UPDATE page_sections SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($values);
    $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE id=?');
    $stmt->execute([$id]);
    json_response(['success' => true, 'data' => cms_extra_decode_section($stmt->fetch(PDO::FETCH_ASSOC))]);
});

$router->add('DELETE', '/v1/admin/sections/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM page_sections WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

$router->add('POST', '/v1/admin/sections/reorder', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'page_sections', $in['items'] ?? []);
    json_response(['success' => true, 'message' => 'Sections reordered']);
});

$router->add('POST', '/v1/admin/courses/reorder', function() {
    $admin = require_admin();
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'courses', (request_json() ?? [])['items'] ?? []);
    json_response(['success' => true]);
});

$router->add('POST', '/v1/admin/course-categories/reorder', function() {
    $admin = require_admin();
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'course_categories', (request_json() ?? [])['items'] ?? []);
    json_response(['success' => true]);
});

$router->add('POST', '/v1/admin/webinars/reorder', function() {
    $admin = require_admin();
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'webinars', (request_json() ?? [])['items'] ?? []);
    json_response(['success' => true]);
});

$router->add('POST', '/v1/admin/trusted-partners/reorder', function() {
    $admin = require_admin();
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'trusted_partners', (request_json() ?? [])['items'] ?? []);
    json_response(['success' => true]);
});

$router->add('POST', '/v1/admin/testimonials/reorder', function() {
    $admin = require_admin();
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'testimonials', (request_json() ?? [])['items'] ?? []);
    json_response(['success' => true]);
});

$router->add('POST', '/v1/admin/navigation/reorder', function() {
    $admin = require_admin();
    $pdo = db_connect();
    cms_extra_reorder($pdo, 'navigation_menus', (request_json() ?? [])['items'] ?? []);
    json_response(['success' => true]);
});
