/* ============================================================
   EEPL Admin Panel — admin.js
   Full SPA: Dashboard, Home Editor, Courses, Webinars,
   Posts, Testimonials, Trusted-By, FAQs, Counters,
   Navigation, Media Library, Contact Leads, Settings
   ============================================================ */

const API = (() => {
  if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  const path = window.location.pathname || "";
  const frontendIndex = path.toLowerCase().indexOf("/frontend");
  if (frontendIndex >= 0) {
    return `${path.slice(0, frontendIndex)}/Backend/public/index.php`;
  }
  return "/Backend/public/index.php";
})();
const ADMIN_FRONTEND_BASE = (() => {
  const path = window.location.pathname || "";
  const frontendIndex = path.toLowerCase().indexOf("/frontend");
  if (frontendIndex >= 0) return `${path.slice(0, frontendIndex)}/Frontend`;
  return "/Frontend";
})();
const TOKEN_KEY = 'eepl_admin_token';
const ADMIN_KEY = 'eepl_admin_user';
const MESSAGES_API = window.MESSAGES_API_BASE || "../../Backend/api";
const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ADMIN_ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  trainer: '<circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2M4 4l8-3 8 3-8 3z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 6.5v13A2.5 2.5 0 0 0 6.5 22H20"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"/>',
  file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.3 2 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1M12 5v14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  megaphone: '<path d="M3 11v2l13 5V6zM16 9h3a2 2 0 0 1 0 4h-3M6 14l1 6h4l-1-5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  star: '<path d="m12 2 3 6 6.5 1-4.75 4.6 1.1 6.4L12 17l-5.85 3 1.1-6.4L2.5 9 9 8z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
  video: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3z"/>',
  leads: '<path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
};

function adminIcon(name, className = '') {
  const paths = ADMIN_ICON_PATHS[name] || ADMIN_ICON_PATHS.file;
  return `<svg class="admin-icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

function hydrateAdminIcons() {
  const pageIcons = {
    dashboard: 'dashboard', 'lms-users': 'users', 'lms-trainers': 'trainer',
    courses: 'book', 'lms-batches': 'clipboard', 'lms-enrollments': 'clipboard',
    'lms-assignments': 'file', 'lms-assessments': 'check', 'lms-certificates': 'award',
    'lms-materials': 'file', 'lms-payments': 'money', 'lms-messages': 'mail',
    'lms-announcements': 'megaphone', 'lms-reports': 'chart', 'home-editor': 'home',
    'home-popups': 'image', 'trusted-by': 'users', testimonials: 'star', faqs: 'help',
    counters: 'chart', 'navigation-menu': 'link', 'course-categories': 'clipboard',
    webinars: 'video', posts: 'file', media: 'image', 'contact-leads': 'leads', settings: 'settings',
  };
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const icon = item.querySelector('.nav-icon');
    if (icon) icon.innerHTML = adminIcon(pageIcons[item.dataset.page] || 'file');
  });

  const setIcon = (selector, name, keepChildren = false) => {
    const element = document.querySelector(selector);
    if (!element) return;
    if (keepChildren) {
      Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
      element.insertAdjacentHTML('afterbegin', adminIcon(name));
    } else {
      element.innerHTML = adminIcon(name);
    }
  };
  setIcon('#topbar-menu-btn', 'menu');
  setIcon('#sidebar-close', 'close');
  setIcon('.topbar-search-icon', 'search');
  setIcon('#admin-notifications', 'bell', true);
  setIcon('#admin-messages', 'mail', true);
  document.getElementById('logout-btn').innerHTML = `${adminIcon('logout')}<span>Sign Out</span>`;
  setIcon('#modal-close', 'close');
}

function repairBrokenLeadingIcons(root = document) {
  root.querySelectorAll?.('button, .card-title, .empty-state-icon').forEach(element => {
    const text = element.textContent.trim();
    if (!text) return;
    const parts = text.split(/\s+/);
    if (!/[ðâï]/.test(parts[0])) return;
    const cleanText = parts.slice(1).join(' ');
    if (cleanText) {
      element.textContent = cleanText;
    } else if (element.matches('.btn-danger')) {
      element.innerHTML = `${adminIcon('trash')}<span class="sr-only">Delete</span>`;
    } else if (element.matches('button')) {
      element.innerHTML = `${adminIcon('edit')}<span class="sr-only">Edit</span>`;
    } else {
      element.textContent = '';
    }
  });
}

function hydrateDynamicAdminIcons(root = document) {
  const statIcons = ['users', 'trainer', 'book', 'clipboard', 'clipboard', 'money', 'file', 'check'];
  root.querySelectorAll?.('.stat-icon').forEach((element, index) => {
    if (element.dataset.iconReady) return;
    element.innerHTML = adminIcon(statIcons[index % statIcons.length]);
    element.dataset.iconReady = '1';
  });

  const quickIcons = ['book', 'video', 'file', 'upload', 'leads', 'settings'];
  root.querySelectorAll?.('.dashboard-quick-grid button span').forEach((element, index) => {
    if (element.dataset.iconReady) return;
    element.innerHTML = adminIcon(quickIcons[index % quickIcons.length]);
    element.dataset.iconReady = '1';
  });

  const uploadIcon = root.querySelector?.('#upload-zone > div:first-child');
  if (uploadIcon && !uploadIcon.dataset.iconReady) {
    uploadIcon.innerHTML = adminIcon('upload');
    uploadIcon.dataset.iconReady = '1';
  }
}

// ── State ──────────────────────────────────────────────────
let currentPage = 'dashboard';
let adminToken = localStorage.getItem(TOKEN_KEY) || null;
let adminUser  = JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null');

// ── API Helper ─────────────────────────────────────────────
async function api(method, path, data = null, isForm = false) {
  const opts = {
    method,
    headers: {}
  };
  if (adminToken) opts.headers['Authorization'] = 'Bearer ' + adminToken;
  if (data && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  } else if (data && isForm) {
    opts.body = data; // FormData
  }
  try {
    const res = await fetch(API + '/v1/' + path, opts);
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { success: false, message: text || `Server returned ${res.status}` };
    }
    if (res.status === 401 && path !== 'auth/admin-login') {
      logout();
      toast('Your session expired. Please sign in again.', 'error');
    }
    return { ok: res.ok, status: res.status, data: json };
  } catch(e) {
    return { ok: false, status: 0, data: { success: false, message: 'Cannot reach the LMS API' } };
  }
}

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast toast-' + type;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ── Modal ──────────────────────────────────────────────────
function adminAssetUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (/^\/?Frontend\//i.test(value)) {
    const cleanFrontend = value.replace(/^\/?Frontend\//i, '');
    return `${ADMIN_FRONTEND_BASE}/${cleanFrontend}`.replace(/([^:]\/)\/+/g, '$1');
  }
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
  const clean = value.replace(/^(\.\/)+/, '').replace(/^(\.\.\/)+/, '').replace(/^\/+/, '').replace(/^Frontend\//i, '');
  return `${ADMIN_FRONTEND_BASE}/${clean}`.replace(/([^:]\/)\/+/g, '$1');
}

function cacheBustUrl(url) {
  if (!url || /^(data:|blob:)/i.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
}

function imageUploadField(id, label, value = '', helper = 'JPG, PNG, or WEBP. Max 5MB.') {
  const previewUrl = adminAssetUrl(value);
  return `
    <input type="hidden" id="${id}" value="${esc(value)}">
    <div class="image-upload-control" data-upload-control="${id}">
      <label class="image-upload-box" for="${id}-file">
        <span class="image-upload-icon">+</span>
        <span>
          <strong>${esc(label)}</strong>
          <small>JPG, JPEG, PNG, WEBP up to 5MB</small>
        </span>
      </label>
      <input id="${id}-file" class="image-file-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
      <p class="form-hint">${esc(helper)}</p>
      <img id="${id}-preview" class="img-preview ${previewUrl ? '' : 'hidden'}" src="${esc(previewUrl)}" alt="${esc(label)} preview" onerror="this.classList.add('hidden')">
    </div>`;
}

function validateImageFile(file) {
  if (!file) return '';
  if (!IMAGE_UPLOAD_TYPES.includes(file.type)) return 'Only JPG, JPEG, PNG, and WEBP images are allowed.';
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) return 'Image is too large. Maximum size is 5MB.';
  return '';
}

function setImageValue(id, value, bustCache = false) {
  setValue(id, value || '');
  const preview = document.getElementById(`${id}-preview`);
  if (!preview) return;
  if (preview._objectUrl) {
    URL.revokeObjectURL(preview._objectUrl);
    preview._objectUrl = null;
  }
  if (value) {
    const src = adminAssetUrl(value);
    preview.src = bustCache ? cacheBustUrl(src) : src;
    preview.classList.remove('hidden');
  } else {
    preview.removeAttribute('src');
    preview.classList.add('hidden');
  }
}

function bindImageUploadPreview(id) {
  const input = document.getElementById(`${id}-file`);
  const hidden = document.getElementById(id);
  const preview = document.getElementById(`${id}-preview`);
  if (!input || !hidden || !preview) return;
  if (hidden.value) setImageValue(id, hidden.value);
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      input.value = '';
      toast(error, 'error');
      return;
    }
    if (preview._objectUrl) URL.revokeObjectURL(preview._objectUrl);
    preview._objectUrl = URL.createObjectURL(file);
    preview.src = preview._objectUrl;
    preview.classList.remove('hidden');
  };
}

async function uploadImageField(id, folder) {
  const input = document.getElementById(`${id}-file`);
  const hidden = document.getElementById(id);
  const file = input?.files?.[0];
  if (!file) return hidden ? hidden.value.trim() : '';

  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const r = await api('POST', 'admin/media/upload', fd, true);
  if (!r.ok || !r.data.success) throw new Error(r.data.message || 'Image upload failed');
  const path = r.data.data?.file_url || '';
  if (!path) throw new Error('Upload succeeded but no image path was returned');
  input.value = '';
  setImageValue(id, path, true);
  return path;
}

function openModal(title, bodyHTML, onConfirm, confirmText = 'Save') {
  const footer = document.getElementById('modal-footer');
  footer.innerHTML = `
    <button class="btn-secondary" id="modal-cancel" type="button">Cancel</button>
    <button class="btn-primary" id="modal-confirm" type="button">${esc(confirmText)}</button>
  `;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-confirm').onclick = onConfirm || (() => {});
}

function openInfoModal(title, bodyHTML, closeText = 'Close') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = `<button class="btn-secondary" id="modal-info-close" type="button">${esc(closeText)}</button>`;
  document.getElementById('modal-info-close').onclick = closeModal;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ── Auth ───────────────────────────────────────────────────
function isLoggedIn() { return !!adminToken; }

async function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  adminToken = null; adminUser = null;
  try {
    await fetch('../../Backend/logout.php', { method: 'POST', credentials: 'same-origin' });
  } catch (_) {}
  window.location.href = '../login.php?role=admin';
}

async function doLogin(email, password) {
  const r = await api('POST', 'auth/admin-login', { email, password });
  if (r.ok && r.data.success) {
    adminToken = r.data.data.token;
    adminUser  = r.data.data.admin;
    localStorage.setItem(TOKEN_KEY, adminToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminUser));
    return true;
  }
  return r.data.message || 'Login failed';
}

// ── Navigation ─────────────────────────────────────────────
const PAGE_TITLES = {
  'dashboard': 'Dashboard', 'home-editor': 'Home Page Editor',
  'home-popups': 'Pop ups',
  'courses': 'Courses', 'course-categories': 'Course Categories',
  'webinars': 'Webinars', 'posts': 'Blogs & Articles',
  'testimonials': 'Testimonials', 'trusted-by': 'Trusted By Partners',
  'faqs': 'FAQs Manager', 'counters': 'Stats / Counters',
  'navigation-menu': 'Navigation Menu',
  'media': 'Media & Gallery', 'contact-leads': 'Contact Leads',
  'settings': 'Settings',
  'lms-users': 'Manage Users', 'lms-trainers': 'Manage Trainers',
  'lms-batches': 'Manage Batches', 'lms-enrollments': 'Enrollments',
  'lms-assignments': 'Assignments', 'lms-assessments': 'Assessments',
  'lms-certificates': 'Certificates', 'lms-materials': 'Study Materials',
  'lms-payments': 'Payments', 'lms-messages': 'Messages',
  'lms-announcements': 'Announcements', 'lms-reports': 'Reports',
};

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;
  // close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  renderPage(page);
}

async function renderPage(page) {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="loading-block"><div class="loading-ring"></div></div>`;
  switch (page) {
    case 'dashboard':       return renderDashboard();
    case 'home-editor':     return renderHomeEditor();
    case 'home-popups':     return renderHomePopups();
    case 'courses':         return renderCourses();
    case 'course-categories': return renderCourseCategories();
    case 'webinars':        return renderWebinars();
    case 'posts':           return renderPosts();
    case 'testimonials':    return renderTestimonials();
    case 'trusted-by':      return renderTrustedBy();
    case 'faqs':            return renderFaqs();
    case 'counters':        return renderCounters();
    case 'navigation-menu': return renderNavigationMenu();
    case 'media':           return renderMedia();
    case 'contact-leads':   return renderContactLeads();
    case 'settings':        return renderSettings();
    case 'lms-users':       return renderLmsResource('users');
    case 'lms-trainers':    return renderLmsResource('trainers');
    case 'lms-batches':     return renderLmsResource('batches');
    case 'lms-enrollments': return renderLmsResource('enrollments');
    case 'lms-assignments': return renderLmsResource('assignments');
    case 'lms-assessments': return renderLmsResource('assessments');
    case 'lms-certificates':return renderLmsResource('certificates');
    case 'lms-materials':   return renderLmsResource('materials');
    case 'lms-payments':    return renderLmsResource('payments');
    case 'lms-messages':    return renderMessagesPage();
    case 'lms-announcements': return renderLmsResource('announcements');
    case 'lms-reports':     return renderLmsResource('reports');
    default: content.innerHTML = '<p>Page not found</p>';
  }
}

// ── DASHBOARD ─────────────────────────────────────────────
async function renderDashboard() {
  const r = await api('GET', 'admin/dashboard');
  const content = document.getElementById('admin-content');
  if (!r.ok) { content.innerHTML = '<p class="text-muted">Failed to load dashboard</p>'; return; }
  const { stats, recent_leads, recent_enrollments, recent_registrations = [] } = r.data.data;
  document.querySelector('#admin-notifications span').textContent = stats.notifications || 0;
  document.querySelector('#admin-messages span').textContent = stats.messages || 0;
  const statItems = [
    { icon:'👨‍🎓', label:'Total Students', value: stats.students },
    { icon:'🧑‍🏫', label:'Total Trainers', value: stats.trainers },
    { icon:'📚', label:'Total Courses', value: stats.courses },
    { icon:'▣', label:'Total Batches', value: stats.batches },
    { icon:'📋', label:'Enrollments', value: stats.enrollments },
    { icon:'₹', label:'Paid Revenue', value: `₹${Number(stats.revenue || 0).toLocaleString('en-IN')}` },
    { icon:'☷', label:'Assignments', value: stats.assignments },
    { icon:'!', label:'Pending Approvals', value: stats.pending },
  ];
  content.innerHTML = `
    <div class="stats-grid">
      ${statItems.map(s => `
        <div class="stat-card">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('')}
    </div>
    <div class="dashboard-detail-grid">
      <div class="card">
        <div class="card-title">📩 Recent Leads</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Contact</th><th>Status</th></tr></thead>
            <tbody>${recent_leads.length ? recent_leads.map(l => `
              <tr>
                <td><b>${esc(l.name)}</b></td>
                <td class="text-muted">${esc(l.email||l.phone||'—')}</td>
                <td><span class="badge ${l.status==='new'?'badge-cyan':'badge-green'}">${l.status}</span></td>
              </tr>`).join('') : '<tr><td colspan="3" class="text-muted">No leads yet</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Recent Enrollments</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Course</th></tr></thead>
            <tbody>${recent_enrollments.length ? recent_enrollments.map(e => `
              <tr>
                <td>${esc(e.student||'—')}</td>
                <td class="text-muted">${esc(e.course||'—')}</td>
              </tr>`).join('') : '<tr><td colspan="2" class="text-muted">No enrollments yet</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-title">Recent Registrations</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Registered</th></tr></thead>
          <tbody>${recent_registrations.length ? recent_registrations.map(user => `
            <tr>
              <td><b>${esc(user.name)}</b></td>
              <td>${esc(user.email)}</td>
              <td>${esc(user.role)}</td>
              <td><span class="badge ${user.status === 'active' ? 'badge-green' : 'badge-yellow'}">${esc(user.status)}</span></td>
              <td class="text-muted">${new Date(user.created_at).toLocaleDateString()}</td>
            </tr>`).join('') : '<tr><td colspan="5" class="text-muted">No registrations yet</td></tr>'}</tbody>
        </table>
      </div>
    </div>
    <div class="dashboard-quick-card card">
      <div class="card-title">Quick Actions</div>
      <div class="dashboard-quick-grid">
        <button type="button" onclick="navigate('courses')"><span>＋</span>Manage Courses</button>
        <button type="button" onclick="navigate('webinars')"><span>◫</span>Schedule Webinar</button>
        <button type="button" onclick="navigate('posts')"><span>▤</span>Publish Article</button>
        <button type="button" onclick="navigate('media')"><span>▧</span>Upload Media</button>
        <button type="button" onclick="navigate('contact-leads')"><span>✉</span>View Inquiries</button>
        <button type="button" onclick="navigate('settings')"><span>⚙</span>Site Settings</button>
      </div>
    </div>`;
}

const LMS_STATUS_OPTIONS = {
  users: ['active','inactive','suspended'],
  trainers: ['active','inactive','suspended'],
  batches: ['draft','active','completed','cancelled'],
  assignments: ['draft','published','closed'],
  assessments: ['draft','published','completed','cancelled'],
  certificates: ['active','pending','revoked'],
  materials: ['draft','published','archived'],
  payments: ['pending','paid','failed','refunded'],
  announcements: ['draft','published','archived'],
};

async function renderLmsResource(resource) {
  if (['batches','assignments','certificates','announcements'].includes(resource)) {
    return renderManagedLmsResource(resource);
  }
  const content = document.getElementById('admin-content');
  const r = await api('GET', `admin/lms/${resource}`);
  if (!r.ok || !r.data.success) {
    content.innerHTML = `<div class="card"><p class="text-muted">${esc(r.data.message || 'Unable to load LMS data')}</p></div>`;
    return;
  }
  const { title, columns, rows } = r.data.data;
  const statusOptions = LMS_STATUS_OPTIONS[resource] || null;
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">${esc(title)}</div><div class="page-subtitle">Live database records from the LMS</div></div>
      <button class="btn-secondary" type="button" onclick="renderLmsResource('${esc(resource)}')">Refresh</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>${columns.map(column => `<th>${esc(column)}</th>`).join('')}</tr></thead>
          <tbody>${rows.length ? rows.map(row => `
            <tr>${columns.map(column => {
              if (column === 'Status' && statusOptions && row.ID) {
                return `<td><select class="form-control lms-status-select" onchange="updateLmsStatus('${esc(resource)}',${Number(row.ID)},this.value)" aria-label="Update status">${statusOptions.map(option => `<option value="${option}" ${String(row[column]).toLowerCase() === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></td>`;
              }
              return `<td>${esc(row[column] ?? '')}</td>`;
            }).join('')}</tr>
          `).join('') : `<tr><td colspan="${columns.length}" class="text-muted">No records found</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
}

async function renderManagedLmsResource(resource) {
  const content = document.getElementById('admin-content');
  const [listResponse, optionsResponse] = await Promise.all([
    api('GET', `admin/lms/${resource}`),
    api('GET', 'admin/lms/options'),
  ]);
  if (!listResponse.ok || !listResponse.data.success) {
    content.innerHTML = `<div class="card"><p class="text-muted">${esc(listResponse.data.message || 'Unable to load LMS data')}</p></div>`;
    return;
  }
  const options = optionsResponse.ok ? optionsResponse.data.data : {};
  const { title, columns, rows } = listResponse.data.data;
  const statusOptions = LMS_STATUS_OPTIONS[resource] || null;
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">${esc(title)}</div><div class="page-subtitle">Add, edit, delete, and manage LMS records</div></div>
      <div class="page-actions">
        <button class="btn-secondary" type="button" onclick="renderLmsResource('${esc(resource)}')">Refresh</button>
        <button class="btn-primary" type="button" onclick="openLmsRecordModal('${esc(resource)}')">+ Add ${esc(lmsSingular(resource))}</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>${columns.map(column => `<th>${esc(column)}</th>`).join('')}<th>Actions</th></tr></thead>
          <tbody>${rows.length ? rows.map(row => `
            <tr>${columns.map(column => {
              if (column === 'Status' && statusOptions && row.ID) {
                return `<td><select class="form-control lms-status-select" onchange="updateLmsStatus('${esc(resource)}',${Number(row.ID)},this.value)" aria-label="Update status">${statusOptions.map(option => `<option value="${option}" ${String(row[column]).toLowerCase() === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></td>`;
              }
              if (column === 'File' && row[column]) {
                return `<td><a href="${esc(adminAssetUrl(row[column]))}" target="_blank" rel="noopener">View</a></td>`;
              }
              return `<td>${esc(row[column] ?? '')}</td>`;
            }).join('')}
            <td><div style="display:flex;gap:6px">
              <button class="btn-icon btn-sm" onclick="openLmsRecordModal('${esc(resource)}',${Number(row.ID)})">Edit</button>
              <button class="btn-danger btn-sm" onclick="deleteLmsRecord('${esc(resource)}',${Number(row.ID)})">Delete</button>
            </div></td></tr>
          `).join('') : `<tr><td colspan="${columns.length + 1}" class="text-muted">No records found</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
  window._lmsOptions = options;
}

function lmsSingular(resource) {
  return ({ batches:'Batch', assignments:'Assignment', certificates:'Certificate', announcements:'Announcement' })[resource] || 'Record';
}

function lmsOptions(items = [], selected = '', valueKey = 'id', labelKey = 'title') {
  return items.map(item => `<option value="${Number(item[valueKey])}" ${Number(selected) === Number(item[valueKey]) ? 'selected' : ''}>${esc(item[labelKey] || item.name || item.title || item.email || item[valueKey])}</option>`).join('');
}

function lmsStudentOptions(students = [], selected = []) {
  const selectedSet = new Set((selected || []).map(Number));
  return students.map(item => `<option value="${Number(item.id)}" ${selectedSet.has(Number(item.id)) ? 'selected' : ''}>${esc(item.name)}${item.email ? ' - ' + esc(item.email) : ''}</option>`).join('');
}

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function toDateTimeInput(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

async function openLmsRecordModal(resource, id = null) {
  const optionsResponse = await api('GET', 'admin/lms/options');
  const options = optionsResponse.ok ? optionsResponse.data.data : {};
  let record = {};
  if (id) {
    const response = await api('GET', `admin/lms/${resource}/${id}`);
    if (!response.ok) return toast(response.data.message || 'Could not load record', 'error');
    record = response.data.data || {};
  }
  const body = lmsFormHtml(resource, record, options);
  openModal(id ? `Edit ${lmsSingular(resource)}` : `Add ${lmsSingular(resource)}`, body, async () => {
    const payload = lmsPayload(resource);
    const response = id
      ? await api('PATCH', `admin/lms/${resource}/${id}`, payload)
      : await api('POST', `admin/lms/${resource}`, payload);
    if (response.ok && response.data.success) {
      toast(`${lmsSingular(resource)} saved`);
      closeModal();
      renderLmsResource(resource);
    } else {
      toast(response.data.message || 'Save failed', 'error');
    }
  });
}

function lmsFormHtml(resource, d, o) {
  if (resource === 'batches') return `
    <div class="form-grid">
      <div class="form-group full"><label>Batch Name *</label><input id="lms-batch-name" class="form-control" value="${esc(d.batch_name||'')}" required></div>
      <div class="form-group"><label>Course *</label><select id="lms-course" class="form-control"><option value="">Select course</option>${lmsOptions(o.courses, d.course_id)}</select></div>
      <div class="form-group"><label>Trainer</label><select id="lms-trainer" class="form-control"><option value="">Unassigned</option>${lmsOptions(o.trainers, d.trainer_id, 'id', 'name')}</select></div>
      <div class="form-group"><label>Start Date</label><input id="lms-start" type="date" class="form-control" value="${toDateInput(d.start_date)}"></div>
      <div class="form-group"><label>End Date</label><input id="lms-end" type="date" class="form-control" value="${toDateInput(d.end_date)}"></div>
      <div class="form-group full"><label>Schedule</label><input id="lms-schedule" class="form-control" value="${esc(d.schedule_text||'')}" placeholder="Mon/Wed/Fri 6 PM"></div>
      <div class="form-group full"><label>Assign Students</label><select id="lms-students" class="form-control" multiple size="7">${lmsStudentOptions(o.students, d.student_ids || [])}</select><p class="form-hint">Selected students will be linked to this batch through enrollments.</p></div>
      <div class="form-group"><label>Status</label><select id="lms-status" class="form-control">${LMS_STATUS_OPTIONS.batches.map(s=>`<option value="${s}" ${String(d.status||'active')===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>`;
  if (resource === 'assignments') return `
    <div class="form-grid">
      <div class="form-group full"><label>Title *</label><input id="lms-title" class="form-control" value="${esc(d.title||'')}" required></div>
      <div class="form-group"><label>Course *</label><select id="lms-course" class="form-control"><option value="">Select course</option>${lmsOptions(o.courses, d.course_id)}</select></div>
      <div class="form-group"><label>Batch</label><select id="lms-batch" class="form-control"><option value="">All batches</option>${lmsOptions(o.batches, d.batch_id, 'id', 'name')}</select></div>
      <div class="form-group"><label>Trainer</label><select id="lms-trainer" class="form-control"><option value="">Unassigned</option>${lmsOptions(o.trainers, d.trainer_id, 'id', 'name')}</select></div>
      <div class="form-group"><label>Due Date</label><input id="lms-due" type="datetime-local" class="form-control" value="${toDateTimeInput(d.due_date)}"></div>
      <div class="form-group"><label>Max Marks</label><input id="lms-marks" type="number" class="form-control" value="${esc(d.max_marks||100)}"></div>
      <div class="form-group full"><label>Description</label><textarea id="lms-description" class="form-control">${esc(d.description||'')}</textarea></div>
      <div class="form-group full"><label>Attachment URL</label><input id="lms-attachment" class="form-control" value="${esc(d.attachment_url||'')}" placeholder="Optional file URL from Media Library"></div>
      <div class="form-group"><label>Status</label><select id="lms-status" class="form-control">${LMS_STATUS_OPTIONS.assignments.map(s=>`<option value="${s}" ${String(d.status||'published')===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>`;
  if (resource === 'announcements') return `
    <div class="form-grid">
      <div class="form-group full"><label>Title *</label><input id="lms-title" class="form-control" value="${esc(d.title||'')}" required></div>
      <div class="form-group full"><label>Message *</label><textarea id="lms-message" class="form-control">${esc(d.message||'')}</textarea></div>
      <div class="form-group"><label>Target Type</label><select id="lms-target-type" class="form-control"><option value="all" ${d.target_type==='all'?'selected':''}>All</option><option value="batch" ${d.target_type==='batch'?'selected':''}>Batch</option><option value="course" ${d.target_type==='course'?'selected':''}>Course</option><option value="trainer" ${d.target_type==='trainer'?'selected':''}>Trainer</option><option value="user" ${d.target_type==='user'?'selected':''}>User</option></select></div>
      <div class="form-group"><label>Audience Role</label><select id="lms-target-role" class="form-control"><option value="all" ${d.target_role==='all'?'selected':''}>All</option><option value="trainer" ${d.target_role==='trainer'?'selected':''}>Trainers</option><option value="user" ${d.target_role==='user'?'selected':''}>Users</option><option value="admin" ${d.target_role==='admin'?'selected':''}>Admins</option></select></div>
      <div class="form-group"><label>Course</label><select id="lms-course" class="form-control"><option value="">None</option>${lmsOptions(o.courses, d.course_id)}</select></div>
      <div class="form-group"><label>Batch</label><select id="lms-batch" class="form-control"><option value="">None</option>${lmsOptions(o.batches, d.batch_id, 'id', 'name')}</select></div>
      <div class="form-group"><label>Status</label><select id="lms-status" class="form-control">${LMS_STATUS_OPTIONS.announcements.map(s=>`<option value="${s}" ${String(d.status||'published')===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>`;
  return `
    <div class="form-grid">
      <div class="form-group"><label>Certificate Number</label><input id="lms-cert-no" class="form-control" value="${esc(d.certificate_number||'')}" placeholder="Auto-generated if empty"></div>
      <div class="form-group"><label>Title</label><input id="lms-title" class="form-control" value="${esc(d.title||'Course Completion Certificate')}"></div>
      <div class="form-group"><label>Student *</label><select id="lms-student" class="form-control"><option value="">Select student</option>${lmsOptions(o.students, d.student_id, 'id', 'name')}</select></div>
      <div class="form-group"><label>Course *</label><select id="lms-course" class="form-control"><option value="">Select course</option>${lmsOptions(o.courses, d.course_id)}</select></div>
      <div class="form-group"><label>Batch</label><select id="lms-batch" class="form-control"><option value="">None</option>${lmsOptions(o.batches, d.batch_id, 'id', 'name')}</select></div>
      <div class="form-group"><label>Issue Date</label><input id="lms-issued" type="date" class="form-control" value="${toDateInput(d.issued_date)}"></div>
      <div class="form-group full"><label>Certificate File URL</label><input id="lms-file" class="form-control" value="${esc(d.certificate_file||'')}" placeholder="Optional file URL from Media Library"></div>
      <div class="form-group"><label>Status</label><select id="lms-status" class="form-control">${['active','pending','revoked'].map(s=>`<option value="${s}" ${String(d.status||'active')===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>`;
}

function lmsPayload(resource) {
  if (resource === 'batches') {
    return {
      batch_name: getValue('lms-batch-name'), course_id: parseInt(getValue('lms-course')||0), trainer_id: parseInt(getValue('lms-trainer')||0)||null,
      start_date: getValue('lms-start') || null, end_date: getValue('lms-end') || null, schedule_text: getValue('lms-schedule'), status: getValue('lms-status'),
      student_ids: Array.from(document.getElementById('lms-students')?.selectedOptions || []).map(option => Number(option.value)),
    };
  }
  if (resource === 'assignments') {
    return {
      title: getValue('lms-title'), course_id: parseInt(getValue('lms-course')||0), batch_id: parseInt(getValue('lms-batch')||0)||null,
      trainer_id: parseInt(getValue('lms-trainer')||0)||null, due_date: getValue('lms-due') ? getValue('lms-due').replace('T',' ') : null,
      max_marks: parseFloat(getValue('lms-marks')||100), description: getValue('lms-description'), attachment_url: getValue('lms-attachment'), status: getValue('lms-status'),
    };
  }
  if (resource === 'announcements') {
    return {
      title: getValue('lms-title'), message: getValue('lms-message'), target_type: getValue('lms-target-type'), target_role: getValue('lms-target-role'),
      course_id: parseInt(getValue('lms-course')||0)||null, batch_id: parseInt(getValue('lms-batch')||0)||null, status: getValue('lms-status'),
    };
  }
  return {
    certificate_number: getValue('lms-cert-no'), title: getValue('lms-title'), student_id: parseInt(getValue('lms-student')||0),
    course_id: parseInt(getValue('lms-course')||0), batch_id: parseInt(getValue('lms-batch')||0)||null,
    issued_date: getValue('lms-issued') || null, certificate_file: getValue('lms-file'), status: getValue('lms-status'),
  };
}

async function deleteLmsRecord(resource, id) {
  if (!confirm(`Delete this ${lmsSingular(resource).toLowerCase()}?`)) return;
  const response = await api('DELETE', `admin/lms/${resource}/${id}`);
  if (response.ok && response.data.success) {
    toast(`${lmsSingular(resource)} deleted`);
    renderLmsResource(resource);
  } else {
    toast(response.data.message || 'Delete failed', 'error');
  }
}

function renderMessagesPage() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div id="admin-messages-root"></div>`;

  if (!window.EEPLMessages) {
    content.innerHTML = `<div class="card"><p class="text-muted">The messaging asset could not be loaded.</p></div>`;
    return;
  }

  window.EEPLMessages.mount(document.getElementById('admin-messages-root'), {
    role: 'admin',
    title: 'Messages',
    subtitle: 'Message users and trainers, review all conversations, and manage support queries.',
    apiBase: MESSAGES_API,
    csrfToken: document.querySelector('meta[name="csrf-token"]')?.content || '',
    notify: toast,
    onUnreadChange(count) {
      const badge = document.querySelector('#admin-messages span');
      if (badge) badge.textContent = count;
    },
  });
}

async function updateLmsStatus(resource, id, status) {
  const r = await api('PATCH', `admin/lms/${resource}/${id}/status`, { status });
  if (r.ok && r.data.success) toast('Status updated');
  else {
    toast(r.data.message || 'Status update failed', 'error');
    renderLmsResource(resource);
  }
}

// ── HOME EDITOR ────────────────────────────────────────────
async function renderHomeEditor() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">Home Page Editor</div><div class="page-subtitle">Control what visitors see on the home page</div></div>
  </div>
  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab(this,'tab-hero')">🦸 Hero</button>
    <button class="tab-btn" onclick="switchTab(this,'tab-popular')">📚 Popular Courses</button>
    <button class="tab-btn" onclick="switchTab(this,'tab-counters-home')">📈 Stats</button>
    <button class="tab-btn" onclick="switchTab(this,'tab-cta')">📢 CTA</button>
  </div>

  <div id="tab-hero" class="tab-content active">
    <div class="card">
      <div class="card-title">🦸 Hero Section</div>
      <div class="card-heading-row">
        <div>
          <div class="card-title">Hero Slides</div>
          <p class="text-muted">Slides are shown by sort order and loop automatically on the home page.</p>
        </div>
        <button type="button" class="btn-primary" onclick="openHeroSlideModal()">+ Add Slide</button>
      </div>
      <div id="hero-slides-list"><div class="loading-block"><div class="loading-ring"></div></div></div>
      <template id="legacy-hero-form">
        <div class="form-grid">
          <div class="form-group"><label>Main Title</label><input id="hero-title" class="form-control" placeholder="Learn Today. Lead Tomorrow."></div>
          <div class="form-group"><label>Highlighted Text (optional)</label><input id="hero-highlight" class="form-control" placeholder="Lead Tomorrow"></div>
          <div class="form-group full"><label>Subtitle</label><textarea id="hero-subtitle" class="form-control" rows="2" placeholder="Industry-relevant skills..."></textarea></div>
          <div class="form-group"><label>Primary CTA Text</label><input id="hero-cta1-text" class="form-control" placeholder="Explore Courses"></div>
          <div class="form-group"><label>Primary CTA Link</label><input id="hero-cta1-url" class="form-control" placeholder="/courses.html"></div>
          <div class="form-group"><label>Secondary CTA Text</label><input id="hero-cta2-text" class="form-control" placeholder="Free Counselling"></div>
          <div class="form-group"><label>Secondary CTA Link</label><input id="hero-cta2-url" class="form-control" placeholder="/contact.html"></div>
          <div class="form-group full"><label>Upload Hero Image</label>${imageUploadField('hero-img', 'Upload Hero Image', '', 'Recommended size: 1200x600px or larger')}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px">
          <button type="submit" class="btn-primary">💾 Save Hero Section</button>
        </div>
      </template>
    </div>
  </div>

  <div id="tab-popular" class="tab-content">
    <div class="card">
      <div class="card-title">📚 Popular Courses — Mark as Popular</div>
      <p class="text-muted mb-4">Toggle courses to appear in the homepage Popular Courses section.</p>
      <div id="popular-courses-list"><div class="loading-block"><div class="loading-ring"></div></div></div>
    </div>
  </div>

  <div id="tab-counters-home" class="tab-content">
    <div id="counters-home-section"></div>
  </div>

  <div id="tab-cta" class="tab-content">
    <div class="card">
      <div class="card-title">📢 Bottom CTA Section</div>
      <form id="cta-form">
        <div class="form-grid">
          <div class="form-group"><label>CTA Title</label><input id="cta-title" class="form-control" placeholder="Ready to start?"></div>
          <div class="form-group"><label>CTA Subtitle</label><input id="cta-subtitle" class="form-control" placeholder="Join thousands of students..."></div>
          <div class="form-group"><label>Button Text</label><input id="cta-btn-text" class="form-control" placeholder="Get Started"></div>
          <div class="form-group"><label>Button URL</label><input id="cta-btn-url" class="form-control" placeholder="/courses.html"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button type="submit" class="btn-primary">💾 Save CTA</button>
        </div>
      </form>
    </div>
  </div>`;

  document.querySelector('#tab-hero > .card > .card-title')?.classList.add('hidden');

  const sectionsResponse = await api('GET', 'pages/home/sections');
  if (sectionsResponse.ok) {
    const cta = (sectionsResponse.data.data || []).find(section => section.section_key === 'cta');
    if (cta) {
      const c = cta.content || {};
      setValue('cta-title', cta.title || '');
      setValue('cta-subtitle', cta.subtitle || '');
      setValue('cta-btn-text', c.btn_text || c.cta_primary_text || '');
      setValue('cta-btn-url', c.btn_url || c.cta_primary_url || '');
    }
  }

  // CTA form
  document.getElementById('cta-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = { title: getValue('cta-title'), subtitle: getValue('cta-subtitle'), btn_text: getValue('cta-btn-text'), btn_url: getValue('cta-btn-url') };
    const r = await api('PATCH', 'admin/home/cta', data);
    r.ok ? toast('CTA saved!') : toast(r.data.message, 'error');
  };

  // Popular courses — load on tab switch
  document.querySelector('[onclick*="tab-popular"]').addEventListener('click', () => loadPopularCoursesPicker());
  document.querySelector('[onclick*="tab-counters-home"]').addEventListener('click', () => loadCountersSection('counters-home-section'));
  await loadHeroSlides();
}

let _heroSlides = [];

async function loadHeroSlides() {
  const container = document.getElementById('hero-slides-list');
  if (!container) return;
  const response = await api('GET', 'admin/hero-slides');
  if (!response.ok || !response.data.success) {
    container.innerHTML = `<div class="admin-inline-notice">${esc(response.data.message || 'Unable to load hero slides.')}</div>`;
    return;
  }

  _heroSlides = response.data.data || [];
  container.innerHTML = _heroSlides.length ? `
    <div class="table-wrap">
      <table class="hero-slides-table">
        <thead><tr><th>Slide</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${_heroSlides.map(slide => `
            <tr>
              <td>
                <div class="hero-slide-summary">
                  ${slide.image_path
                    ? `<img src="${esc(adminAssetUrl(slide.image_path))}" alt="${esc(slide.image_alt || slide.title)}">`
                    : '<div class="hero-slide-placeholder">No image</div>'}
                  <div>
                    <strong>${esc(slide.title)}</strong>
                    ${slide.accent_text ? `<span>${esc(slide.accent_text)}</span>` : ''}
                  </div>
                </div>
              </td>
              <td>${Number(slide.sort_order) || 0}</td>
              <td>
                <label class="toggle-switch">
                  <div class="toggle">
                    <input type="checkbox" ${Number(slide.is_active) ? 'checked' : ''} onchange="toggleHeroSlide(${slide.id},this.checked)">
                    <span class="toggle-slider"></span>
                  </div>
                  <span>${Number(slide.is_active) ? 'Active' : 'Inactive'}</span>
                </label>
              </td>
              <td>
                <div class="table-actions">
                  <button type="button" class="btn-icon btn-sm" onclick="openHeroSlideModal(${slide.id})">Edit</button>
                  <button type="button" class="btn-danger btn-sm" onclick="deleteHeroSlide(${slide.id})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '<div class="empty-state"><p>No hero slides yet. Add one to replace the current fallback hero.</p></div>';
}

function validHeroButtonLink(value) {
  const link = String(value || '').trim();
  if (!link) return true;
  if (/^https?:\/\//i.test(link)) {
    try { return Boolean(new URL(link)); } catch (_) { return false; }
  }
  return !link.includes(':') && !link.includes('\\') && /^(?:\/|#|\.\/|\.\.\/|[a-z0-9])/i.test(link);
}

function openHeroSlideModal(id = null) {
  const slide = _heroSlides.find(item => Number(item.id) === Number(id)) || {};
  const body = `
    <div class="form-grid">
      <div class="form-group"><label>Title *</label><input id="hs-title" class="form-control" value="${esc(slide.title || '')}" placeholder="Learn Today."></div>
      <div class="form-group"><label>Highlighted Text</label><input id="hs-accent" class="form-control" value="${esc(slide.accent_text || '')}" placeholder="Lead Tomorrow."></div>
      <div class="form-group full"><label>Description</label><textarea id="hs-description" class="form-control" rows="3">${esc(slide.description || '')}</textarea></div>
      <div class="form-group"><label>Primary Button Text</label><input id="hs-primary-text" class="form-control" value="${esc(slide.primary_button_text || '')}"></div>
      <div class="form-group"><label>Primary Button Link</label><input id="hs-primary-link" class="form-control" value="${esc(slide.primary_button_link || '')}" placeholder="courses.html"></div>
      <div class="form-group"><label>Secondary Button Text</label><input id="hs-secondary-text" class="form-control" value="${esc(slide.secondary_button_text || '')}"></div>
      <div class="form-group"><label>Secondary Button Link</label><input id="hs-secondary-link" class="form-control" value="${esc(slide.secondary_button_link || '')}" placeholder="contact.html"></div>
      <div class="form-group"><label>Image Alt Text</label><input id="hs-image-alt" class="form-control" value="${esc(slide.image_alt || '')}" placeholder="Student learning"></div>
      <div class="form-group"><label>Sort Order</label><input id="hs-sort" type="number" class="form-control" value="${Number(slide.sort_order) || 0}"></div>
      <div class="form-group full"><label>Slide Image</label>${imageUploadField('hs-image', 'Upload Hero Slide Image', slide.image_path || '', 'Recommended size: 1200x600px or larger')}</div>
      <div class="form-group full">
        <label class="toggle-switch">
          <div class="toggle"><input id="hs-active" type="checkbox" ${slide.is_active === undefined || Number(slide.is_active) ? 'checked' : ''}><span class="toggle-slider"></span></div>
          <span>Active on home page</span>
        </label>
      </div>
    </div>`;

  openModal(id ? 'Edit Hero Slide' : 'Add Hero Slide', body, async () => {
    const title = getValue('hs-title');
    const primaryLink = getValue('hs-primary-link');
    const secondaryLink = getValue('hs-secondary-link');
    if (!title) return toast('Slide title is required', 'error');
    if (!validHeroButtonLink(primaryLink) || !validHeroButtonLink(secondaryLink)) {
      return toast('Use valid http(s) URLs or relative website links for buttons', 'error');
    }

    const confirmButton = document.getElementById('modal-confirm');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Saving...';
    let imagePath = '';
    try {
      imagePath = await uploadImageField('hs-image', 'hero');
    } catch (error) {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Save';
      return toast(error.message || 'Hero image upload failed', 'error');
    }

    const payload = {
      title,
      accent_text: getValue('hs-accent'),
      description: getValue('hs-description'),
      primary_button_text: getValue('hs-primary-text'),
      primary_button_link: primaryLink,
      secondary_button_text: getValue('hs-secondary-text'),
      secondary_button_link: secondaryLink,
      image_path: imagePath,
      image_alt: getValue('hs-image-alt') || 'Student learning',
      badges: Array.isArray(slide.badges) ? slide.badges : [],
      sort_order: Number.parseInt(getValue('hs-sort') || '0', 10),
      is_active: document.getElementById('hs-active').checked ? 1 : 0,
    };
    const response = await api(id ? 'PATCH' : 'POST', id ? `admin/hero-slides/${id}` : 'admin/hero-slides', payload);
    if (!response.ok || !response.data.success) {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Save';
      return toast(response.data.message || 'Hero slide could not be saved', 'error');
    }
    closeModal();
    toast('Hero slide saved');
    loadHeroSlides();
  });
  bindImageUploadPreview('hs-image');
}

async function toggleHeroSlide(id, isActive) {
  const response = await api('PATCH', `admin/hero-slides/${id}`, { is_active: isActive ? 1 : 0 });
  if (response.ok && response.data.success) {
    toast(isActive ? 'Hero slide activated' : 'Hero slide deactivated');
    loadHeroSlides();
  } else {
    toast(response.data.message || 'Slide status could not be updated', 'error');
    loadHeroSlides();
  }
}

async function deleteHeroSlide(id) {
  if (!confirm('Delete this hero slide? This cannot be undone.')) return;
  const response = await api('DELETE', `admin/hero-slides/${id}`);
  if (response.ok && response.data.success) {
    toast('Hero slide deleted');
    loadHeroSlides();
  } else {
    toast(response.data.message || 'Hero slide could not be deleted', 'error');
  }
}

async function loadPopularCoursesPicker() {
  const el = document.getElementById('popular-courses-list');
  if (!el) return;
  el.innerHTML = '<div class="loading-block"><div class="loading-ring"></div></div>';
  const r = await api('GET', 'admin/courses');
  if (!r.ok) { el.innerHTML = '<p class="text-muted">Failed to load courses</p>'; return; }
  const courses = r.data.data || [];
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Course</th><th>Category</th><th>Status</th><th>Popular</th><th>Featured</th></tr></thead>
        <tbody>
          ${courses.map(c => `
          <tr>
            <td><b>${esc(c.title)}</b></td>
            <td class="text-muted">${esc(c.category||'—')}</td>
            <td><span class="badge ${c.status==='published'?'badge-green':'badge-yellow'}">${c.status}</span></td>
            <td>
              <label class="toggle-switch">
                <div class="toggle"><input type="checkbox" ${c.is_popular?'checked':''} onchange="toggleCourseFlag(${c.id},'popular',this)"><span class="toggle-slider"></span></div>
              </label>
            </td>
            <td>
              <label class="toggle-switch">
                <div class="toggle"><input type="checkbox" ${c.is_featured?'checked':''} onchange="toggleCourseFlag(${c.id},'feature',this)"><span class="toggle-slider"></span></div>
              </label>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function toggleCourseFlag(id, flag, control) {
  const value = control.checked ? 1 : 0;
  control.disabled = true;
  const r = await api('PATCH', `admin/courses/${id}/${flag}`, { value });
  control.disabled = false;
  if (r.ok) {
    toast(`Course ${flag} updated`);
  } else {
    control.checked = !control.checked;
    toast(r.data.message || `Could not update ${flag}`, 'error');
  }
}

function switchTab(btn, tabId) {
  btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const parent = btn.closest('.admin-content') || document.getElementById('admin-content');
  parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const t = document.getElementById(tabId);
  if (t) t.classList.add('active');
}

// ── COURSES ────────────────────────────────────────────────
function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function hasActiveDiscount(course) {
  return Number(course.discount_status) === 1
    && course.discount_type
    && course.discount_type !== 'none'
    && course.discounted_price !== null
    && Number(course.discounted_price) < Number(course.price);
}

function coursePriceAdminHtml(course) {
  if (!hasActiveDiscount(course)) return formatMoney(course.price);
  const value = Number(course.discount_value || 0);
  const badge = course.discount_type === 'percentage'
    ? `${value.toLocaleString('en-IN')}% off`
    : `${formatMoney(value)} off`;
  return `<div class="admin-price-stack"><span class="admin-price-old">${formatMoney(course.price)}</span><strong>${formatMoney(course.discounted_price)}</strong><span class="badge badge-green">${esc(badge)}</span></div>`;
}

function webinarStatusLabel(status) {
  if (status === 'published' || status === 'active') return 'Active';
  if (status === 'draft') return 'Draft';
  return 'Inactive';
}

function webinarStatusBadge(status) {
  const label = webinarStatusLabel(status);
  return label === 'Active' ? 'badge-green' : label === 'Draft' ? 'badge-yellow' : 'badge-red';
}

async function renderCourses() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/courses');
  const courses = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header courses-page-header">
      <div><div class="page-title">Courses</div><div class="page-subtitle">${courses.length} courses total</div></div>
      <div class="page-actions">
        <button class="btn-primary" onclick="openCourseModal()">+ Add Course</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap courses-table-wrap">
        <table class="admin-courses-table">
          <thead><tr><th>Course</th><th>Trainer</th><th>Category</th><th>Price</th><th>Level</th><th>Status</th><th>Popular</th><th>Featured</th><th>Actions</th></tr></thead>
          <tbody id="courses-tbody">
            ${courses.length ? courses.map(c => courseRow(c)).join('') : '<tr><td colspan="9" class="empty-state"><div class="empty-state-icon">📚</div><p>No courses yet</p></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

function courseRow(c) {
  return `<tr id="course-row-${c.id}">
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        ${c.thumbnail_url ? `<img src="${esc(adminAssetUrl(c.thumbnail_url))}" class="td-img">` : '<div class="td-img" style="background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:20px">📚</div>'}
        <div>
          <div style="font-weight:600">${esc(c.title)}</div>
          ${c.badge ? `<span class="badge badge-purple">${esc(c.badge)}</span>` : ''}
        </div>
      </div>
    </td>
    <td class="text-muted">${esc(c.trainer_name || 'Unassigned')}</td>
    <td class="text-muted">${esc(c.category||'—')}</td>
    <td>${coursePriceAdminHtml(c)}</td>
    <td class="text-muted">${c.level||'—'}</td>
    <td><span class="badge ${c.status==='published'?'badge-green':'badge-yellow'}">${c.status}</span></td>
    <td><label class="toggle-switch"><div class="toggle"><input type="checkbox" ${c.is_popular?'checked':''} onchange="toggleCourseFlag(${c.id},'popular',this)"><span class="toggle-slider"></span></div></label></td>
    <td><label class="toggle-switch"><div class="toggle"><input type="checkbox" ${c.is_featured?'checked':''} onchange="toggleCourseFlag(${c.id},'feature',this)"><span class="toggle-slider"></span></div></label></td>
    <td>
      <div style="display:flex;gap:6px">
        <button class="btn-icon btn-sm" onclick="openCourseModal(${c.id})">✏️</button>
        <button class="btn-icon btn-sm" onclick="togglePublish('courses',${c.id},'${c.status}')">
          ${c.status==='published'?'📤 Unpublish':'📥 Publish'}
        </button>
        <button class="btn-danger btn-sm" onclick="deleteItem('courses',${c.id},decodeURIComponent('${enc(c.title)}'))">🗑</button>
      </div>
    </td>
  </tr>`;
}

async function openCourseModal(id = null) {
  let course = {};
  let trainers = [];
  const trainerResponse = await api('GET', 'admin/lms/trainers');
  if (trainerResponse.ok) trainers = trainerResponse.data.data.rows || [];
  if (id) {
    const r = await api('GET', `admin/courses/${id}`);
    if (r.ok) course = r.data.data;
  }
  const status = course.status || 'published';
  const discountType = course.discount_type || 'none';
  const discountEnabled = Number(course.discount_status) === 1 && discountType !== 'none';
  const initialFinalPrice = discountEnabled && course.discounted_price !== null
    ? course.discounted_price
    : course.price || 0;
  const body = `
    <div class="form-grid">
      <div class="form-group full"><label>Title *</label><input id="cf-title" class="form-control" value="${esc(course.title||'')}" placeholder="Course Title"></div>
      <div class="form-group"><label>Slug</label><input id="cf-slug" class="form-control" value="${esc(course.slug||'')}" placeholder="auto-generated from title"></div>
      <div class="form-group"><label>Sort Order</label><input id="cf-sort" type="number" class="form-control" value="${course.sort_order||0}"></div>
      <div class="form-group full"><label>Short Description</label><input id="cf-short" class="form-control" value="${esc(course.short_description||'')}" placeholder="One-line summary"></div>
      <div class="form-group full"><label>Description</label><textarea id="cf-desc" class="form-control" rows="3">${esc(course.description||'')}</textarea></div>
      <div class="form-group"><label>Category</label><input id="cf-cat" class="form-control" value="${esc(course.category||'')}" placeholder="e.g. Data Analytics"></div>
      <div class="form-group"><label>Original Price</label><input id="cf-price" type="number" min="0" step="0.01" class="form-control" value="${course.price||0}"></div>
      <div class="form-group"><label>Discount Type</label>
        <select id="cf-discount-type" class="form-control">
          <option value="none" ${discountType==='none'?'selected':''}>No Discount</option>
          <option value="percentage" ${discountType==='percentage'?'selected':''}>Percentage Discount</option>
          <option value="fixed" ${discountType==='fixed'?'selected':''}>Fixed Amount Discount</option>
        </select>
      </div>
      <div class="form-group"><label>Discount Value</label><input id="cf-discount-value" type="number" min="0" step="0.01" class="form-control" value="${course.discount_value||0}"><p class="form-hint" id="cf-discount-error"></p></div>
      <div class="form-group"><label>Final Price</label><input id="cf-final-price" type="text" class="form-control" value="${formatMoney(initialFinalPrice)}" readonly></div>
      <div class="form-group full">
        <label>Discount Status</label>
        <label class="toggle-switch"><div class="toggle"><input id="cf-discount-status" type="checkbox" ${discountEnabled?'checked':''}><span class="toggle-slider"></span></div><span>Apply discount on the website</span></label>
      </div>
      <div class="form-group"><label>Duration (hours)</label><input id="cf-dur" type="number" class="form-control" value="${course.duration||''}"></div>
      <div class="form-group"><label>Assigned Trainer</label>
        <select id="cf-trainer" class="form-control">
          <option value="">Unassigned</option>
          ${trainers.map(trainer => `<option value="${Number(trainer.ID)}" ${Number(course.trainer_id) === Number(trainer.ID) ? 'selected' : ''}>${esc(trainer.Name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Level</label>
        <select id="cf-level" class="form-control">
          ${['beginner','intermediate','advanced'].map(l=>`<option value="${l}" ${course.level===l?'selected':''}>${l.charAt(0).toUpperCase()+l.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Badge (e.g. New, Popular)</label><input id="cf-badge" class="form-control" value="${esc(course.badge||'')}" placeholder="New"></div>
      <div class="form-group full"><label>Course Thumbnail</label>${imageUploadField('cf-thumb', 'Upload Course Thumbnail', course.thumbnail_url || '', 'Recommended size: 800x450px or larger')}</div>
      <div class="form-group full"><label>Course Banner</label>${imageUploadField('cf-banner', 'Upload Course Banner', course.banner_url || '', 'Recommended size: 1200x600px or larger')}</div>
      <div class="form-group full"><label>SEO Title</label><input id="cf-seo-title" class="form-control" value="${esc(course.seo_title||'')}"></div>
      <div class="form-group full"><label>SEO Description</label><textarea id="cf-seo-desc" class="form-control" rows="2">${esc(course.seo_description||'')}</textarea></div>
      <div class="form-group"><label>Status</label>
        <select id="cf-status" class="form-control">
          <option value="published" ${status==='published'?'selected':''}>Published</option>
          <option value="draft" ${status==='draft'?'selected':''}>Draft</option>
        </select>
      </div>
      <div class="form-group">
        <label>Visibility</label>
        <label class="toggle-switch"><div class="toggle"><input id="cf-popular" type="checkbox" ${course.is_popular?'checked':''}><span class="toggle-slider"></span></div><span>Show in Popular Courses</span></label>
        <label class="toggle-switch"><div class="toggle"><input id="cf-featured" type="checkbox" ${course.is_featured?'checked':''}><span class="toggle-slider"></span></div><span>Featured</span></label>
      </div>
    </div>`;
  openModal(id ? 'Edit Course' : 'Add Course', body, async () => {
    const price = parseFloat(getValue('cf-price') || 0);
    const discountTypeValue = getValue('cf-discount-type');
    const discountValue = parseFloat(getValue('cf-discount-value') || 0);
    const discountStatus = document.getElementById('cf-discount-status').checked && discountTypeValue !== 'none';
    if (price < 0 || discountValue < 0) {
      toast('Price and discount value cannot be negative', 'error');
      return;
    }
    if (discountTypeValue === 'percentage' && discountValue > 100) {
      toast('Percentage discount cannot be more than 100', 'error');
      return;
    }
    if (discountTypeValue === 'fixed' && discountValue > price) {
      toast('Fixed discount cannot be greater than the original price', 'error');
      return;
    }
    let thumbnailUrl = '';
    let bannerUrl = '';
    try {
      thumbnailUrl = await uploadImageField('cf-thumb', 'courses');
      bannerUrl = await uploadImageField('cf-banner', 'courses');
    } catch (err) {
      toast(err.message || 'Course image upload failed', 'error');
      return;
    }
    const payload = {
      title: getValue('cf-title'), short_description: getValue('cf-short'),
      description: getValue('cf-desc'), category: getValue('cf-cat'),
      price, discount_type: discountTypeValue, discount_value: discountValue,
      discount_status: discountStatus ? 1 : 0,
      duration: parseInt(getValue('cf-dur')||0)||null,
      trainer_id: parseInt(getValue('cf-trainer') || 0) || null,
      level: getValue('cf-level'), badge: getValue('cf-badge'),
      thumbnail_url: thumbnailUrl, banner_url: bannerUrl,
      seo_title: getValue('cf-seo-title'), seo_description: getValue('cf-seo-desc'),
      status: getValue('cf-status'), sort_order: parseInt(getValue('cf-sort')||0),
      is_popular: document.getElementById('cf-popular').checked ? 1 : 0,
      is_featured: document.getElementById('cf-featured').checked ? 1 : 0,
    };
    const courseSlug = getValue('cf-slug');
    if (courseSlug) payload.slug = courseSlug;
    const r = id ? await api('PATCH', `admin/courses/${id}`, payload) : await api('POST', 'admin/courses', payload);
    if (r.ok) { toast(id ? 'Course updated!' : 'Course created!'); closeModal(); renderCourses(); }
    else toast(r.data.message, 'error');
  });
  bindImageUploadPreview('cf-thumb');
  bindImageUploadPreview('cf-banner');
  const updateDiscountPreview = () => {
    const price = Math.max(0, parseFloat(getValue('cf-price') || 0));
    const type = getValue('cf-discount-type');
    const value = Math.max(0, parseFloat(getValue('cf-discount-value') || 0));
    const enabled = document.getElementById('cf-discount-status').checked && type !== 'none';
    let finalPrice = price;
    let error = '';
    if (enabled && type === 'percentage') {
      if (value > 100) error = 'Percentage cannot be more than 100.';
      else finalPrice = price - (price * value / 100);
    } else if (enabled && type === 'fixed') {
      if (value > price) error = 'Fixed discount cannot exceed the original price.';
      else finalPrice = price - value;
    }
    document.getElementById('cf-final-price').value = formatMoney(Math.max(0, finalPrice));
    const errorEl = document.getElementById('cf-discount-error');
    errorEl.textContent = error;
    errorEl.classList.toggle('form-error-text', Boolean(error));
    document.getElementById('cf-discount-value').disabled = type === 'none';
    document.getElementById('cf-discount-status').disabled = type === 'none';
  };
  ['cf-price','cf-discount-type','cf-discount-value','cf-discount-status'].forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('input', updateDiscountPreview);
    document.getElementById(fieldId).addEventListener('change', updateDiscountPreview);
  });
  updateDiscountPreview();
}

// ── COURSE CATEGORIES ──────────────────────────────────────
async function renderCourseCategories() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/course-categories');
  const cats = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Course Categories</div></div>
      <button class="btn-primary" onclick="openCatModal()">+ Add Category</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            ${cats.length ? cats.map(c => `
            <tr>
              <td><b>${esc(c.name)}</b></td>
              <td class="text-muted">${esc(c.slug)}</td>
              <td>${c.sort_order}</td>
              <td><span class="badge ${c.is_active?'badge-green':'badge-red'}">${c.is_active?'Yes':'No'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick='openCatModal(${JSON.stringify(c)})'>✏️</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('course-categories',${c.id},decodeURIComponent('${enc(c.name)}'))">🗑</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="5" class="text-muted">No categories</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openCatModal(cat = null) {
  const c = cat || {};
  const body = `
    <div class="form-grid">
      <div class="form-group full"><label>Name *</label><input id="cat-name" class="form-control" value="${esc(c.name||'')}"></div>
      <div class="form-group"><label>Slug</label><input id="cat-slug" class="form-control" value="${esc(c.slug||'')}" placeholder="auto-generated"></div>
      <div class="form-group"><label>Sort Order</label><input id="cat-sort" type="number" class="form-control" value="${c.sort_order||0}"></div>
      <div class="form-group full"><label>Description</label><textarea id="cat-desc" class="form-control">${esc(c.description||'')}</textarea></div>
      <div class="form-group full"><label>Image URL</label><input id="cat-img" class="form-control" value="${esc(c.image_url||'')}"></div>
    </div>`;
  openModal(c.id ? 'Edit Category' : 'Add Category', body, async () => {
    const payload = { name: getValue('cat-name'), slug: getValue('cat-slug'), description: getValue('cat-desc'), image_url: getValue('cat-img'), sort_order: parseInt(getValue('cat-sort')||0) };
    const r = c.id ? await api('PATCH', `admin/course-categories/${c.id}`, payload) : await api('POST', 'admin/course-categories', payload);
    if (r.ok) { toast('Category saved!'); closeModal(); renderCourseCategories(); }
    else toast(r.data.message, 'error');
  });
}

// ── WEBINARS ───────────────────────────────────────────────
async function renderWebinars() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/webinars');
  const webinars = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Webinars</div><div class="page-subtitle">${webinars.length} total</div></div>
      <button class="btn-primary" onclick="openWebinarModal()">+ Add Webinar</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Speaker</th><th>Date</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${webinars.length ? webinars.map(w => `
            <tr>
              <td><b>${esc(w.title)}</b><br><span class="text-muted">${esc(w.category||'')}</span></td>
              <td>${esc(w.speaker_name||'—')}</td>
              <td class="text-muted">${w.starts_at ? new Date(w.starts_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
              <td>${w.seats_limit > 0 ? `${w.seats_left}/${w.seats_limit}` : 'Unlimited'}</td>
              <td><span class="badge ${webinarStatusBadge(w.status)}">${webinarStatusLabel(w.status)}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick="openWebinarModal(${w.id})">✏️</button>
                  <button class="btn-icon btn-sm" onclick="viewRegistrations(${w.id},decodeURIComponent('${enc(w.title)}'))">👥</button>
                  <button class="btn-icon btn-sm" onclick="togglePublish('webinars',${w.id},'${w.status}')">${webinarStatusLabel(w.status)==='Active'?'Deactivate':'Activate'}</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('webinars',${w.id},decodeURIComponent('${enc(w.title)}'))">🗑</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="6" class="text-muted">No webinars</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function openWebinarModal(id = null) {
  let w = {};
  if (id) { const r = await api('GET', `admin/webinars/${id}`); if (r.ok) w = r.data.data; }
  const toInput = (dt) => dt ? dt.replace(' ','T').slice(0,16) : '';
  const status = webinarStatusLabel(w.status || 'active').toLowerCase();
  const body = `
    <div class="form-grid">
      <div class="form-group full"><label>Title *</label><input id="wf-title" class="form-control" value="${esc(w.title||'')}"></div>
      <div class="form-group"><label>Slug</label><input id="wf-slug" class="form-control" value="${esc(w.slug||'')}" placeholder="auto-generated from title"></div>
      <div class="form-group"><label>Sort Order</label><input id="wf-sort" type="number" class="form-control" value="${w.sort_order||0}"></div>
      <div class="form-group full"><label>Description</label><textarea id="wf-desc" class="form-control" rows="2">${esc(w.description||'')}</textarea></div>
      <div class="form-group"><label>Speaker Name</label><input id="wf-speaker" class="form-control" value="${esc(w.speaker_name||'')}"></div>
      <div class="form-group"><label>Speaker Role</label><input id="wf-speaker-role" class="form-control" value="${esc(w.speaker_role||'')}"></div>
      <div class="form-group"><label>Category</label><input id="wf-cat" class="form-control" value="${esc(w.category||'')}"></div>
      <div class="form-group"><label>Start Date &amp; Time</label><input id="wf-start" type="datetime-local" class="form-control" value="${toInput(w.starts_at)}"></div>
      <div class="form-group"><label>End Date &amp; Time</label><input id="wf-end" type="datetime-local" class="form-control" value="${toInput(w.ends_at)}"></div>
      <div class="form-group"><label>Total Seats (0=unlimited)</label><input id="wf-seats" type="number" class="form-control" value="${w.seats_limit||0}"></div>
      <div class="form-group"><label>Seats Left</label><input id="wf-seats-left" type="number" class="form-control" value="${w.seats_left ?? w.seats_limit ?? 0}"></div>
      <div class="form-group full"><label>Google Meet / Webinar URL</label><input id="wf-meet" class="form-control" value="${esc(w.meet_url||'')}" placeholder="https://meet.google.com/..."></div>
      <div class="form-group full"><label>Webinar Banner</label>${imageUploadField('wf-banner', 'Upload Webinar Banner', w.banner_url || '', 'Recommended size: 1200x600px or larger')}</div>
      <div class="form-group full"><label>Speaker Image / Logo</label>${imageUploadField('wf-speaker-img', 'Upload Speaker Image or Logo', w.speaker_image_url || '', 'Use a clear square image or transparent logo')}</div>
      <div class="form-group full"><label>SEO Title</label><input id="wf-seo-title" class="form-control" value="${esc(w.seo_title||'')}"></div>
      <div class="form-group full"><label>SEO Description</label><textarea id="wf-seo-desc" class="form-control" rows="2">${esc(w.seo_description||'')}</textarea></div>
      <div class="form-group"><label>Status</label>
        <select id="wf-status" class="form-control">
          <option value="active" ${status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${status==='inactive'?'selected':''}>Inactive</option>
          <option value="draft" ${status==='draft'?'selected':''}>Draft</option>
        </select>
      </div>
      <div class="form-group">
        <label>Options</label>
        <label class="toggle-switch"><div class="toggle"><input id="wf-registration" type="checkbox" ${w.registration_enabled === undefined || Number(w.registration_enabled) ? 'checked' : ''}><span class="toggle-slider"></span></div><span>Registration Open</span></label>
        <label class="toggle-switch"><div class="toggle"><input id="wf-featured" type="checkbox" ${w.is_featured?'checked':''}><span class="toggle-slider"></span></div><span>Featured</span></label>
      </div>
    </div>`;
  openModal(id ? 'Edit Webinar' : 'Add Webinar', body, async () => {
    let bannerUrl = '';
    let speakerImageUrl = '';
    try {
      bannerUrl = await uploadImageField('wf-banner', 'webinars');
      speakerImageUrl = await uploadImageField('wf-speaker-img', 'webinars');
    } catch (err) {
      toast(err.message || 'Webinar image upload failed', 'error');
      return;
    }
    const payload = {
      title: getValue('wf-title'), description: getValue('wf-desc'),
      speaker_name: getValue('wf-speaker'), speaker_role: getValue('wf-speaker-role'),
      category: getValue('wf-cat'),
      starts_at: getValue('wf-start') ? getValue('wf-start').replace('T',' ') : null,
      ends_at: getValue('wf-end') ? getValue('wf-end').replace('T',' ') : null,
      seats_limit: parseInt(getValue('wf-seats')||0),
      seats_left: parseInt(getValue('wf-seats-left')||0),
      meet_url: getValue('wf-meet'), banner_url: bannerUrl,
      speaker_image_url: speakerImageUrl,
      status: getValue('wf-status'), sort_order: parseInt(getValue('wf-sort')||0),
      registration_enabled: document.getElementById('wf-registration').checked ? 1 : 0,
      is_featured: document.getElementById('wf-featured').checked ? 1 : 0,
      seo_title: getValue('wf-seo-title'), seo_description: getValue('wf-seo-desc'),
    };
    const webinarSlug = getValue('wf-slug');
    if (webinarSlug) payload.slug = webinarSlug;
    const r = id ? await api('PATCH',`admin/webinars/${id}`,payload) : await api('POST','admin/webinars',payload);
    if (r.ok) { toast('Webinar saved!'); closeModal(); renderWebinars(); }
    else toast(r.data.message,'error');
  });
  bindImageUploadPreview('wf-banner');
  bindImageUploadPreview('wf-speaker-img');
}

async function viewRegistrations(id, title) {
  const r = await api('GET', `admin/webinars/${id}/registrations`);
  const rows = r.ok ? r.data.data : [];
  const body = `
    <p class="text-muted mb-4">${rows.length} registrations for <b>${esc(title)}</b></p>
    <div class="table-wrap" style="max-height:320px;overflow-y:auto">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone||'—')}</td><td><span class="badge badge-cyan">${r.status}</span></td><td class="text-muted">${new Date(r.registered_at).toLocaleDateString()}</td></tr>`).join('') : '<tr><td colspan="5" class="text-muted">No registrations</td></tr>'}
        </tbody>
      </table>
    </div>`;
  openInfoModal('Webinar Registrations', body);
}

// ── POSTS (BLOGS & ARTICLES) ───────────────────────────────
async function renderPosts() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/posts');
  const posts = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Blogs &amp; Articles</div></div>
      <div class="page-actions">
        <select id="post-type-filter" class="form-control" style="width:140px" onchange="renderPosts()">
          <option value="">All Types</option>
          <option value="blog">Blogs</option>
          <option value="article">Articles</option>
        </select>
        <button class="btn-primary" onclick="openPostModal()">+ Add Post</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Featured</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${posts.length ? posts.map(p => `
            <tr>
              <td><b>${esc(p.title)}</b></td>
              <td><span class="badge ${p.type==='blog'?'badge-cyan':'badge-purple'}">${p.type}</span></td>
              <td><span class="badge ${p.status==='published'?'badge-green':'badge-yellow'}">${p.status}</span></td>
              <td>${p.is_featured ? '⭐' : '—'}</td>
              <td class="text-muted">${p.published_at ? new Date(p.published_at).toLocaleDateString() : 'Draft'}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick="openPostModal(${p.id})">✏️</button>
                  <button class="btn-icon btn-sm" onclick="togglePublish('posts',${p.id},'${p.status}')">${p.status==='published'?'📤':'📥'}</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('posts',${p.id},decodeURIComponent('${enc(p.title)}'))">🗑</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="6" class="text-muted">No posts yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function openPostModal(id = null) {
  let p = {};
  if (id) { const r = await api('GET', `admin/posts/${id}`); if (r.ok) p = r.data.data; }
  const body = `
    <div class="form-grid">
      <div class="form-group"><label>Type</label>
        <select id="pf-type" class="form-control">
          <option value="blog" ${p.type==='blog'?'selected':''}>Blog</option>
          <option value="article" ${p.type==='article'?'selected':''}>Article</option>
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="pf-status" class="form-control">
          <option value="draft" ${p.status==='draft'?'selected':''}>Draft</option>
          <option value="published" ${p.status==='published'?'selected':''}>Published</option>
        </select>
      </div>
      <div class="form-group full"><label>Title *</label><input id="pf-title" class="form-control" value="${esc(p.title||'')}"></div>
      <div class="form-group full"><label>Excerpt</label><textarea id="pf-excerpt" class="form-control" rows="2">${esc(p.excerpt||'')}</textarea></div>
      <div class="form-group full"><label>Content</label><textarea id="pf-content" class="form-control" rows="6">${esc(p.content||'')}</textarea></div>
      <div class="form-group full"><label>Featured Image</label>${imageUploadField('pf-img', 'Upload Featured Image', p.featured_image_url || '', 'Recommended size: 900x520px or larger')}</div>
      <div class="form-group"><label>Reading Time (min)</label><input id="pf-time" type="number" class="form-control" value="${p.reading_time||5}"></div>
      <div class="form-group"><label>Featured?</label>
        <label class="toggle-switch" style="margin-top:8px">
          <div class="toggle"><input id="pf-featured" type="checkbox" ${p.is_featured?'checked':''}><span class="toggle-slider"></span></div>
          <span>Show as featured</span>
        </label>
      </div>
      <div class="form-group full"><label>SEO Title</label><input id="pf-seo-title" class="form-control" value="${esc(p.seo_title||'')}"></div>
      <div class="form-group full"><label>SEO Description</label><textarea id="pf-seo-desc" class="form-control" rows="2">${esc(p.seo_description||'')}</textarea></div>
    </div>`;
  openModal(id ? 'Edit Post' : 'Add Post', body, async () => {
    let featuredImageUrl = '';
    try {
      featuredImageUrl = await uploadImageField('pf-img', 'articles');
    } catch (err) {
      toast(err.message || 'Featured image upload failed', 'error');
      return;
    }
    const payload = {
      type: getValue('pf-type'), status: getValue('pf-status'),
      title: getValue('pf-title'), excerpt: getValue('pf-excerpt'),
      content: getValue('pf-content'), featured_image_url: featuredImageUrl,
      reading_time: parseInt(getValue('pf-time')||5),
      is_featured: document.getElementById('pf-featured').checked ? 1 : 0,
      seo_title: getValue('pf-seo-title'), seo_description: getValue('pf-seo-desc'),
    };
    const r = id ? await api('PATCH',`admin/posts/${id}`,payload) : await api('POST','admin/posts',payload);
    if (r.ok) { toast('Post saved!'); closeModal(); renderPosts(); }
    else toast(r.data.message,'error');
  });
  bindImageUploadPreview('pf-img');
}

// ── TESTIMONIALS ───────────────────────────────────────────
async function renderHomePopups() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/home-popups');
  const items = r.ok ? r.data.data : [];
  const badgeClass = status => status === 'active' ? 'badge-green' : status === 'draft' ? 'badge-yellow' : 'badge-red';
  const dateLabel = value => value ? new Date(String(value).replace(' ', 'T')).toLocaleString('en-IN') : 'No limit';
  content.innerHTML = `
    <div class="page-header popup-page-header">
      <div><div class="page-title">Pop ups</div><div class="page-subtitle">${items.length} pop up${items.length === 1 ? '' : 's'}</div></div>
      <div class="page-actions">
        <button class="btn-primary" type="button" onclick="openHomePopupModal()">${adminIcon('plus')} Add Pop up</button>
      </div>
    </div>
    <div class="card popup-admin-card">
      <div class="table-wrap popup-table-wrap">
        <table class="admin-popups-table">
          <thead><tr><th>Pop up</th><th>Display Page</th><th>Position</th><th>Type</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.length ? items.map(item => `
              <tr>
                <td class="popup-summary-cell">
                  <div class="popup-summary">
                    ${item.image_url ? `<img src="${esc(adminAssetUrl(item.image_url))}" class="td-img" style="object-fit:cover">` : ''}
                    <div class="popup-copy">
                      <b class="popup-title" title="${esc(item.title)}">${esc(item.title)}</b>
                      <div class="text-muted popup-message" title="${esc(item.message || '')}">${esc((item.message || '').slice(0, 70))}</div>
                    </div>
                  </div>
                </td>
                <td class="popup-page-cell">${esc(popupPageLabel(item.page_key))}</td>
                <td class="popup-position-cell">${esc(popupPositionLabel(item.position))}</td>
                <td class="popup-type-cell">${esc(String(item.popup_type || 'announcement').replace(/_/g, ' '))}</td>
                <td class="text-muted popup-schedule-cell"><div>${dateLabel(item.start_date)}</div><div>to ${dateLabel(item.end_date)}</div></td>
                <td><span class="badge ${badgeClass(item.status)}">${esc(item.status)}</span></td>
                <td>
                  <div class="table-actions popup-actions">
                    <button class="btn-icon btn-sm" type="button" onclick="openHomePopupModal(${item.id})">${adminIcon('edit')} Edit</button>
                    <button class="btn-danger btn-sm" type="button" onclick="deleteItem('home-popups',${item.id},decodeURIComponent('${enc(item.title)}'))">${adminIcon('trash')} Delete</button>
                  </div>
                </td>
              </tr>`).join('') : '<tr><td colspan="7" class="text-muted">No pop ups yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

function popupPageLabel(pageKey) {
  return ({
    home: 'Home Page',
    courses: 'Courses Page',
    webinar: 'Webinar Page',
    'media-gallery': 'Media Gallery Page',
    articles: 'Articles Page',
    certification: 'Certification Page',
    contact: 'Contact Page',
    all: 'All Pages',
  })[pageKey] || 'Home Page';
}

function popupPositionLabel(position) {
  return ({
    center: 'Center',
    top: 'Top',
    bottom: 'Bottom',
    'bottom-right': 'Bottom Right',
    'bottom-left': 'Bottom Left',
  })[position] || 'Center';
}

async function openHomePopupModal(id = null) {
  let popup = {};
  if (id) {
    const r = await api('GET', `admin/home-popups/${id}`);
    if (!r.ok) {
      toast(r.data.message || 'Popup could not be loaded', 'error');
      return;
    }
    popup = r.data.data;
  }
  const toInput = value => value ? String(value).replace(' ', 'T').slice(0, 16) : '';
  const body = `
    <div class="form-grid">
      <div class="form-group full"><label>Popup Title *</label><input id="pop-title" class="form-control" value="${esc(popup.title || '')}"></div>
      <div class="form-group full"><label>Description / Message</label><textarea id="pop-message" class="form-control" rows="4">${esc(popup.message || '')}</textarea></div>
      <div class="form-group"><label>Popup Type</label>
        <select id="pop-type" class="form-control">
          ${[
            ['announcement','Announcement'],
            ['course_discount','Course Discount'],
            ['festival_offer','Festival Offer'],
            ['webinar_promo','Webinar Promotion'],
            ['new_course_launch','New Course Launch'],
          ].map(([value, label]) => `<option value="${value}" ${popup.popup_type === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="pop-status" class="form-control">
          <option value="active" ${popup.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${popup.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          <option value="draft" ${!popup.status || popup.status === 'draft' ? 'selected' : ''}>Draft</option>
        </select>
      </div>
      <div class="form-group"><label>Display Page</label>
        <select id="pop-page-key" class="form-control">
          ${[
            ['home','Home Page'],
            ['courses','Courses Page'],
            ['webinar','Webinar Page'],
            ['media-gallery','Media Gallery Page'],
            ['articles','Articles Page'],
            ['certification','Certification Page'],
            ['contact','Contact Page'],
            ['all','All Pages'],
          ].map(([value, label]) => `<option value="${value}" ${(popup.page_key || 'home') === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Position</label>
        <select id="pop-position" class="form-control">
          ${[
            ['center','Center'],
            ['top','Top'],
            ['bottom','Bottom'],
            ['bottom-right','Bottom Right'],
            ['bottom-left','Bottom Left'],
          ].map(([value, label]) => `<option value="${value}" ${(popup.position || 'center') === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Button Text</label><input id="pop-button-text" class="form-control" value="${esc(popup.button_text || '')}"></div>
      <div class="form-group"><label>Button Link</label><input id="pop-button-link" class="form-control" value="${esc(popup.button_link || '')}" placeholder="courses.html"></div>
      <div class="form-group"><label>Start Date</label><input id="pop-start" type="datetime-local" class="form-control" value="${toInput(popup.start_date)}"></div>
      <div class="form-group"><label>End Date</label><input id="pop-end" type="datetime-local" class="form-control" value="${toInput(popup.end_date)}"></div>
      <div class="form-group full"><label>Popup Image</label>${imageUploadField('pop-image', 'Upload Popup Image', popup.image_url || '', 'JPG, JPEG, PNG, or WEBP up to 5MB')}</div>
    </div>`;
  openModal(id ? 'Edit Pop up' : 'Add Pop up', body, async () => {
    const startDate = getValue('pop-start');
    const endDate = getValue('pop-end');
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast('End date must be after the start date', 'error');
      return;
    }
    let imageUrl = '';
    try {
      imageUrl = await uploadImageField('pop-image', 'popups');
    } catch (err) {
      toast(err.message || 'Popup image upload failed', 'error');
      return;
    }
    const payload = {
      title: getValue('pop-title'),
      message: getValue('pop-message'),
      popup_type: getValue('pop-type'),
      status: getValue('pop-status'),
      page_key: getValue('pop-page-key'),
      position: getValue('pop-position'),
      button_text: getValue('pop-button-text'),
      button_link: getValue('pop-button-link'),
      start_date: startDate ? startDate.replace('T', ' ') : null,
      end_date: endDate ? endDate.replace('T', ' ') : null,
      image_url: imageUrl,
    };
    const r = id
      ? await api('PATCH', `admin/home-popups/${id}`, payload)
      : await api('POST', 'admin/home-popups', payload);
    if (r.ok) {
      toast('Pop up saved!');
      closeModal();
      renderHomePopups();
    } else {
      toast(r.data.message || 'Popup could not be saved', 'error');
    }
  });
  bindImageUploadPreview('pop-image');
}

async function renderTestimonials() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/testimonials');
  const items = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Testimonials</div></div>
      <button class="btn-primary" onclick="openTestimonialModal()">+ Add Testimonial</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
      ${items.length ? items.map(t => `
      <div class="card" style="position:relative">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="position:relative;width:44px;height:44px;flex:0 0 44px;border-radius:50%;overflow:hidden;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">
            ${esc(String(t.name || '?').charAt(0).toUpperCase())}
            ${t.image_url ? `<img src="${esc(adminAssetUrl(t.image_url))}" alt="${esc(t.name)}" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center">` : ''}
          </div>
          <div>
            <div style="font-weight:700">${esc(t.name)}</div>
            <div class="text-muted" style="font-size:12px">${esc(t.role||'')} ${t.company_or_course?'· '+esc(t.company_or_course):''}</div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--text-soft);line-height:1.5;margin-bottom:12px">"${esc(t.quote)}"</p>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>${'⭐'.repeat(Math.min(5,t.rating||5))}</div>
          <div style="display:flex;gap:6px">
            ${t.is_featured ? '<span class="badge badge-yellow">Featured</span>' : ''}
            <span class="badge ${t.status==='active'?'badge-green':'badge-red'}">${t.status}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:12px">
          <button class="btn-icon btn-sm" onclick='openTestimonialModal(${JSON.stringify(t).replace(/'/g,"&#39;")})'>✏️</button>
          <button class="btn-danger btn-sm" onclick="deleteItem('testimonials',${t.id},decodeURIComponent('${enc(t.name)}'))">🗑</button>
        </div>
      </div>`).join('') : '<div class="empty-state card"><div class="empty-state-icon">⭐</div><p>No testimonials yet</p></div>'}
    </div>`;
}

function openTestimonialModal(t = null) {
  const d = t || {};
  const body = `
    <div class="form-grid">
      <div class="form-group"><label>Name *</label><input id="tf-name" class="form-control" value="${esc(d.name||'')}"></div>
      <div class="form-group"><label>Role</label><input id="tf-role" class="form-control" value="${esc(d.role||'')}"></div>
      <div class="form-group full"><label>Company / Course</label><input id="tf-company" class="form-control" value="${esc(d.company_or_course||'')}"></div>
      <div class="form-group full"><label>Quote *</label><textarea id="tf-quote" class="form-control" rows="3">${esc(d.quote||'')}</textarea></div>
      <div class="form-group"><label>Rating (1-5)</label><input id="tf-rating" type="number" min="1" max="5" class="form-control" value="${d.rating||5}"></div>
      <div class="form-group"><label>Sort Order</label><input id="tf-sort" type="number" class="form-control" value="${d.sort_order||0}"></div>
      <div class="form-group full"><label>Profile Picture</label>${imageUploadField('tf-img', 'Upload Profile Picture', d.image_url || '', 'Use a clear square JPG, JPEG, PNG, or WEBP image')}</div>
      <div class="form-group"><label>Status</label>
        <select id="tf-status" class="form-control">
          <option value="active" ${d.status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${d.status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div class="form-group"><label>Featured?</label>
        <label class="toggle-switch" style="margin-top:8px"><div class="toggle"><input id="tf-featured" type="checkbox" ${d.is_featured?'checked':''}><span class="toggle-slider"></span></div><span>Featured</span></label>
      </div>
    </div>`;
  openModal(d.id ? 'Edit Testimonial' : 'Add Testimonial', body, async () => {
    let imageUrl = '';
    try {
      imageUrl = await uploadImageField('tf-img', 'testimonials');
    } catch (err) {
      toast(err.message || 'Profile picture upload failed', 'error');
      return;
    }
    const payload = {
      name: getValue('tf-name'), role: getValue('tf-role'), company_or_course: getValue('tf-company'),
      quote: getValue('tf-quote'), rating: parseInt(getValue('tf-rating')||5), sort_order: parseInt(getValue('tf-sort')||0),
      image_url: imageUrl, status: getValue('tf-status'),
      is_featured: document.getElementById('tf-featured').checked ? 1 : 0,
    };
    const r = d.id ? await api('PATCH',`admin/testimonials/${d.id}`,payload) : await api('POST','admin/testimonials',payload);
    if (r.ok) { toast('Testimonial saved!'); closeModal(); renderTestimonials(); }
    else toast(r.data.message,'error');
  });
  bindImageUploadPreview('tf-img');
}

// ── TRUSTED BY ─────────────────────────────────────────────
async function renderTrustedBy() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/trusted-partners');
  const items = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Trusted By Partners</div></div>
      <button class="btn-primary" onclick="openPartnerModal()">+ Add Partner</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
      ${items.length ? items.map(p => `
      <div class="card" style="text-align:center">
        ${p.logo_url ? `<img src="${esc(adminAssetUrl(p.logo_url))}" style="max-height:60px;max-width:140px;object-fit:contain;margin-bottom:10px">` : '<div style="height:60px;display:flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:10px">🤝</div>'}
        <div style="font-weight:600;font-size:14px">${esc(p.name)}</div>
        ${p.website_url ? `<a href="${esc(p.website_url)}" target="_blank" class="text-muted" style="font-size:12px">${esc(p.website_url)}</a>` : ''}
        <div style="display:flex;gap:6px;justify-content:center;margin-top:10px">
          <button class="btn-icon btn-sm" onclick='openPartnerModal(${JSON.stringify(p).replace(/'/g,"&#39;")})'>✏️</button>
          <button class="btn-danger btn-sm" onclick="deleteItem('trusted-partners',${p.id},decodeURIComponent('${enc(p.name)}'))">🗑</button>
        </div>
      </div>`).join('') : '<div class="empty-state card"><div class="empty-state-icon">🤝</div><p>No partners yet</p></div>'}
    </div>`;
}

function openPartnerModal(p = null) {
  const d = p || {};
  const body = `
    <div class="form-grid">
      <div class="form-group full"><label>Partner Name *</label><input id="pf2-name" class="form-control" value="${esc(d.name||'')}"></div>
      <div class="form-group full"><label>Partner Logo</label>${imageUploadField('pf2-logo', 'Upload Partner Logo', d.logo_url || '', 'Use PNG or WEBP for transparent logos when possible')}</div>
      <div class="form-group full"><label>Website URL</label><input id="pf2-url" class="form-control" value="${esc(d.website_url||'')}" placeholder="https://partner.com"></div>
      <div class="form-group"><label>Sort Order</label><input id="pf2-sort" type="number" class="form-control" value="${d.sort_order||0}"></div>
    </div>`;
  openModal(d.id ? 'Edit Partner' : 'Add Partner', body, async () => {
    let logoUrl = '';
    try {
      logoUrl = await uploadImageField('pf2-logo', 'partners');
    } catch (err) {
      toast(err.message || 'Partner logo upload failed', 'error');
      return;
    }
    const payload = { name: getValue('pf2-name'), logo_url: logoUrl, website_url: getValue('pf2-url'), sort_order: parseInt(getValue('pf2-sort')||0) };
    const r = d.id ? await api('PATCH',`admin/trusted-partners/${d.id}`,payload) : await api('POST','admin/trusted-partners',payload);
    if (r.ok) { toast('Partner saved!'); closeModal(); renderTrustedBy(); }
    else toast(r.data.message,'error');
  });
  bindImageUploadPreview('pf2-logo');
}

// ── FAQS ───────────────────────────────────────────────────
async function renderFaqs() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/faqs');
  const items = r.ok ? r.data.data : [];
  const pages = ['home','courses','webinar','articles','certification','contact'];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">FAQs Manager</div></div>
      <div class="page-actions">
        <select id="faq-page-filter" class="form-control" style="width:150px">
          <option value="">All Pages</option>
          ${pages.map(p=>`<option value="${p}">${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}
        </select>
        <button class="btn-primary" onclick="openFaqModal()">+ Add FAQ</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Question</th><th>Page</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody id="faq-tbody">
            ${items.length ? items.map(f => `
            <tr>
              <td style="max-width:320px"><b>${esc(f.question)}</b><div class="text-muted" style="font-size:12px;margin-top:3px">${esc(f.answer.slice(0,80))}${f.answer.length>80?'…':''}</div></td>
              <td><span class="badge badge-purple">${f.page_key}</span></td>
              <td>${f.sort_order}</td>
              <td><span class="badge ${f.is_active?'badge-green':'badge-red'}">${f.is_active?'Yes':'No'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick='openFaqModal(${JSON.stringify(f).replace(/'/g,"&#39;")})'>✏️</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('faqs',${f.id},'FAQ')">🗑</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="5" class="text-muted">No FAQs</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openFaqModal(f = null) {
  const d = f || {};
  const pages = ['home','courses','webinar','articles','certification','contact'];
  const body = `
    <div class="form-grid">
      <div class="form-group"><label>Page</label>
        <select id="ff-page" class="form-control">${pages.map(p=>`<option value="${p}" ${d.page_key===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Sort Order</label><input id="ff-sort" type="number" class="form-control" value="${d.sort_order||0}"></div>
      <div class="form-group full"><label>Question *</label><input id="ff-q" class="form-control" value="${esc(d.question||'')}"></div>
      <div class="form-group full"><label>Answer *</label><textarea id="ff-a" class="form-control" rows="4">${esc(d.answer||'')}</textarea></div>
    </div>`;
  openModal(d.id ? 'Edit FAQ' : 'Add FAQ', body, async () => {
    const payload = { page_key: getValue('ff-page'), question: getValue('ff-q'), answer: getValue('ff-a'), sort_order: parseInt(getValue('ff-sort')||0) };
    const r = d.id ? await api('PATCH',`admin/faqs/${d.id}`,payload) : await api('POST','admin/faqs',payload);
    if (r.ok) { toast('FAQ saved!'); closeModal(); renderFaqs(); }
    else toast(r.data.message,'error');
  });
}

// ── COUNTERS ───────────────────────────────────────────────
async function renderCounters() {
  const content = document.getElementById('admin-content');
  await loadCountersSection('admin-content', true);
}

async function loadCountersSection(containerId, isPage = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const r = await api('GET', 'admin/counters');
  const items = r.ok ? r.data.data : [];
  el.innerHTML = `
    ${isPage ? '<div class="page-header"><div><div class="page-title">Stats / Counters</div></div><button class="btn-primary" onclick="openCounterModal()">+ Add Counter</button></div>' : '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div class="card-title" style="margin:0">📈 Stats / Counters</div><button class="btn-primary btn-sm" onclick="openCounterModal()">+ Add</button></div>'}
    <div class="card" ${isPage?'':'style="margin-top:0"'}>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Icon</th><th>Label</th><th>Value</th><th>Suffix</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.map(c => `
            <tr>
              <td style="font-size:24px">${esc(c.icon||'—')}</td>
              <td><b>${esc(c.label)}</b></td>
              <td><b style="font-size:18px;color:var(--accent)">${esc(c.value)}</b></td>
              <td>${esc(c.suffix||'')}</td>
              <td>${c.sort_order}</td>
              <td><span class="badge ${c.is_active?'badge-green':'badge-red'}">${c.is_active?'Yes':'No'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick='openCounterModal(${JSON.stringify(c).replace(/'/g,"&#39;")})'>✏️</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('counters',${c.id},decodeURIComponent('${enc(c.label)}'))">🗑</button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openCounterModal(c = null) {
  const d = c || {};
  const body = `
    <div class="form-grid">
      <div class="form-group"><label>Icon (emoji)</label><input id="cf2-icon" class="form-control" value="${esc(d.icon||'')}" placeholder="👨‍🎓"></div>
      <div class="form-group"><label>Label *</label><input id="cf2-label" class="form-control" value="${esc(d.label||'')}"></div>
      <div class="form-group"><label>Value *</label><input id="cf2-value" class="form-control" value="${esc(d.value||'')}"></div>
      <div class="form-group"><label>Suffix</label><input id="cf2-suffix" class="form-control" value="${esc(d.suffix||'')}" placeholder="+ or %"></div>
      <div class="form-group"><label>Sort Order</label><input id="cf2-sort" type="number" class="form-control" value="${d.sort_order||0}"></div>
    </div>`;
  openModal(d.id ? 'Edit Counter' : 'Add Counter', body, async () => {
    const payload = { icon: getValue('cf2-icon'), label: getValue('cf2-label'), value: getValue('cf2-value'), suffix: getValue('cf2-suffix'), sort_order: parseInt(getValue('cf2-sort')||0) };
    const r = d.id ? await api('PATCH',`admin/counters/${d.id}`,payload) : await api('POST','admin/counters',payload);
    if (r.ok) { toast('Counter saved!'); closeModal(); renderCounters(); }
    else toast(r.data.message,'error');
  });
}

// ── NAVIGATION MENU ────────────────────────────────────────
async function renderNavigationMenu() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/navigation');
  const items = r.ok ? r.data.data : [];
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Navigation Menu</div></div>
      <button class="btn-primary" onclick="openNavModal()">+ Add Menu Item</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Label</th><th>URL</th><th>Location</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.length ? items.map(n => `
            <tr>
              <td><b>${esc(n.label)}</b></td>
              <td class="text-muted">${esc(n.url||'—')}</td>
              <td><span class="badge badge-purple">${n.location}</span></td>
              <td>${n.sort_order}</td>
              <td><span class="badge ${n.is_active?'badge-green':'badge-red'}">${n.is_active?'Yes':'No'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick='openNavModal(${JSON.stringify(n).replace(/'/g,"&#39;")})'>✏️</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('navigation',${n.id},decodeURIComponent('${enc(n.label)}'))">🗑</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="6" class="text-muted">No menu items</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openNavModal(n = null) {
  const d = n || {};
  const body = `
    <div class="form-grid">
      <div class="form-group"><label>Location</label>
        <select id="nf-loc" class="form-control">
          <option value="header" ${d.location==='header'?'selected':''}>Header</option>
          <option value="footer" ${d.location==='footer'?'selected':''}>Footer</option>
          <option value="mobile" ${d.location==='mobile'?'selected':''}>Mobile</option>
        </select>
      </div>
      <div class="form-group"><label>Sort Order</label><input id="nf-sort" type="number" class="form-control" value="${d.sort_order||0}"></div>
      <div class="form-group full"><label>Label *</label><input id="nf-label" class="form-control" value="${esc(d.label||'')}"></div>
      <div class="form-group full"><label>URL</label><input id="nf-url" class="form-control" value="${esc(d.url||'')}" placeholder="/courses.html"></div>
      <div class="form-group"><label>Active?</label>
        <label class="toggle-switch" style="margin-top:8px"><div class="toggle"><input id="nf-active" type="checkbox" ${d.is_active||d.is_active===undefined?'checked':''}><span class="toggle-slider"></span></div></label>
      </div>
    </div>`;
  openModal(d.id ? 'Edit Menu Item' : 'Add Menu Item', body, async () => {
    const payload = { location: getValue('nf-loc'), label: getValue('nf-label'), url: getValue('nf-url'), sort_order: parseInt(getValue('nf-sort')||0), is_active: document.getElementById('nf-active').checked ? 1 : 0 };
    const r = d.id ? await api('PATCH',`admin/navigation/${d.id}`,payload) : await api('POST','admin/navigation',payload);
    if (r.ok) { toast('Menu item saved!'); closeModal(); renderNavigationMenu(); }
    else toast(r.data.message,'error');
  });
}

// ── MEDIA LIBRARY ──────────────────────────────────────────
async function renderLegacyMedia() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Media Library</div><div class="page-subtitle">Upload and manage general site files.</div></div>
      <div class="page-actions">
        <button class="btn-secondary" type="button" onclick="renderMedia()">Gallery Manager</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div id="upload-zone" class="upload-zone">
        <div style="font-size:40px">📁</div>
        <p><b>Click to upload</b> or drag & drop</p>
        <p style="font-size:12px">JPG, PNG, GIF, WebP, PDF — Max 10MB</p>
        <input type="file" id="media-file-input" accept="image/*,application/pdf" style="display:none" multiple>
      </div>
      <div id="upload-progress" class="hidden" style="margin-top:12px;color:var(--text-soft);font-size:13px"></div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="card-title" style="margin:0">Uploaded Files</div>
        <div class="search-bar"><input id="media-search" class="form-control" placeholder="Search..." style="width:200px" oninput="filterMedia(this.value)"></div>
      </div>
      <div id="media-grid" class="media-grid"><div class="loading-block"><div class="loading-ring"></div></div></div>
    </div>`;

  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('media-file-input');
  zone.onclick = () => fileInput.click();
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = () => zone.classList.remove('dragover');
  zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove('dragover'); handleUploads(e.dataTransfer.files); };
  fileInput.onchange = (e) => handleUploads(e.target.files);

  await loadMedia();
}

let _allMedia = [];
async function loadMedia() {
  const r = await api('GET', 'admin/media');
  _allMedia = r.ok ? r.data.data : [];
  renderMediaGrid(_allMedia);
}
function filterMedia(q) {
  renderMediaGrid(q ? _allMedia.filter(m => m.file_name.toLowerCase().includes(q.toLowerCase())) : _allMedia);
}
function renderMediaGrid(items) {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  grid.innerHTML = items.length ? items.map(m => `
    <div class="media-thumb" onclick="copyMediaUrl('${esc(m.file_url)}')">
      <img src="${esc(adminAssetUrl(m.file_url))}" alt="${esc(m.alt_text||m.file_name)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\'><rect fill=\\' %2322263a\\' width=\\'100%25\\' height=\\'100%25\\'/></svg>'">
      <div class="media-thumb-name">${esc(m.file_name)}</div>
      <button class="media-del" onclick="event.stopPropagation();deleteMedia(${m.id})">✕</button>
    </div>`).join('') : '<p class="text-muted">No media uploaded yet</p>';
}

async function handleUploads(files) {
  const prog = document.getElementById('upload-progress');
  prog.classList.remove('hidden');
  for (const file of files) {
    prog.textContent = `Uploading ${file.name}…`;
    const fd = new FormData(); fd.append('file', file);
    const r = await api('POST', 'admin/media/upload', fd, true);
    if (r.ok) { prog.textContent = `✅ ${file.name} uploaded`; }
    else { prog.textContent = `❌ ${file.name}: ${r.data.message}`; }
  }
  setTimeout(() => prog.classList.add('hidden'), 2000);
  await loadMedia();
}

async function deleteMedia(id) {
  if (!confirm('Delete this media file?')) return;
  const r = await api('DELETE', `admin/media/${id}`);
  if (r.ok) { toast('Media deleted'); loadMedia(); }
  else toast(r.data.message, 'error');
}

function copyMediaUrl(url) {
  navigator.clipboard.writeText(url).then(() => toast('URL copied to clipboard!'));
}

let _galleryItems = [];

async function renderMedia() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Media Gallery</div>
        <div class="page-subtitle">Manage the images displayed on the public gallery page.</div>
      </div>
      <div class="page-actions">
        <button class="btn-secondary" type="button" onclick="renderLegacyMedia()">Media Library</button>
        <button class="btn-primary" type="button" onclick="openGalleryModal()">${adminIcon('plus')} Add Image</button>
      </div>
    </div>
    <div class="card">
      <div class="card-heading-row">
        <div>
          <div class="card-title">Gallery Images</div>
          <div class="page-subtitle" id="gallery-count">Loading...</div>
        </div>
        <input class="form-control gallery-search" placeholder="Search category or alt text" oninput="filterGallery(this.value)">
      </div>
      <div class="table-wrap gallery-table-wrap">
        <table class="gallery-admin-table">
          <thead><tr><th>Image</th><th>Category</th><th>Order</th><th>Visibility</th><th>Actions</th></tr></thead>
          <tbody id="gallery-admin-body">
            <tr><td colspan="5"><div class="loading-block"><div class="loading-ring"></div></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
  await loadGalleryAdmin();
}

async function loadGalleryAdmin() {
  const response = await api('GET', 'admin/gallery');
  if (!response.ok) {
    _galleryItems = [];
    renderGalleryAdmin([]);
    toast(response.data.message || 'Unable to load gallery images', 'error');
    return;
  }
  _galleryItems = response.data.data || [];
  renderGalleryAdmin(_galleryItems);
}

function filterGallery(query) {
  const value = String(query || '').trim().toLowerCase();
  const items = value
    ? _galleryItems.filter(item => `${item.category || ''} ${item.alt_text || ''}`.toLowerCase().includes(value))
    : _galleryItems;
  renderGalleryAdmin(items);
}

function renderGalleryAdmin(items) {
  const body = document.getElementById('gallery-admin-body');
  const count = document.getElementById('gallery-count');
  if (count) count.textContent = `${_galleryItems.length} image${_galleryItems.length === 1 ? '' : 's'} total`;
  if (!body) return;
  body.innerHTML = items.length ? items.map(item => `
    <tr>
      <td class="gallery-image-cell">
        <img src="${esc(adminAssetUrl(item.file_url))}" alt="${esc(item.alt_text || `${item.category || 'General'} gallery image`)}" loading="lazy">
      </td>
      <td><span class="badge badge-purple">${esc(item.category || 'General')}</span></td>
      <td class="admin-nowrap">${Number(item.sort_order || 0)}</td>
      <td><span class="badge ${Number(item.is_active) ? 'badge-green' : 'badge-yellow'}">${Number(item.is_active) ? 'Active' : 'Hidden'}</span></td>
      <td>
        <div class="table-actions gallery-actions">
          <button class="btn-icon btn-sm" type="button" onclick="openGalleryModal(${Number(item.id)})">${adminIcon('edit')} Edit</button>
          <button class="btn-icon btn-sm" type="button" onclick="toggleGalleryImage(${Number(item.id)})">${Number(item.is_active) ? 'Hide' : 'Show'}</button>
          <button class="btn-danger btn-sm" type="button" onclick="deleteGalleryImage(${Number(item.id)})">${adminIcon('trash')} Delete</button>
        </div>
      </td>
    </tr>`).join('') : `
      <tr><td colspan="5" class="empty-state"><p>No gallery images found.</p></td></tr>`;
}

async function uploadGalleryImageAsset() {
  const input = document.getElementById('gallery-image-file');
  const file = input?.files?.[0];
  if (!file) return null;
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'gallery');
  const response = await api('POST', 'admin/media/upload', formData, true);
  if (!response.ok || !response.data.success || !response.data.data?.id) {
    throw new Error(response.data.message || 'Gallery image upload failed');
  }
  return response.data.data;
}

function openGalleryModal(id = null) {
  const item = id ? _galleryItems.find(entry => Number(entry.id) === Number(id)) : null;
  if (id && !item) return toast('Gallery image not found', 'error');
  const current = item || {};
  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Category *</label>
        <input id="gallery-category" class="form-control" list="gallery-category-list" maxlength="100" value="${esc(current.category || 'General')}" placeholder="Choose or enter a category">
        <datalist id="gallery-category-list">
          <option value="General"><option value="Classroom"><option value="Events"><option value="Workshops"><option value="Achievements">
        </datalist>
      </div>
      <div class="form-group full">
        <label>Alternative Text</label>
        <input id="gallery-alt" class="form-control" maxlength="255" value="${esc(current.alt_text || '')}" placeholder="Describe the image for accessibility">
      </div>
      <div class="form-group">
        <label>Display Order</label>
        <input id="gallery-sort" class="form-control" type="number" step="1" value="${Number(current.sort_order || 0)}">
      </div>
      <div class="form-group">
        <label>Visibility</label>
        <label class="toggle-switch gallery-active-toggle">
          <div class="toggle"><input id="gallery-active" type="checkbox" ${current.is_active === undefined || Number(current.is_active) ? 'checked' : ''}><span class="toggle-slider"></span></div>
          <span>Show on public gallery</span>
        </label>
      </div>
      <div class="form-group full">
        <label>${item ? 'Replace Image' : 'Gallery Image *'}</label>
        ${imageUploadField('gallery-image', item ? 'Choose a replacement image' : 'Choose gallery image', current.file_url || '', 'JPG, JPEG, PNG, or WEBP. Maximum size 5MB.')}
      </div>
    </div>`;

  openModal(item ? 'Edit Gallery Image' : 'Add Gallery Image', body, async () => {
    const category = getValue('gallery-category');
    const sortOrder = Number.parseInt(getValue('gallery-sort') || '0', 10);
    const hasNewImage = Boolean(document.getElementById('gallery-image-file')?.files?.[0]);
    if (!category) return toast('Category is required', 'error');
    if (!Number.isInteger(sortOrder)) return toast('Display order must be a whole number', 'error');
    if (!item && !hasNewImage) return toast('Choose an image to upload', 'error');

    const confirmButton = document.getElementById('modal-confirm');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Saving...';
    let uploaded = null;
    try {
      uploaded = await uploadGalleryImageAsset();
      const targetId = uploaded?.id || item.id;
      const response = await api('PATCH', `admin/gallery/${targetId}`, {
        category,
        alt_text: getValue('gallery-alt'),
        sort_order: sortOrder,
        is_active: document.getElementById('gallery-active').checked ? 1 : 0,
      });
      if (!response.ok) throw new Error(response.data.message || 'Unable to save gallery image');

      if (uploaded && item && Number(uploaded.id) !== Number(item.id)) {
        await api('DELETE', `admin/media/${item.id}`);
      }
      toast(item ? 'Gallery image updated' : 'Gallery image added');
      closeModal();
      await loadGalleryAdmin();
    } catch (error) {
      if (uploaded?.id) await api('DELETE', `admin/media/${uploaded.id}`);
      confirmButton.disabled = false;
      confirmButton.textContent = 'Save';
      toast(error.message || 'Unable to save gallery image', 'error');
    }
  });
  bindImageUploadPreview('gallery-image');
}

async function toggleGalleryImage(id) {
  const item = _galleryItems.find(entry => Number(entry.id) === Number(id));
  if (!item) return;
  const response = await api('PATCH', `admin/gallery/${id}`, {
    category: item.category || 'General',
    alt_text: item.alt_text || '',
    sort_order: Number(item.sort_order || 0),
    is_active: Number(item.is_active) ? 0 : 1,
  });
  if (response.ok) {
    toast(Number(item.is_active) ? 'Gallery image hidden' : 'Gallery image activated');
    await loadGalleryAdmin();
  } else {
    toast(response.data.message || 'Unable to update gallery image', 'error');
  }
}

async function deleteGalleryImage(id) {
  if (!confirm('Delete this gallery image? This cannot be undone.')) return;
  const response = await api('DELETE', `admin/media/${id}`);
  if (response.ok) {
    toast('Gallery image deleted');
    await loadGalleryAdmin();
  } else {
    toast(response.data.message || 'Unable to delete gallery image', 'error');
  }
}

// ── CONTACT LEADS ──────────────────────────────────────────
async function renderContactLeads() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/contact-leads');
  const leads = r.ok ? r.data.data : [];
  const statusColors = { new:'cyan', contacted:'yellow', converted:'green', closed:'red' };
  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Contact Leads</div><div class="page-subtitle">${leads.filter(l=>l.status==='new').length} new leads</div></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${leads.length ? leads.map(l => `
            <tr>
              <td><b>${esc(l.name)}</b></td>
              <td class="text-muted">${esc(l.email||'—')}</td>
              <td class="text-muted">${esc(l.phone||'—')}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${esc(l.subject||l.message?.slice(0,50)||'—')}</td>
              <td>
                <select class="form-control" style="padding:4px 8px;font-size:12px;width:120px" onchange="updateLeadStatus(${l.id},this.value)">
                  ${['new','contacted','converted','closed'].map(s=>`<option value="${s}" ${l.status===s?'selected':''}>${s}</option>`).join('')}
                </select>
              </td>
              <td class="text-muted">${new Date(l.created_at).toLocaleDateString()}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-icon btn-sm" onclick="viewLead(${l.id})">👁</button>
                  <button class="btn-danger btn-sm" onclick="deleteItem('contact-leads',${l.id},'this lead')">🗑</button>
                </div>
              </td>
            </tr>`).join('') : '<tr><td colspan="7" class="text-muted">No leads yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function updateLeadStatus(id, status) {
  const r = await api('PATCH', `admin/contact-leads/${id}`, { status });
  r.ok ? toast('Status updated') : toast(r.data.message, 'error');
}

async function viewLead(id) {
  const r = await api('GET', `admin/contact-leads/${id}`);
  if (!r.ok) return;
  const l = r.data.data;
  const body = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div><b>Name:</b> ${esc(l.name)}</div>
      <div><b>Email:</b> ${esc(l.email||'—')}</div>
      <div><b>Phone:</b> ${esc(l.phone||'—')}</div>
      <div><b>Subject:</b> ${esc(l.subject||'—')}</div>
      <div><b>Message:</b><br><p style="margin-top:6px;color:var(--text-soft);line-height:1.6">${esc(l.message||'—')}</p></div>
      <div><b>Source Page:</b> ${esc(l.source_page||'—')}</div>
      <div><b>Date:</b> ${new Date(l.created_at).toLocaleString()}</div>
    </div>`;
  openInfoModal('Lead Details', body);
}

// ── SETTINGS ───────────────────────────────────────────────
async function renderSettings() {
  const content = document.getElementById('admin-content');
  const r = await api('GET', 'admin/settings');
  const settings = {};
  if (r.ok) r.data.data.forEach(s => settings[s.setting_key] = s.setting_value);

  content.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Settings</div></div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab(this,'stab-general')">⚙️ General</button>
      <button class="tab-btn" onclick="switchTab(this,'stab-contact')">📞 Contact</button>
      <button class="tab-btn" onclick="switchTab(this,'stab-social')">📱 Social</button>
      <button class="tab-btn" onclick="switchTab(this,'stab-seo')">🔍 SEO</button>
    </div>

    <div id="stab-general" class="tab-content active">
      <div class="card">
        <form id="settings-general-form">
          <div class="form-grid">
            <div class="form-group full"><label>Site / Institute Name</label><input id="s-site-name" class="form-control" value="${esc(settings.site_name||'')}"></div>
            <div class="form-group full"><label>Logo URL</label><input id="s-logo" class="form-control" value="${esc(settings.site_logo||'')}"><img id="s-logo-preview" class="img-preview ${settings.site_logo?'':'hidden'}" src="${esc(settings.site_logo||'')}"></div>
            <div class="form-group full"><label>Favicon URL</label><input id="s-favicon" class="form-control" value="${esc(settings.site_favicon||'')}"></div>
            <div class="form-group"><label>Google Analytics ID</label><input id="s-ga" class="form-control" value="${esc(settings.google_analytics_id||'')}" placeholder="G-XXXXXXXXXX"></div>
            <div class="form-group"><label>Maintenance Mode</label>
              <label class="toggle-switch" style="margin-top:8px"><div class="toggle"><input id="s-maint" type="checkbox" ${settings.maintenance_mode==='1'?'checked':''}><span class="toggle-slider"></span></div><span>Enable Maintenance</span></label>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="submit" class="btn-primary">💾 Save General</button></div>
        </form>
      </div>
    </div>

    <div id="stab-contact" class="tab-content">
      <div class="card">
        <form id="settings-contact-form">
          <div class="form-grid">
            <div class="form-group"><label>Contact Email</label><input id="s-email" class="form-control" value="${esc(settings.contact_email||'')}"></div>
            <div class="form-group"><label>Phone Number</label><input id="s-phone" class="form-control" value="${esc(settings.contact_phone||'')}"></div>
            <div class="form-group"><label>WhatsApp Number</label><input id="s-whatsapp" class="form-control" value="${esc(settings.contact_whatsapp||'')}"></div>
            <div class="form-group full"><label>Address</label><textarea id="s-address" class="form-control">${esc(settings.contact_address||'')}</textarea></div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="submit" class="btn-primary">💾 Save Contact</button></div>
        </form>
      </div>
    </div>

    <div id="stab-social" class="tab-content">
      <div class="card">
        <form id="settings-social-form">
          <div class="form-grid">
            <div class="form-group"><label>Facebook URL</label><input id="s-fb" class="form-control" value="${esc(settings.social_facebook||'')}"></div>
            <div class="form-group"><label>Instagram URL</label><input id="s-ig" class="form-control" value="${esc(settings.social_instagram||'')}"></div>
            <div class="form-group"><label>YouTube URL</label><input id="s-yt" class="form-control" value="${esc(settings.social_youtube||'')}"></div>
            <div class="form-group"><label>LinkedIn URL</label><input id="s-li" class="form-control" value="${esc(settings.social_linkedin||'')}"></div>
            <div class="form-group"><label>Twitter / X URL</label><input id="s-tw" class="form-control" value="${esc(settings.social_twitter||'')}"></div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="submit" class="btn-primary">💾 Save Social</button></div>
        </form>
      </div>
    </div>

    <div id="stab-seo" class="tab-content">
      <div class="card">
        <form id="settings-seo-form">
          <div class="form-grid">
            <div class="form-group full"><label>Default SEO Title</label><input id="s-seo-title" class="form-control" value="${esc(settings.seo_default_title||'')}"></div>
            <div class="form-group full"><label>Default SEO Description</label><textarea id="s-seo-desc" class="form-control">${esc(settings.seo_default_description||'')}</textarea></div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="submit" class="btn-primary">💾 Save SEO</button></div>
        </form>
      </div>
    </div>`;

  // Wire forms
  document.getElementById('settings-general-form').onsubmit = async (e) => {
    e.preventDefault();
    const r = await api('PATCH', 'admin/settings', {
      site_name: getValue('s-site-name'), site_logo: getValue('s-logo'),
      site_favicon: getValue('s-favicon'), google_analytics_id: getValue('s-ga'),
      maintenance_mode: document.getElementById('s-maint').checked ? '1' : '0',
    });
    r.ok ? toast('General settings saved!') : toast(r.data.message,'error');
  };
  document.getElementById('settings-contact-form').onsubmit = async (e) => {
    e.preventDefault();
    const r = await api('PATCH', 'admin/settings', {
      contact_email: getValue('s-email'), contact_phone: getValue('s-phone'),
      contact_whatsapp: getValue('s-whatsapp'), contact_address: getValue('s-address'),
    });
    r.ok ? toast('Contact settings saved!') : toast(r.data.message,'error');
  };
  document.getElementById('settings-social-form').onsubmit = async (e) => {
    e.preventDefault();
    const r = await api('PATCH', 'admin/settings', {
      social_facebook: getValue('s-fb'), social_instagram: getValue('s-ig'),
      social_youtube: getValue('s-yt'), social_linkedin: getValue('s-li'),
      social_twitter: getValue('s-tw'),
    });
    r.ok ? toast('Social links saved!') : toast(r.data.message,'error');
  };
  document.getElementById('settings-seo-form').onsubmit = async (e) => {
    e.preventDefault();
    const r = await api('PATCH', 'admin/settings', {
      seo_default_title: getValue('s-seo-title'), seo_default_description: getValue('s-seo-desc'),
    });
    r.ok ? toast('SEO settings saved!') : toast(r.data.message,'error');
  };

  document.getElementById('s-logo').oninput = (e) => {
    const img = document.getElementById('s-logo-preview');
    if (e.target.value) { img.src = e.target.value; img.classList.remove('hidden'); } else img.classList.add('hidden');
  };
}

// ── SHARED HELPERS ─────────────────────────────────────────
function getValue(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function esc(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function enc(str) { return encodeURIComponent(String(str || '')).replace(/'/g, '%27'); }

async function togglePublish(type, id, currentStatus) {
  const endpoint = type === 'courses' ? `admin/courses/${id}/publish` :
                   type === 'webinars' ? `admin/webinars/${id}/publish` :
                   type === 'posts' ? `admin/posts/${id}/publish` : null;
  if (!endpoint) return;
  const r = await api('PATCH', endpoint);
  if (r.ok) {
    const status = type === 'webinars' ? webinarStatusLabel(r.data.status) : r.data.status;
    toast(`Status changed to ${status}`);
    renderPage(currentPage);
  }
  else toast(r.data.message, 'error');
}

async function deleteItem(type, id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const endpointMap = {
    'courses': `admin/courses/${id}`,
    'course-categories': `admin/course-categories/${id}`,
    'webinars': `admin/webinars/${id}`,
    'posts': `admin/posts/${id}`,
    'testimonials': `admin/testimonials/${id}`,
    'home-popups': `admin/home-popups/${id}`,
    'trusted-partners': `admin/trusted-partners/${id}`,
    'faqs': `admin/faqs/${id}`,
    'counters': `admin/counters/${id}`,
    'navigation': `admin/navigation/${id}`,
    'contact-leads': `admin/contact-leads/${id}`,
  };
  const endpoint = endpointMap[type];
  if (!endpoint) return;
  const r = await api('DELETE', endpoint);
  if (r.ok) { toast(`${name} deleted`); renderPage(currentPage); }
  else toast(r.data.message, 'error');
}

// ── INIT ───────────────────────────────────────────────────
function init() {
  hydrateAdminIcons();
  const adminContent = document.getElementById('admin-content');
  const refreshDynamicIcons = () => {
    hydrateDynamicAdminIcons(adminContent);
    repairBrokenLeadingIcons(adminContent);
  };
  new MutationObserver(refreshDynamicIcons).observe(adminContent, { childList: true, subtree: true });

  // Login form
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const btnText = document.getElementById('login-btn-text');
    const spinner = document.getElementById('login-btn-spinner');
    const errEl = document.getElementById('login-error');
    btn.disabled = true; btnText.textContent = 'Signing in…'; spinner.classList.remove('hidden');
    const result = await doLogin(email, password);
    if (result === true) {
      document.getElementById('login-page').classList.add('hidden');
      document.getElementById('admin-app').classList.remove('hidden');
      document.getElementById('topbar-admin-name').textContent = adminUser?.name || 'Admin';
      navigate('dashboard');
    } else {
      errEl.textContent = result; errEl.classList.remove('hidden');
      btn.disabled = false; btnText.textContent = 'Sign In'; spinner.classList.add('hidden');
    }
  };

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(item.dataset.page);
    });
  });

  // Mobile sidebar
  document.getElementById('topbar-menu-btn').onclick = () => document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-close').onclick = () => document.getElementById('sidebar').classList.remove('open');

  // Logout
  document.getElementById('logout-btn').onclick = logout;

  // Header actions
  const globalSearch = document.getElementById('admin-global-search');
  globalSearch.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const query = e.target.value.trim().toLowerCase();
    const page = Object.keys(PAGE_TITLES).find(key =>
      PAGE_TITLES[key].toLowerCase().includes(query) || key.includes(query)
    );
    if (page) {
      navigate(page);
      e.target.value = '';
    } else if (query) {
      toast('No matching admin page found', 'error');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      globalSearch.focus();
    }
  });
  document.getElementById('admin-notifications').onclick = () => navigate('lms-announcements');
  document.getElementById('admin-messages').onclick = () => navigate('lms-messages');

  // Modal close
  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-overlay').onclick = (e) => { if (e.target === document.getElementById('modal-overlay')) closeModal(); };

  // Check existing session
  if (isLoggedIn()) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    document.getElementById('topbar-admin-name').textContent = adminUser?.name || 'Admin';
    navigate('dashboard');
  }
}

document.addEventListener('DOMContentLoaded', init);
