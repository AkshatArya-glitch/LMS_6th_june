<?php

function dashboard_scalar(PDO $pdo, string $sql, array $params = [])
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchColumn();
}

function dashboard_rows(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function dashboard_row(PDO $pdo, string $sql, array $params = []): ?array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function dashboard_time_ago(?string $date): string
{
    if (!$date) {
        return '';
    }
    $timestamp = strtotime($date);
    if (!$timestamp) {
        return '';
    }
    $seconds = max(0, time() - $timestamp);
    if ($seconds < 60) return 'Just now';
    if ($seconds < 3600) return floor($seconds / 60) . ' min ago';
    if ($seconds < 86400) return floor($seconds / 3600) . ' hours ago';
    if ($seconds < 604800) return floor($seconds / 86400) . ' days ago';
    return date('M j, Y', $timestamp);
}

function dashboard_course_style(string $value): array
{
    $value = strtolower($value);
    if (str_contains($value, 'python')) return ['cls' => 'course-python', 'icon' => 'python', 'color' => '#246bfe', 'soft' => '#eaf1ff'];
    if (str_contains($value, 'data') || str_contains($value, 'algorithm')) return ['cls' => 'course-ds', 'icon' => 'ds', 'color' => '#22a85b', 'soft' => '#e9f8ef'];
    if (str_contains($value, 'web') || str_contains($value, 'html')) return ['cls' => 'course-web', 'icon' => 'web', 'color' => '#f97316', 'soft' => '#fff0e5'];
    return ['cls' => 'course-db', 'icon' => 'db', 'color' => '#8b45e7', 'soft' => '#f1e9ff'];
}

function dashboard_profile_image(?string $path): string
{
    if (!$path) {
        return '../assets/dashboard/amit-avatar.jpg';
    }
    if (preg_match('#^(https?:)?//#i', $path)) {
        return $path;
    }
    return '../' . ltrim($path, '/');
}

function dashboard_calendar(?DateTimeImmutable $month = null): array
{
    $month = $month ?: new DateTimeImmutable('first day of this month');
    $first = $month->modify('first day of this month');
    $start = $first->modify('-' . (int) $first->format('w') . ' days');
    $today = (new DateTimeImmutable('today'))->format('Y-m-d');
    $dates = [];

    for ($index = 0; $index < 42; $index++) {
        $date = $start->modify('+' . $index . ' days');
        $classes = [];
        if ($date->format('m') !== $first->format('m')) $classes[] = 'muted';
        if ($date->format('Y-m-d') === $today) $classes[] = 'selected';
        $dates[] = [$date->format('j'), implode(' ', $classes)];
    }

    return [
        'month' => $first->format('F Y'),
        'days' => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        'dates' => $dates,
    ];
}

function dashboard_student_courses(PDO $pdo, int $studentId): array
{
    $rows = dashboard_rows($pdo, "
        SELECT e.id AS enrollment_id, e.course_id, e.payment_status, e.status AS enrollment_status,
               e.progress_percentage, e.enrollment_date,
               c.title, c.category, c.thumbnail_url, c.duration,
               COALESCE(b.batch_name, 'Not assigned') AS batch_name,
               COALESCE(t.full_name, 'To be assigned') AS trainer_name,
               (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count,
               (SELECT COUNT(*) FROM progress p WHERE p.course_id = c.id AND p.student_id = e.student_id AND p.is_completed = 1) AS completed_count
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        LEFT JOIN batches b ON b.id = e.batch_id
        LEFT JOIN trainers t ON t.id = COALESCE(b.trainer_id, c.trainer_id)
        WHERE e.student_id = ?
        ORDER BY e.updated_at DESC, e.id DESC
    ", [$studentId]);

    return array_map(function (array $row) {
        $calculated = (int) $row['lesson_count'] > 0
            ? round(((int) $row['completed_count'] / (int) $row['lesson_count']) * 100)
            : 0;
        $progress = (float) $row['progress_percentage'] > 0 ? (float) $row['progress_percentage'] : $calculated;
        $row['progress'] = max(0, min(100, (int) round($progress)));
        return array_merge($row, dashboard_course_style($row['title'] . ' ' . $row['category']));
    }, $rows);
}

function dashboard_student_deadlines(PDO $pdo, int $studentId): array
{
    $assignments = dashboard_rows($pdo, "
        SELECT a.id, a.title, a.due_date, c.title AS course_title, 'assignment' AS item_type
        FROM assignments a
        JOIN courses c ON c.id = a.course_id
        JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = e.student_id
        WHERE a.status = 'published'
          AND a.due_date IS NOT NULL
          AND a.due_date >= NOW()
          AND s.id IS NULL
          AND (a.batch_id IS NULL OR a.batch_id = e.batch_id)
        ORDER BY a.due_date
        LIMIT 8
    ", [$studentId]);

    $assessments = dashboard_rows($pdo, "
        SELECT a.id, a.title, a.assessment_date AS due_date, c.title AS course_title, 'assessment' AS item_type
        FROM assessments a
        JOIN courses c ON c.id = a.course_id
        JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
        WHERE a.status = 'published'
          AND a.assessment_date IS NOT NULL
          AND a.assessment_date >= NOW()
          AND (a.batch_id IS NULL OR a.batch_id = e.batch_id)
        ORDER BY a.assessment_date
        LIMIT 8
    ", [$studentId]);

    $rows = array_merge($assignments, $assessments);
    usort($rows, fn($a, $b) => strcmp((string) $a['due_date'], (string) $b['due_date']));
    return array_slice($rows, 0, 6);
}

function dashboard_student_activities(PDO $pdo, int $studentId): array
{
    $rows = dashboard_rows($pdo, "
        SELECT a.activity_text, a.activity_type, a.created_at, c.title AS course_title
        FROM activities a
        LEFT JOIN courses c ON c.id = a.course_id
        WHERE a.user_role = 'user' AND a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT 8
    ", [$studentId]);

    if ($rows) {
        return $rows;
    }

    return dashboard_rows($pdo, "
        SELECT CONCAT('Enrolled in ', c.title) AS activity_text, 'enrollment' AS activity_type,
               e.enrollment_date AS created_at, c.title AS course_title
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY e.enrollment_date DESC
        LIMIT 8
    ", [$studentId]);
}

function dashboard_student_announcements(PDO $pdo, int $studentId): array
{
    return dashboard_rows($pdo, "
        SELECT DISTINCT a.id, a.title, a.message, a.created_at
        FROM announcements a
        LEFT JOIN enrollments e ON e.student_id = ?
        WHERE a.target_role IN ('all','user') AND a.status = 'published'
          AND (a.published_at IS NULL OR a.published_at <= NOW())
          AND (
              (COALESCE(a.target_type, 'all') IN ('all','user') AND a.created_by_role = 'admin')
              OR (a.target_type = 'course' AND a.course_id IS NOT NULL AND e.course_id = a.course_id)
              OR (a.target_type = 'batch' AND a.batch_id IS NOT NULL AND e.batch_id = a.batch_id)
          )
        ORDER BY COALESCE(a.published_at, a.created_at) DESC
        LIMIT 6
    ", [$studentId]);
}

function dashboard_student_data(PDO $pdo, int $studentId): array
{
    $student = dashboard_row($pdo, "
        SELECT id, name, email, username, phone, profile_image, course_interest, status
        FROM students WHERE id = ?
    ", [$studentId]);

    if (!$student) {
        throw new RuntimeException('Student account not found.');
    }

    $courses = dashboard_student_courses($pdo, $studentId);
    $deadlines = dashboard_student_deadlines($pdo, $studentId);
    $activities = dashboard_student_activities($pdo, $studentId);
    $announcements = dashboard_student_announcements($pdo, $studentId);
    $firstName = preg_split('/\s+/', trim($student['name']))[0] ?: 'Student';

    $pendingAssignments = (int) dashboard_scalar($pdo, "
        SELECT COUNT(DISTINCT a.id)
        FROM assignments a
        JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = e.student_id
        WHERE a.status = 'published' AND s.id IS NULL
          AND (a.batch_id IS NULL OR a.batch_id = e.batch_id)
    ", [$studentId]);
    $upcomingAssessments = (int) dashboard_scalar($pdo, "
        SELECT COUNT(DISTINCT a.id)
        FROM assessments a
        JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
        WHERE a.status = 'published' AND a.assessment_date >= NOW()
          AND (a.batch_id IS NULL OR a.batch_id = e.batch_id)
    ", [$studentId]);
    $certificateCount = (int) dashboard_scalar($pdo, "SELECT COUNT(*) FROM certificates WHERE student_id = ? AND status = 'active'", [$studentId]);
    $seconds = (int) dashboard_scalar($pdo, "SELECT COALESCE(SUM(time_spent), 0) FROM progress WHERE student_id = ?", [$studentId]);
    $hours = floor($seconds / 3600);
    $minutes = floor(($seconds % 3600) / 60);
    $learningTime = $hours . 'h ' . $minutes . 'm';
    $messageCount = (int) dashboard_scalar($pdo, "SELECT COUNT(*) FROM messages WHERE recipient_role = 'user' AND recipient_id = ? AND is_read = 0", [$studentId]);
    $notificationCount = (int) dashboard_scalar($pdo, "SELECT COUNT(*) FROM notifications WHERE recipient_role = 'user' AND recipient_id = ? AND is_read = 0", [$studentId]);

    $courseCards = array_map(function (array $course) {
        return [
            'id' => (int) $course['course_id'],
            'cls' => $course['cls'],
            'icon' => $course['icon'],
            'name' => $course['title'],
            'batch' => $course['batch_name'],
            'progress' => $course['progress'],
            'status' => $course['progress'] >= 100 ? 'Completed' : ucfirst($course['enrollment_status']),
        ];
    }, array_slice($courses, 0, 5));

    $deadlineCards = array_map(function (array $item) {
        $timestamp = strtotime($item['due_date']);
        $isToday = date('Y-m-d', $timestamp) === date('Y-m-d');
        return [
            'icon' => $item['item_type'] === 'assessment' ? 'clipboard' : 'assignments',
            'color' => $item['item_type'] === 'assessment' ? '#8b45e7' : '#f03768',
            'soft' => $item['item_type'] === 'assessment' ? '#f2eaff' : '#ffe9f0',
            'title' => $item['title'],
            'course' => $item['course_title'],
            'time' => ($isToday ? 'Today' : date('M j, Y', $timestamp)) . '<br>' . date('g:i A', $timestamp),
        ];
    }, $deadlines);

    $activityCards = array_map(function (array $item) {
        $type = $item['activity_type'] ?? 'general';
        $styles = [
            'submission' => ['upload', '#1ca45d', '#e8f8ef'],
            'quiz' => ['help', '#8b45e7', '#f2eaff'],
            'live_class' => ['video', '#246bfe', '#eaf1ff'],
            'download' => ['download', '#d89213', '#fff4db'],
            'enrollment' => ['courses', '#246bfe', '#eaf1ff'],
        ];
        [$icon, $color, $soft] = $styles[$type] ?? ['clock', '#246bfe', '#eaf1ff'];
        return [
            'icon' => $icon,
            'color' => $color,
            'soft' => $soft,
            'title' => $item['activity_text'],
            'course' => $item['course_title'] ?: 'Student account',
            'time' => dashboard_time_ago($item['created_at']),
        ];
    }, array_slice($activities, 0, 5));

    $batchCards = array_map(function (array $course) {
        return [
            'cls' => $course['cls'],
            'icon' => $course['icon'],
            'code' => $course['batch_name'],
            'course' => $course['title'],
            'instructor' => $course['trainer_name'],
            'color' => $course['color'],
            'soft' => $course['soft'],
        ];
    }, array_values(array_filter(array_slice($courses, 0, 5), fn($course) => $course['batch_name'] !== 'Not assigned')));

    $announcementCards = array_map(fn($item) => [
        'icon' => 'bell',
        'color' => '#22a85b',
        'soft' => '#e9f8ef',
        'title' => $item['title'],
        'text' => $item['message'],
        'time' => dashboard_time_ago($item['created_at']),
    ], $announcements);

    $continue = $courses[0] ?? null;
    $nextLesson = null;
    if ($continue) {
        $nextLesson = dashboard_scalar($pdo, "
            SELECT l.title
            FROM lessons l
            WHERE l.course_id = ?
              AND NOT EXISTS (
                SELECT 1 FROM progress p
                WHERE p.lesson_id = l.id AND p.student_id = ? AND p.is_completed = 1
              )
            ORDER BY l.lesson_order, l.id
            LIMIT 1
        ", [$continue['course_id'], $studentId]);
    }

    return [
        'student' => [
            'firstName' => $firstName,
            'fullName' => $student['name'],
            'role' => 'Student',
            'avatar' => dashboard_profile_image($student['profile_image']),
            'welcomeSubtitle' => 'Keep learning and grow your skills',
            'notifications' => (string) $notificationCount,
            'messages' => (string) $messageCount,
        ],
        'stats' => [
            ['icon' => 'book', 'title' => 'Enrolled Courses', 'value' => (string) count($courses), 'status' => 'Active', 'trend' => 'Your current enrollments', 'color' => '#246bfe', 'soft' => '#eaf1ff'],
            ['icon' => 'assignments', 'title' => 'Assignments', 'value' => (string) $pendingAssignments, 'status' => 'Pending', 'trend' => 'Awaiting submission', 'color' => '#22a85b', 'soft' => '#e9f8ef'],
            ['icon' => 'clipboard', 'title' => 'Assessments', 'value' => (string) $upcomingAssessments, 'status' => 'Upcoming', 'trend' => 'Scheduled assessments', 'color' => '#8b45e7', 'soft' => '#f1e9ff'],
            ['icon' => 'trophy', 'title' => 'Certificates', 'value' => (string) $certificateCount, 'status' => 'Earned', 'trend' => 'Active certificates', 'color' => '#d89316', 'soft' => '#fff5de'],
            ['icon' => 'clock', 'title' => 'Learning Hours', 'value' => $learningTime, 'status' => '', 'trend' => 'Tracked lesson time', 'color' => '#f25196', 'soft' => '#ffe9f2'],
        ],
        'courses' => $courseCards,
        'deadlines' => $deadlineCards,
        'activities' => $activityCards,
        'batches' => $batchCards,
        'announcements' => $announcementCards,
        'quickLinks' => [
            ['icon' => 'book', 'label' => 'Browse Courses', 'color' => '#246bfe', 'soft' => '#eaf1ff', 'href' => '../courses.html'],
            ['icon' => 'video', 'label' => 'Join Live Class', 'color' => '#246bfe', 'soft' => '#eaf1ff', 'view' => 'Live Classes'],
            ['icon' => 'download', 'label' => 'Download App', 'color' => '#22a85b', 'soft' => '#e9f8ef', 'view' => 'Download App'],
            ['icon' => 'help', 'label' => 'Help Center', 'color' => '#246bfe', 'soft' => '#eaf1ff', 'view' => 'Help Center'],
        ],
        'calendar' => dashboard_calendar(),
        'continueLearning' => $continue ? [
            'courseId' => (int) $continue['course_id'],
            'cls' => $continue['cls'],
            'icon' => $continue['icon'],
            'title' => $continue['title'],
            'progress' => $continue['progress'],
            'progressLabel' => $continue['progress'] . '% Completed',
            'lessonLabel' => 'Next Lesson',
            'nextLesson' => $nextLesson ?: 'No pending lesson',
            'buttonText' => 'Continue Learning',
        ] : null,
    ];
}

function dashboard_detail_stat(string $icon, string $title, $value, string $status, string $trend, string $color = '#246bfe', string $soft = '#eaf1ff'): array
{
    return compact('icon', 'title', 'value', 'status', 'trend', 'color', 'soft');
}

function dashboard_detail_item(string $icon, string $title, string $meta, string $note, string $status, string $color = '#246bfe', string $soft = '#eaf1ff', ?int $progress = null): array
{
    $item = compact('icon', 'title', 'meta', 'note', 'status', 'color', 'soft');
    if ($progress !== null) $item['progress'] = $progress;
    return $item;
}

function dashboard_student_view(PDO $pdo, int $studentId, string $view): array
{
    $courses = dashboard_student_courses($pdo, $studentId);
    $title = $view;
    $subtitle = 'Your authenticated LMS information.';
    $stats = [];
    $sectionTitle = $view;
    $items = [];
    $type = 'list';

    switch ($view) {
        case 'My Courses':
            $subtitle = 'Only courses enrolled by your student account are shown here.';
            $stats[] = dashboard_detail_stat('book', 'Active Courses', count($courses), 'Enrolled', 'Database-backed enrollments');
            foreach ($courses as $course) {
                $items[] = array_merge(
                    dashboard_detail_item($course['icon'], $course['title'], 'Batch: ' . $course['batch_name'], 'Trainer: ' . $course['trainer_name'], $course['progress'] . '%', $course['color'], $course['soft'], $course['progress']),
                    ['cls' => $course['cls'], 'action' => 'Course ' . $course['course_id']]
                );
            }
            break;

        case 'My Enrollments':
            $subtitle = 'Enrollment, payment, and completion status for your account.';
            foreach ($courses as $course) {
                $items[] = dashboard_detail_item('enrollments', $course['title'], 'Enrolled ' . date('M j, Y', strtotime($course['enrollment_date'])), 'Payment: ' . ucfirst($course['payment_status']), ucfirst($course['enrollment_status']), $course['color'], $course['soft'], $course['progress']);
            }
            $stats[] = dashboard_detail_stat('enrollments', 'Total Enrollments', count($courses), 'Records', 'Linked to your student ID');
            break;

        case 'My Batches':
            $subtitle = 'Batches assigned through your course enrollments.';
            foreach ($courses as $course) {
                if ($course['batch_name'] === 'Not assigned') continue;
                $items[] = dashboard_detail_item('batches', $course['batch_name'], $course['title'], 'Trainer: ' . $course['trainer_name'], ucfirst($course['enrollment_status']), $course['color'], $course['soft']);
            }
            $stats[] = dashboard_detail_stat('batches', 'Assigned Batches', count($items), 'Active', 'Linked through enrollments');
            break;

        case 'Assignments':
            $rows = dashboard_rows($pdo, "
                SELECT a.title, a.description, a.due_date, a.max_marks, c.title AS course_title,
                       COALESCE(s.status, 'pending') AS submission_status, s.marks
                FROM assignments a
                JOIN courses c ON c.id = a.course_id
                JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
                LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = e.student_id
                WHERE a.status <> 'draft' AND (a.batch_id IS NULL OR a.batch_id = e.batch_id)
                ORDER BY a.due_date IS NULL, a.due_date
            ", [$studentId]);
            foreach ($rows as $row) {
                $due = $row['due_date'] ? 'Due ' . date('M j, Y g:i A', strtotime($row['due_date'])) : 'No due date';
                $note = $row['submission_status'] === 'graded' ? 'Marks: ' . ($row['marks'] ?? 'Not set') . '/' . $row['max_marks'] : $due;
                $items[] = dashboard_detail_item('assignments', $row['title'], $row['course_title'], $note, ucfirst($row['submission_status']), '#f03768', '#ffe9f0');
            }
            $stats[] = dashboard_detail_stat('assignments', 'Assignments', count($rows), 'Total', 'Across enrolled courses', '#f03768', '#ffe9f0');
            break;

        case 'Assessments':
            $rows = dashboard_rows($pdo, "
                SELECT a.title, a.assessment_date, a.max_marks, c.title AS course_title,
                       COALESCE(r.status, 'pending') AS result_status, r.percentage
                FROM assessments a
                JOIN courses c ON c.id = a.course_id
                JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
                LEFT JOIN assessment_results r ON r.assessment_id = a.id AND r.student_id = e.student_id
                WHERE a.status <> 'draft' AND (a.batch_id IS NULL OR a.batch_id = e.batch_id)
                ORDER BY a.assessment_date IS NULL, a.assessment_date
            ", [$studentId]);
            foreach ($rows as $row) {
                $note = $row['percentage'] !== null ? 'Score: ' . $row['percentage'] . '%' : ($row['assessment_date'] ? date('M j, Y g:i A', strtotime($row['assessment_date'])) : 'Date not scheduled');
                $items[] = dashboard_detail_item('clipboard', $row['title'], $row['course_title'], $note, ucfirst($row['result_status']), '#8b45e7', '#f1e9ff');
            }
            $stats[] = dashboard_detail_stat('clipboard', 'Assessments', count($rows), 'Available', 'Assigned to enrolled courses', '#8b45e7', '#f1e9ff');
            break;

        case 'Certificates':
            $rows = dashboard_rows($pdo, "
                SELECT c.certificate_number, c.issued_date, c.status, c.verification_url, c.certificate_file,
                       co.title AS course_title
                FROM certificates c
                JOIN courses co ON co.id = c.course_id
                WHERE c.student_id = ?
                ORDER BY c.issued_date DESC
            ", [$studentId]);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('trophy', $row['course_title'], 'Certificate ' . $row['certificate_number'], 'Issued ' . date('M j, Y', strtotime($row['issued_date'])), ucfirst($row['status']), '#d89316', '#fff5de');
            }
            $stats[] = dashboard_detail_stat('trophy', 'Earned Certificates', count($rows), 'Verified', 'Issued to your account', '#d89316', '#fff5de');
            break;

        case 'Study Materials':
            $rows = dashboard_rows($pdo, "
                SELECT sm.title, sm.description, sm.material_type, sm.file_url, sm.created_at, c.title AS course_title
                FROM study_materials sm
                JOIN courses c ON c.id = sm.course_id
                JOIN enrollments e ON e.course_id = sm.course_id AND e.student_id = ?
                WHERE sm.status = 'published' AND (sm.batch_id IS NULL OR sm.batch_id = e.batch_id)
                ORDER BY sm.created_at DESC
            ", [$studentId]);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('materials', $row['title'], $row['course_title'], ucfirst($row['material_type']) . ' | ' . dashboard_time_ago($row['created_at']), $row['file_url'] ? 'Open' : 'Available', '#246bfe', '#eaf1ff');
            }
            $stats[] = dashboard_detail_stat('materials', 'Materials', count($rows), 'Available', 'For your enrolled courses');
            break;

        case 'Attendance':
            $rows = dashboard_rows($pdo, "
                SELECT a.attendance_date, a.status, a.notes, c.title AS course_title, b.batch_name
                FROM attendance a
                JOIN courses c ON c.id = a.course_id
                LEFT JOIN batches b ON b.id = a.batch_id
                WHERE a.student_id = ?
                ORDER BY a.attendance_date DESC
            ", [$studentId]);
            $present = count(array_filter($rows, fn($row) => in_array($row['status'], ['present', 'late'], true)));
            $rate = count($rows) ? round(($present / count($rows)) * 100) : 0;
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('attendance', $row['course_title'], $row['batch_name'] ?: 'No batch', date('M j, Y', strtotime($row['attendance_date'])), ucfirst($row['status']), '#22a85b', '#e9f8ef');
            }
            $stats[] = dashboard_detail_stat('attendance', 'Attendance Rate', $rate . '%', 'Recorded', count($rows) . ' class records', '#22a85b', '#e9f8ef');
            break;

        case 'Live Classes':
            $rows = dashboard_rows($pdo, "
                SELECT lc.title, lc.starts_at, lc.ends_at, lc.meeting_url, lc.status, c.title AS course_title, b.batch_name
                FROM live_classes lc
                JOIN courses c ON c.id = lc.course_id
                JOIN enrollments e ON e.course_id = lc.course_id AND e.student_id = ?
                LEFT JOIN batches b ON b.id = lc.batch_id
                WHERE lc.status <> 'cancelled' AND (lc.batch_id IS NULL OR lc.batch_id = e.batch_id)
                ORDER BY lc.starts_at DESC
            ", [$studentId]);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('video', $row['title'], $row['course_title'], date('M j, Y g:i A', strtotime($row['starts_at'])), ucfirst($row['status']), '#246bfe', '#eaf1ff');
            }
            $stats[] = dashboard_detail_stat('video', 'Live Classes', count($rows), 'Scheduled', 'For your enrolled courses');
            break;

        case 'Messages':
            $rows = dashboard_rows($pdo, "
                SELECT sender_role, sender_id, subject, message, is_read, created_at
                FROM messages
                WHERE recipient_role = 'user' AND recipient_id = ?
                ORDER BY a.created_at DESC
            ", [$studentId]);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('messages', $row['subject'] ?: 'Message from ' . ucfirst($row['sender_role']), ucfirst($row['sender_role']), $row['message'], $row['is_read'] ? 'Read' : 'New', '#246bfe', '#eaf1ff');
            }
            $stats[] = dashboard_detail_stat('messages', 'Messages', count($rows), 'Inbox', 'Private messages for your account');
            break;

        case 'Payment History':
            $rows = dashboard_rows($pdo, "
                SELECT p.amount, p.payment_method, p.transaction_id, p.status, p.paid_at, p.created_at, c.title AS course_title
                FROM payments p
                LEFT JOIN enrollments e ON e.id = p.enrollment_id
                LEFT JOIN courses c ON c.id = e.course_id
                WHERE p.student_id = ?
                ORDER BY p.created_at DESC
            ", [$studentId]);
            $paid = array_sum(array_map(fn($row) => $row['status'] === 'paid' ? (float) $row['amount'] : 0, $rows));
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('payments', $row['course_title'] ?: 'LMS Payment', $row['transaction_id'] ?: 'No transaction ID', 'INR ' . number_format((float) $row['amount'], 2) . ' | ' . ($row['payment_method'] ?: 'Method not recorded'), ucfirst($row['status']), '#22a85b', '#e9f8ef');
            }
            $stats[] = dashboard_detail_stat('payments', 'Total Paid', 'INR ' . number_format($paid, 2), 'Payments', count($rows) . ' records', '#22a85b', '#e9f8ef');
            break;

        case 'Wishlist':
            $rows = dashboard_rows($pdo, "
                SELECT c.id, c.title, c.category, c.price, w.created_at
                FROM wishlist w JOIN courses c ON c.id = w.course_id
                WHERE w.student_id = ? ORDER BY w.created_at DESC
            ", [$studentId]);
            foreach ($rows as $row) {
                $style = dashboard_course_style($row['title'] . ' ' . $row['category']);
                $items[] = array_merge(dashboard_detail_item('wishlist', $row['title'], $row['category'], 'INR ' . number_format((float) $row['price'], 2), 'Saved', $style['color'], $style['soft']), ['action' => 'Course ' . $row['id']]);
            }
            $stats[] = dashboard_detail_stat('wishlist', 'Saved Courses', count($rows), 'Wishlist', 'Courses you saved');
            break;

        case 'Notifications':
            $rows = dashboard_rows($pdo, "SELECT title, message, is_read, created_at FROM notifications WHERE recipient_role = 'user' AND recipient_id = ? ORDER BY created_at DESC", [$studentId]);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('bell', $row['title'], dashboard_time_ago($row['created_at']), $row['message'] ?: '', $row['is_read'] ? 'Read' : 'New', '#f03768', '#ffe9f0');
            }
            $stats[] = dashboard_detail_stat('bell', 'Notifications', count($rows), 'Updates', 'Account notifications', '#f03768', '#ffe9f0');
            break;

        case 'Announcements':
            $rows = dashboard_student_announcements($pdo, $studentId);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('bell', $row['title'], dashboard_time_ago($row['created_at']), $row['message'], 'Published', '#22a85b', '#e9f8ef');
            }
            $stats[] = dashboard_detail_stat('bell', 'Announcements', count($rows), 'Published', 'For students and everyone', '#22a85b', '#e9f8ef');
            break;

        case 'Recent Activities':
            $rows = dashboard_student_activities($pdo, $studentId);
            foreach ($rows as $row) {
                $items[] = dashboard_detail_item('clock', $row['activity_text'], $row['course_title'] ?: 'Student account', dashboard_time_ago($row['created_at']), ucfirst($row['activity_type']), '#246bfe', '#eaf1ff');
            }
            $stats[] = dashboard_detail_stat('clock', 'Recent Activities', count($rows), 'Timeline', 'Your latest LMS actions');
            break;

        case 'Profile Settings':
            $profile = dashboard_row($pdo, "SELECT name, email, username, phone, profile_image, course_interest, bio FROM students WHERE id = ?", [$studentId]);
            return [
                'title' => 'Profile Settings',
                'subtitle' => 'Update your personal details, profile image, or password.',
                'type' => 'profile',
                'profile' => $profile,
                'stats' => [],
                'sections' => [],
            ];

        case 'Download App':
            $subtitle = 'The mobile application download will be published here when available.';
            $items[] = dashboard_detail_item('download', 'EEPL Learning App', 'Android and iOS', 'Download links are not published yet.', 'Coming Soon', '#22a85b', '#e9f8ef');
            break;

        case 'Help Center':
            $subtitle = 'Use the support channels below when you need assistance.';
            $items[] = dashboard_detail_item('help', 'Contact Support', 'Support team', 'Open the website contact page to submit your question.', 'Available', '#246bfe', '#eaf1ff');
            break;

        case 'Refer & Earn':
            $subtitle = 'Referral tracking can be connected to a rewards provider later.';
            $items[] = dashboard_detail_item('trophy', 'Referral Program', 'Invite friends to EEPL', 'Referral rewards are currently being configured.', 'Coming Soon', '#d89316', '#fff5de');
            break;

        case 'Course Player':
            $active = $courses[0] ?? null;
            if ($active) {
                $lessons = dashboard_rows($pdo, "SELECT title, video_duration, lesson_order FROM lessons WHERE course_id = ? ORDER BY lesson_order, id", [$active['course_id']]);
                foreach ($lessons as $lesson) {
                    $items[] = dashboard_detail_item('video', $lesson['title'], $active['title'], ($lesson['video_duration'] ?: 0) . ' minutes', 'Lesson', $active['color'], $active['soft']);
                }
                $title = $active['title'];
                $subtitle = 'Continue your most recently updated enrolled course.';
            }
            break;

        default:
            $subtitle = 'This section is ready for LMS data.';
            $items[] = dashboard_detail_item('book', $view, 'Student portal', 'No records are available yet.', 'Empty');
    }

    return [
        'title' => $title,
        'subtitle' => $subtitle,
        'type' => $type,
        'stats' => $stats,
        'sections' => [
            ['title' => $sectionTitle, 'items' => $items],
        ],
    ];
}

function dashboard_trainer_data(PDO $pdo, int $trainerId): array
{
    $trainer = dashboard_row($pdo, "SELECT id, full_name, email, profile_image, specialization FROM trainers WHERE id = ?", [$trainerId]);
    if (!$trainer) throw new RuntimeException('Trainer account not found.');

    $courses = dashboard_rows($pdo, "
        SELECT c.id, c.title, c.category, c.status,
               COUNT(DISTINCT e.student_id) AS student_count,
               COUNT(DISTINCT b.id) AS batch_count
        FROM courses c
        LEFT JOIN batches b ON b.course_id = c.id AND b.trainer_id = ?
        LEFT JOIN enrollments e ON e.course_id = c.id AND (e.batch_id = b.id OR (e.batch_id IS NULL AND c.trainer_id = ?))
        WHERE c.trainer_id = ? OR b.trainer_id = ?
        GROUP BY c.id
        ORDER BY c.updated_at DESC
    ", [$trainerId, $trainerId, $trainerId, $trainerId]);

    $batches = dashboard_rows($pdo, "
        SELECT b.id, b.batch_name, b.schedule_text, b.start_date, b.end_date, b.status,
               c.title AS course_title, COUNT(DISTINCT e.student_id) AS student_count
        FROM batches b
        JOIN courses c ON c.id = b.course_id
        LEFT JOIN enrollments e ON e.batch_id = b.id
        WHERE b.trainer_id = ?
        GROUP BY b.id
        ORDER BY b.start_date IS NULL, b.start_date DESC
    ", [$trainerId]);
    $studentCount = (int) dashboard_scalar($pdo, "
        SELECT COUNT(DISTINCT e.student_id)
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        LEFT JOIN batches b ON b.id = e.batch_id
        WHERE c.trainer_id = ? OR b.trainer_id = ?
    ", [$trainerId, $trainerId]);
    $pendingReviews = (int) dashboard_scalar($pdo, "
        SELECT COUNT(*)
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE a.trainer_id = ? AND s.status IN ('submitted','late')
    ", [$trainerId]);
    $liveCount = (int) dashboard_scalar($pdo, "SELECT COUNT(*) FROM live_classes WHERE trainer_id = ? AND status = 'scheduled' AND starts_at >= NOW()", [$trainerId]);
    $messageCount = (int) dashboard_scalar($pdo, "SELECT COUNT(*) FROM messages WHERE recipient_role = 'trainer' AND recipient_id = ? AND is_read = 0", [$trainerId]);

    $schedule = dashboard_rows($pdo, "
        SELECT lc.title, lc.starts_at, lc.status, c.title AS course_title, b.batch_name
        FROM live_classes lc
        JOIN courses c ON c.id = lc.course_id
        LEFT JOIN batches b ON b.id = lc.batch_id
        WHERE lc.trainer_id = ? AND lc.starts_at >= NOW() AND lc.status IN ('scheduled','live')
        ORDER BY lc.starts_at LIMIT 6
    ", [$trainerId]);
    $submissions = dashboard_rows($pdo, "
        SELECT s.id, s.status, s.submitted_at, st.name AS student_name, a.title AS assignment_title, c.title AS course_title
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        JOIN students st ON st.id = s.student_id
        JOIN courses c ON c.id = a.course_id
        WHERE a.trainer_id = ?
        ORDER BY s.submitted_at DESC LIMIT 6
    ", [$trainerId]);
    $announcements = dashboard_rows($pdo, "
        SELECT a.title, a.message, a.created_at
        FROM announcements a
        WHERE a.target_role IN ('all','trainer') AND a.status = 'published'
          AND (
              COALESCE(a.target_type, 'all') IN ('all','trainer')
              OR (a.target_type = 'course' AND (
                  EXISTS (SELECT 1 FROM courses c WHERE c.id = a.course_id AND c.trainer_id = ?)
                  OR EXISTS (SELECT 1 FROM batches b WHERE b.course_id = a.course_id AND b.trainer_id = ?)
              ))
              OR (a.target_type = 'batch' AND EXISTS (SELECT 1 FROM batches b WHERE b.id = a.batch_id AND b.trainer_id = ?))
          )
        ORDER BY a.created_at DESC LIMIT 5
    ", [$trainerId, $trainerId, $trainerId]);

    return [
        'profile' => [
            'fullName' => $trainer['full_name'],
            'firstName' => preg_split('/\s+/', trim($trainer['full_name']))[0] ?: 'Trainer',
            'email' => $trainer['email'],
            'role' => 'Trainer',
            'specialization' => $trainer['specialization'] ?: 'Trainer',
            'avatar' => dashboard_profile_image($trainer['profile_image']),
            'messages' => $messageCount,
        ],
        'stats' => [
            ['label' => 'Assigned Courses', 'value' => count($courses), 'note' => 'Linked to your trainer ID', 'icon' => 'courses'],
            ['label' => 'Assigned Batches', 'value' => count($batches), 'note' => 'Current batch records', 'icon' => 'batches'],
            ['label' => 'Total Students', 'value' => $studentCount, 'note' => 'Across your courses', 'icon' => 'students'],
            ['label' => 'Pending Reviews', 'value' => $pendingReviews, 'note' => 'Submissions awaiting grading', 'icon' => 'assignments'],
            ['label' => 'Upcoming Classes', 'value' => $liveCount, 'note' => 'Scheduled live classes', 'icon' => 'live'],
        ],
        'courses' => $courses,
        'batches' => $batches,
        'schedule' => $schedule,
        'submissions' => $submissions,
        'announcements' => $announcements,
    ];
}

function dashboard_trainer_view(PDO $pdo, int $trainerId, string $view): array
{
    $title = $view;
    $subtitle = 'Records linked to your trainer account.';
    $columns = [];
    $rows = [];

    switch ($view) {
        case 'My Courses':
            $columns = ['Course', 'Category', 'Students', 'Batches', 'Status'];
            $rows = dashboard_rows($pdo, "
                SELECT c.title AS Course, c.category AS Category,
                       COUNT(DISTINCT e.student_id) AS Students,
                       COUNT(DISTINCT b.id) AS Batches, c.status AS Status
                FROM courses c
                LEFT JOIN batches b ON b.course_id = c.id AND b.trainer_id = ?
                LEFT JOIN enrollments e ON e.course_id = c.id AND (e.batch_id = b.id OR e.batch_id IS NULL)
                WHERE c.trainer_id = ? OR b.trainer_id = ?
                GROUP BY c.id ORDER BY c.title
            ", [$trainerId, $trainerId, $trainerId]);
            break;
        case 'My Batches':
            $columns = ['Batch', 'Course', 'Schedule', 'Students', 'Student Names', 'Status'];
            $rows = dashboard_rows($pdo, "
                SELECT b.batch_name AS Batch, c.title AS Course, COALESCE(b.schedule_text, 'Not scheduled') AS Schedule,
                       COUNT(DISTINCT e.student_id) AS Students,
                       COALESCE(GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', '),'No students assigned') AS `Student Names`,
                       b.status AS Status
                FROM batches b JOIN courses c ON c.id=b.course_id
                LEFT JOIN enrollments e ON e.batch_id=b.id
                LEFT JOIN students s ON s.id=e.student_id
                WHERE b.trainer_id=? GROUP BY b.id ORDER BY b.batch_name
            ", [$trainerId]);
            break;
        case 'Students':
            $columns = ['Student', 'Email', 'Course', 'Batch', 'Progress'];
            $rows = dashboard_rows($pdo, "
                SELECT s.name AS Student, s.email AS Email, c.title AS Course,
                       COALESCE(b.batch_name, 'Not assigned') AS Batch,
                       CONCAT(ROUND(e.progress_percentage), '%') AS Progress
                FROM enrollments e
                JOIN students s ON s.id=e.student_id
                JOIN courses c ON c.id=e.course_id
                LEFT JOIN batches b ON b.id=e.batch_id
                WHERE c.trainer_id=? OR b.trainer_id=?
                ORDER BY s.name
            ", [$trainerId, $trainerId]);
            break;
        case 'Assignments':
            $courses = dashboard_rows($pdo, "
                SELECT DISTINCT c.id, c.title
                FROM courses c
                LEFT JOIN batches b ON b.course_id=c.id
                WHERE c.trainer_id=? OR b.trainer_id=?
                ORDER BY c.title
            ", [$trainerId, $trainerId]);
            $batches = dashboard_rows($pdo, "
                SELECT id, batch_name, course_id FROM batches WHERE trainer_id=? ORDER BY batch_name
            ", [$trainerId]);
            $rows = dashboard_rows($pdo, "
                SELECT a.id, a.title, a.description, a.course_id, a.batch_id, a.due_date, a.status,
                       c.title AS course_title, COALESCE(b.batch_name,'All batches') AS batch_name,
                       COUNT(s.id) AS submissions,
                       SUM(CASE WHEN s.status IN ('submitted','late') THEN 1 ELSE 0 END) AS pending
                FROM assignments a
                LEFT JOIN courses c ON c.id=a.course_id
                LEFT JOIN batches b ON b.id=a.batch_id
                LEFT JOIN assignment_submissions s ON s.assignment_id=a.id
                WHERE a.trainer_id=? GROUP BY a.id ORDER BY a.due_date IS NULL,a.due_date DESC
            ", [$trainerId]);
            return [
                'title' => $title,
                'subtitle' => 'Create assignments for your assigned courses and batches.',
                'type' => 'trainer_assignments',
                'rows' => $rows,
                'options' => ['courses' => $courses, 'batches' => $batches],
            ];
        case 'Assessments':
            $columns = ['Assessment', 'Course', 'Date', 'Results', 'Status'];
            $rows = dashboard_rows($pdo, "
                SELECT a.title AS Assessment, c.title AS Course,
                       COALESCE(DATE_FORMAT(a.assessment_date,'%d %b %Y %h:%i %p'),'Not scheduled') AS Date,
                       COUNT(r.id) AS Results, a.status AS Status
                FROM assessments a JOIN courses c ON c.id=a.course_id
                LEFT JOIN assessment_results r ON r.assessment_id=a.id
                WHERE a.trainer_id=? GROUP BY a.id ORDER BY a.assessment_date
            ", [$trainerId]);
            break;
        case 'Study Materials':
            $columns = ['Material', 'Course', 'Type', 'Created', 'Status'];
            $rows = dashboard_rows($pdo, "
                SELECT sm.title AS Material, c.title AS Course, sm.material_type AS Type,
                       DATE_FORMAT(sm.created_at,'%d %b %Y') AS Created, sm.status AS Status
                FROM study_materials sm JOIN courses c ON c.id=sm.course_id
                WHERE sm.trainer_id=? ORDER BY sm.created_at DESC
            ", [$trainerId]);
            break;
        case 'Live Classes':
            $columns = ['Class', 'Course', 'Batch', 'Starts', 'Status'];
            $rows = dashboard_rows($pdo, "
                SELECT lc.title AS Class, c.title AS Course, COALESCE(b.batch_name,'All batches') AS Batch,
                       DATE_FORMAT(lc.starts_at,'%d %b %Y %h:%i %p') AS Starts, lc.status AS Status
                FROM live_classes lc JOIN courses c ON c.id=lc.course_id
                LEFT JOIN batches b ON b.id=lc.batch_id
                WHERE lc.trainer_id=? ORDER BY lc.starts_at DESC
            ", [$trainerId]);
            break;
        case 'Attendance':
            $columns = ['Student', 'Course', 'Date', 'Status', 'Notes'];
            $rows = dashboard_rows($pdo, "
                SELECT s.name AS Student, c.title AS Course, DATE_FORMAT(a.attendance_date,'%d %b %Y') AS Date,
                       a.status AS Status, COALESCE(a.notes,'') AS Notes
                FROM attendance a JOIN students s ON s.id=a.student_id JOIN courses c ON c.id=a.course_id
                WHERE a.trainer_id=? ORDER BY a.attendance_date DESC
            ", [$trainerId]);
            break;
        case 'Messages':
            $columns = ['From', 'Subject', 'Message', 'Received', 'Status'];
            $rows = dashboard_rows($pdo, "
                SELECT CONCAT(UPPER(LEFT(sender_role,1)),SUBSTRING(sender_role,2)) AS `From`,
                       COALESCE(subject,'No subject') AS Subject, message AS Message,
                       DATE_FORMAT(created_at,'%d %b %Y %h:%i %p') AS Received,
                       IF(is_read=1,'Read','New') AS Status
                FROM messages WHERE recipient_role='trainer' AND recipient_id=?
                ORDER BY created_at DESC
            ", [$trainerId]);
            break;
        case 'Announcements':
            $courses = dashboard_rows($pdo, "
                SELECT DISTINCT c.id, c.title
                FROM courses c
                LEFT JOIN batches b ON b.course_id=c.id
                WHERE c.trainer_id=? OR b.trainer_id=?
                ORDER BY c.title
            ", [$trainerId, $trainerId]);
            $batches = dashboard_rows($pdo, "SELECT id,batch_name,course_id FROM batches WHERE trainer_id=? ORDER BY batch_name", [$trainerId]);
            $rows = dashboard_rows($pdo, "
                SELECT a.id,a.title,a.message,a.target_type,a.batch_id,a.course_id,a.target_role,a.status,a.created_by_role,a.created_by_id,a.created_at,
                       CASE WHEN a.created_by_role='trainer' AND a.created_by_id=? THEN 1 ELSE 0 END AS can_manage
                FROM announcements a
                WHERE (a.created_by_role='trainer' AND a.created_by_id=?)
                   OR (a.status='published' AND a.target_role IN ('all','trainer') AND (
                       COALESCE(a.target_type, 'all') IN ('all','trainer')
                       OR (a.target_type = 'course' AND (
                           EXISTS (SELECT 1 FROM courses c WHERE c.id = a.course_id AND c.trainer_id = ?)
                           OR EXISTS (SELECT 1 FROM batches b WHERE b.course_id = a.course_id AND b.trainer_id = ?)
                       ))
                       OR (a.target_type = 'batch' AND EXISTS (SELECT 1 FROM batches b WHERE b.id = a.batch_id AND b.trainer_id = ?))
                   ))
                ORDER BY created_at DESC
            ", [$trainerId, $trainerId, $trainerId, $trainerId, $trainerId]);
            return [
                'title' => $title,
                'subtitle' => 'Publish announcements for your assigned batches or courses.',
                'type' => 'trainer_announcements',
                'rows' => $rows,
                'options' => ['courses' => $courses, 'batches' => $batches],
            ];
        case 'Profile Settings':
            $profile = dashboard_row($pdo, "SELECT full_name, email, username, phone, profile_image, specialization, experience_years, qualification FROM trainers WHERE id=?", [$trainerId]);
            return ['title' => $title, 'subtitle' => 'Update your trainer profile and password.', 'type' => 'profile', 'profile' => $profile];
        default:
            $columns = ['Information'];
            $rows = [['Information' => 'No records are available for this section yet.']];
    }

    return ['title' => $title, 'subtitle' => $subtitle, 'type' => 'table', 'columns' => $columns, 'rows' => $rows];
}
