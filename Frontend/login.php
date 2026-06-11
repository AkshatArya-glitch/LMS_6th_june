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
  <meta name="description" content="Secure role-based login for Emancipation Edutech learners, trainers, and administrators.">
  <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
  <title>Login | Emancipation Edutech</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth-page" data-auth-page="login" data-backend-base="../Backend">
  <main class="auth-layout">
    <?php require __DIR__ . '/includes/auth_visual.php'; ?>

    <section class="auth-main">
      <div class="auth-card login-card">
        <a class="auth-logo" href="index.html" aria-label="Emancipation Edutech home">
          <img src="assets/eepl-reference-logo.png" alt="Emancipation Edutech Private Limited">
        </a>

        <header class="auth-header">
          <h1>Welcome Back!</h1>
          <p>Login to access your account</p>
        </header>

        <div class="section-heading"><span></span><strong>Login As</strong><span></span></div>

        <div class="role-tabs" role="tablist" aria-label="Select login role">
          <button class="role-tab active" type="button" role="tab" aria-selected="true" data-role="admin">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5.2 3.2 8.2 8 10 4.8-1.8 8-4.8 8-10V6z"/><path d="M9 11h6M12 8v6"/></svg>
            <span>Admin</span>
          </button>
          <button class="role-tab" type="button" role="tab" aria-selected="false" data-role="trainer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v3"/><path d="M3 4h5M5.5 1.5v5"/></svg>
            <span>Trainer</span>
          </button>
          <button class="role-tab" type="button" role="tab" aria-selected="false" data-role="user">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7"/></svg>
            <span>User</span>
          </button>
        </div>

        <form id="login-form" class="auth-form" novalidate>
          <input type="hidden" name="role" id="selected-role" value="admin">

          <label class="field-label" for="login-identifier">Email or Username</label>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.4-7 8-7s7.2 2 8 7"/></svg>
            <input id="login-identifier" name="identifier" type="text" placeholder="Enter your email or username" autocomplete="username" required>
          </div>

          <label class="field-label" for="login-password">Password</label>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
            <input id="login-password" name="password" type="password" placeholder="Enter your password" autocomplete="current-password" required>
            <button class="password-toggle" type="button" data-password-toggle="login-password" aria-label="Show password">
              <svg class="eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>
            </button>
          </div>

          <div class="form-options">
            <label class="check-label">
              <input type="checkbox" name="remember" value="1">
              <span class="custom-check"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7"/></svg></span>
              Remember me
            </label>
            <button class="text-link" id="forgot-password-button" type="button">Forgot Password?</button>
          </div>

          <div class="form-alert" id="login-alert" role="alert" aria-live="polite"></div>

          <button class="primary-auth-button" type="submit">
            <span>Login</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </form>

        <div class="auth-divider"><span></span><b>or</b><span></span></div>

        <button class="otp-button" id="otp-login-button" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5.2 3.2 8.2 8 10 4.8-1.8 8-4.8 8-10V6z"/><path d="m9 12 2 2 4-5"/></svg>
          Login with OTP
        </button>

        <div class="secure-box">
          <span class="secure-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5.2 3.2 8.2 8 10 4.8-1.8 8-4.8 8-10V6z"/><path d="m9 12 2 2 4-5"/></svg>
          </span>
          <span><strong>Secure &amp; Protected</strong><small>Your data is safe with us</small></span>
        </div>

        <div class="register-prompt" id="register-prompt" hidden>
          <span>Don't have an account?</span>
          <a id="register-link" href="register_user.php">Register</a>
        </div>
      </div>

      <footer class="auth-footer">&copy; <?= date('Y') ?> Emancipation Edutech Private Limited. All rights reserved.</footer>
    </section>
  </main>

  <div class="auth-modal" id="forgot-modal" aria-hidden="true">
    <div class="modal-backdrop" data-modal-close></div>
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
      <button class="modal-close" type="button" data-modal-close aria-label="Close">&times;</button>
      <span class="modal-icon">
        <svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="m4 8 8 6 8-6"/></svg>
      </span>
      <h2 id="forgot-title">Forgot Password?</h2>
      <p>Enter your email and we will prepare reset instructions.</p>
      <form id="forgot-form" class="modal-form">
        <input type="email" name="email" placeholder="Email address" autocomplete="email" required>
        <div class="form-alert" data-modal-alert role="alert"></div>
        <button class="primary-auth-button" type="submit"><span>Submit</span></button>
      </form>
    </section>
  </div>

  <div class="auth-modal" id="otp-modal" aria-hidden="true">
    <div class="modal-backdrop" data-modal-close></div>
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="otp-title">
      <button class="modal-close" type="button" data-modal-close aria-label="Close">&times;</button>
      <span class="modal-icon">
        <svg viewBox="0 0 24 24"><path d="M12 3 4 6v5c0 5.2 3.2 8.2 8 10 4.8-1.8 8-4.8 8-10V6z"/><path d="M9 12h6"/></svg>
      </span>
      <h2 id="otp-title">Login with OTP</h2>
      <p id="otp-description">Enter the email or username registered to the selected role.</p>
      <form id="otp-form" class="modal-form">
        <input type="text" name="identifier" id="otp-identifier" placeholder="Email or username" autocomplete="username" required>
        <input class="otp-code-input" type="text" name="otp" id="otp-code" placeholder="6-digit OTP" inputmode="numeric" maxlength="6" hidden>
        <div class="demo-otp" id="demo-otp" hidden></div>
        <div class="form-alert" data-modal-alert role="alert"></div>
        <button class="primary-auth-button" id="otp-submit" type="submit"><span>Send OTP</span></button>
      </form>
    </section>
  </div>

  <script src="assets/js/auth.js"></script>
</body>
</html>

