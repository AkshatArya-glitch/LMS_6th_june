<?php
require_once __DIR__ . '/../../Backend/includes/session_auth.php';
require_once __DIR__ . '/../../Backend/includes/dashboard_repository.php';
auth_require_role('trainer');

$dashboardData = dashboard_trainer_data(db_connect(), (int) $_SESSION['user_id']);
$csrfToken = auth_csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
  <title>Trainer Dashboard | Emancipation Edutech</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/messages.css">
  <link rel="stylesheet" href="trainer-dashboard.css">
  <script>
    window.TRAINER_DASHBOARD_DATA = <?= json_encode($dashboardData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
    window.DASHBOARD_API_URL = "../../Backend/dashboard_api.php";
    window.MESSAGES_API_BASE = "../../Backend/api";
  </script>
</head>
<body>
  <div class="trainer-shell">
    <aside class="trainer-sidebar" id="trainer-sidebar">
      <a class="trainer-logo" href="../index.html" aria-label="Emancipation Edutech home">
        <img src="../assets/eepl-reference-logo.png" alt="Emancipation Edutech Private Limited">
      </a>
      <nav id="trainer-nav" aria-label="Trainer dashboard">
        <button class="active" type="button" data-view="Dashboard"><span>⌂</span>Dashboard</button>
        <button type="button" data-view="My Courses"><span>▤</span>My Courses</button>
        <button type="button" data-view="My Batches"><span>▣</span>My Batches</button>
        <button type="button" data-view="Students"><span>♙</span>Students</button>
        <button type="button" data-view="Assignments"><span>☷</span>Assignments</button>
        <button type="button" data-view="Assessments"><span>✓</span>Assessments</button>
        <button type="button" data-view="Study Materials"><span>▧</span>Study Materials</button>
        <button type="button" data-view="Live Classes"><span>▻</span>Live Classes</button>
        <button type="button" data-view="Attendance"><span>□</span>Attendance</button>
        <button type="button" data-view="Messages"><span>✉</span>Messages <b id="trainer-message-badge">0</b></button>
        <button type="button" data-view="Announcements"><span>◇</span>Announcements</button>
        <button type="button" data-view="Profile Settings"><span>⚙</span>Profile Settings</button>
      </nav>
      <a class="trainer-logout" href="../../Backend/logout.php">Sign Out</a>
    </aside>

    <div class="trainer-workspace">
      <header class="trainer-topbar">
        <button class="trainer-menu" id="trainer-menu" type="button" aria-label="Toggle menu">☰</button>
        <div class="trainer-welcome">
          <h1 id="trainer-welcome">Welcome back!</h1>
          <p>Manage your courses and guide your students</p>
        </div>
        <label class="trainer-search">
          <span>⌕</span>
          <input id="trainer-search" type="search" placeholder="Search courses, batches, students...">
          <kbd>Ctrl /</kbd>
        </label>
        <button class="trainer-icon" type="button" data-view="Messages" aria-label="Messages">✉<b id="top-message-badge">0</b></button>
        <button class="trainer-profile" type="button" data-view="Profile Settings">
          <img id="trainer-avatar" src="../assets/dashboard/amit-avatar.jpg" alt="Trainer">
          <span><strong id="trainer-name">Trainer</strong><small>Trainer</small></span>
        </button>
      </header>

      <main class="trainer-content" id="trainer-content">
        <section class="trainer-stat-grid" id="trainer-stats"></section>
        <section class="trainer-dashboard-grid">
          <article class="trainer-card">
            <div class="trainer-card-head"><h2>My Courses</h2><button type="button" data-view="My Courses">View All</button></div>
            <div id="trainer-courses"></div>
          </article>
          <article class="trainer-card">
            <div class="trainer-card-head"><h2>Upcoming Schedule</h2><button type="button" data-view="Live Classes">View All</button></div>
            <div id="trainer-schedule"></div>
          </article>
          <article class="trainer-card">
            <div class="trainer-card-head"><h2>My Batches</h2><button type="button" data-view="My Batches">View All</button></div>
            <div id="trainer-batches"></div>
          </article>
          <article class="trainer-card">
            <div class="trainer-card-head"><h2>Assignment Submissions</h2><button type="button" data-view="Assignments">Review All</button></div>
            <div id="trainer-submissions"></div>
          </article>
          <article class="trainer-card trainer-wide">
            <div class="trainer-card-head"><h2>Announcements</h2><button type="button" data-view="Announcements">View All</button></div>
            <div id="trainer-announcements"></div>
          </article>
        </section>
        <footer>&copy; <?= date('Y') ?> Emancipation Edutech Private Limited. All rights reserved.</footer>
      </main>
    </div>
  </div>
  <div class="trainer-backdrop" id="trainer-backdrop"></div>
  <div class="trainer-toast" id="trainer-toast" role="status"></div>
  <script src="../assets/js/messages.js"></script>
  <script src="trainer-dashboard.js"></script>
</body>
</html>
