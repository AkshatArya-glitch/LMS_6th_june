<?php

function request_json() {
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : null;
}

function require_json() {
    $input = request_json();
    if (!is_array($input)) {
        json_response(['success'=>false,'message'=>'Invalid JSON body'],400);
    }
    return $input;
}

function token_payload($id, $email, $role) {
    $ttl = (int) env('JWT_TTL', 60);
    return [
        'id'=>(int) $id,
        'email'=>$email,
        'role'=>$role,
        'iat'=>time(),
        'exp'=>time() + ($ttl * 60),
    ];
}

$router->add('POST', '/v1/auth/register', function() {
    $input = require_json();
    if (empty($input['email']) || empty($input['password']) || empty($input['name'])) {
        return json_response(['success'=>false,'message'=>'Missing fields'],400);
    }
    $pdo = db_connect();
    // check existing
    $stmt = $pdo->prepare('SELECT id FROM students WHERE email = ?');
    $stmt->execute([$input['email']]);
    if ($stmt->fetch()) return json_response(['success'=>false,'message'=>'Email exists'],409);

    $username = strtolower(trim($input['username'] ?? ''));
    if (!preg_match('/^[a-z0-9._-]{3,100}$/i', $username)) {
        $emailPrefix = strtolower(preg_replace('/[^a-z0-9._-]/i', '', strstr($input['email'], '@', true) ?: 'student'));
        $username = strlen($emailPrefix) >= 3 ? $emailPrefix : 'student';
    }
    $baseUsername = substr($username, 0, 88);
    $candidate = $baseUsername;
    $suffix = 1;
    $usernameCheck = $pdo->prepare('SELECT id FROM students WHERE username = ?');
    while (true) {
        $usernameCheck->execute([$candidate]);
        if (!$usernameCheck->fetch()) break;
        $candidate = $baseUsername . $suffix++;
    }

    $pw = password_hash($input['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO students (name,username,email,password,phone) VALUES (?,?,?,?,?)');
    $stmt->execute([$input['name'],$candidate,$input['email'],$pw,$input['phone'] ?? null]);
    $id = $pdo->lastInsertId();
    $token = jwt_encode(token_payload($id, $input['email'], 'student'));
    json_response(['success'=>true,'data'=>['id'=>(int) $id,'token'=>$token]],201);
});

$router->add('POST','/v1/auth/login', function(){
    $in = require_json();
    if (empty($in['email']) || empty($in['password'])) return json_response(['success'=>false,'message'=>'Missing'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,password,email,name FROM students WHERE email = ?');
    $stmt->execute([$in['email']]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$u || !password_verify($in['password'],$u['password'])) return json_response(['success'=>false,'message'=>'Invalid credentials'],401);
    $token = jwt_encode(token_payload($u['id'], $u['email'], 'student'));
    json_response(['success'=>true,'data'=>['token'=>$token,'user'=>['id'=>$u['id'],'email'=>$u['email'],'name'=>$u['name']]]]);
});

$router->add('POST','/v1/auth/admin-login', function(){
    $in = require_json();
    if (empty($in['email']) || empty($in['password'])) return json_response(['success'=>false,'message'=>'Missing'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,password,email,name,role FROM admins WHERE email = ?');
    $stmt->execute([$in['email']]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$u || !password_verify($in['password'],$u['password'])) return json_response(['success'=>false,'message'=>'Invalid credentials'],401);
    $token = jwt_encode(token_payload($u['id'], $u['email'], 'admin'));
    json_response(['success'=>true,'data'=>['token'=>$token,'admin'=>['id'=>$u['id'],'email'=>$u['email'],'name'=>$u['name'],'role'=>$u['role']]]]);
});

$router->add('POST','/v1/auth/admin-register', function(){
    $in = require_json();
    if (empty($in['name']) || empty($in['email']) || empty($in['password'])) {
        return json_response(['success'=>false,'message'=>'Missing fields'],400);
    }

    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id FROM admins WHERE email = ?');
    $stmt->execute([$in['email']]);
    if ($stmt->fetch()) return json_response(['success'=>false,'message'=>'Email exists'],409);

    $role = $in['role'] ?? 'admin';
    $password = password_hash($in['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO admins (name,email,password,role) VALUES (?,?,?,?)');
    $stmt->execute([$in['name'],$in['email'],$password,$role]);

    $id = $pdo->lastInsertId();
    $token = jwt_encode(token_payload($id, $in['email'], 'admin'));
    json_response([
        'success'=>true,
        'data'=>[
            'token'=>$token,
            'admin'=>[
                'id'=>$id,
                'email'=>$in['email'],
                'name'=>$in['name'],
                'role'=>$role,
            ],
        ],
    ],201);
});

// Middleware helpers
function require_auth() {
    $token = get_bearer_token();
    if (!$token) json_response(['success'=>false,'message'=>'Missing token'],401);
    $payload = jwt_decode($token);
    if (!$payload) json_response(['success'=>false,'message'=>'Invalid or expired token'],401);
    return $payload;
}

function require_admin() {
    $p = require_auth();
    if (($p['role'] ?? '') !== 'admin') json_response(['success'=>false,'message'=>'Admin required'],403);
    return $p;
}

// Courses
function list_courses_response() {
    $user = require_auth();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT id,title,description,category,price,instructor_id,thumbnail_url,duration,status,created_at,updated_at FROM courses ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
}

function course_response($id, $status = 200) {
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,title,description,category,price,instructor_id,thumbnail_url,duration,status,created_at,updated_at FROM courses WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>'Course not found'],404);
    json_response(['success'=>true,'data'=>$row], $status);
}

function update_course_response($id) {
    $admin = require_admin();
    $in = require_json();
    $allowed = ['title','description','category','price','thumbnail_url','duration','status'];
    $sets = [];
    $values = [];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $in[$field];
        }
    }

    if (!$sets) {
        return json_response(['success'=>false,'message'=>'No course fields provided'],400);
    }

    $pdo = db_connect();
    $check = $pdo->prepare('SELECT id FROM courses WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) {
        return json_response(['success'=>false,'message'=>'Course not found'],404);
    }

    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE courses SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    course_response($id);
}

function row_response($table, $id, $notFoundMessage = 'Not found') {
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>$notFoundMessage],404);
    json_response(['success'=>true,'data'=>$row]);
}

$router->add('GET','/v1/courses', function(){
    list_courses_response();
});

$router->add('GET','/v1/auth/course', function(){
    list_courses_response();
});

$router->add('GET','/v1/courses/{id}', function($id){
    course_response($id);
});

$router->add('POST','/v1/courses', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['title'])) return json_response(['success'=>false,'message'=>'Title required'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO courses (title,description,category,price,instructor_id,thumbnail_url,duration,status) VALUES (?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['title'],
        $in['description'] ?? '',
        $in['category'] ?? 'General',
        $in['price'] ?? 0,
        $admin['id'],
        $in['thumbnail_url'] ?? null,
        $in['duration'] ?? null,
        $in['status'] ?? 'published',
    ]);
    $id = $pdo->lastInsertId();
    course_response($id, 201);
});

$router->add('PUT','/v1/courses/{id}', function($id){
    update_course_response($id);
});

$router->add('PATCH','/v1/courses/{id}', function($id){
    update_course_response($id);
});

$router->add('DELETE','/v1/courses/{id}', function($id){
    $admin = require_admin();
    $pdo = db_connect();
    $check = $pdo->prepare('SELECT id FROM courses WHERE id=?');
    $check->execute([$id]);
    if (!$check->fetch()) return json_response(['success'=>false,'message'=>'Course not found'],404);
    $stmt = $pdo->prepare('DELETE FROM courses WHERE id=?');
    $stmt->execute([$id]);
    json_response(['success'=>true]);
});

// Modules
$router->add('GET','/v1/modules', function(){
    $user = require_auth();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM modules ORDER BY course_id,module_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('GET','/v1/courses/{courseId}/modules', function($courseId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY module_order,id');
    $stmt->execute([$courseId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/modules/{id}', function($id){
    row_response('modules', $id, 'Module not found');
});

$router->add('POST','/v1/modules', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['course_id']) || empty($in['title'])) return json_response(['success'=>false,'message'=>'Missing fields'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO modules (course_id,title,description,module_order) VALUES (?,?,?,?)');
    $stmt->execute([$in['course_id'],$in['title'],$in['description'] ?? null,$in['module_order'] ?? null]);
    row_response('modules', $pdo->lastInsertId(), 'Module not found');
});

$router->add('PATCH','/v1/modules/{id}', function($id){
    $admin = require_admin();
    $in = require_json();
    $allowed = ['course_id','title','description','module_order'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success'=>false,'message'=>'No module fields provided'],400);
    $pdo = db_connect();
    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE modules SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    if ($stmt->rowCount() === 0) {
        $check = $pdo->prepare('SELECT id FROM modules WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) return json_response(['success'=>false,'message'=>'Module not found'],404);
    }
    row_response('modules', $id, 'Module not found');
});

$router->add('DELETE','/v1/modules/{id}', function($id){
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('DELETE FROM modules WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) return json_response(['success'=>false,'message'=>'Module not found'],404);
    json_response(['success'=>true]);
});

// Lessons
$router->add('GET','/v1/lessons', function(){
    $user = require_auth();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM lessons ORDER BY course_id,module_id,lesson_order,id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('GET','/v1/modules/{moduleId}/lessons', function($moduleId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY lesson_order,id');
    $stmt->execute([$moduleId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/lessons/{id}', function($id){
    row_response('lessons', $id, 'Lesson not found');
});

$router->add('POST','/v1/lessons', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['course_id']) || empty($in['module_id']) || empty($in['title'])) {
        return json_response(['success'=>false,'message'=>'Missing fields'],400);
    }
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO lessons (course_id,module_id,title,description,video_url,video_duration,lesson_order) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['course_id'],
        $in['module_id'],
        $in['title'],
        $in['description'] ?? null,
        $in['video_url'] ?? null,
        $in['video_duration'] ?? null,
        $in['lesson_order'] ?? null,
    ]);
    row_response('lessons', $pdo->lastInsertId(), 'Lesson not found');
});

$router->add('PATCH','/v1/lessons/{id}', function($id){
    $admin = require_admin();
    $in = require_json();
    $allowed = ['course_id','module_id','title','description','video_url','video_duration','lesson_order'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success'=>false,'message'=>'No lesson fields provided'],400);
    $pdo = db_connect();
    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE lessons SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    if ($stmt->rowCount() === 0) {
        $check = $pdo->prepare('SELECT id FROM lessons WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) return json_response(['success'=>false,'message'=>'Lesson not found'],404);
    }
    row_response('lessons', $id, 'Lesson not found');
});

$router->add('DELETE','/v1/lessons/{id}', function($id){
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('DELETE FROM lessons WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) return json_response(['success'=>false,'message'=>'Lesson not found'],404);
    json_response(['success'=>true]);
});

// Enrollments
$router->add('POST','/v1/enrollments', function(){
    $user = require_auth();
    $in = require_json();
    if (empty($in['student_id']) || empty($in['course_id'])) return json_response(['success'=>false,'message'=>'Missing fields'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO enrollments (student_id,course_id,payment_status,payment_method,transaction_id,amount_paid) VALUES (?,?,?,?,?,?)');
    $stmt->execute([
        $in['student_id'],
        $in['course_id'],
        $in['payment_status'] ?? 'pending',
        $in['payment_method'] ?? null,
        $in['transaction_id'] ?? null,
        $in['amount_paid'] ?? 0,
    ]);
    json_response(['success'=>true,'id'=>$pdo->lastInsertId()],201);
});

$router->add('GET','/v1/enrollments', function(){
    $user = require_auth();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM enrollments')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('GET','/v1/enrollments/{id}', function($id){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM enrollments WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>'Not found'],404);
    json_response(['success'=>true,'data'=>$row]);
});

// Progress
$router->add('POST','/v1/progress/mark-complete', function(){
    $user = require_auth();
    $in = require_json();
    $lessonId = $in['lesson_id'] ?? $in['module_id'] ?? null;
    if (empty($in['student_id']) || empty($in['course_id']) || empty($lessonId)) return json_response(['success'=>false,'message'=>'Missing'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO progress (student_id,course_id,lesson_id,is_completed,completed_at,time_spent) VALUES (?,?,?,?,NOW(),?)');
    $stmt->execute([$in['student_id'],$in['course_id'],$lessonId,1,$in['time_spent'] ?? 0]);
    json_response(['success'=>true,'id'=>$pdo->lastInsertId()],201);
});

$router->add('GET','/v1/progress/all', function(){
    $user = require_auth();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM progress')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('GET','/v1/progress/{courseId}', function($courseId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM progress WHERE course_id = ?');
    $stmt->execute([$courseId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

// Quizzes (basic)
$router->add('GET','/v1/quizzes', function(){
    $user = require_auth();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM quizzes')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('GET','/v1/quizzes/{id}', function($id){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM quizzes WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>'Not found'],404);
    json_response(['success'=>true,'data'=>$row]);
});

$router->add('POST','/v1/quizzes/{id}/attempt', function($id){
    $user = require_auth();
    $in = require_json();
    $pdo = db_connect();
    // Very simple scoring: count answers provided
    $answers = $in['answers'] ?? [];
    $score = count($answers);
    $stmt = $pdo->prepare('INSERT INTO quiz_attempts (student_id,quiz_id,score_percentage,correct_answers,total_questions,is_passed) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$user['id'],$id,$score, $score, count($answers), 0]);
    json_response(['success'=>true,'id'=>$pdo->lastInsertId()]);
});

$router->add('GET','/v1/quizzes/{id}/results', function($id){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY attempted_at DESC LIMIT 10');
    $stmt->execute([$id,$user['id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('POST','/v1/quizzes', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['course_id']) || empty($in['title'])) return json_response(['success'=>false,'message'=>'Missing fields'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO quizzes (course_id,title,description,passing_score,total_questions,duration) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$in['course_id'],$in['title'],$in['description'] ?? '',$in['passing_score'] ?? 0,$in['total_questions'] ?? 0,$in['duration'] ?? null]);
    json_response(['success'=>true,'id'=>$pdo->lastInsertId()],201);
});

// Questions
$router->add('GET','/v1/quizzes/{quizId}/questions', function($quizId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id');
    $stmt->execute([$quizId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/questions/{id}', function($id){
    row_response('questions', $id, 'Question not found');
});

$router->add('POST','/v1/questions', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['quiz_id']) || empty($in['question_text'])) return json_response(['success'=>false,'message'=>'Missing fields'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO questions (quiz_id,question_text,question_type,correct_answer_id) VALUES (?,?,?,?)');
    $stmt->execute([
        $in['quiz_id'],
        $in['question_text'],
        $in['question_type'] ?? 'multiple_choice',
        $in['correct_answer_id'] ?? null,
    ]);
    row_response('questions', $pdo->lastInsertId(), 'Question not found');
});

$router->add('PATCH','/v1/questions/{id}', function($id){
    $admin = require_admin();
    $in = require_json();
    $allowed = ['quiz_id','question_text','question_type','correct_answer_id'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success'=>false,'message'=>'No question fields provided'],400);
    $pdo = db_connect();
    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE questions SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    if ($stmt->rowCount() === 0) {
        $check = $pdo->prepare('SELECT id FROM questions WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) return json_response(['success'=>false,'message'=>'Question not found'],404);
    }
    row_response('questions', $id, 'Question not found');
});

$router->add('DELETE','/v1/questions/{id}', function($id){
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('DELETE FROM questions WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) return json_response(['success'=>false,'message'=>'Question not found'],404);
    json_response(['success'=>true]);
});

// Answers
$router->add('GET','/v1/questions/{questionId}/answers', function($questionId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM answers WHERE question_id = ? ORDER BY answer_order,id');
    $stmt->execute([$questionId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/answers/{id}', function($id){
    row_response('answers', $id, 'Answer not found');
});

$router->add('POST','/v1/answers', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['question_id']) || empty($in['answer_text'])) return json_response(['success'=>false,'message'=>'Missing fields'],400);
    $pdo = db_connect();
    $stmt = $pdo->prepare('INSERT INTO answers (question_id,answer_text,is_correct,answer_order) VALUES (?,?,?,?)');
    $stmt->execute([
        $in['question_id'],
        $in['answer_text'],
        !empty($in['is_correct']) ? 1 : 0,
        $in['answer_order'] ?? null,
    ]);
    row_response('answers', $pdo->lastInsertId(), 'Answer not found');
});

$router->add('PATCH','/v1/answers/{id}', function($id){
    $admin = require_admin();
    $in = require_json();
    $allowed = ['question_id','answer_text','is_correct','answer_order'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $field === 'is_correct' ? (!empty($in[$field]) ? 1 : 0) : $in[$field];
        }
    }
    if (!$sets) return json_response(['success'=>false,'message'=>'No answer fields provided'],400);
    $pdo = db_connect();
    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE answers SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    if ($stmt->rowCount() === 0) {
        $check = $pdo->prepare('SELECT id FROM answers WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) return json_response(['success'=>false,'message'=>'Answer not found'],404);
    }
    row_response('answers', $id, 'Answer not found');
});

$router->add('DELETE','/v1/answers/{id}', function($id){
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('DELETE FROM answers WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) return json_response(['success'=>false,'message'=>'Answer not found'],404);
    json_response(['success'=>true]);
});

// Admin
$router->add('GET','/v1/admin/dashboard', function(){
    $admin = require_admin();
    $pdo = db_connect();
    $counts = [];
    $counts['students'] = $pdo->query('SELECT COUNT(*) FROM students')->fetchColumn();
    $counts['courses'] = $pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    $counts['enrollments'] = $pdo->query('SELECT COUNT(*) FROM enrollments')->fetchColumn();
    json_response(['success'=>true,'data'=>$counts]);
});

$router->add('GET','/v1/admin/students', function(){
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT id,name,email,created_at FROM students')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('GET','/v1/admin/analytics', function(){
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT course_id,COUNT(*) as enrollments FROM enrollments GROUP BY course_id')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

$router->add('POST','/v1/admin/certificates/generate', function(){
    $admin = require_admin();
    $in = require_json();
    if (empty($in['course_id'])) return json_response(['success'=>false,'message'=>'Missing course_id'],400);
    $pdo = db_connect();
    // Generate certificate for all enrollments in course
    $stmt = $pdo->prepare('SELECT student_id FROM enrollments WHERE course_id = ?');
    $stmt->execute([$in['course_id']]);
    $students = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $out = [];
    $ins = $pdo->prepare('INSERT INTO certificates (student_id,course_id,certificate_number) VALUES (?,?,?)');
    foreach ($students as $s) {
        $num = bin2hex(random_bytes(8));
        $ins->execute([$s,$in['course_id'],$num]);
        $out[] = ['student_id'=>$s,'certificate'=>$num];
    }
    json_response(['success'=>true,'data'=>$out]);
});

// Student Profiles
$router->add('GET','/v1/students/{id}', function($id){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,name,email,phone,profile_image,date_of_birth,bio,created_at,updated_at FROM students WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>'Student not found'],404);
    json_response(['success'=>true,'data'=>$row]);
});

$router->add('GET','/v1/profile', function(){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT id,name,email,phone,profile_image,date_of_birth,bio,created_at,updated_at FROM students WHERE id=?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>'Student not found'],404);
    json_response(['success'=>true,'data'=>$row]);
});

$router->add('PATCH','/v1/profile', function(){
    $user = require_auth();
    $in = require_json();
    $allowed = ['name','phone','profile_image','date_of_birth','bio'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success'=>false,'message'=>'No fields provided'],400);
    $pdo = db_connect();
    $values[] = $user['id'];
    $stmt = $pdo->prepare('UPDATE students SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    
    $stmt = $pdo->prepare('SELECT id,name,email,phone,profile_image,date_of_birth,bio,created_at,updated_at FROM students WHERE id=?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$row]);
});

// Certificates
$router->add('GET','/v1/certificates', function(){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM certificates WHERE student_id = ?');
    $stmt->execute([$user['id']]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/certificates/{id}', function($id){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM certificates WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return json_response(['success'=>false,'message'=>'Certificate not found'],404);
    if ($row['student_id'] != $user['id'] && ($user['role'] ?? '') !== 'admin') {
        return json_response(['success'=>false,'message'=>'Unauthorized'],403);
    }
    json_response(['success'=>true,'data'=>$row]);
});

$router->add('GET','/v1/admin/certificates', function(){
    $admin = require_admin();
    $pdo = db_connect();
    $rows = $pdo->query('SELECT * FROM certificates')->fetchAll(PDO::FETCH_ASSOC);
    json_response(['success'=>true,'data'=>$rows]);
});

// Progress - additional endpoints
$router->add('GET','/v1/progress/student/{studentId}', function($studentId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM progress WHERE student_id = ? ORDER BY course_id,lesson_id');
    $stmt->execute([$studentId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/progress/{studentId}/course/{courseId}', function($studentId, $courseId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT * FROM progress WHERE student_id = ? AND course_id = ? ORDER BY lesson_id');
    $stmt->execute([$studentId, $courseId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

// Enrollments - additional endpoints
$router->add('GET','/v1/enrollments/student/{studentId}', function($studentId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT e.*,c.title as course_title FROM enrollments e LEFT JOIN courses c ON e.course_id = c.id WHERE e.student_id = ? ORDER BY e.enrollment_date DESC');
    $stmt->execute([$studentId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('GET','/v1/enrollments/course/{courseId}', function($courseId){
    $user = require_auth();
    $pdo = db_connect();
    $stmt = $pdo->prepare('SELECT e.*,s.name as student_name,s.email as student_email FROM enrollments e LEFT JOIN students s ON e.student_id = s.id WHERE e.course_id = ? ORDER BY e.enrollment_date');
    $stmt->execute([$courseId]);
    json_response(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('PATCH','/v1/enrollments/{id}', function($id){
    $user = require_auth();
    $in = require_json();
    $allowed = ['payment_status','payment_method','transaction_id','amount_paid'];
    $sets = [];
    $values = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $in)) {
            $sets[] = "$field = ?";
            $values[] = $in[$field];
        }
    }
    if (!$sets) return json_response(['success'=>false,'message'=>'No enrollment fields provided'],400);
    $pdo = db_connect();
    $values[] = $id;
    $stmt = $pdo->prepare('UPDATE enrollments SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);
    if ($stmt->rowCount() === 0) {
        $check = $pdo->prepare('SELECT id FROM enrollments WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) return json_response(['success'=>false,'message'=>'Enrollment not found'],404);
    }
    $stmt = $pdo->prepare('SELECT * FROM enrollments WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['success'=>true,'data'=>$stmt->fetch(PDO::FETCH_ASSOC)]);
});

$router->add('DELETE','/v1/enrollments/{id}', function($id){
    $admin = require_admin();
    $pdo = db_connect();
    $stmt = $pdo->prepare('DELETE FROM enrollments WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) return json_response(['success'=>false,'message'=>'Enrollment not found'],404);
    json_response(['success'=>true]);
});
