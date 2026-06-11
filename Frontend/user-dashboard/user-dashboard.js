(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const dashboardData = window.USER_DASHBOARD_DATA || {};
  const dashboardApi = window.DASHBOARD_API_URL || "../../Backend/dashboard_api.php";
  const messagesApi = window.MESSAGES_API_BASE || "../../Backend/api";
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";
  let dashboardTemplate = "";
  let calendarMonthOffset = 0;

  const icon = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const icons = {
    dashboard: icon('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>'),
    courses: icon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>'),
    book: icon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>'),
    enrollments: icon('<path d="M6 4h12v16H6z"/><path d="M9 8h6m-6 4h6m-6 4h4"/>'),
    batches: icon('<path d="M16 21v-2a4 4 0 0 0-8 0v2"/><circle cx="12" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M2 21v-2a4 4 0 0 1 3-3.87"/>'),
    assignments: icon('<path d="M9 4h6l1 2h3v15H5V6h3l1-2z"/><path d="M9 12h6m-6 4h4"/>'),
    clipboard: icon('<path d="M9 4h6l1 2h3v15H5V6h3l1-2z"/><path d="M9 12h6m-6 4h4"/>'),
    assessments: icon('<path d="M9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
    certificates: icon('<circle cx="12" cy="8" r="5"/><path d="m8.5 12.5-1 8L12 18l4.5 2.5-1-8"/>'),
    trophy: icon('<path d="M8 21h8m-4-4v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 3m10-3h3a3 3 0 0 1-3 3"/>'),
    materials: icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
    attendance: icon('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 9h6m-6 4h6m-6 4h3"/>'),
    live: icon('<rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2z"/>'),
    video: icon('<rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2z"/>'),
    messages: icon('<path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'),
    payments: icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 5h4"/>'),
    wishlist: icon('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>'),
    settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 1 1-7-7"/>'),
    clock: icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>'),
    upload: icon('<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4H4v-4"/>'),
    download: icon('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M20 21H4"/>'),
    help: icon('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1.4-2.4 1.7-2.8 3"/><path d="M12 17h.01"/>'),
    bell: icon('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>'),
    logout: icon('<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M8 12h10"/>'),
  };

  const courseIcons = {
    python: icon('<path d="M10.5 3h4A3.5 3.5 0 0 1 18 6.5V10H9a3 3 0 0 0-3 3v1.5"/><path d="M13.5 21h-4A3.5 3.5 0 0 1 6 17.5V14h9a3 3 0 0 0 3-3V9.5"/>'),
    ds: icon('<path d="m12 3 7 4v10l-7 4-7-4V7z"/><path d="M9 9.5h6M9 12h6M9 14.5h4"/>'),
    web: icon('<path d="M6 3h12l-1.2 14L12 20l-4.8-3L6 3z"/><path d="M9 8h6M9.5 12h5"/>'),
    db: icon('<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  };

  const navItems = [
    ["Dashboard", "dashboard"],
    ["My Courses", "courses"],
    ["My Enrollments", "enrollments"],
    ["My Batches", "batches"],
    ["Assignments", "assignments"],
    ["Assessments", "assessments"],
    ["Certificates", "certificates"],
    ["Study Materials", "materials"],
    ["Attendance", "attendance"],
    ["Live Classes", "live"],
    ["Messages", "messages", dashboardData.student?.messages || ""],
    ["Payment History", "payments"],
    ["Wishlist", "wishlist"],
    ["Profile Settings", "settings"],
    ["Sign Out", "logout"],
  ];

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function styleVars(item) {
    return `style="--accent:${esc(item.color || "#246bfe")};--accent-soft:${esc(item.soft || "#eaf1ff")}"`;
  }

  function emptyState(message) {
    return `<div class="dashboard-empty"><strong>No records yet</strong><span>${esc(message)}</span></div>`;
  }

  function showToast(message) {
    const toast = $("#dashboard-toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function renderNav() {
    $("#sidebar-nav").innerHTML = navItems.map((item, index) => {
      const [label, iconName, badge] = item;
      const hasBadge = item.length > 2;
      return `
        <button class="side-link dashboard-action ${index === 0 ? "active" : ""}" type="button" data-action="${esc(label)}">
          ${icons[iconName] || icons.book}<span class="side-label">${esc(label)}</span>
          ${hasBadge ? `<span class="side-badge">${esc(badge || 0)}</span>` : ""}
        </button>
      `;
    }).join("");
  }

  function renderStudentShell() {
    const student = dashboardData.student || {};
    const avatar = student.avatar || "../assets/dashboard/amit-avatar.jpg";
    $(".welcome-copy h1").innerHTML = `Welcome back, ${esc(student.firstName || "Student")}! <span aria-hidden="true">&#128075;</span>`;
    $(".welcome-copy p").textContent = student.welcomeSubtitle || "";
    document.querySelectorAll(".sidebar-profile img, .top-profile img").forEach((image) => {
      image.src = avatar;
      image.alt = student.fullName || "Student";
    });
    document.querySelectorAll(".sidebar-profile strong, .top-profile strong").forEach((name) => name.textContent = student.fullName || "Student");
    document.querySelectorAll(".sidebar-profile small, .top-profile small").forEach((role) => role.textContent = student.role || "Student");
    const notificationBadge = document.querySelector('.top-icon[data-action="Notifications"] span');
    if (notificationBadge) notificationBadge.textContent = student.notifications || 0;
    document.querySelectorAll('.side-link[data-action="Messages"] .side-badge, .top-icon[data-action="Messages"] span').forEach((badge) => {
      badge.textContent = student.messages || 0;
    });
  }

  function renderStats() {
    $("#stats-grid").innerHTML = (dashboardData.stats || []).map((item) => `
      <article class="stat-card dashboard-action" tabindex="0" role="button" data-action="${esc(item.title)}" ${styleVars(item)}>
        <span class="stat-icon">${icons[item.icon] || icons.book}</span>
        <div><h3>${esc(item.title)}</h3><div class="stat-value-row"><strong class="stat-value">${esc(item.value)}</strong>${item.status ? `<span class="stat-status">${esc(item.status)}</span>` : ""}</div><p class="stat-trend">${esc(item.trend)}</p></div>
      </article>
    `).join("");
  }

  function renderCourses() {
    const rows = dashboardData.courses || [];
    $("#course-progress-list").innerHTML = rows.length ? `<div class="course-list">${rows.map((item) => `
      <div class="course-row dashboard-action" tabindex="0" role="button" data-action="Course ${Number(item.id) || 0}">
        <span class="course-icon ${esc(item.cls)}">${courseIcons[item.icon] || icons.book}</span>
        <div class="course-info"><strong>${esc(item.name)}</strong><small>Batch: ${esc(item.batch)}</small></div>
        <div class="progress-line ${esc(item.cls)}"><span style="width:${Math.max(0, Math.min(100, Number(item.progress) || 0))}%"></span></div>
        <div class="course-percent ${esc(item.cls)}"><strong>${Math.max(0, Math.min(100, Number(item.progress) || 0))}%</strong><small>${esc(item.status)}</small></div>
      </div>`).join("")}</div>` : emptyState("Enroll in a course to see learning progress.");
  }

  function renderDeadlines() {
    const rows = dashboardData.deadlines || [];
    $("#deadlines-list").innerHTML = rows.length ? `<div class="deadline-list">${rows.map((item) => `
      <div class="deadline-item dashboard-action" tabindex="0" role="button" data-action="${esc(item.title)}" ${styleVars(item)}>
        <span class="deadline-icon">${icons[item.icon] || icons.clock}</span>
        <div class="deadline-info"><strong>${esc(item.title)}</strong><small>${esc(item.course)}</small></div>
        <span class="deadline-time">${item.time}</span>
      </div>`).join("")}</div>` : emptyState("No upcoming assignment or assessment deadlines.");
  }

  function renderActivities() {
    const rows = dashboardData.activities || [];
    $("#activities-list").innerHTML = rows.length ? `<div class="activity-list">${rows.map((item) => `
      <div class="activity-item dashboard-action" tabindex="0" role="button" data-action="${esc(item.title)}" ${styleVars(item)}>
        <span class="activity-icon">${icons[item.icon] || icons.clock}</span>
        <div class="activity-info"><strong>${esc(item.title)}</strong><small>${esc(item.course)}</small></div>
        <span class="activity-time">${esc(item.time)}</span>
      </div>`).join("")}</div>` : emptyState("Your recent learning activity will appear here.");
  }

  function renderBatches() {
    const rows = dashboardData.batches || [];
    $("#batches-list").innerHTML = rows.length ? `<div class="batch-list">${rows.map((item) => `
      <div class="batch-item dashboard-action" tabindex="0" role="button" data-action="${esc(item.code)}" ${styleVars(item)}>
        <span class="course-icon ${esc(item.cls)}">${courseIcons[item.icon] || icons.book}</span>
        <div class="batch-info"><strong>${esc(item.code)}</strong><small>${esc(item.course)}</small></div>
        <span class="instructor-tag">Instructor: ${esc(item.instructor)}</span>
      </div>`).join("")}</div>` : emptyState("No batch has been assigned to your enrollments.");
  }

  function renderAnnouncements() {
    const rows = dashboardData.announcements || [];
    $("#announcements-list").innerHTML = rows.length ? `<div class="announcement-list">${rows.map((item) => `
      <div class="announcement-item dashboard-action" tabindex="0" role="button" data-action="${esc(item.title)}" ${styleVars(item)}>
        <span class="activity-icon">${icons[item.icon] || icons.bell}</span>
        <div class="announcement-copy"><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div>
        <span class="announce-time">${esc(item.time)}</span>
      </div>`).join("")}</div>` : emptyState("There are no published announcements.");
  }

  function renderQuickLinks() {
    $("#quick-links").innerHTML = (dashboardData.quickLinks || []).map((item) => `
      <button class="quick-link dashboard-action" type="button" data-action="${esc(item.label)}" data-href="${esc(item.href || "")}" data-view="${esc(item.view || "")}" ${styleVars(item)}>
        <span>${icons[item.icon] || icons.book}</span><span>${esc(item.label)}</span>
      </button>
    `).join("");
  }

  function renderContinueLearning() {
    const item = dashboardData.continueLearning;
    if (!item) {
      $("#continue-learning").innerHTML = emptyState("Your next lesson will appear after you enroll in a course.");
      return;
    }
    $("#continue-learning").innerHTML = `
      <div class="continue-row dashboard-action" tabindex="0" role="button" data-action="Course Player">
        <div class="course-icon ${esc(item.cls)}">${courseIcons[item.icon] || icons.book}</div>
        <div class="continue-course"><strong>${esc(item.title)}</strong><div class="mini-progress ${esc(item.cls)}"><span style="width:${Number(item.progress) || 0}%"></span></div></div>
        <span class="continue-percent">${esc(item.progressLabel)}</span>
        <div class="next-lesson"><small>${esc(item.lessonLabel)}</small><strong>${esc(item.nextLesson)}</strong></div>
        <button class="continue-btn dashboard-action" type="button" data-action="Course Player">${esc(item.buttonText)} <span aria-hidden="true">&rarr;</span></button>
      </div>`;
  }

  function calendarForOffset(offset) {
    const base = new Date();
    const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const today = new Date().toDateString();
    const dates = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const classes = [];
      if (date.getMonth() !== first.getMonth()) classes.push("muted");
      if (date.toDateString() === today) classes.push("selected");
      dates.push([date.getDate(), classes.join(" ")]);
    }
    return { month: first.toLocaleDateString(undefined, { month: "long", year: "numeric" }), days: ["Su","Mo","Tu","We","Th","Fr","Sa"], dates };
  }

  function renderCalendar() {
    const calendar = calendarMonthOffset === 0 && dashboardData.calendar ? dashboardData.calendar : calendarForOffset(calendarMonthOffset);
    $(".calendar-head strong").textContent = calendar.month;
    $("#calendar-grid").innerHTML = [
      ...calendar.days.map((day) => `<span class="calendar-cell day-name">${day}</span>`),
      ...calendar.dates.map(([date, cls]) => `<button class="calendar-cell dashboard-action ${esc(cls)}" type="button" data-action="Calendar ${date}">${date}</button>`),
    ].join("");
  }

  function footerHtml() {
    return `<footer class="dashboard-footer"><span>&copy; ${new Date().getFullYear()} Emancipation Edutech Private Limited.</span><span>Student Portal</span></footer>`;
  }

  function renderDashboard() {
    $(".dashboard-content").innerHTML = dashboardTemplate;
    renderStats();
    renderCourses();
    renderDeadlines();
    renderActivities();
    renderBatches();
    renderAnnouncements();
    renderQuickLinks();
    renderContinueLearning();
    renderCalendar();
  }

  function renderDetailItem(item) {
    const progress = typeof item.progress === "number" ? `<div class="detail-progress ${esc(item.cls || "")}"><span style="width:${item.progress}%"></span></div>` : "";
    const itemIcon = item.cls && courseIcons[item.icon]
      ? `<span class="course-icon ${esc(item.cls)}">${courseIcons[item.icon]}</span>`
      : `<span class="activity-icon" ${styleVars(item)}>${icons[item.icon] || icons.book}</span>`;
    return `<button class="detail-item dashboard-action" type="button" data-action="${esc(item.action || item.title)}" ${styleVars(item)}>
      ${itemIcon}<span class="detail-copy"><strong>${esc(item.title)}</strong><small>${esc(item.meta)}</small><em>${esc(item.note)}</em>${progress}</span><span class="detail-status">${esc(item.status)}</span>
    </button>`;
  }

  function renderProfileView(view) {
    const profile = view.profile || {};
    $(".dashboard-content").innerHTML = `
      <section class="detail-view">
        <div class="detail-hero"><div><p class="detail-eyebrow">Student Portal</p><h2>${esc(view.title)}</h2><p>${esc(view.subtitle)}</p></div></div>
        <article class="dash-card profile-settings-card">
          <form id="profile-settings-form" enctype="multipart/form-data">
            <div class="profile-form-grid">
              <label><span>Full Name</span><input name="name" value="${esc(profile.name)}" required></label>
              <label><span>Email</span><input name="email" type="email" value="${esc(profile.email)}" required></label>
              <label><span>Username</span><input value="${esc(profile.username)}" disabled></label>
              <label><span>Phone</span><input name="phone" value="${esc(profile.phone)}"></label>
              <label><span>Course Interest</span><input name="course_interest" value="${esc(profile.course_interest)}"></label>
              <label><span>Profile Image</span><input name="profile_image" type="file" accept=".jpg,.jpeg,.png,.webp"></label>
              <label class="profile-wide"><span>Bio</span><textarea name="bio" rows="4">${esc(profile.bio)}</textarea></label>
              <label><span>Current Password</span><input name="current_password" type="password"></label>
              <label><span>New Password</span><input name="new_password" type="password" minlength="8"></label>
            </div>
            <div id="profile-form-message" class="profile-form-message"></div>
            <button class="view-action" type="submit">Save Profile</button>
          </form>
        </article>
      </section>${footerHtml()}`;

    $("#profile-settings-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      const message = $("#profile-form-message");
      const formData = new FormData(form);
      formData.append("action", "update_profile");
      formData.append("csrf_token", csrfToken);
      button.disabled = true;
      try {
        const response = await fetch(dashboardApi, { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrfToken }, body: formData });
        const result = await response.json();
        message.textContent = result.message || "Request completed.";
        message.className = `profile-form-message show ${response.ok && result.success ? "success" : "error"}`;
        if (response.ok && result.success) {
          dashboardData.student.fullName = formData.get("name");
          dashboardData.student.firstName = String(formData.get("name")).trim().split(/\s+/)[0];
          renderStudentShell();
        }
      } catch {
        message.textContent = "Unable to update the profile.";
        message.className = "profile-form-message show error";
      } finally {
        button.disabled = false;
      }
    });
  }

  function renderDetailView(view) {
    if (view.type === "profile") {
      renderProfileView(view);
      return;
    }
    $(".dashboard-content").innerHTML = `
      <section class="detail-view">
        <div class="detail-hero"><div><p class="detail-eyebrow">Student Portal</p><h2>${esc(view.title)}</h2><p>${esc(view.subtitle)}</p></div></div>
        <div class="detail-stats">${(view.stats || []).map((item) => `
          <article class="stat-card" ${styleVars(item)}><span class="stat-icon">${icons[item.icon] || icons.book}</span><div><h3>${esc(item.title)}</h3><div class="stat-value-row"><strong class="stat-value">${esc(item.value)}</strong><span class="stat-status">${esc(item.status)}</span></div><p class="stat-trend">${esc(item.trend)}</p></div></article>
        `).join("")}</div>
        <div class="detail-sections">${(view.sections || []).map((section) => `
          <article class="dash-card detail-card"><div class="card-heading"><h2>${esc(section.title)}</h2></div><div class="detail-list">${section.items.length ? section.items.map(renderDetailItem).join("") : emptyState("No records are available in this section.")}</div></article>
        `).join("")}</div>
      </section>${footerHtml()}`;
  }

  function setActiveNav(label) {
    document.querySelectorAll(".side-link").forEach((item) => item.classList.toggle("active", item.dataset.action === label));
  }

  function renderMessagesView() {
    $(".dashboard-content").innerHTML = `
      <section class="detail-view messages-detail-view">
        <div id="student-messages-root"></div>
      </section>${footerHtml()}`;

    if (!window.EEPLMessages) {
      $("#student-messages-root").innerHTML = `<div class="dashboard-empty dashboard-load-error"><strong>Messaging is unavailable</strong><span>The messaging asset could not be loaded.</span></div>`;
      return;
    }

    window.EEPLMessages.mount(document.getElementById("student-messages-root"), {
      role: "user",
      title: "Messages",
      subtitle: "Contact Admin support or trainers connected to your enrolled courses.",
      apiBase: messagesApi,
      csrfToken,
      notify: showToast,
      onUnreadChange(count) {
        dashboardData.student = dashboardData.student || {};
        dashboardData.student.messages = String(count);
        renderStudentShell();
      },
    });
  }

  async function openView(label) {
    if (label === "Dashboard") {
      renderDashboard();
      setActiveNav("Dashboard");
      history.replaceState({}, "", location.pathname);
      return;
    }
    setActiveNav(label);
    if (label === "Messages") {
      renderMessagesView();
      history.replaceState({}, "", `#${encodeURIComponent(label)}`);
      return;
    }
    $(".dashboard-content").innerHTML = `<div class="dashboard-loading"><span></span><p>Loading ${esc(label)}...</p></div>`;
    try {
      const response = await fetch(`${dashboardApi}?view=${encodeURIComponent(label)}`, { credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load this section.");
      renderDetailView(result.data);
      history.replaceState({}, "", `#${encodeURIComponent(label)}`);
    } catch (error) {
      $(".dashboard-content").innerHTML = `<div class="dashboard-empty dashboard-load-error"><strong>Unable to load this section</strong><span>${esc(error.message)}</span><button class="view-action dashboard-action" type="button" data-action="Dashboard">Return to Dashboard</button></div>`;
    }
  }

  function bindActions() {
    document.addEventListener("click", (event) => {
      const action = event.target.closest(".dashboard-action");
      if (!action) return;
      const name = action.dataset.action || "";
      if (action.dataset.href) {
        window.location.href = action.dataset.href;
        return;
      }
      if (action.dataset.view) {
        openView(action.dataset.view);
        return;
      }
      if (name === "Sign Out") {
        localStorage.removeItem("eepl_authenticated_user");
        window.location.href = "../../Backend/logout.php";
        return;
      }
      if (name === "Previous Month" || name === "Next Month") {
        calendarMonthOffset += name === "Previous Month" ? -1 : 1;
        renderCalendar();
        return;
      }
      if (name.startsWith("Calendar ")) {
        document.querySelectorAll(".calendar-cell.selected").forEach((cell) => cell.classList.remove("selected"));
        action.classList.add("selected");
        return;
      }
      const routes = {
        "View All Courses": "My Courses",
        "View Deadlines": "Assignments",
        "View Recent Activities": "Recent Activities",
        "View Batches": "My Batches",
        "View Announcements": "Announcements",
        "Notifications": "Notifications",
        "Messages": "Messages",
        "Open User Menu": "Profile Settings",
        "Open Profile Menu": "Profile Settings",
        "Refer Now": "Refer & Earn",
        "Enrolled Courses": "My Courses",
        "Assignments": "Assignments",
        "Assessments": "Assessments",
        "Certificates": "Certificates",
        "Learning Hours": "Attendance",
        "Course Player": "Course Player",
      };
      if (routes[name]) {
        openView(routes[name]);
        return;
      }
      if (action.classList.contains("side-link")) {
        openView(name);
        if (window.matchMedia("(max-width: 900px)").matches) document.body.classList.remove("sidebar-open");
        return;
      }
      showToast(`${name || "Item"} selected`);
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        $("#dashboard-search").focus();
      }
      if ((event.key === "Enter" || event.key === " ") && event.target.matches('[role="button"].dashboard-action')) {
        event.preventDefault();
        event.target.click();
      }
    });

    $("#dashboard-search").addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll(".course-row, .detail-item, .activity-item, .batch-item, .announcement-item").forEach((item) => {
        item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
      });
    });
    $("#menu-toggle").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
    $("#sidebar-backdrop").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  }

  function init() {
    renderStudentShell();
    renderNav();
    dashboardTemplate = $(".dashboard-content").innerHTML;
    renderDashboard();
    bindActions();
    const initial = decodeURIComponent(location.hash.replace("#", ""));
    if (initial) openView(initial);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
