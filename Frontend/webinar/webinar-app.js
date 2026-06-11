(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const icons = {
    date: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v14H3V7a2 2 0 0 1 2-2Z"/></svg>`,
    time: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0"/></svg>`,
    seats: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m8 0c2.7.7 5 2.4 5 5v1H3v-1c0-2.6 2.3-4.3 5-5"/></svg>`,
    download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/></svg>`,
    monitor: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H4zM9 21h6m-3-5v5"/></svg>`,
    students: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21c.6-4 3-6 6-6s5.4 2 6 6m0 0c.5-3.2 2.4-5 5-5 2 0 3.6 1.2 4 5"/></svg>`,
    trainer: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0M19 4h2v10h-5"/></svg>`,
    star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.4 7 .8-5.2 4.8 1.4 7-6.2-3.5L5.8 21l1.4-7L2 9.2l7-.8L12 2Z"/></svg>`,
    fb: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12Z"/></svg>`,
    ig: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>`,
    yt: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.6V8.4L15.8 12l-6.3 3.6Z"/></svg>`,
    in: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.11 20.45H3.56V9h3.55v11.45Z"/></svg>`,
    address: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.75a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>`,
  };

  function renderNav() {
    const nav = siteData.navigation.map((item) => ({
      ...item,
      active: item.label === "Webinar",
      href: normalizeNavHref(item),
    }));

    ["#nav-list", "#mobile-nav-list"].forEach((selector) => {
      const list = $(selector);
      list.innerHTML = nav
        .map((item) => `<li><a href="${item.href}" class="nav-link ${item.active ? "nav-link--active" : ""}">${item.label}</a></li>`)
        .join("");
    });

    const hamburger = $("#hamburger-btn");
    const mobileMenu = $("#mobile-menu");
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open");
    });

    window.addEventListener("scroll", () => {
      $("#site-header").classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  function normalizeNavHref(item) {
    return window.eeplResolveHref ? window.eeplResolveHref(item.href) : item.href;
  }

  function renderUpcoming() {
    $("#wb-upcoming-grid").innerHTML = webinarPageData.upcoming
        .map((item) => `
        <article class="wb-webinar-card">
          <div class="wb-card-media wb-media-${item.theme} ${item.image ? "wb-card-media--image" : ""}">
            <span class="wb-live-badge">LIVE</span>
            ${item.image ? `<img class="wb-card-image" src="${item.image}" alt="${escapeAttribute(item.title)}" loading="lazy" onerror="this.remove()">` : mediaMarkup(item.theme)}
          </div>
          <div class="wb-card-body">
            <h3>${item.title}</h3>
            <ul class="wb-meta-list">
              <li>${icons.date}<span>${item.date}</span></li>
              <li>${icons.time}<span>${item.time}</span></li>
              <li>${item.speakerImage ? `<img class="wb-speaker-logo" src="${item.speakerImage}" alt="" loading="lazy" onerror="this.remove()">` : icons.user}<span>${item.speaker}</span></li>
              <li>${icons.seats}<span>${item.seats}</span></li>
            </ul>
            ${item.id
              ? `<button type="button" class="btn btn-red btn-sm wb-register-btn" data-webinar-id="${item.id}" data-webinar-title="${escapeAttribute(item.title)}" ${item.registrationEnabled === false ? "disabled" : ""}>${item.registrationEnabled === false ? "Registration Closed" : "Register Now"}</button>`
              : `<a href="${window.eeplResolveHref ? window.eeplResolveHref("/contact") : "../contact.html"}" class="btn btn-red btn-sm">Register Now</a>`}
          </div>
        </article>
      `)
      .join("");

    document.querySelectorAll(".wb-register-btn[data-webinar-id]").forEach((button) => {
      button.addEventListener("click", () => {
        openRegistrationModal(button.dataset.webinarId, button.dataset.webinarTitle);
      });
    });
  }

  function escapeAttribute(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function ensureRegistrationModal() {
    let overlay = $("#wb-registration-overlay");
    if (overlay) return overlay;

    document.body.insertAdjacentHTML("beforeend", `
      <div class="wb-registration-overlay" id="wb-registration-overlay" hidden>
        <div class="wb-registration-modal" role="dialog" aria-modal="true" aria-labelledby="wb-registration-title">
          <button type="button" class="wb-registration-close" aria-label="Close">&times;</button>
          <p class="wb-registration-kicker">Webinar Registration</p>
          <h2 id="wb-registration-title">Register for webinar</h2>
          <form id="wb-registration-form">
            <input type="hidden" id="wb-registration-id">
            <label>Full Name<input type="text" id="wb-registration-name" required></label>
            <label>Email Address<input type="email" id="wb-registration-email" required></label>
            <label>Phone Number<input type="tel" id="wb-registration-phone"></label>
            <p class="wb-registration-message" id="wb-registration-message" aria-live="polite"></p>
            <button type="submit" class="btn btn-red">Complete Registration</button>
          </form>
        </div>
      </div>
    `);

    overlay = $("#wb-registration-overlay");
    const close = () => {
      overlay.hidden = true;
      document.body.style.overflow = "";
    };
    overlay.querySelector(".wb-registration-close").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    $("#wb-registration-form").addEventListener("submit", submitRegistration);
    return overlay;
  }

  function openRegistrationModal(id, title) {
    const overlay = ensureRegistrationModal();
    $("#wb-registration-id").value = id;
    $("#wb-registration-title").textContent = title || "Register for webinar";
    $("#wb-registration-message").textContent = "";
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $("#wb-registration-name").focus();
  }

  async function submitRegistration(event) {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    const message = $("#wb-registration-message");
    submit.disabled = true;
    submit.textContent = "Registering...";

    const result = window.eeplApiPost
      ? await window.eeplApiPost(`/webinars/${$("#wb-registration-id").value}/register`, {
          name: $("#wb-registration-name").value.trim(),
          email: $("#wb-registration-email").value.trim(),
          phone: $("#wb-registration-phone").value.trim(),
        })
      : { ok: false, data: { message: "Registration service is unavailable" } };

    submit.disabled = false;
    submit.textContent = "Complete Registration";
    message.textContent = result.ok
      ? "Registration completed. We will contact you with joining details."
      : (result.data?.message || "Registration could not be completed.");
    message.className = `wb-registration-message ${result.ok ? "is-success" : "is-error"}`;
    if (result.ok) event.currentTarget.reset();
  }

  function mediaMarkup(theme) {
    const labels = {
      java: `<span class="wb-code-lines"></span><strong>Java</strong>`,
      analytics: `<span class="wb-chart"><i></i><i></i><i></i></span>`,
      english: `<span class="wb-mic"></span>`,
      jee: `<span class="wb-card-books"></span>`,
      bootcamp: `<strong>JAVA<br>FULL STACK<br>BOOTCAMP</strong><span class="wb-window"></span>`,
      spoken: `<strong>SPOKEN<br>ENGLISH<br>MASTERCLASS</strong><span class="wb-mic"></span>`,
      strategy: `<strong>JEE MAIN 2026<br>COMPLETE<br>STRATEGY</strong><span class="wb-mini-person"></span>`,
      career: `<strong>CAREER GUIDANCE<br>& SUCCESS<br>STRATEGIES</strong><span class="wb-table-people"></span>`,
    };
    return labels[theme] || "";
  }

  function renderStats() {
    $("#wb-stats-grid").innerHTML = webinarPageData.stats
      .map((item) => `
        <div class="wb-stat-card">
          <span class="wb-stat-icon">${icons[item.icon]}</span>
          <div>
            <strong>${item.value}${item.icon === "star" ? " <span>&#9733;</span>" : ""}</strong>
            <small>${item.label}</small>
          </div>
        </div>
      `)
      .join("");
  }

  function renderRecordings() {
    $("#wb-recording-grid").innerHTML = webinarPageData.recordings
      .map((item) => `
        <article class="wb-recording-card">
          <div class="wb-recording-media wb-media-${item.theme}">
            ${mediaMarkup(item.theme)}
          </div>
          <div class="wb-recording-body">
            <h3>${item.title}</h3>
            <p>${item.date}</p>
            <div class="wb-recording-actions">
              <a href="${item.videoUrl || (window.eeplResolveHref ? window.eeplResolveHref("/contact") : "../contact.html")}" class="btn btn-outline-red btn-sm">Watch Now</a>
              <a href="${window.eeplResolveHref ? window.eeplResolveHref("/notes") : "../courses.html#study-materials"}" class="btn btn-outline-dark btn-sm">Download Notes ${icons.download}</a>
            </div>
          </div>
        </article>
      `)
      .join("");
  }

  function renderTestimonials() {
    $("#wb-testimonial-grid").innerHTML = webinarPageData.testimonials
      .map((item) => `
        <article class="wb-testimonial-card">
          <div class="wb-avatar wb-avatar-${item.avatar}"></div>
          <div class="wb-testimonial-copy">
            <div class="wb-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>${item.quote}</p>
            <strong>- ${item.name}</strong>
            <small>${item.role}</small>
          </div>
        </article>
      `)
      .join("");
  }

  function renderFaqs() {
    $("#wb-faq-list").innerHTML = webinarPageData.faqs
      .map((item, index) => `
        <details class="wb-faq-item" ${index === 0 ? "open" : ""}>
          <summary>${item.question}<span></span></summary>
          <p>${item.answer}</p>
        </details>
      `)
      .join("");
  }

  function asset(path) {
    return path && path.indexOf("assets/") === 0 ? `../${path}` : path;
  }

  function renderFooter() {
    const f = siteData.footer;
    $("#footer-grid").innerHTML = `
      <div class="footer-col footer-brand">
        <div class="footer-logo">
          <img src="${asset(f.brand.logo)}" alt="${f.brand.name} ${f.brand.sub}" class="footer-logo-img">
        </div>
        <p class="footer-tagline">CIN: U80301JH2019PTC012119</p>
        <p class="footer-tagline">${f.brand.tagline}</p>
        <div class="footer-social">
          ${f.social.map((social) => `<a href="${social.href}" class="social-icon" aria-label="${social.platform}" title="${social.platform}">${icons[social.icon] || social.icon}</a>`).join("")}
        </div>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Quick Links</h3>
        <ul class="footer-links">
          <li><a href="/about">About Us</a></li>
          <li><a href="/toppers">&#9733; Our Toppers</a></li>
          <li><a href="/faculty">Our Faculty</a></li>
          <li><a href="../articles.html">Blog</a></li>
          <li><a href="/contact">Contact Us</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Webinar</h3>
        <ul class="footer-links">
          <li><a href="#upcoming-webinars">Upcoming Webinars</a></li>
          <li><a href="#recorded-webinars">Recorded Webinars</a></li>
          <li><a href="#upcoming-webinars">Webinar Calendar</a></li>
          <li><a href="#upcoming-webinars">Webinar Categories</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Resources</h3>
        <ul class="footer-links">
          <li><a href="/study-materials">Study Materials</a></li>
          <li><a href="/notes">Downloadable Notes</a></li>
          <li><a href="/help">Help Center</a></li>
          <li><a href="#webinar-faq">FAQs</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Contact Info</h3>
        <ul class="footer-contact">
          <li><span class="footer-contact-icon">${icons.address}</span><span>${f.contact.address}</span></li>
          <li><span class="footer-contact-icon">${icons.phone}</span><a href="tel:${f.contact.phone.replace(/[^+\d]/g, "")}">${f.contact.phone}</a></li>
          <li><span class="footer-contact-icon">${icons.email}</span><a href="mailto:${f.contact.email}">${f.contact.email}</a></li>
        </ul>
      </div>
    `;

    $("#footer-copyright").textContent = "\u00a9 2026 Emancipation Edutech Private Limited. All Rights Reserved.";
  }

  function animateOnScroll(selector, visibleClass) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add(visibleClass));
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
      { threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
  }

  function initAnimations() {
    animateOnScroll(".wb-webinar-card", "wb-visible");
    animateOnScroll(".wb-recording-card", "wb-visible");
    animateOnScroll(".wb-testimonial-card", "wb-visible");
    animateOnScroll(".wb-stat-card", "wb-visible");
    animateOnScroll(".footer-col", "footer-col--visible");
    animateOnScroll(".footer-bottom", "footer-bottom--visible");
  }

  async function init() {
    if (window._siteDataPromise) {
      window.siteData = await window._siteDataPromise;
    }
    if (window._webinarPageDataPromise) {
      Object.assign(webinarPageData, await window._webinarPageDataPromise);
    }
    renderNav();
    renderUpcoming();
    renderStats();
    renderRecordings();
    renderTestimonials();
    renderFaqs();
    renderFooter();
    requestAnimationFrame(initAnimations);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
