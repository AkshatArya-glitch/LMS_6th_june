(function () {
  "use strict";

  const data = window.TRAINER_DASHBOARD_DATA || {};
  const apiUrl = window.DASHBOARD_API_URL || "../../Backend/dashboard_api.php";
  const messagesApi = window.MESSAGES_API_BASE || "../../Backend/api";
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";
  const content = document.getElementById("trainer-content");
  let dashboardHtml = "";

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function empty(message) {
    return `<div class="trainer-empty"><strong>No records yet</strong><span>${esc(message)}</span></div>`;
  }

  function listItem(icon, title, meta, end) {
    return `<div class="trainer-list-item"><span class="trainer-list-icon">${esc(icon)}</span><span class="trainer-list-copy"><strong>${esc(title)}</strong><small>${esc(meta)}</small></span><b>${esc(end)}</b></div>`;
  }

  function renderDashboard() {
    content.innerHTML = dashboardHtml;
    document.getElementById("trainer-stats").innerHTML = (data.stats || []).map((item) => `
      <article class="trainer-stat">
        <span class="trainer-stat-icon">${esc(item.icon.slice(0, 1).toUpperCase())}</span>
        <div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><small>${esc(item.note)}</small></div>
      </article>
    `).join("");

    document.getElementById("trainer-courses").innerHTML = (data.courses || []).length
      ? data.courses.map((item) => listItem("C", item.title, `${item.student_count} students | ${item.batch_count} batches`, item.status)).join("")
      : empty("Courses assigned to your trainer ID will appear here.");
    document.getElementById("trainer-batches").innerHTML = (data.batches || []).length
      ? data.batches.map((item) => listItem("B", item.batch_name, `${item.course_title} | ${item.student_count} students`, item.status)).join("")
      : empty("No batches are assigned to this trainer.");
    document.getElementById("trainer-schedule").innerHTML = (data.schedule || []).length
      ? data.schedule.map((item) => listItem("L", item.title, `${item.course_title} | ${item.batch_name || "All batches"}`, new Date(item.starts_at).toLocaleString())).join("")
      : empty("No upcoming live classes are scheduled.");
    document.getElementById("trainer-submissions").innerHTML = (data.submissions || []).length
      ? data.submissions.map((item) => listItem("A", item.student_name, `${item.assignment_title} | ${item.course_title}`, item.status)).join("")
      : empty("No assignment submissions are awaiting review.");
    document.getElementById("trainer-announcements").innerHTML = (data.announcements || []).length
      ? data.announcements.map((item) => listItem("N", item.title, item.message, new Date(item.created_at).toLocaleDateString())).join("")
      : empty("No announcements are published for trainers.");
  }

  function renderProfile(view) {
    const profile = view.profile || {};
    content.innerHTML = `
      <section class="trainer-detail-head"><p>Trainer Portal</p><h1>${esc(view.title)}</h1><span>${esc(view.subtitle)}</span></section>
      <article class="trainer-card trainer-profile-form">
        <form id="trainer-profile-form" enctype="multipart/form-data">
          <div class="trainer-form-grid">
            <label>Full Name<input name="full_name" value="${esc(profile.full_name)}" required></label>
            <label>Email<input name="email" type="email" value="${esc(profile.email)}" required></label>
            <label>Username<input value="${esc(profile.username)}" disabled></label>
            <label>Phone<input name="phone" value="${esc(profile.phone)}"></label>
            <label>Specialization<input name="specialization" value="${esc(profile.specialization)}"></label>
            <label>Experience Years<input name="experience_years" type="number" min="0" max="80" value="${esc(profile.experience_years)}"></label>
            <label>Qualification<input name="qualification" value="${esc(profile.qualification)}"></label>
            <label>Profile Image<input name="profile_image" type="file" accept=".jpg,.jpeg,.png,.webp"></label>
            <label>Current Password<input name="current_password" type="password"></label>
            <label>New Password<input name="new_password" type="password" minlength="8"></label>
          </div>
          <div class="trainer-form-message" id="trainer-form-message"></div>
          <button class="trainer-save" type="submit">Save Profile</button>
        </form>
      </article>
    `;

    document.getElementById("trainer-profile-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = document.getElementById("trainer-form-message");
      const formData = new FormData(form);
      formData.append("action", "update_profile");
      formData.append("csrf_token", csrfToken);
      try {
        const response = await fetch(apiUrl, { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrfToken }, body: formData });
        const result = await response.json();
        message.textContent = result.message || "Request completed.";
        message.className = `trainer-form-message ${response.ok && result.success ? "success" : "error"}`;
        if (response.ok && result.success) {
          data.profile.fullName = formData.get("full_name");
          data.profile.firstName = String(formData.get("full_name")).trim().split(/\s+/)[0];
          updateProfile();
        }
      } catch {
        message.textContent = "Unable to update the profile.";
        message.className = "trainer-form-message error";
      }
    });
  }

  function renderTable(view) {
    const rows = view.rows || [];
    content.innerHTML = `
      <section class="trainer-detail-head"><p>Trainer Portal</p><h1>${esc(view.title)}</h1><span>${esc(view.subtitle)}</span></section>
      <article class="trainer-card trainer-table-card">
        ${rows.length ? `<div class="trainer-table-wrap"><table class="trainer-table"><thead><tr>${view.columns.map((column) => `<th>${esc(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${view.columns.map((column) => `<td>${esc(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : empty("No database records are available for this section.")}
      </article>
    `;
  }

  function optionList(items = [], selected = "", labelKey = "title") {
    return items.map((item) => `<option value="${Number(item.id)}" ${Number(selected) === Number(item.id) ? "selected" : ""}>${esc(item[labelKey] || item.batch_name || item.title || item.id)}</option>`).join("");
  }

  function dateTimeValue(value) {
    return value ? String(value).replace(" ", "T").slice(0, 16) : "";
  }

  async function trainerPost(payload) {
    const response = await fetch(apiUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ ...payload, csrf_token: csrfToken }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
    return result;
  }

  function trainerNotice(message, type = "success") {
    const toast = document.getElementById("trainer-toast");
    toast.textContent = message;
    toast.className = `trainer-toast show ${type === "error" ? "error" : "success"}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toast.classList.remove("show", "error", "success"), 2200);
  }

  function renderTrainerAssignments(view) {
    const rows = view.rows || [];
    const courses = view.options?.courses || [];
    const batches = view.options?.batches || [];
    content.innerHTML = `
      <section class="trainer-detail-head"><p>Trainer Portal</p><h1>${esc(view.title)}</h1><span>${esc(view.subtitle)}</span></section>
      <article class="trainer-card trainer-profile-form">
        <form id="trainer-assignment-form">
          <input type="hidden" id="ta-id">
          <div class="trainer-form-grid">
            <label>Title<input id="ta-title" required></label>
            <label>Course<select id="ta-course" required><option value="">Select course</option>${optionList(courses)}</select></label>
            <label>Batch<select id="ta-batch"><option value="">All batches</option>${optionList(batches, "", "batch_name")}</select></label>
            <label>Due Date<input id="ta-due" type="datetime-local"></label>
            <label>Status<select id="ta-status"><option value="published">Published</option><option value="draft">Draft</option><option value="closed">Closed</option></select></label>
            <label class="trainer-form-wide">Description<textarea id="ta-description"></textarea></label>
          </div>
          <div class="trainer-form-message" id="ta-message"></div>
          <button class="trainer-save" type="submit">Save Assignment</button>
          <button class="trainer-secondary" type="button" id="ta-reset">Clear</button>
        </form>
      </article>
      <article class="trainer-card trainer-table-card">
        ${rows.length ? `<div class="trainer-table-wrap"><table class="trainer-table"><thead><tr><th>Assignment</th><th>Course</th><th>Batch</th><th>Due</th><th>Submissions</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map((row) => `
          <tr>
            <td>${esc(row.title)}</td><td>${esc(row.course_title || "")}</td><td>${esc(row.batch_name || "All batches")}</td>
            <td>${row.due_date ? new Date(String(row.due_date).replace(" ", "T")).toLocaleString() : "No due date"}</td>
            <td>${Number(row.submissions || 0)} (${Number(row.pending || 0)} pending)</td><td>${esc(row.status)}</td>
            <td><button class="trainer-row-btn" data-assignment-edit="${Number(row.id)}">Edit</button><button class="trainer-row-btn danger" data-assignment-delete="${Number(row.id)}">Delete</button></td>
          </tr>`).join("")}</tbody></table></div>` : empty("No assignments created yet.")}
      </article>
    `;
    const clearForm = () => {
      ["ta-id","ta-title","ta-course","ta-batch","ta-due","ta-description"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
      document.getElementById("ta-status").value = "published";
    };
    document.getElementById("ta-reset").addEventListener("click", clearForm);
    document.getElementById("trainer-assignment-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await trainerPost({
          action: "save_assignment",
          id: document.getElementById("ta-id").value,
          title: document.getElementById("ta-title").value.trim(),
          course_id: document.getElementById("ta-course").value,
          batch_id: document.getElementById("ta-batch").value || null,
          due_date: document.getElementById("ta-due").value || null,
          description: document.getElementById("ta-description").value.trim(),
          status: document.getElementById("ta-status").value,
        });
        trainerNotice("Assignment saved");
        openView("Assignments");
      } catch (error) {
        trainerNotice(error.message, "error");
      }
    });
    content.querySelectorAll("[data-assignment-edit]").forEach((button) => button.addEventListener("click", () => {
      const row = rows.find((item) => Number(item.id) === Number(button.dataset.assignmentEdit));
      if (!row) return;
      document.getElementById("ta-id").value = row.id;
      document.getElementById("ta-title").value = row.title || "";
      document.getElementById("ta-course").value = row.course_id || "";
      document.getElementById("ta-batch").value = row.batch_id || "";
      document.getElementById("ta-due").value = dateTimeValue(row.due_date);
      document.getElementById("ta-description").value = row.description || "";
      document.getElementById("ta-status").value = row.status || "published";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    content.querySelectorAll("[data-assignment-delete]").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm("Delete this assignment?")) return;
      try {
        await trainerPost({ action: "delete_assignment", id: button.dataset.assignmentDelete });
        trainerNotice("Assignment deleted");
        openView("Assignments");
      } catch (error) {
        trainerNotice(error.message, "error");
      }
    }));
  }

  function renderTrainerAnnouncements(view) {
    const rows = view.rows || [];
    const courses = view.options?.courses || [];
    const batches = view.options?.batches || [];
    content.innerHTML = `
      <section class="trainer-detail-head"><p>Trainer Portal</p><h1>${esc(view.title)}</h1><span>${esc(view.subtitle)}</span></section>
      <article class="trainer-card trainer-profile-form">
        <form id="trainer-announcement-form">
          <input type="hidden" id="tn-id">
          <div class="trainer-form-grid">
            <label>Title<input id="tn-title" required></label>
            <label>Target<select id="tn-target"><option value="course">Course</option><option value="batch">Batch</option></select></label>
            <label>Course<select id="tn-course"><option value="">Select course</option>${optionList(courses)}</select></label>
            <label>Batch<select id="tn-batch"><option value="">Select batch</option>${optionList(batches, "", "batch_name")}</select></label>
            <label>Status<select id="tn-status"><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
            <label class="trainer-form-wide">Message<textarea id="tn-message" required></textarea></label>
          </div>
          <button class="trainer-save" type="submit">Save Announcement</button>
          <button class="trainer-secondary" type="button" id="tn-reset">Clear</button>
        </form>
      </article>
      <article class="trainer-card trainer-table-card">
        ${rows.length ? `<div class="trainer-table-wrap"><table class="trainer-table"><thead><tr><th>Title</th><th>Message</th><th>Target</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows.map((row) => `
          <tr>
            <td>${esc(row.title)}</td><td>${esc(row.message)}</td><td>${esc(row.target_type || row.target_role || "all")}</td><td>${esc(row.status)}</td>
            <td>${row.created_at ? new Date(String(row.created_at).replace(" ", "T")).toLocaleDateString() : ""}</td>
            <td>${Number(row.can_manage) ? `<button class="trainer-row-btn" data-announcement-edit="${Number(row.id)}">Edit</button><button class="trainer-row-btn danger" data-announcement-delete="${Number(row.id)}">Delete</button>` : `<span class="trainer-muted">View only</span>`}</td>
          </tr>`).join("")}</tbody></table></div>` : empty("No announcements are available yet.")}
      </article>
    `;
    const clearForm = () => {
      ["tn-id","tn-title","tn-course","tn-batch","tn-message"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
      document.getElementById("tn-target").value = "course";
      document.getElementById("tn-status").value = "published";
    };
    document.getElementById("tn-reset").addEventListener("click", clearForm);
    document.getElementById("trainer-announcement-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await trainerPost({
          action: "save_announcement",
          id: document.getElementById("tn-id").value,
          title: document.getElementById("tn-title").value.trim(),
          message: document.getElementById("tn-message").value.trim(),
          target_type: document.getElementById("tn-target").value,
          course_id: document.getElementById("tn-course").value || null,
          batch_id: document.getElementById("tn-batch").value || null,
          status: document.getElementById("tn-status").value,
        });
        trainerNotice("Announcement saved");
        openView("Announcements");
      } catch (error) {
        trainerNotice(error.message, "error");
      }
    });
    content.querySelectorAll("[data-announcement-edit]").forEach((button) => button.addEventListener("click", () => {
      const row = rows.find((item) => Number(item.id) === Number(button.dataset.announcementEdit));
      if (!row) return;
      document.getElementById("tn-id").value = row.id;
      document.getElementById("tn-title").value = row.title || "";
      document.getElementById("tn-message").value = row.message || "";
      document.getElementById("tn-target").value = row.target_type === "batch" ? "batch" : "course";
      document.getElementById("tn-course").value = row.course_id || "";
      document.getElementById("tn-batch").value = row.batch_id || "";
      document.getElementById("tn-status").value = row.status || "published";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    content.querySelectorAll("[data-announcement-delete]").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm("Delete this announcement?")) return;
      try {
        await trainerPost({ action: "delete_announcement", id: button.dataset.announcementDelete });
        trainerNotice("Announcement deleted");
        openView("Announcements");
      } catch (error) {
        trainerNotice(error.message, "error");
      }
    }));
  }

  function renderMessagesView() {
    content.innerHTML = `<div id="trainer-messages-root"></div>`;
    if (!window.EEPLMessages) {
      content.innerHTML = empty("The messaging asset could not be loaded.");
      return;
    }

    window.EEPLMessages.mount(document.getElementById("trainer-messages-root"), {
      role: "trainer",
      title: "Messages",
      subtitle: "Message Admin or students enrolled in your assigned courses.",
      apiBase: messagesApi,
      csrfToken,
      notify(message, type) {
        const toast = document.getElementById("trainer-toast");
        toast.textContent = message;
        toast.className = `trainer-toast show ${type === "error" ? "error" : "success"}`;
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => toast.classList.remove("show", "error", "success"), 2200);
      },
      onUnreadChange(count) {
        data.profile = data.profile || {};
        data.profile.messages = count;
        updateProfile();
      },
    });
  }

  async function openView(viewName) {
    document.querySelectorAll("#trainer-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
    document.body.classList.remove("sidebar-open");
    if (viewName === "Dashboard") {
      renderDashboard();
      history.replaceState({}, "", location.pathname);
      return;
    }
    if (viewName === "Messages") {
      renderMessagesView();
      history.replaceState({}, "", `#${encodeURIComponent(viewName)}`);
      return;
    }
    content.innerHTML = `<div class="trainer-empty"><strong>Loading</strong><span>Fetching ${esc(viewName)} data...</span></div>`;
    try {
      const response = await fetch(`${apiUrl}?view=${encodeURIComponent(viewName)}`, { credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load data");
      if (result.data.type === "profile") renderProfile(result.data);
      else if (result.data.type === "trainer_assignments") renderTrainerAssignments(result.data);
      else if (result.data.type === "trainer_announcements") renderTrainerAnnouncements(result.data);
      else renderTable(result.data);
      history.replaceState({}, "", `#${encodeURIComponent(viewName)}`);
    } catch (error) {
      content.innerHTML = empty(error.message);
    }
  }

  function updateProfile() {
    const profile = data.profile || {};
    document.getElementById("trainer-welcome").textContent = `Welcome back, ${profile.firstName || "Trainer"}!`;
    document.getElementById("trainer-name").textContent = profile.fullName || "Trainer";
    document.getElementById("trainer-avatar").src = profile.avatar || "../assets/dashboard/amit-avatar.jpg";
    document.getElementById("trainer-avatar").alt = profile.fullName || "Trainer";
    document.getElementById("trainer-message-badge").textContent = profile.messages || 0;
    document.getElementById("top-message-badge").textContent = profile.messages || 0;
  }

  function init() {
    updateProfile();
    dashboardHtml = content.innerHTML;
    renderDashboard();
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view]");
      if (button) openView(button.dataset.view);
    });
    document.getElementById("trainer-menu").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
    document.getElementById("trainer-backdrop").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        document.getElementById("trainer-search").focus();
      }
    });
    document.getElementById("trainer-search").addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll(".trainer-list-item, .trainer-table tbody tr").forEach((item) => {
        item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
      });
    });
    const initial = decodeURIComponent(location.hash.replace("#", ""));
    if (initial) openView(initial);
  }

  init();
})();
