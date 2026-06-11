(function () {
  "use strict";

  const body = document.body;
  const page = body.dataset.authPage;
  const backendBase = body.dataset.backendBase || "../Backend";
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";

  function backendUrl(file) {
    return new URL(`${backendBase.replace(/\/$/, "")}/${file}`, window.location.href).href;
  }

  function setAlert(element, message, type) {
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("show", Boolean(message));
    element.classList.toggle("success", type === "success");
  }

  function setLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    button.classList.toggle("loading", loading);
  }

  async function postJson(file, payload) {
    const response = await fetch(backendUrl(file), {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { success: false, message: "The server returned an invalid response." };
    }
    return { ok: response.ok, data };
  }

  function persistAuthenticatedUser(data) {
    const user = data?.data?.user;
    const token = data?.data?.token;
    if (!user) return;

    if (user.role === "admin" && token) {
      localStorage.setItem("eepl_admin_token", token);
      localStorage.setItem("eepl_admin_user", JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: "admin",
      }));
    } else {
      localStorage.setItem("eepl_authenticated_user", JSON.stringify(user));
    }
  }

  function initPasswordToggles() {
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.passwordToggle);
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.classList.toggle("password-visible", show);
        button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => modal.querySelector("input:not([hidden])")?.focus(), 50);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function initModalClosers() {
    document.querySelectorAll(".auth-modal").forEach((modal) => {
      modal.querySelectorAll("[data-modal-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(modal));
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.querySelectorAll(".auth-modal.open").forEach(closeModal);
      }
    });
  }

  function initLogin() {
    const roleTabs = Array.from(document.querySelectorAll(".role-tab"));
    const roleInput = document.getElementById("selected-role");
    const registerPrompt = document.getElementById("register-prompt");
    const registerLink = document.getElementById("register-link");
    const loginForm = document.getElementById("login-form");
    const loginAlert = document.getElementById("login-alert");
    const queryRole = new URLSearchParams(window.location.search).get("role");
    let selectedRole = ["admin", "trainer", "user"].includes(queryRole) ? queryRole : "admin";

    function selectRole(role, updateUrl) {
      selectedRole = role;
      roleInput.value = role;
      roleTabs.forEach((tab) => {
        const active = tab.dataset.role === role;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });

      const canRegister = role !== "admin";
      registerPrompt.hidden = !canRegister;
      if (canRegister) {
        registerLink.href = role === "trainer" ? "register_trainer.php" : "register_user.php";
      }
      setAlert(loginAlert, "");

      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set("role", role);
        history.replaceState({}, "", url);
      }
    }

    roleTabs.forEach((tab) => {
      tab.addEventListener("click", () => selectRole(tab.dataset.role, true));
    });
    selectRole(selectedRole, false);

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!loginForm.reportValidity()) return;

      const button = loginForm.querySelector('button[type="submit"]');
      const formData = new FormData(loginForm);
      setAlert(loginAlert, "");
      setLoading(button, true);

      try {
        const result = await postJson("auth_login.php", {
          identifier: formData.get("identifier"),
          password: formData.get("password"),
          role: selectedRole,
          remember: formData.get("remember") === "1",
        });

        if (!result.ok || !result.data.success) {
          setAlert(loginAlert, result.data.message || "Login failed.");
          return;
        }

        persistAuthenticatedUser(result.data);
        setAlert(loginAlert, "Login successful. Redirecting...", "success");
        window.location.assign(result.data.redirect_url);
      } catch {
        setAlert(loginAlert, "Unable to reach the authentication server. Please try again.");
      } finally {
        setLoading(button, false);
      }
    });

    const forgotModal = document.getElementById("forgot-modal");
    const forgotForm = document.getElementById("forgot-form");
    document.getElementById("forgot-password-button")?.addEventListener("click", () => openModal(forgotModal));
    forgotForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!forgotForm.reportValidity()) return;
      const alert = forgotForm.querySelector("[data-modal-alert]");
      const button = forgotForm.querySelector('button[type="submit"]');
      setAlert(alert, "");
      setLoading(button, true);
      try {
        const result = await postJson("forgot_password.php", {
          email: new FormData(forgotForm).get("email"),
          role: selectedRole,
        });
        setAlert(alert, result.data.message, result.ok && result.data.success ? "success" : "error");
      } catch {
        setAlert(alert, "Unable to submit the request right now.");
      } finally {
        setLoading(button, false);
      }
    });

    const otpModal = document.getElementById("otp-modal");
    const otpForm = document.getElementById("otp-form");
    const otpCode = document.getElementById("otp-code");
    const otpSubmit = document.getElementById("otp-submit");
    const demoOtp = document.getElementById("demo-otp");
    let otpSent = false;

    document.getElementById("otp-login-button")?.addEventListener("click", () => {
      otpSent = false;
      otpForm.reset();
      otpCode.hidden = true;
      otpCode.required = false;
      demoOtp.hidden = true;
      demoOtp.textContent = "";
      otpSubmit.querySelector("span").textContent = "Send OTP";
      setAlert(otpForm.querySelector("[data-modal-alert]"), "");
      openModal(otpModal);
    });

    otpForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!otpForm.reportValidity()) return;

      const identifier = document.getElementById("otp-identifier").value.trim();
      const alert = otpForm.querySelector("[data-modal-alert]");
      setAlert(alert, "");
      setLoading(otpSubmit, true);

      try {
        const result = await postJson("otp_login.php", {
          action: otpSent ? "verify" : "send",
          identifier,
          otp: otpCode.value,
          role: selectedRole,
        });

        if (!result.ok || !result.data.success) {
          setAlert(alert, result.data.message || "OTP request failed.");
          return;
        }

        if (!otpSent) {
          otpSent = true;
          otpCode.hidden = false;
          otpCode.required = true;
          otpSubmit.querySelector("span").textContent = "Verify OTP";
          demoOtp.textContent = `Demo OTP: ${result.data.demo_otp}`;
          demoOtp.hidden = false;
          setAlert(alert, result.data.message, "success");
          otpCode.focus();
          return;
        }

        persistAuthenticatedUser(result.data);
        setAlert(alert, "OTP verified. Redirecting...", "success");
        window.location.assign(result.data.redirect_url);
      } catch {
        setAlert(alert, "Unable to complete OTP login.");
      } finally {
        setLoading(otpSubmit, false);
      }
    });
  }

  function initRegistration() {
    const form = document.getElementById("register-form");
    const alert = document.getElementById("register-alert");
    if (!form) return;

    document.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener("change", () => {
        const label = input.closest(".file-input")?.querySelector("[data-file-label]");
        if (label) label.textContent = input.files?.[0]?.name || "Choose JPG, PNG, or WebP (max 3 MB)";
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const password = form.elements.password.value;
      const confirmPassword = form.elements.confirm_password.value;
      if (password.length < 8) {
        setAlert(alert, "Password must be at least 8 characters.");
        form.elements.password.focus();
        return;
      }
      if (password !== confirmPassword) {
        setAlert(alert, "Password and confirm password do not match.");
        form.elements.confirm_password.focus();
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      formData.append("csrf_token", csrfToken);
      setAlert(alert, "");
      setLoading(button, true);

      try {
        const response = await fetch(backendUrl("auth_register.php"), {
          method: "POST",
          credentials: "same-origin",
          headers: { "X-CSRF-Token": csrfToken },
          body: formData,
        });
        const text = await response.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { success: false, message: "The server returned an invalid response." };
        }

        if (!response.ok || !data.success) {
          setAlert(alert, data.message || "Registration failed.");
          if (data.field && form.elements[data.field]) form.elements[data.field].focus();
          return;
        }

        setAlert(alert, data.message, "success");
        form.reset();
        setTimeout(() => window.location.assign(data.redirect_url), 900);
      } catch {
        setAlert(alert, "Unable to reach the authentication server. Please try again.");
      } finally {
        setLoading(button, false);
      }
    });
  }

  initPasswordToggles();
  initModalClosers();
  if (page === "login") initLogin();
  if (page === "register") initRegistration();
})();
