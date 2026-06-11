<?php
function cms_slugify($value) {
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', trim((string)$value)));
    return trim($slug, '-') ?: ('item-' . time());
}

function cms_unique_slug($pdo, $table, $baseSlug, $ignoreId = null) {
    $slug = cms_slugify($baseSlug);
    $candidate = $slug;
    $suffix = 2;

    while (true) {
        $sql = "SELECT id FROM $table WHERE slug=? LIMIT 1";
        $values = [$candidate];
        if ($ignoreId) {
            $sql = "SELECT id FROM $table WHERE slug=? AND id<>? LIMIT 1";
            $values[] = $ignoreId;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) return $candidate;
        $candidate = $slug . '-' . $suffix++;
    }
}

function cms_webinar_storage_status($status) {
    $value = strtolower(trim((string)$status));
    $map = [
        'active' => 'published',
        'published' => 'published',
        'inactive' => 'cancelled',
        'draft' => 'draft',
        'completed' => 'completed',
        'cancelled' => 'cancelled',
    ];
    if (!isset($map[$value])) {
        throw new InvalidArgumentException('Webinar status must be Active, Inactive, or Draft');
    }
    return $map[$value];
}

function cms_course_discount_data(array $input, array $current = []) {
    $price = array_key_exists('price', $input) ? (float)$input['price'] : (float)($current['price'] ?? 0);
    $type = strtolower(trim((string)($input['discount_type'] ?? ($current['discount_type'] ?? 'none'))));
    $value = array_key_exists('discount_value', $input)
        ? (float)$input['discount_value']
        : (float)($current['discount_value'] ?? 0);
    $status = array_key_exists('discount_status', $input)
        ? (int)(bool)$input['discount_status']
        : (int)(bool)($current['discount_status'] ?? 0);

    $typeAliases = [
        '' => 'none',
        'no discount' => 'none',
        'percentage discount' => 'percentage',
        'fixed amount discount' => 'fixed',
        'fixed_amount' => 'fixed',
    ];
    $type = $typeAliases[$type] ?? $type;

    if ($price < 0) throw new InvalidArgumentException('Course price cannot be negative');
    if (!in_array($type, ['none', 'percentage', 'fixed'], true)) {
        throw new InvalidArgumentException('Invalid discount type');
    }
    if ($value < 0) throw new InvalidArgumentException('Discount value cannot be negative');

    if ($type === 'none') {
        $value = 0;
        $status = 0;
    } elseif ($type === 'percentage' && $value > 100) {
        throw new InvalidArgumentException('Percentage discount cannot be more than 100');
    } elseif ($type === 'fixed' && $value > $price) {
        throw new InvalidArgumentException('Fixed discount cannot be greater than the original price');
    }

    $discountedPrice = null;
    if ($status) {
        $discountedPrice = $type === 'percentage'
            ? $price - ($price * $value / 100)
            : $price - $value;
        if ($discountedPrice < 0) throw new InvalidArgumentException('Final price cannot be negative');
        $discountedPrice = round($discountedPrice, 2);
    }

    return [
        'price' => round($price, 2),
        'discount_type' => $type,
        'discount_value' => round($value, 2),
        'discounted_price' => $discountedPrice,
        'discount_status' => $status,
    ];
}

function cms_popup_page_key($value) {
    $pageKey = strtolower(trim((string)$value));
    $allowed = ['home','courses','webinar','media-gallery','articles','certification','contact','all'];
    if (!in_array($pageKey, $allowed, true)) {
        throw new InvalidArgumentException('Invalid popup display page');
    }
    return $pageKey;
}

function cms_popup_position($value) {
    $position = strtolower(trim((string)$value));
    $allowed = ['center','top','bottom','bottom-right','bottom-left'];
    if (!in_array($position, $allowed, true)) {
        throw new InvalidArgumentException('Invalid popup position');
    }
    return $position;
}

function cms_active_popup(PDO $pdo, $pageKey) {
    $pageKey = cms_popup_page_key($pageKey);
    $stmt = $pdo->prepare("SELECT * FROM home_popups
        WHERE status='active'
          AND page_key IN (?, 'all')
          AND (start_date IS NULL OR start_date <= NOW())
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY (page_key = ?) DESC, updated_at DESC, id DESC
        LIMIT 1");
    $stmt->execute([$pageKey, $pageKey]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}
// ============================================================
// EEPL LMS — CMS API Routes
// Included automatically from routes.php
// ============================================================

// CORS helper for OPTIONS preflight
$router->add('OPTIONS', '/{any}', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type,Authorization');
    http_response_code(204);
    exit;
});

// ================================================================
// PUBLIC API — SITE SETTINGS & NAVIGATION
// ================================================================

$router->add('GET', '/v1/site/settings', function() {
    $pdo = db_connect();
    $rows = $pdo->query('SELECT setting_key, setting_value, setting_type, group_name FROM site_settings')->fetchAll(PDO::FETCH_ASSOC);
    $out = [];
    foreach ($rows as $r) {
        $v = $r['setting_value'];
        if ($r['setting_type'] === 'boolean') $v = (bool)(int)$v;
        if ($r['setting_type'] === 'number') $v = (float)$v;
        if ($r['setting_type'] === 'json') $v = json_decode($v, true);
        $out[$r['setting_key']] = $v;
    }
    json_response(['success' => true, 'data' => $out]);
});

$router->add('GET', '/v1/site/navigation', function() {
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM navigation_menus WHERE is_active=1 ORDER BY location, sort_order')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/contact-settings', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT setting_key, setting_value FROM site_settings WHERE group_name IN ('contact','social')")->fetchAll(PDO::FETCH_ASSOC);
    $out = [];
    foreach ($rows as $r) $out[$r['setting_key']] = $r['setting_value'];
    json_response(['success' => true, 'data' => $out]);
});

// ================================================================
// PUBLIC API — HOME PAGE
// ================================================================

$router->add('GET', '/v1/home', function() {
    $pdo = db_connect();
    $page = $pdo->query("SELECT id FROM pages WHERE page_key='home' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $sections = [];
    if ($page) {
        $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE page_id=? AND is_active=1 ORDER BY sort_order');
        $stmt->execute([$page['id']]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            if ($r['content_json']) $r['content'] = json_decode($r['content_json'], true);
        }
        $sections = $rows;
    }
    json_response(['success' => true, 'data' => $sections]);
});

$router->add('GET', '/v1/home/hero', function() {
    $pdo = db_connect();
    $page = $pdo->query("SELECT id FROM pages WHERE page_key='home' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if (!$page) return json_response(['success' => false, 'message' => 'Not found'], 404);
    $stmt = $pdo->prepare("SELECT * FROM page_sections WHERE page_id=? AND section_key='hero' AND is_active=1 LIMIT 1");
    $stmt->execute([$page['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && $row['content_json']) $row['content'] = json_decode($row['content_json'], true);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('GET', '/v1/home/popular-courses', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT c.id,c.title,c.slug,c.short_description,c.description,c.category,c.price,c.discount_type,c.discount_value,c.discounted_price,c.discount_status,c.thumbnail_url,c.duration,c.level,c.badge,c.is_featured,c.is_popular,c.sort_order,t.full_name AS trainer_name FROM courses c LEFT JOIN trainers t ON t.id=c.trainer_id WHERE c.is_popular=1 AND c.status='published' ORDER BY c.sort_order,c.id LIMIT 12")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/home/upcoming-webinars', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,title,slug,description,speaker_name,speaker_role,speaker_image_url,banner_url,category,starts_at,ends_at,seats_limit,seats_left,registration_enabled,meet_url FROM webinars WHERE status='published' AND (starts_at IS NULL OR starts_at >= NOW()) ORDER BY (starts_at IS NULL), starts_at ASC, sort_order ASC, id DESC LIMIT 6")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/home/trusted-by', function() {
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM trusted_partners WHERE is_active=1 ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/home/testimonials', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT * FROM testimonials WHERE status='active' ORDER BY sort_order,id")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/home/faqs', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT * FROM faqs WHERE page_key='home' AND is_active=1 ORDER BY sort_order,id")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/home/counters', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT * FROM counters WHERE is_active=1 ORDER BY sort_order,id")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/home/popup', function() {
    $pdo = db_connect();
    json_response(['success' => true, 'data' => cms_active_popup($pdo, 'home')]);
});

$router->add('GET', '/v1/popups', function() {
    try {
        $pageKey = cms_popup_page_key($_GET['page_key'] ?? 'home');
    } catch (InvalidArgumentException $e) {
        return json_response(['success' => false, 'message' => $e->getMessage()], 422);
    }
    json_response(['success' => true, 'data' => cms_active_popup(db_connect(), $pageKey)]);
});

// ================================================================
// PUBLIC API — COURSE CATEGORIES
// ================================================================

$router->add('GET', '/v1/course-categories', function() {
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM course_categories WHERE is_active=1 ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

// ================================================================
// PUBLIC API — COURSES (override/extend existing with public ones)
// ================================================================

$router->add('GET', '/v1/public-courses', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,title,slug,description,short_description,category,price,discount_type,discount_value,discounted_price,discount_status,thumbnail_url,banner_url,duration,level,badge,is_featured,is_popular,sort_order FROM courses WHERE status='published' ORDER BY sort_order,id DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/courses/featured', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,title,slug,short_description,category,price,discount_type,discount_value,discounted_price,discount_status,thumbnail_url,duration,level,badge,sort_order FROM courses WHERE is_featured=1 AND status='published' ORDER BY sort_order LIMIT 12")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/courses/popular', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT c.id,c.title,c.slug,c.short_description,c.category,c.price,c.discount_type,c.discount_value,c.discounted_price,c.discount_status,c.thumbnail_url,c.duration,c.level,c.badge,c.sort_order,t.full_name AS trainer_name FROM courses c LEFT JOIN trainers t ON t.id=c.trainer_id WHERE c.is_popular=1 AND c.status='published' ORDER BY c.sort_order LIMIT 12")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/courses/slug/{slug}', function($slug) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM courses WHERE slug=? AND status='published' LIMIT 1");
    $stmt->execute([$slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('GET', '/v1/courses/{courseId}/faqs', function($courseId) {
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM course_faqs WHERE course_id=? ORDER BY sort_order,id');
    $stmt->execute([$courseId]);
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

// ================================================================
// PUBLIC API — WEBINARS
// ================================================================

$router->add('GET', '/v1/webinars', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT * FROM webinars WHERE status='published' ORDER BY starts_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/webinars/upcoming', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT * FROM webinars WHERE status='published' AND (starts_at IS NULL OR starts_at >= NOW()) ORDER BY (starts_at IS NULL), starts_at ASC, sort_order ASC, id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/webinars/recordings', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT wr.*, w.title as webinar_title FROM webinar_recordings wr JOIN webinars w ON wr.webinar_id=w.id WHERE wr.is_active=1 ORDER BY wr.recorded_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/webinars/slug/{slug}', function($slug) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM webinars WHERE slug=? AND status='published' LIMIT 1");
    $stmt->execute([$slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/webinars/{id}/register', function($id) {
    $in = request_json() ?? [];
    if (empty($in['name']) || empty($in['email'])) return json_response(['success' => false, 'message' => 'Name and email required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,seats_limit,seats_left,registration_enabled FROM webinars WHERE id=?');
    $stmt->execute([$id]);
    $w = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$w) return json_response(['success' => false, 'message' => 'Webinar not found'], 404);
    if (!$w['registration_enabled']) return json_response(['success' => false, 'message' => 'Registration closed'], 400);
    if ($w['seats_limit'] > 0 && $w['seats_left'] <= 0) return json_response(['success' => false, 'message' => 'No seats left'], 400);
    $ins = $pdo->prepare('INSERT INTO webinar_registrations (webinar_id,name,email,phone) VALUES (?,?,?,?)');
    $ins->execute([$id, $in['name'], $in['email'], $in['phone'] ?? null]);
    if ($w['seats_limit'] > 0) {
        $pdo->prepare('UPDATE webinars SET seats_left=GREATEST(seats_left-1,0) WHERE id=?')->execute([$id]);
    }
    json_response(['success' => true, 'message' => 'Registered successfully'], 201);
});

// ================================================================
// PUBLIC API — POSTS / BLOGS / ARTICLES
// ================================================================

$router->add('GET', '/v1/posts', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,type,title,slug,excerpt,featured_image_url,author_admin_id,category_id,reading_time,is_featured,published_at FROM posts WHERE status='published' ORDER BY published_at DESC, id DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/posts/featured', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,type,title,slug,excerpt,featured_image_url,reading_time,published_at FROM posts WHERE status='published' AND is_featured=1 ORDER BY published_at DESC LIMIT 6")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/posts/slug/{slug}', function($slug) {
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE slug=? AND status='published' LIMIT 1");
    $stmt->execute([$slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    if ($row['tags_json']) $row['tags'] = json_decode($row['tags_json'], true);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('GET', '/v1/blogs', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,title,slug,excerpt,featured_image_url,reading_time,is_featured,published_at FROM posts WHERE type='blog' AND status='published' ORDER BY published_at DESC, id DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/articles', function() {
    $pdo = db_connect();
    $rows = $pdo->query("SELECT id,title,slug,excerpt,featured_image_url,reading_time,is_featured,published_at FROM posts WHERE type='article' AND status='published' ORDER BY published_at DESC, id DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/content-categories', function() {
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM content_categories WHERE is_active=1 ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

// ================================================================
// PUBLIC API — CERTIFICATION PAGE
// ================================================================

$router->add('GET', '/v1/certification-page', function() {
    $pdo = db_connect();
    $page = $pdo->query("SELECT id FROM pages WHERE page_key='certification' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $sections = [];
    if ($page) {
        $stmt = $pdo->prepare('SELECT * FROM page_sections WHERE page_id=? AND is_active=1 ORDER BY sort_order');
        $stmt->execute([$page['id']]);
        $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($sections as &$s) {
            if ($s['content_json']) $s['content'] = json_decode($s['content_json'], true);
        }
    }
    json_response(['success' => true, 'data' => $sections]);
});

$router->add('GET', '/v1/certificates/verify/{certNumber}', function($certNumber) {
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT c.*, s.name as student_name, co.title as course_title FROM certificates c LEFT JOIN students s ON c.student_id=s.id LEFT JOIN courses co ON c.course_id=co.id WHERE c.certificate_number=? LIMIT 1');
    $stmt->execute([$certNumber]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Certificate not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

// ================================================================
// PUBLIC API — CONTACT FORM
// ================================================================

$router->add('POST', '/v1/contact', function() {
    $in = request_json() ?? [];
    if (empty($in['name'])) return json_response(['success' => false, 'message' => 'Name required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO contact_leads (name,email,phone,subject,message,source_page) VALUES (?,?,?,?,?,?)');
    $stmt->execute([
        $in['name'],
        $in['email'] ?? null,
        $in['phone'] ?? null,
        $in['subject'] ?? null,
        $in['message'] ?? null,
        $in['source_page'] ?? 'contact',
    ]);
    json_response(['success' => true, 'message' => 'Message received!'], 201);
});

// ================================================================
// ADMIN API — DASHBOARD (extended)
// ================================================================

$router->add('GET', '/v1/admin/dashboard', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $data = [
        'students'   => (int)$pdo->query('SELECT COUNT(*) FROM students')->fetchColumn(),
        'trainers'   => (int)$pdo->query('SELECT COUNT(*) FROM trainers')->fetchColumn(),
        'courses'    => (int)$pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn(),
        'batches'    => (int)$pdo->query('SELECT COUNT(*) FROM batches')->fetchColumn(),
        'enrollments'=> (int)$pdo->query('SELECT COUNT(*) FROM enrollments')->fetchColumn(),
        'assignments'=> (int)$pdo->query('SELECT COUNT(*) FROM assignments')->fetchColumn(),
        'revenue'    => (float)$pdo->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid'")->fetchColumn(),
        'pending'    => (int)$pdo->query("SELECT (SELECT COUNT(*) FROM students WHERE status='inactive') + (SELECT COUNT(*) FROM trainers WHERE status='inactive')")->fetchColumn(),
        'messages'   => (int)$pdo->query("SELECT COUNT(*) FROM messages WHERE recipient_role='admin' AND is_read=0")->fetchColumn(),
        'notifications' => (int)$pdo->query("SELECT COUNT(*) FROM notifications WHERE recipient_role='admin' AND is_read=0")->fetchColumn(),
        'webinars'   => (int)$pdo->query("SELECT COUNT(*) FROM webinars WHERE status='published' AND starts_at >= NOW()")->fetchColumn(),
        'posts'      => (int)$pdo->query("SELECT COUNT(*) FROM posts WHERE status='published'")->fetchColumn(),
        'leads'      => (int)$pdo->query("SELECT COUNT(*) FROM contact_leads WHERE status='new'")->fetchColumn(),
    ];
    $recent_leads = $pdo->query('SELECT id,name,email,phone,subject,status,created_at FROM contact_leads ORDER BY created_at DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    $recent_enrollments = $pdo->query('SELECT e.id,s.name as student,c.title as course,e.enrollment_date FROM enrollments e LEFT JOIN students s ON e.student_id=s.id LEFT JOIN courses c ON e.course_id=c.id ORDER BY e.enrollment_date DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    $recent_registrations = $pdo->query("
        (SELECT id,name,email,'Student' AS role,status,created_at FROM students ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT id,full_name AS name,email,'Trainer' AS role,status,created_at FROM trainers ORDER BY created_at DESC LIMIT 5)
        ORDER BY created_at DESC LIMIT 6
    ")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => [
        'stats' => $data,
        'recent_leads' => $recent_leads,
        'recent_enrollments' => $recent_enrollments,
        'recent_registrations' => $recent_registrations,
    ]]);
});

$router->add('GET', '/v1/admin/lms/{resource}', function($resource) {
    require_admin();
    $pdo = db_connect();

    $resources = [
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
            'sql' => "SELECT b.id AS ID,b.batch_name AS Batch,c.title AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,COALESCE(b.schedule_text,'Not scheduled') AS Schedule,COUNT(DISTINCT e.student_id) AS Students,b.status AS Status FROM batches b JOIN courses c ON c.id=b.course_id LEFT JOIN trainers t ON t.id=b.trainer_id LEFT JOIN enrollments e ON e.batch_id=b.id GROUP BY b.id ORDER BY b.created_at DESC",
        ],
        'enrollments' => [
            'title' => 'Enrollments',
            'columns' => ['ID','Student','Course','Batch','Progress','Payment','Status'],
            'sql' => "SELECT e.id AS ID,s.name AS Student,c.title AS Course,COALESCE(b.batch_name,'Not assigned') AS Batch,CONCAT(ROUND(e.progress_percentage),'%') AS Progress,e.payment_status AS Payment,e.status AS Status FROM enrollments e JOIN students s ON s.id=e.student_id JOIN courses c ON c.id=e.course_id LEFT JOIN batches b ON b.id=e.batch_id ORDER BY e.enrollment_date DESC",
        ],
        'assignments' => [
            'title' => 'Assignments',
            'columns' => ['ID','Assignment','Course','Trainer','Due Date','Submissions','Status'],
            'sql' => "SELECT a.id AS ID,a.title AS Assignment,c.title AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,COALESCE(DATE_FORMAT(a.due_date,'%d %b %Y %h:%i %p'),'No due date') AS `Due Date`,COUNT(s.id) AS Submissions,a.status AS Status FROM assignments a JOIN courses c ON c.id=a.course_id LEFT JOIN trainers t ON t.id=a.trainer_id LEFT JOIN assignment_submissions s ON s.assignment_id=a.id GROUP BY a.id ORDER BY a.due_date",
        ],
        'assessments' => [
            'title' => 'Assessments',
            'columns' => ['ID','Assessment','Course','Trainer','Date','Results','Status'],
            'sql' => "SELECT a.id AS ID,a.title AS Assessment,c.title AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,COALESCE(DATE_FORMAT(a.assessment_date,'%d %b %Y %h:%i %p'),'Not scheduled') AS Date,COUNT(r.id) AS Results,a.status AS Status FROM assessments a JOIN courses c ON c.id=a.course_id LEFT JOIN trainers t ON t.id=a.trainer_id LEFT JOIN assessment_results r ON r.assessment_id=a.id GROUP BY a.id ORDER BY a.assessment_date",
        ],
        'certificates' => [
            'title' => 'Certificates',
            'columns' => ['ID','Certificate','Student','Course','Issued','Status'],
            'sql' => "SELECT ce.id AS ID,ce.certificate_number AS Certificate,s.name AS Student,c.title AS Course,DATE_FORMAT(ce.issued_date,'%d %b %Y') AS Issued,ce.status AS Status FROM certificates ce JOIN students s ON s.id=ce.student_id JOIN courses c ON c.id=ce.course_id ORDER BY ce.issued_date DESC",
        ],
        'materials' => [
            'title' => 'Study Materials',
            'columns' => ['ID','Material','Course','Trainer','Type','Status'],
            'sql' => "SELECT sm.id AS ID,sm.title AS Material,c.title AS Course,COALESCE(t.full_name,'Unassigned') AS Trainer,sm.material_type AS Type,sm.status AS Status FROM study_materials sm JOIN courses c ON c.id=sm.course_id LEFT JOIN trainers t ON t.id=sm.trainer_id ORDER BY sm.created_at DESC",
        ],
        'payments' => [
            'title' => 'Payments',
            'columns' => ['ID','Student','Amount','Method','Transaction','Status','Paid'],
            'sql' => "SELECT p.id AS ID,s.name AS Student,CONCAT('INR ',FORMAT(p.amount,2)) AS Amount,COALESCE(p.payment_method,'') AS Method,COALESCE(p.transaction_id,'') AS Transaction,p.status AS Status,COALESCE(DATE_FORMAT(p.paid_at,'%d %b %Y'),'Not paid') AS Paid FROM payments p JOIN students s ON s.id=p.student_id ORDER BY p.created_at DESC",
        ],
        'messages' => [
            'title' => 'Messages',
            'columns' => ['ID','From Role','From ID','To Role','To ID','Subject','Status','Sent'],
            'sql' => "SELECT id AS ID,sender_role AS `From Role`,sender_id AS `From ID`,recipient_role AS `To Role`,recipient_id AS `To ID`,COALESCE(subject,'No subject') AS Subject,IF(is_read=1,'Read','New') AS Status,DATE_FORMAT(created_at,'%d %b %Y %h:%i %p') AS Sent FROM messages ORDER BY created_at DESC",
        ],
        'announcements' => [
            'title' => 'Announcements',
            'columns' => ['ID','Title','Audience','Status','Published'],
            'sql' => "SELECT id AS ID,title AS Title,target_role AS Audience,status AS Status,COALESCE(DATE_FORMAT(published_at,'%d %b %Y'),DATE_FORMAT(created_at,'%d %b %Y')) AS Published FROM announcements ORDER BY created_at DESC",
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

    if (!isset($resources[$resource])) {
        return json_response(['success' => false, 'message' => 'This admin section is not available.'], 404);
    }
    $config = $resources[$resource];
    $rows = $pdo->query($config['sql'])->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => [
        'title' => $config['title'],
        'columns' => $config['columns'],
        'rows' => $rows,
    ]]);
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
        'materials' => ['table' => 'study_materials', 'allowed' => ['draft','published','archived']],
        'payments' => ['table' => 'payments', 'allowed' => ['pending','paid','failed','refunded']],
        'announcements' => ['table' => 'announcements', 'allowed' => ['draft','published','archived']],
    ];
    if (!isset($resources[$resource]) || !in_array($status, $resources[$resource]['allowed'], true)) {
        return json_response(['success' => false, 'message' => 'Invalid status update'], 422);
    }
    $table = $resources[$resource]['table'];
    $stmt = db_connect()->prepare("UPDATE {$table} SET status = ? WHERE id = ?");
    $stmt->execute([$status, (int)$id]);
    json_response(['success' => true, 'message' => 'Status updated']);
});

// ================================================================
// ADMIN API — SITE SETTINGS
// ================================================================

$router->add('GET', '/v1/admin/settings', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM site_settings ORDER BY group_name, setting_key')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('PATCH', '/v1/admin/settings', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    foreach ($in as $key => $value) {
        $stmt = $pdo->prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), updated_at=NOW()');
        $stmt->execute([$key, is_array($value) ? json_encode($value) : (string)$value]);
    }
    json_response(['success' => true, 'message' => 'Settings updated']);
});

// ================================================================
// ADMIN API — NAVIGATION
// ================================================================

$router->add('GET', '/v1/admin/navigation', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM navigation_menus ORDER BY location, sort_order')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/navigation', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['label'])) return json_response(['success' => false, 'message' => 'Label required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO navigation_menus (location,label,url,parent_id,sort_order,is_active) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$in['location'] ?? 'header', $in['label'], $in['url'] ?? '#', $in['parent_id'] ?? null, $in['sort_order'] ?? 0, isset($in['is_active']) ? (int)$in['is_active'] : 1]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM navigation_menus WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/navigation/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['location','label','url','parent_id','sort_order','is_active'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE navigation_menus SET ' . implode(',', $sets) . ' WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM navigation_menus WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/navigation/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM navigation_menus WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — MEDIA UPLOAD
// ================================================================

$router->add('GET', '/v1/admin/media', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $type = $_GET['type'] ?? null;
    if ($type) {
        $stmt = $pdo->prepare('SELECT * FROM media_assets WHERE file_type=? ORDER BY created_at DESC');
        $stmt->execute([$type]);
    } else {
        $stmt = $pdo->query('SELECT * FROM media_assets ORDER BY created_at DESC');
    }
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
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

$router->add('PATCH', '/v1/admin/media/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    if (isset($in['alt_text'])) {
        $pdo->prepare('UPDATE media_assets SET alt_text=?, updated_at=NOW() WHERE id=?')->execute([$in['alt_text'], $id]);
    }
    $row = $pdo->prepare('SELECT * FROM media_assets WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/media/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $row = $pdo->prepare('SELECT file_path FROM media_assets WHERE id=?');
    $row->execute([$id]);
    $asset = $row->fetch(PDO::FETCH_ASSOC);
    if ($asset && file_exists($asset['file_path'])) @unlink($asset['file_path']);
    $pdo->prepare('DELETE FROM media_assets WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — HOME PAGE SECTION EDITORS
// ================================================================

function get_home_page_id($pdo) {
    return $pdo->query("SELECT id FROM pages WHERE page_key='home' LIMIT 1")->fetchColumn();
}

function upsert_section($pdo, $pageId, $key, $data) {
    $stmt = $pdo->prepare("SELECT id FROM page_sections WHERE page_id=? AND section_key=? LIMIT 1");
    $stmt->execute([$pageId, $key]);
    $existing = $stmt->fetchColumn();

    $title    = $data['title']    ?? null;
    $subtitle = $data['subtitle'] ?? null;
    unset($data['title'], $data['subtitle']);
    $json = !empty($data) ? json_encode($data) : null;

    if ($existing) {
        $upd = $pdo->prepare("UPDATE page_sections SET title=?, subtitle=?, content_json=?, updated_at=NOW() WHERE id=?");
        $upd->execute([$title, $subtitle, $json, $existing]);
        return $existing;
    } else {
        $ins = $pdo->prepare("INSERT INTO page_sections (page_id, section_key, title, subtitle, content_json) VALUES (?,?,?,?,?)");
        $ins->execute([$pageId, $key, $title, $subtitle, $json]);
        return $pdo->lastInsertId();
    }
}

$router->add('PATCH', '/v1/admin/home/hero', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $pageId = get_home_page_id($pdo);
    if (!$pageId) return json_response(['success' => false, 'message' => 'Home page not found'], 404);
    upsert_section($pdo, $pageId, 'hero', $in);
    json_response(['success' => true, 'message' => 'Hero updated']);
});

$router->add('PATCH', '/v1/admin/home/popular-courses', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    // Mark selected courses as popular
    if (isset($in['course_ids']) && is_array($in['course_ids'])) {
        $pdo->exec('UPDATE courses SET is_popular=0');
        if (!empty($in['course_ids'])) {
            $placeholders = implode(',', array_fill(0, count($in['course_ids']), '?'));
            $pdo->prepare("UPDATE courses SET is_popular=1 WHERE id IN ($placeholders)")->execute($in['course_ids']);
        }
    }
    json_response(['success' => true, 'message' => 'Popular courses updated']);
});

$router->add('PATCH', '/v1/admin/home/trusted-by', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $pageId = get_home_page_id($pdo);
    if (!$pageId) return json_response(['success' => false, 'message' => 'Home page not found'], 404);
    upsert_section($pdo, $pageId, 'trusted_by', $in);
    json_response(['success' => true, 'message' => 'Trusted-by section updated']);
});

$router->add('PATCH', '/v1/admin/home/testimonials', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    if (isset($in['featured_ids']) && is_array($in['featured_ids'])) {
        $pdo->exec("UPDATE testimonials SET is_featured=0");
        if (!empty($in['featured_ids'])) {
            $placeholders = implode(',', array_fill(0, count($in['featured_ids']), '?'));
            $pdo->prepare("UPDATE testimonials SET is_featured=1 WHERE id IN ($placeholders)")->execute($in['featured_ids']);
        }
    }
    json_response(['success' => true, 'message' => 'Testimonials updated']);
});

$router->add('PATCH', '/v1/admin/home/faqs', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $pageId = get_home_page_id($pdo);
    if (!$pageId) return json_response(['success' => false, 'message' => 'Home page not found'], 404);
    upsert_section($pdo, $pageId, 'faqs', $in);
    json_response(['success' => true, 'message' => 'FAQs section updated']);
});

$router->add('PATCH', '/v1/admin/home/cta', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $pageId = get_home_page_id($pdo);
    if (!$pageId) return json_response(['success' => false, 'message' => 'Home page not found'], 404);
    upsert_section($pdo, $pageId, 'cta', $in);
    json_response(['success' => true, 'message' => 'CTA updated']);
});

// ================================================================
// ADMIN API — COURSE CATEGORIES
// ================================================================

$router->add('GET', '/v1/admin/course-categories', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM course_categories ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/course-categories', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['name'])) return json_response(['success' => false, 'message' => 'Name required'], 400);
    $slug = $in['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $in['name']));
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO course_categories (name,slug,description,image_url,sort_order,is_active) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$in['name'], $slug, $in['description'] ?? null, $in['image_url'] ?? null, $in['sort_order'] ?? 0, 1]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM course_categories WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/course-categories/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['name','slug','description','image_url','sort_order','is_active'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE course_categories SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM course_categories WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/course-categories/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM course_categories WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — COURSES (CMS extensions)
// ================================================================

$router->add('GET', '/v1/admin/courses', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT c.id,c.title,c.slug,c.category,c.price,c.discount_type,c.discount_value,c.discounted_price,c.discount_status,c.status,c.is_featured,c.is_popular,c.sort_order,c.thumbnail_url,c.level,c.badge,c.trainer_id,t.full_name AS trainer_name,c.created_at,c.updated_at FROM courses c LEFT JOIN trainers t ON t.id=c.trainer_id ORDER BY c.sort_order,c.id DESC')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/admin/courses/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM courses WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/admin/courses', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['title'])) return json_response(['success' => false, 'message' => 'Title required'], 400);
    $pdo = db_connect();
    $slug = cms_unique_slug($pdo, 'courses', $in['slug'] ?? $in['title']);
    $status = $in['status'] ?? 'published';
    try {
        $discount = cms_course_discount_data($in);
    } catch (InvalidArgumentException $e) {
        return json_response(['success' => false, 'message' => $e->getMessage()], 422);
    }
    $stmt = $pdo->prepare('INSERT INTO courses (title,slug,description,short_description,category,price,discount_type,discount_value,discounted_price,discount_status,instructor_id,trainer_id,thumbnail_url,banner_url,duration,status,level,badge,is_featured,is_popular,sort_order,seo_title,seo_description,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['title'], $slug,
        $in['description'] ?? '',
        $in['short_description'] ?? null,
        $in['category'] ?? 'General',
        $discount['price'],
        $discount['discount_type'],
        $discount['discount_value'],
        $discount['discounted_price'],
        $discount['discount_status'],
        $admin['id'],
        !empty($in['trainer_id']) ? (int)$in['trainer_id'] : null,
        $in['thumbnail_url'] ?? null,
        $in['banner_url'] ?? null,
        $in['duration'] ?? null,
        $status,
        $in['level'] ?? 'beginner',
        $in['badge'] ?? null,
        !empty($in['is_featured']) ? 1 : 0,
        !empty($in['is_popular']) ? 1 : 0,
        $in['sort_order'] ?? 0,
        $in['seo_title'] ?? null,
        $in['seo_description'] ?? null,
        $status === 'published' ? date('Y-m-d H:i:s') : null,
    ]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM courses WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/courses/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['title','slug','description','short_description','category','trainer_id','thumbnail_url','banner_url','duration','status','level','badge','is_featured','is_popular','sort_order','seo_title','seo_description'];
    $sets = []; $vals = [];
    $pdo = db_connect();
    $existingStmt = $pdo->prepare('SELECT price,discount_type,discount_value,discounted_price,discount_status FROM courses WHERE id=?');
    $existingStmt->execute([$id]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) return json_response(['success' => false, 'message' => 'Not found'], 404);
    if (array_key_exists('slug', $in) && trim((string)$in['slug']) !== '') {
        $in['slug'] = cms_unique_slug($pdo, 'courses', $in['slug'], $id);
    }
    $discountFields = ['price','discount_type','discount_value','discount_status'];
    if (array_intersect($discountFields, array_keys($in))) {
        try {
            $discount = cms_course_discount_data($in, $existing);
        } catch (InvalidArgumentException $e) {
            return json_response(['success' => false, 'message' => $e->getMessage()], 422);
        }
        foreach ($discount as $field => $value) {
            $sets[] = "$field=?";
            $vals[] = $value;
        }
    }
    foreach ($allowed as $f) {
        if (array_key_exists($f, $in)) {
            $sets[] = "$f=?";
            if (in_array($f, ['is_featured','is_popular'])) $vals[] = (int)(bool)$in[$f];
            elseif ($f === 'trainer_id') $vals[] = !empty($in[$f]) ? (int)$in[$f] : null;
            else $vals[] = $in[$f];
        }
    }
    if (array_key_exists('status', $in)) {
        $sets[] = 'published_at=?';
        $vals[] = $in['status'] === 'published' ? date('Y-m-d H:i:s') : null;
    }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $vals[] = $id;
    $pdo->prepare('UPDATE courses SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM courses WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/courses/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM courses WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

$router->add('PATCH', '/v1/admin/courses/{id}/publish', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT status FROM courses WHERE id=?');
    $stmt->execute([$id]);
    $c = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$c) return json_response(['success' => false, 'message' => 'Not found'], 404);
    $newStatus = isset($in['value'])
        ? ($in['value'] ? 'published' : 'draft')
        : ($c['status'] === 'published' ? 'draft' : 'published');
    $pdo->prepare('UPDATE courses SET status=?, published_at=?, updated_at=NOW() WHERE id=?')->execute([$newStatus, $newStatus === 'published' ? date('Y-m-d H:i:s') : null, $id]);
    json_response(['success' => true, 'status' => $newStatus]);
});

$router->add('PATCH', '/v1/admin/courses/{id}/feature', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT is_featured FROM courses WHERE id=?');
    $stmt->execute([$id]);
    $c = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$c) return json_response(['success' => false, 'message' => 'Not found'], 404);
    $new = isset($in['value']) ? (int)(bool)$in['value'] : ($c['is_featured'] ? 0 : 1);
    $pdo->prepare('UPDATE courses SET is_featured=? WHERE id=?')->execute([$new, $id]);
    json_response(['success' => true, 'is_featured' => (bool)$new]);
});

$router->add('PATCH', '/v1/admin/courses/{id}/popular', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT is_popular FROM courses WHERE id=?');
    $stmt->execute([$id]);
    $c = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$c) return json_response(['success' => false, 'message' => 'Not found'], 404);
    $new = isset($in['value']) ? (int)(bool)$in['value'] : ($c['is_popular'] ? 0 : 1);
    $pdo->prepare('UPDATE courses SET is_popular=? WHERE id=?')->execute([$new, $id]);
    json_response(['success' => true, 'is_popular' => (bool)$new]);
});

// ================================================================
// ADMIN API — WEBINARS
// ================================================================

$router->add('GET', '/v1/admin/webinars', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM webinars ORDER BY starts_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/admin/webinars/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM webinars WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/admin/webinars', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['title'])) return json_response(['success' => false, 'message' => 'Title required'], 400);
    $pdo = db_connect();
    $slug = cms_unique_slug($pdo, 'webinars', $in['slug'] ?? $in['title']);
    try {
        $status = cms_webinar_storage_status($in['status'] ?? 'active');
    } catch (InvalidArgumentException $e) {
        return json_response(['success' => false, 'message' => $e->getMessage()], 422);
    }
    $seatsLimit = (int)($in['seats_limit'] ?? 0);
    $seatsLeft = array_key_exists('seats_left', $in) ? (int)$in['seats_left'] : $seatsLimit;
    $stmt = $pdo->prepare('INSERT INTO webinars (title,slug,description,speaker_name,speaker_role,speaker_image_url,banner_url,category,starts_at,ends_at,seats_limit,seats_left,registration_enabled,meet_url,status,is_featured,sort_order,seo_title,seo_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['title'], $slug,
        $in['description'] ?? null,
        $in['speaker_name'] ?? null,
        $in['speaker_role'] ?? null,
        $in['speaker_image_url'] ?? null,
        $in['banner_url'] ?? null,
        $in['category'] ?? null,
        $in['starts_at'] ?? null,
        $in['ends_at'] ?? null,
        $seatsLimit,
        $seatsLeft,
        array_key_exists('registration_enabled', $in) ? (int)(bool)$in['registration_enabled'] : 1,
        $in['meet_url'] ?? null,
        $status,
        !empty($in['is_featured']) ? 1 : 0,
        $in['sort_order'] ?? 0,
        $in['seo_title'] ?? null,
        $in['seo_description'] ?? null,
    ]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM webinars WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/webinars/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['title','slug','description','speaker_name','speaker_role','speaker_image_url','banner_url','category','starts_at','ends_at','seats_limit','seats_left','registration_enabled','meet_url','status','is_featured','sort_order','seo_title','seo_description'];
    $sets = []; $vals = [];
    $pdo = db_connect();
    if (array_key_exists('status', $in)) {
        try {
            $in['status'] = cms_webinar_storage_status($in['status']);
        } catch (InvalidArgumentException $e) {
            return json_response(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
    if (array_key_exists('slug', $in) && trim((string)$in['slug']) !== '') {
        $in['slug'] = cms_unique_slug($pdo, 'webinars', $in['slug'], $id);
    }
    foreach ($allowed as $f) {
        if (array_key_exists($f, $in)) {
            $sets[] = "$f=?";
            $vals[] = in_array($f, ['registration_enabled','is_featured']) ? (int)(bool)$in[$f] : $in[$f];
        }
    }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $vals[] = $id;
    $pdo->prepare('UPDATE webinars SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM webinars WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/webinars/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM webinars WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

$router->add('PATCH', '/v1/admin/webinars/{id}/publish', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT status FROM webinars WHERE id=?');
    $stmt->execute([$id]);
    $w = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$w) return json_response(['success' => false, 'message' => 'Not found'], 404);
    $newStatus = $w['status'] === 'published' ? 'draft' : 'published';
    $pdo->prepare('UPDATE webinars SET status=? WHERE id=?')->execute([$newStatus, $id]);
    json_response(['success' => true, 'status' => $newStatus]);
});

$router->add('GET', '/v1/admin/webinars/{id}/registrations', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM webinar_registrations WHERE webinar_id=? ORDER BY registered_at DESC');
    $stmt->execute([$id]);
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

// ================================================================
// ADMIN API — TRUSTED PARTNERS
// ================================================================

$router->add('GET', '/v1/admin/trusted-partners', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM trusted_partners ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/trusted-partners', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['name'])) return json_response(['success' => false, 'message' => 'Name required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO trusted_partners (name,logo_url,website_url,sort_order,is_active) VALUES (?,?,?,?,?)');
    $stmt->execute([$in['name'], $in['logo_url'] ?? null, $in['website_url'] ?? null, $in['sort_order'] ?? 0, 1]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM trusted_partners WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/trusted-partners/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['name','logo_url','website_url','sort_order','is_active'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE trusted_partners SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM trusted_partners WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/trusted-partners/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM trusted_partners WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — TESTIMONIALS
// ================================================================

$router->add('GET', '/v1/admin/testimonials', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM testimonials ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/testimonials', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['name']) || empty($in['quote'])) return json_response(['success' => false, 'message' => 'Name and quote required'], 400);
    $pdo = db_connect();
    $rating = max(1, min(5, (int)($in['rating'] ?? 5)));
    $status = strtolower((string)($in['status'] ?? 'active'));
    if (!in_array($status, ['active', 'inactive'], true)) {
        return json_response(['success' => false, 'message' => 'Invalid testimonial status'], 422);
    }
    $stmt = $pdo->prepare('INSERT INTO testimonials (name,role,company_or_course,quote,rating,image_url,is_featured,sort_order,status) VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$in['name'], $in['role'] ?? null, $in['company_or_course'] ?? null, $in['quote'], $rating, $in['image_url'] ?? null, !empty($in['is_featured']) ? 1 : 0, $in['sort_order'] ?? 0, $status]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM testimonials WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/testimonials/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (array_key_exists('rating', $in)) $in['rating'] = max(1, min(5, (int)$in['rating']));
    if (array_key_exists('status', $in)) {
        $in['status'] = strtolower((string)$in['status']);
        if (!in_array($in['status'], ['active', 'inactive'], true)) {
            return json_response(['success' => false, 'message' => 'Invalid testimonial status'], 422);
        }
    }
    $allowed = ['name','role','company_or_course','quote','rating','image_url','is_featured','sort_order','status'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE testimonials SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM testimonials WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/testimonials/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM testimonials WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API - HOME POPUPS
// ================================================================

$router->add('GET', '/v1/admin/home-popups', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM home_popups ORDER BY created_at DESC, id DESC')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/admin/home-popups/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM home_popups WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Popup not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/admin/home-popups', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['title'])) return json_response(['success' => false, 'message' => 'Popup title is required'], 422);
    $status = strtolower(trim((string)($in['status'] ?? 'draft')));
    if (!in_array($status, ['active', 'inactive', 'draft'], true)) {
        return json_response(['success' => false, 'message' => 'Invalid popup status'], 422);
    }
    try {
        $pageKey = cms_popup_page_key($in['page_key'] ?? 'home');
        $position = cms_popup_position($in['position'] ?? 'center');
    } catch (InvalidArgumentException $e) {
        return json_response(['success' => false, 'message' => $e->getMessage()], 422);
    }
    $startDate = !empty($in['start_date']) ? $in['start_date'] : null;
    $endDate = !empty($in['end_date']) ? $in['end_date'] : null;
    if ($startDate && $endDate && strtotime($endDate) < strtotime($startDate)) {
        return json_response(['success' => false, 'message' => 'End date must be after the start date'], 422);
    }
    $pdo = db_connect();
    if ($status === 'active') {
        $stmt = $pdo->prepare("UPDATE home_popups SET status='inactive' WHERE status='active' AND page_key=?");
        $stmt->execute([$pageKey]);
    }
    $stmt = $pdo->prepare('INSERT INTO home_popups (title,message,image_url,button_text,button_link,status,start_date,end_date,popup_type,page_key,position) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        trim((string)$in['title']),
        $in['message'] ?? null,
        $in['image_url'] ?? null,
        $in['button_text'] ?? null,
        $in['button_link'] ?? null,
        $status,
        $startDate,
        $endDate,
        $in['popup_type'] ?? 'announcement',
        $pageKey,
        $position,
    ]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM home_popups WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/home-popups/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $pdo = db_connect();
    $currentStmt = $pdo->prepare('SELECT * FROM home_popups WHERE id=?');
    $currentStmt->execute([$id]);
    $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
    if (!$current) return json_response(['success' => false, 'message' => 'Popup not found'], 404);

    $status = strtolower(trim((string)($in['status'] ?? $current['status'])));
    if (!in_array($status, ['active', 'inactive', 'draft'], true)) {
        return json_response(['success' => false, 'message' => 'Invalid popup status'], 422);
    }
    try {
        $pageKey = cms_popup_page_key($in['page_key'] ?? ($current['page_key'] ?? 'home'));
        $position = cms_popup_position($in['position'] ?? ($current['position'] ?? 'center'));
    } catch (InvalidArgumentException $e) {
        return json_response(['success' => false, 'message' => $e->getMessage()], 422);
    }
    $startDate = array_key_exists('start_date', $in) ? ($in['start_date'] ?: null) : $current['start_date'];
    $endDate = array_key_exists('end_date', $in) ? ($in['end_date'] ?: null) : $current['end_date'];
    if ($startDate && $endDate && strtotime($endDate) < strtotime($startDate)) {
        return json_response(['success' => false, 'message' => 'End date must be after the start date'], 422);
    }
    if (array_key_exists('title', $in) && trim((string)$in['title']) === '') {
        return json_response(['success' => false, 'message' => 'Popup title is required'], 422);
    }

    $allowed = ['title','message','image_url','button_text','button_link','status','start_date','end_date','popup_type','page_key','position'];
    $in['status'] = $status;
    $in['start_date'] = $startDate;
    $in['end_date'] = $endDate;
    $in['page_key'] = $pageKey;
    $in['position'] = $position;
    $sets = [];
    $vals = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field=?";
            $vals[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    if ($status === 'active') {
        $stmt = $pdo->prepare("UPDATE home_popups SET status='inactive' WHERE status='active' AND page_key=? AND id<>?");
        $stmt->execute([$pageKey, $id]);
    }
    $vals[] = $id;
    $pdo->prepare('UPDATE home_popups SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM home_popups WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/home-popups/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM home_popups WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — FAQS
// ================================================================

$router->add('GET', '/v1/admin/faqs', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $page = $_GET['page_key'] ?? null;
    if ($page) {
        $stmt = $pdo->prepare('SELECT * FROM faqs WHERE page_key=? ORDER BY sort_order,id');
        $stmt->execute([$page]);
    } else {
        $stmt = $pdo->query('SELECT * FROM faqs ORDER BY page_key,sort_order,id');
    }
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('POST', '/v1/admin/faqs', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['question']) || empty($in['answer'])) return json_response(['success' => false, 'message' => 'Question and answer required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO faqs (page_key,question,answer,sort_order,is_active) VALUES (?,?,?,?,?)');
    $stmt->execute([$in['page_key'] ?? 'home', $in['question'], $in['answer'], $in['sort_order'] ?? 0, 1]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM faqs WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/faqs/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['page_key','question','answer','sort_order','is_active'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE faqs SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM faqs WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/faqs/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM faqs WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — BLOG / ARTICLE POSTS
// ================================================================

$router->add('GET', '/v1/admin/posts', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $type = $_GET['type'] ?? null;
    if ($type) {
        $stmt = $pdo->prepare('SELECT id,type,title,slug,status,is_featured,published_at,created_at,updated_at FROM posts WHERE type=? ORDER BY created_at DESC');
        $stmt->execute([$type]);
    } else {
        $stmt = $pdo->query('SELECT id,type,title,slug,status,is_featured,published_at,created_at,updated_at FROM posts ORDER BY created_at DESC');
    }
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET', '/v1/admin/posts/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM posts WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    if ($row['tags_json']) $row['tags'] = json_decode($row['tags_json'], true);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('POST', '/v1/admin/posts', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['title'])) return json_response(['success' => false, 'message' => 'Title required'], 400);
    $slug = $in['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $in['title'])) . '-' . time();
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO posts (type,title,slug,excerpt,content,featured_image_url,author_admin_id,category_id,tags_json,reading_time,status,is_featured,published_at,seo_title,seo_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['type'] ?? 'blog', $in['title'], $slug,
        $in['excerpt'] ?? null, $in['content'] ?? null,
        $in['featured_image_url'] ?? null,
        $admin['id'],
        $in['category_id'] ?? null,
        isset($in['tags']) ? json_encode($in['tags']) : null,
        $in['reading_time'] ?? 5,
        $in['status'] ?? 'draft',
        !empty($in['is_featured']) ? 1 : 0,
        ($in['status'] ?? 'draft') === 'published' ? date('Y-m-d H:i:s') : null,
        $in['seo_title'] ?? null,
        $in['seo_description'] ?? null,
    ]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM posts WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/posts/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['type','title','slug','excerpt','content','featured_image_url','category_id','reading_time','status','is_featured','seo_title','seo_description'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (isset($in['tags'])) { $sets[] = 'tags_json=?'; $vals[] = json_encode($in['tags']); }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE posts SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM posts WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/posts/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM posts WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

$router->add('PATCH', '/v1/admin/posts/{id}/publish', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT status FROM posts WHERE id=?');
    $stmt->execute([$id]);
    $p = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$p) return json_response(['success' => false, 'message' => 'Not found'], 404);
    $newStatus = $p['status'] === 'published' ? 'draft' : 'published';
    $pdo->prepare('UPDATE posts SET status=?, published_at=? WHERE id=?')->execute([$newStatus, $newStatus === 'published' ? date('Y-m-d H:i:s') : null, $id]);
    json_response(['success' => true, 'status' => $newStatus]);
});

// ================================================================
// ADMIN API — CONTENT CATEGORIES
// ================================================================

$router->add('GET', '/v1/admin/content-categories', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM content_categories ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/content-categories', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['name'])) return json_response(['success' => false, 'message' => 'Name required'], 400);
    $slug = $in['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $in['name']));
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO content_categories (name,slug,type,sort_order,is_active) VALUES (?,?,?,?,?)');
    $stmt->execute([$in['name'], $slug, $in['type'] ?? 'both', $in['sort_order'] ?? 0, 1]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM content_categories WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/content-categories/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['name','slug','type','sort_order','is_active'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE content_categories SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM content_categories WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/content-categories/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM content_categories WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — COUNTERS / STATS
// ================================================================

$router->add('GET', '/v1/admin/counters', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM counters ORDER BY sort_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/counters', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['label']) || empty($in['value'])) return json_response(['success' => false, 'message' => 'Label and value required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO counters (label,value,suffix,icon,sort_order,is_active) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$in['label'], $in['value'], $in['suffix'] ?? null, $in['icon'] ?? null, $in['sort_order'] ?? 0, 1]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM counters WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/counters/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['label','value','suffix','icon','sort_order','is_active'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE counters SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM counters WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/counters/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM counters WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — CONTACT LEADS
// ================================================================

$router->add('GET', '/v1/admin/contact-leads', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $status = $_GET['status'] ?? null;
    if ($status) {
        $stmt = $pdo->prepare('SELECT * FROM contact_leads WHERE status=? ORDER BY created_at DESC');
        $stmt->execute([$status]);
    } else {
        $stmt = $pdo->query('SELECT * FROM contact_leads ORDER BY created_at DESC');
    }
    json_response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET', '/v1/admin/contact-leads/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM contact_leads WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success' => false, 'message' => 'Not found'], 404);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('PATCH', '/v1/admin/contact-leads/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['status','name','email','phone','subject','message'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE contact_leads SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM contact_leads WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/contact-leads/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM contact_leads WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — CERTIFICATE TEMPLATES
// ================================================================

$router->add('GET', '/v1/admin/certificate-templates', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM certificate_templates ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('POST', '/v1/admin/certificate-templates', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    if (empty($in['name'])) return json_response(['success' => false, 'message' => 'Name required'], 400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO certificate_templates (name,template_image_url,html_template,is_default) VALUES (?,?,?,?)');
    $stmt->execute([$in['name'], $in['template_image_url'] ?? null, $in['html_template'] ?? null, !empty($in['is_default']) ? 1 : 0]);
    $id = $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM certificate_templates WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)], 201);
});

$router->add('PATCH', '/v1/admin/certificate-templates/{id}', function($id) {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['name','template_image_url','html_template','is_default'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $id;
    $pdo->prepare('UPDATE certificate_templates SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
    $row = $pdo->prepare('SELECT * FROM certificate_templates WHERE id=?');
    $row->execute([$id]);
    json_response(['success' => true, 'data' => $row->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE', '/v1/admin/certificate-templates/{id}', function($id) {
    $admin = require_admin();
    $pdo = db_connect();
    $pdo->prepare('DELETE FROM certificate_templates WHERE id=?')->execute([$id]);
    json_response(['success' => true]);
});

// ================================================================
// ADMIN API — ADMIN PROFILE
// ================================================================

$router->add('GET', '/v1/admin/profile', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,name,email,role,created_at FROM admins WHERE id=?');
    $stmt->execute([$admin['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $row]);
});

$router->add('PATCH', '/v1/admin/profile', function() {
    $admin = require_admin();
    $in = request_json() ?? [];
    $allowed = ['name'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) { if (array_key_exists($f, $in)) { $sets[] = "$f=?"; $vals[] = $in[$f]; } }
    if (!$sets) return json_response(['success' => false, 'message' => 'Nothing to update'], 400);
    $pdo = db_connect();
    $vals[] = $admin['id'];
    $pdo->prepare('UPDATE admins SET ' . implode(',', $sets) . ' WHERE id=?')->execute($vals);
    $stmt = $pdo->prepare('SELECT id,name,email,role,created_at FROM admins WHERE id=?');
    $stmt->execute([$admin['id']]);
    json_response(['success' => true, 'data' => $stmt->fetch(PDO::FETCH_ASSOC)]);
});

// ================================================================
// ADMIN API — STUDENTS (extended)
// ================================================================
$router->add('GET', '/v1/admin/students', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT id,name,email,phone,created_at FROM students ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => $rows]);
});

$router->add('GET', '/v1/admin/analytics', function() {
    $admin = require_admin();
    $pdo = db_connect();
    $byCategory = $pdo->query('SELECT category, COUNT(*) as count FROM courses GROUP BY category')->fetchAll(PDO::FETCH_ASSOC);
    $enrollByMonth = $pdo->query("SELECT DATE_FORMAT(enrollment_date,'%Y-%m') as month, COUNT(*) as count FROM enrollments GROUP BY month ORDER BY month DESC LIMIT 12")->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success' => true, 'data' => [
        'courses_by_category' => $byCategory,
        'enrollments_by_month' => $enrollByMonth,
    ]]);
});
