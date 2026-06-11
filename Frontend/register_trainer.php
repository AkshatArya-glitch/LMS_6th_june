<?php
require_once __DIR__ . '/../Backend/includes/session_auth.php';
auth_start_session();
$csrfToken = auth_csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
  <title>Trainer Registration | Emancipation Edutech</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth-page register-page" data-auth-page="register" data-register-role="trainer" data-backend-base="../Backend">
  <main class="auth-layout">
    <?php require __DIR__ . '/includes/auth_visual.php'; ?>
    <section class="auth-main">
      <div class="auth-card register-card">
        <a class="auth-logo" href="index.html" aria-label="Emancipation Edutech home">
          <img src="assets/eepl-reference-logo.png" alt="Emancipation Edutech Private Limited">
        </a>
        <header class="auth-header compact">
          <h1>Create Trainer Account</h1>
          <p>Join Emancipation Edutech as an expert trainer</p>
        </header>
        <div class="section-heading"><span></span><strong>Trainer Registration</strong><span></span></div>

        <form id="register-form" class="auth-form register-form" enctype="multipart/form-data" novalidate>
          <input type="hidden" name="role" value="trainer">
          <div class="form-grid">
            <label class="field-group">
              <span>Full Name *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.4-7 8-7s7.2 2 8 7"/></svg><input name="full_name" type="text" placeholder="Enter full name" autocomplete="name" required></div>
            </label>
            <label class="field-group">
              <span>Email *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="m4 8 8 6 8-6"/></svg><input name="email" type="email" placeholder="Enter email" autocomplete="email" required></div>
            </label>
            <label class="field-group">
              <span>Phone Number</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><path d="M6 3h4l2 5-3 2c1.5 3 3.5 5 6 6.5l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 3-2z"/></svg><input name="phone" type="tel" placeholder="Enter phone number" autocomplete="tel"></div>
            </label>
            <label class="field-group">
              <span>Username *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.4-7 8-7s7.2 2 8 7"/></svg><input name="username" type="text" placeholder="Choose username" autocomplete="username" required></div>
            </label>
            <label class="field-group">
              <span>Password *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input id="register-password" name="password" type="password" placeholder="Minimum 8 characters" autocomplete="new-password" required><button class="password-toggle" type="button" data-password-toggle="register-password" aria-label="Show password"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div>
            </label>
            <label class="field-group">
              <span>Confirm Password *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input id="confirm-password" name="confirm_password" type="password" placeholder="Repeat password" autocomplete="new-password" required><button class="password-toggle" type="button" data-password-toggle="confirm-password" aria-label="Show password"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div>
            </label>
            <label class="field-group">
              <span>Specialization / Subject Expertise *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><path d="m3 8 9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/></svg><input name="specialization" type="text" placeholder="e.g. Full Stack Development" required></div>
            </label>
            <label class="field-group">
              <span>Experience in Years *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V3h8v3M3 11h18"/></svg><input name="experience_years" type="number" min="0" max="80" placeholder="e.g. 5" required></div>
            </label>
            <label class="field-group form-grid-wide">
              <span>Qualification *</span>
              <div class="input-shell"><svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg><input name="qualification" type="text" placeholder="Enter highest qualification" required></div>
            </label>
            <label class="field-group form-grid-wide">
              <span>Upload Profile Image</span>
              <span class="file-input">
                <input name="profile_image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
                <svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>
                <span data-file-label>Choose JPG, PNG, or WebP (max 3 MB)</span>
              </span>
            </label>
          </div>
          <label class="check-label terms-check"><input type="checkbox" name="terms" value="1" required><span class="custom-check"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7"/></svg></span>I agree to the <a href="index.html#site-footer">Terms and Conditions</a></label>
          <div class="form-alert" id="register-alert" role="alert" aria-live="polite"></div>
          <button class="primary-auth-button" type="submit"><span>Register as Trainer</span><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>
        <div class="register-prompt visible"><span>Already have an account?</span><a href="login.php?role=trainer">Login</a></div>
      </div>
      <footer class="auth-footer">&copy; <?= date('Y') ?> Emancipation Edutech Private Limited. All rights reserved.</footer>
    </section>
  </main>
  <script src="assets/js/auth.js"></script>
</body>
</html>

