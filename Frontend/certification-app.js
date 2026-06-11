/**
 * ============================================================
 *  EEPL Classroom — Certification Page Renderer
 * ============================================================
 *  Renders all certification sections from certificationPageData
 *  and siteData. Uses the same header/footer pattern as other pages.
 * ============================================================
 */

(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  /* ---------- SVG Icon library for benefit cards ---------- */
  const benefitIcons = {
    career: `<svg viewBox="0 0 24 24"><path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2ZM10 4h4v2h-4V4Zm10 15H4V8h16v11Z"/></svg>`,
    skills: `<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h17M8 16v-5m5 5V8m5 8V5"/><path d="m15 5 3-3 3 3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    credibility: `<svg viewBox="0 0 24 24"><path d="M12 2 3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5Zm-1 15-4-4 1.4-1.4L11 14.2l6.6-6.6L19 9l-8 8Z"/></svg>`,
    share: `<svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="m8.6 13.5 6.8 3.5m0-10L8.6 10.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    lifetime: `<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8Z"/><path d="M12.5 7H11v6l5.2 3.1.8-1.2-4.5-2.7V7Z"/></svg>`,
    global: `<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8Z"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  };

  /* ---------- SVG Icon library for cert card icons ---------- */
  const cardIcons = {
    java: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#f97316" opacity="0.12"/><text x="24" y="30" text-anchor="middle" fill="#ea580c" font-size="16" font-weight="900" font-family="Inter,sans-serif">☕</text></svg>`,
    python: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#3b82f6" opacity="0.12"/><text x="24" y="31" text-anchor="middle" fill="#2563eb" font-size="18" font-weight="900" font-family="Inter,sans-serif">🐍</text></svg>`,
    web: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#10b981" opacity="0.12"/><text x="24" y="31" text-anchor="middle" fill="#059669" font-size="16" font-weight="900" font-family="Inter,sans-serif">&lt;/&gt;</text></svg>`,
    c: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#6366f1" opacity="0.12"/><text x="24" y="32" text-anchor="middle" fill="#4f46e5" font-size="22" font-weight="900" font-family="Inter,sans-serif">C</text></svg>`,
    cpp: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#8b5cf6" opacity="0.12"/><text x="24" y="32" text-anchor="middle" fill="#7c3aed" font-size="18" font-weight="900" font-family="Inter,sans-serif">C++</text></svg>`,
    ds: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#14b8a6" opacity="0.12"/><text x="24" y="31" text-anchor="middle" fill="#0d9488" font-size="16" font-weight="900" font-family="Inter,sans-serif">🔗</text></svg>`,
    sql: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#f59e0b" opacity="0.12"/><text x="24" y="31" text-anchor="middle" fill="#d97706" font-size="16" font-weight="900" font-family="Inter,sans-serif">🗄️</text></svg>`,
    basics: `<svg viewBox="0 0 48 48" width="48" height="48" fill="none"><rect width="48" height="48" rx="10" fill="#64748b" opacity="0.12"/><text x="24" y="31" text-anchor="middle" fill="#475569" font-size="16" font-weight="900" font-family="Inter,sans-serif">💻</text></svg>`,
  };

  /* ---------- Social icons for footer ---------- */
  const socialIconMap = {
    fb: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12Z"/></svg>`,
    ig: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>`,
    yt: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.6V8.4L15.8 12l-6.3 3.6Z"/></svg>`,
    in: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.11 20.45H3.56V9h3.55v11.45Z"/></svg>`,
  };

  const contactIcons = {
    phone: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>`,
    web: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8Z"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  };

  /* ========== 1. HEADER NAV ========== */
  function renderNav() {
    // Override active state for certification page
    const nav = siteData.navigation.map((item) => ({
      ...item,
      active: item.label === "Certification",
    }));

    ["#nav-list", "#mobile-nav-list"].forEach((selector) => {
      const list = $(selector);
      if (!list) return;
      list.innerHTML = nav
        .map(
          (item) =>
            `<li><a href="${item.href}" class="nav-link ${item.active ? "nav-link--active" : ""}">${item.label}</a></li>`
        )
        .join("");
    });

    // Hamburger toggle
    const hamburger = $("#hamburger-btn");
    const mobileMenu = $("#mobile-menu");
    if (hamburger && mobileMenu) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("open");
        mobileMenu.classList.toggle("open");
      });
    }

    // Sticky header
    window.addEventListener("scroll", () => {
      $("#site-header").classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  /* ========== 2. HERO ========== */
  function renderHero() {
    const h = certificationPageData.hero;
    const heroCopy = $("#cf-hero-copy");
    if (!heroCopy) return;

    heroCopy.innerHTML = `
      <h1>
        ${h.headline}
        <span class="text-red">${h.headlineAccent}</span>
      </h1>
      <p class="cf-hero-desc">${h.description}</p>
      <div class="cf-hero-actions">
        <a href="${h.cta1.href}" class="btn btn-red">${h.cta1.label} <span aria-hidden="true">→</span></a>
        <a href="${h.cta2.href}" class="btn btn-outline-red">${h.cta2.label} <span aria-hidden="true">↗</span></a>
      </div>
    `;
  }

  /* ========== 3. CERTIFICATION CARDS ========== */
  function renderCards() {
    const grid = $("#cf-cards-grid");
    if (!grid) return;

    grid.innerHTML = certificationPageData.programs
      .map(
        (item) => `
        <article class="cf-cert-card" id="cert-card-${item.id}">
          <div class="cf-cert-card-icon">
            ${cardIcons[item.icon] || ""}
          </div>
          <h3>${item.title}</h3>
          <ul class="cf-cert-card-features">
            ${item.features.map((f) => `<li>${f}</li>`).join("")}
          </ul>
          <span class="cf-fee-label">${item.feeLabel}</span>
          <strong class="cf-card-fee">${item.fee}</strong>
          <a href="${item.href}" class="btn-view-courses">View Courses <span aria-hidden="true">→</span></a>
        </article>
      `
      )
      .join("");
  }

  /* ========== 4. FEE TABLE ========== */
  function renderFees() {
    const tbody = $("#cf-fee-rows");
    if (!tbody) return;

    tbody.innerHTML = certificationPageData.fees
      .map(
        (row) => `
        <tr>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
        </tr>
      `
      )
      .join("");
  }

  /* ========== 5. SAMPLE CERTIFICATE ========== */
  function renderSampleCertificate() {
    const copy = $("#cf-sample-copy");
    if (!copy) return;

    const sc = certificationPageData.sampleCertificate;
    copy.innerHTML = `
      <h2>${sc.title}</h2>
      <p class="cf-sample-desc">${sc.description}</p>
      <ul class="cf-sample-features">
        ${sc.features
          .map(
            (f) =>
              `<li><span class="cf-feature-check">✓</span> ${f}</li>`
          )
          .join("")}
      </ul>
      <a href="${certificationPageData.links.verifyCertificate}" class="btn-verify">Verify Certificate <span aria-hidden="true">→</span></a>
    `;
  }

  /* ========== 6. BENEFITS ========== */
  function renderBenefits() {
    const grid = $("#cf-benefits-grid");
    if (!grid) return;

    grid.innerHTML = certificationPageData.benefits
      .map(
        (item) => `
        <article class="cf-benefit-card">
          <div class="cf-benefit-icon">
            ${benefitIcons[item.icon] || ""}
          </div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </article>
      `
      )
      .join("");
  }

  /* ========== 7. FOOTER ========== */
  function renderFooter() {
    const f = siteData.footer;
    const cfFooter = certificationPageData.footer;
    const grid = $("#footer-grid");
    if (!grid) return;

    grid.innerHTML = `
      <!-- Brand -->
      <div class="footer-col footer-brand">
        <div class="footer-logo">
          ${
            f.brand.logo
              ? `<img src="${f.brand.logo}" alt="${f.brand.name} ${f.brand.sub}" class="footer-logo-img">`
              : `<span class="logo-main">${f.brand.name}</span><span class="logo-sub">${f.brand.sub}</span>`
          }
        </div>
        <p class="footer-tagline">Your trusted partner in online certification.</p>
        <div class="footer-social">
          ${f.social
            .map(
              (s) =>
                `<a href="${s.href}" class="social-icon" aria-label="${s.platform}" title="${s.platform}">${socialIconMap[s.icon] || s.icon}</a>`
            )
            .join("")}
        </div>
      </div>

      <!-- Quick Links -->
      <div class="footer-col">
        <h3 class="footer-heading">Quick Links</h3>
        <ul class="footer-links">
          ${cfFooter.quickLinks
            .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
            .join("")}
        </ul>
      </div>

      <!-- Resources -->
      <div class="footer-col">
        <h3 class="footer-heading">Resources</h3>
        <ul class="footer-links">
          ${cfFooter.resources
            .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
            .join("")}
        </ul>
      </div>

      <!-- Contact -->
      <div class="footer-col">
        <h3 class="footer-heading">Contact Info</h3>
        <ul class="footer-contact">
          <li><span class="footer-contact-icon">${contactIcons.phone}</span><a href="tel:${f.contact.phone.replace(/[^+\d]/g, "")}">${f.contact.phone}</a></li>
          <li><span class="footer-contact-icon">${contactIcons.email}</span><a href="mailto:${f.contact.email}">${f.contact.email}</a></li>
          <li><span class="footer-contact-icon">${contactIcons.web}</span><a href="#">www.emancipation.com</a></li>
        </ul>
      </div>
    `;

    $("#footer-copyright").textContent =
      "© 2024 Emancipation. All Rights Reserved.";
  }

  /* ========== SCROLL ANIMATIONS ========== */
  function animateOnScroll(selector, visibleClass) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add(visibleClass));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function initAnimations() {
    animateOnScroll(".cf-cert-card", "cf-visible");
    animateOnScroll(".cf-benefit-card", "cf-visible");
    animateOnScroll(".cf-sample-grid", "cf-visible");
    animateOnScroll(".cf-final-cta", "cf-visible");
    animateOnScroll(".footer-col", "footer-col--visible");
    animateOnScroll(".footer-bottom", "footer-bottom--visible");
  }

  /* ========== INIT ========== */
  async function init() {
    if (window._siteDataPromise) {
      window.siteData = await window._siteDataPromise;
    }
    if (window._certificationPageDataPromise) {
      Object.assign(certificationPageData, await window._certificationPageDataPromise);
    }
    renderNav();
    renderHero();
    renderCards();
    renderFees();
    renderSampleCertificate();
    renderBenefits();
    renderFooter();
    requestAnimationFrame(initAnimations);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
