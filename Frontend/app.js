/**
 * ============================================================
 *  EEPL Classroom — Homepage Renderer (app.js)
 * ============================================================
 *  Renders all homepage sections from siteData defined in data.js.
 *  Components read data; they never hard-code visible content.
 * ============================================================
 */

(function () {
  "use strict";

  /* ========== UTILITIES ========== */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function starsHTML(count) {
    return "★".repeat(count) + "☆".repeat(5 - count);
  }

  /* ========== 1. HEADER NAV ========== */
  function renderNav() {
    const list = $("#nav-list");
    const mobileList = $("#mobile-nav-list");
    siteData.navigation.forEach((item) => {
      const li = `<li><a href="${item.href}" class="nav-link ${item.active ? "nav-link--active" : ""}">${item.label}</a></li>`;
      list.insertAdjacentHTML("beforeend", li);
      mobileList.insertAdjacentHTML("beforeend", li);
    });

    // Hamburger toggle
    const hamburger = $("#hamburger-btn");
    const mobileMenu = $("#mobile-menu");
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open");
    });

    // Sticky header
    window.addEventListener("scroll", () => {
      $("#site-header").classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  /* ========== 2. HERO ========== */
  let currentSlide = 0;

  function renderHero() {
    const slide = siteData.heroSlides[currentSlide];
    const hero = $("#hero-section");
    if (hero) {
      hero.style.setProperty("--hero-banner-image", `url("${slide.bannerImage || slide.image}")`);
      hero.style.setProperty("--hero-overlay-opacity", slide.overlayOpacity || 0.93);
    }

    const content = $("#hero-content");
    content.innerHTML = `
      <h1 class="hero-headline">
        ${slide.headline}<br>
        <span class="text-red">${slide.headlineAccent}</span>
      </h1>
      <p class="hero-paragraph">${slide.paragraph}</p>
      <div class="hero-ctas">
        <a href="${slide.cta1.href}" class="btn btn-red btn-lg">${slide.cta1.label}</a>
        <a href="${slide.cta2.href}" class="btn btn-outline-red btn-lg">${slide.cta2.label}</a>
      </div>
    `;

    const heroImg = $("#hero-image");
    heroImg.src = slide.image;
    heroImg.alt = slide.imageAlt;
    heroImg.onerror = () => {
      const fallback = window.eeplResolveAsset
        ? window.eeplResolveAsset("assets/hero-student.png")
        : "assets/hero-student.png";
      const fallbackUrl = new URL(fallback, window.location.href).href;
      if (heroImg.src !== fallbackUrl) heroImg.src = fallback;
    };

    const badges = $("#hero-badges");
    badges.innerHTML = slide.badges
      .map(
        (b, i) => `
      <div class="hero-badge hero-badge--${i + 1}" style="animation-delay:${i * 0.15}s">
        <span class="hero-badge-icon">${b.icon}</span>
        <div>
          ${b.value ? `<strong>${b.value}</strong>` : ""}
          <span>${b.label}</span>
        </div>
      </div>`
      )
      .join("");

    // Hero arrows
    $("#hero-prev").onclick = () => {
      currentSlide = (currentSlide - 1 + siteData.heroSlides.length) % siteData.heroSlides.length;
      renderHero();
    };
    $("#hero-next").onclick = () => {
      currentSlide = (currentSlide + 1) % siteData.heroSlides.length;
      renderHero();
    };
  }

  /* ========== 3. POPULAR COURSES ========== */
  function renderCourses() {
    const grid = $("#courses-grid");
    if (!siteData.courses.length) {
      grid.innerHTML = `<div class="courses-empty">No popular courses are available right now.</div>`;
      return;
    }
    grid.innerHTML = siteData.courses
      .map(
        (c) => `
      <a href="${c.href}" class="course-card">
        <div class="course-card-img">
          <img src="${c.image}" alt="${c.title}" onerror="this.parentElement.classList.add('img-fallback')">
          <div class="course-card-img-overlay">${c.title.charAt(0)}</div>
        </div>
        <div class="course-card-body">
          <h3 class="course-card-title">${c.title}</h3>
          <div class="course-meta">
            <span class="course-meta-item">⏱ ${c.duration}</span>
            <span class="course-meta-item">📊 ${c.level}</span>
          </div>
          <div class="course-card-extra">
            <span class="course-pricing">
              ${c.discountActive ? `<span class="course-price-original">${c.originalPriceLabel}</span>` : ""}
              <span class="course-price">${c.priceLabel || (Number(c.price || 0) > 0 ? `Rs. ${Number(c.price).toLocaleString("en-IN")}` : "Free")}</span>
              ${c.discountActive ? `<span class="course-discount-badge">${c.discountLabel}</span>` : ""}
            </span>
            ${c.trainer ? `<span class="course-trainer">By ${c.trainer}</span>` : ""}
          </div>
          <p class="course-card-desc">${c.description}</p>
          <span class="btn btn-outline-red btn-sm">Learn More</span>
        </div>
      </a>`
      )
      .join("");
  }

  /* ========== 4. UPCOMING WEBINARS ========== */
  function renderWebinars() {
    const grid = $("#webinars-grid");
    grid.innerHTML = siteData.webinars
      .map(
        (w) => `
      <div class="webinar-card">
        ${w.image ? `<div class="webinar-image"><img src="${w.image}" alt="${w.title}" loading="lazy"></div>` : ""}
        <div class="webinar-date">
          <span class="webinar-month">${w.month}</span>
          <span class="webinar-day">${w.day}</span>
          <span class="webinar-weekday">${w.weekday}</span>
        </div>
        <div class="webinar-info">
          <h3 class="webinar-title">${w.title}</h3>
          <p class="webinar-time">🕐 ${w.time}</p>
          <p class="webinar-speaker">By: ${w.speaker}</p>
        </div>
        <a href="${w.href}" class="btn btn-red btn-sm webinar-cta">Register Now</a>
      </div>`
      )
      .join("");
  }

  /* ========== 5. STATS ========== */
  function renderStats() {
    const grid = $("#stats-grid");
    grid.innerHTML = siteData.stats
      .map(
        (s) => `
      <div class="stat-card">
        <span class="stat-icon">${s.icon}</span>
        <div>
          <strong class="stat-value" data-stat-value="${s.value}">${s.value}</strong>
          <span class="stat-label">${s.label}</span>
        </div>
      </div>`
      )
      .join("");

  }

  /* ========== 6. TRUSTED BY ========== */
  function renderTrustedBy() {
    const container = $("#trusted-logos");
    container.innerHTML = siteData.trustedBy
      .map((t) => {
        const logoContent = `
          <img src="${t.logo}" alt="${t.alt || t.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="trusted-logo-fallback" style="display:none">${t.name}</span>
          <strong class="trusted-logo-name">${t.name}</strong>
        `;

        if (t.href && t.href !== "#") {
          return `<a href="${t.href}" class="trusted-logo" aria-label="${t.name}">${logoContent}</a>`;
        }

        return `<div class="trusted-logo" aria-label="${t.name}">${logoContent}</div>`;
      })
      .join("");
  }

  function renderFaqs() {
    const section = $("#faq-section");
    const list = $("#faq-list");
    if (!section || !list || !Array.isArray(siteData.faqs) || !siteData.faqs.length) return;
    section.hidden = false;
    list.innerHTML = siteData.faqs
      .map((item, index) => `
        <details class="faq-item" ${index === 0 ? "open" : ""}>
          <summary>${item.question}<span></span></summary>
          <p>${item.answer}</p>
        </details>
      `)
      .join("");
  }

  /* ========== 7. CERTIFICATIONS ========== */
  function renderCertifications() {
    const grid = $("#cert-grid");
    grid.innerHTML = siteData.certifications
      .map(
        (c) => `
      <div class="cert-card">
        <span class="cert-icon">${c.icon}</span>
        <div>
          <strong class="cert-title">${c.title}</strong>
          <p class="cert-desc">${c.description}</p>
        </div>
      </div>`
      )
      .join("");
  }

  /* ========== 8. TESTIMONIALS ========== */
  function renderTestimonials() {
    const grid = $("#testimonials-grid");
    grid.innerHTML = siteData.testimonials
      .map(
        (t) => `
      <div class="testimonial-card">
        <div class="testimonial-author">
          <div class="testimonial-avatar">
            <span>${String(t.name || "?").charAt(0).toUpperCase()}</span>
            ${t.image ? `<img src="${t.image}" alt="${t.name}" loading="lazy" onerror="this.remove()">` : ""}
          </div>
          <div class="testimonial-identity">
            <p class="testimonial-name">${t.name}</p>
            ${t.role ? `<p class="testimonial-role">${t.role}</p>` : ""}
          </div>
        </div>
        <p class="testimonial-text">${t.text}</p>
        <div class="testimonial-stars">${starsHTML(t.stars)}</div>
      </div>`
      )
      .join("");
  }

  /* ========== 9. BOTTOM CTA ========== */
  function renderCTA() {
    const card = $("#cta-card");
    const d = siteData.bottomCTA;
    card.innerHTML = `
      <div class="cta-left">
        <span class="cta-icon">${d.icon}</span>
        <div>
          <h2 class="cta-headline">${d.headline}</h2>
          <p class="cta-subtext">${d.subtext}</p>
        </div>
      </div>
      <div class="cta-buttons">
        ${d.buttons
          .map(
            (b) =>
              `<a href="${b.href}" class="btn ${b.style === "primary" ? "btn-red" : "btn-outline-dark"} btn-lg">${b.label}</a>`
          )
          .join("")}
      </div>
    `;
  }

  /* ========== 10. FREE COUNSELLING ========== */
  function renderCounselling() {
    const d = siteData.counselling;
    if (!d) return;

    const left = $("#counselling-left");
    left.innerHTML = `
      <span class="counselling-badge" id="counselling-badge">🎓 ${d.badge}</span>
      <h2 class="counselling-headline">
        ${d.headline}<br>
        <span class="text-red">${d.headlineAccent}</span>
      </h2>
      <p class="counselling-desc">${d.paragraph}</p>
      <ul class="counselling-features" id="counselling-features">
        ${d.features
          .map(
            (f) => `
          <li class="counselling-feature">
            <span class="counselling-feature-icon">${f.icon}</span>
            <span>${f.text}</span>
          </li>`
          )
          .join("")}
      </ul>
      <div class="counselling-divider"></div>
      <div class="counselling-contact">
        <a href="tel:${d.phone.replace(/[^+\d]/g, "")}" class="counselling-contact-link" id="counselling-phone">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
          ${d.phone}
        </a>
        <a href="${d.whatsappLink}" target="_blank" class="counselling-contact-link" id="counselling-whatsapp">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp Us
        </a>
      </div>
    `;

    const right = $("#counselling-right");
    right.innerHTML = `
      <h3 class="counselling-form-title">${d.formTitle}</h3>
      <p class="counselling-form-subtitle">${d.formSubtitle}</p>
      <div class="counselling-form-divider"></div>
      <form class="counselling-form" id="counselling-form" autocomplete="off">
        <div class="counselling-form-row">
          <div class="counselling-form-group">
            <label class="counselling-label" for="counsel-name">FULL NAME <span class="text-red">*</span></label>
            <input type="text" id="counsel-name" class="counselling-input" placeholder="Your name" required>
          </div>
          <div class="counselling-form-group">
            <label class="counselling-label" for="counsel-phone">PHONE <span class="text-red">*</span></label>
            <input type="tel" id="counsel-phone" class="counselling-input" placeholder="10-digit number" required pattern="[0-9]{10}">
          </div>
        </div>
        <div class="counselling-form-group">
          <label class="counselling-label" for="counsel-email">EMAIL <span class="counselling-optional">(optional)</span></label>
          <input type="email" id="counsel-email" class="counselling-input" placeholder="email@example.com">
        </div>
        <div class="counselling-form-group">
          <label class="counselling-label" for="counsel-course">COURSE OF INTEREST</label>
          <select id="counsel-course" class="counselling-input counselling-select">
            <option value="">— Select a course —</option>
            ${d.courses.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
        <div class="counselling-form-group">
          <label class="counselling-label" for="counsel-message">MESSAGE <span class="counselling-optional">(optional)</span></label>
          <textarea id="counsel-message" class="counselling-input counselling-textarea" placeholder="Any specific questions or preferred batch timings..." rows="3"></textarea>
        </div>
        <button type="submit" class="counselling-submit" id="counselling-submit">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          ${d.submitLabel}
        </button>
        <p class="counselling-privacy">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
          ${d.privacyNote}
        </p>
      </form>
      <div class="counselling-success" id="counselling-success" style="display:none;">
        <div class="counselling-success-icon">✅</div>
        <h3 class="counselling-success-title">Thank You!</h3>
        <p class="counselling-success-text">Our counselor will call you within 30 minutes.</p>
      </div>
    `;

    // Form submission handler
    const form = $("#counselling-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        name: $("#counsel-name")?.value || "",
        phone: $("#counsel-phone")?.value || "",
        email: $("#counsel-email")?.value || "",
        subject: $("#counsel-course")?.value || "Free Counseling",
        message: $("#counsel-message")?.value || "",
        source_page: "home",
      };
      if (window.eeplApiPost) await window.eeplApiPost("/contact", payload);
      form.style.display = "none";
      $("#counselling-success").style.display = "flex";
    });
  }

  /* ========== 10. FOOTER ========== */
  function renderFooter() {
    const grid = $("#footer-grid");
    const f = siteData.footer;

    const socialIconMap = {
      fb: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`,
      ig: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
      yt: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
      in: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.941v5.665H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.371 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11-.002-4.124 2.062 2.062 0 01.002 4.124zM7.114 20.452H3.558V9h3.556v11.452z"/></svg>`,
      wa: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
    };

    const contactIconMap = {
      address: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.75A2.75 2.75 0 1112 6.25a2.75 2.75 0 010 5.5z"/></svg>`,
      phone: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>`,
      email: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z"/></svg>`,
    };

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
        <p class="footer-tagline">${f.brand.tagline}</p>
        <div class="footer-social">
          ${f.social
            .map(
              (s) => `<a href="${s.href}" class="social-icon" aria-label="${s.platform}" title="${s.platform}">${socialIconMap[s.icon] || s.icon}</a>`
            )
            .join("")}
        </div>
      </div>

      <!-- Quick Links -->
      <div class="footer-col">
        <h3 class="footer-heading">Quick Links</h3>
        <ul class="footer-links">
          ${f.quickLinks.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
        </ul>
      </div>

      <!-- Courses -->
      <div class="footer-col">
        <h3 class="footer-heading">Courses</h3>
        <ul class="footer-links">
          ${f.courses.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
        </ul>
      </div>

      <!-- Contact -->
      <div class="footer-col">
        <h3 class="footer-heading">Contact Info</h3>
        <ul class="footer-contact">
          <li><span class="footer-contact-icon">${contactIconMap.address}</span><span>${f.contact.address}</span></li>
          <li><span class="footer-contact-icon">${contactIconMap.phone}</span><a href="tel:${f.contact.phone.replace(/[^+\d]/g, "")}">${f.contact.phone}</a></li>
          <li><span class="footer-contact-icon">${contactIconMap.email}</span><a href="mailto:${f.contact.email}">${f.contact.email}</a></li>
        </ul>
      </div>
    `;

    $("#footer-copyright").textContent = f.copyright;
  }

  /* ========== 11. PROMOTION POPUP ========== */
  /**
   * Renders and controls the promotional popup / modal.
   * All content is driven by siteData.promotionPopup.
   * Supports localStorage-based "dismiss for today".
   * Future: replace the config with API data from admin panel.
   */
  function renderPromotionPopup() {
    const config = siteData.promotionPopup;
    if (!config || !config.enabled) return;

    // --- "Dismiss for today" check ---
    const dismissKey = `eepl_promo_dismissed_${config.id || "default"}`;
    if (config.dismissForDay) {
      const dismissed = localStorage.getItem(dismissKey);
      if (dismissed) {
        const dismissedDate = new Date(parseInt(dismissed, 10));
        const now = new Date();
        // Same calendar day?
        if (
          dismissedDate.getFullYear() === now.getFullYear() &&
          dismissedDate.getMonth() === now.getMonth() &&
          dismissedDate.getDate() === now.getDate()
        ) {
          return; // already dismissed today
        }
      }
    }

    const overlay = $("#promo-overlay");
    const popup = $("#promo-popup");

    // Human-readable type labels
    const typeLabels = {
      course_discount:   "🎓 Course Offer",
      festival_offer:    "🎉 Festival Offer",
      webinar_promo:     "🎙️ Webinar",
      new_course_launch: "🚀 New Launch",
      announcement:      "📢 Announcement",
    };

    // Emoji fallback for banner
    const typeEmoji = {
      course_discount:   "🎓",
      festival_offer:    "🎊",
      webinar_promo:     "🎙️",
      new_course_launch: "🚀",
      announcement:      "📢",
    };

    const badgeLabel = typeLabels[config.type] || "📢 Offer";
    const fallbackEmoji = typeEmoji[config.type] || "🎁";

    // Build HTML
    popup.innerHTML = `
      <button class="promo-close" id="promo-close-btn" aria-label="Close popup">✕</button>
      <span class="promo-type-badge promo-type-badge--${config.type}">${badgeLabel}</span>

      ${
        config.image
          ? `<div class="promo-banner">
               <img src="${config.image}" alt="${config.title}" onerror="this.parentElement.outerHTML='<div class=\\'promo-banner-fallback\\'>${fallbackEmoji}</div>'">
             </div>`
          : `<div class="promo-banner-fallback">${fallbackEmoji}</div>`
      }

      <div class="promo-body">
        <h2 class="promo-title">${config.title}</h2>
        ${config.subtitle ? `<p class="promo-subtitle">${config.subtitle}</p>` : ""}
        ${config.description ? `<p class="promo-desc">${config.description}</p>` : ""}
        ${config.ctaText ? `<a href="${config.ctaLink || "#"}" class="promo-cta" id="promo-cta-btn">${config.ctaText} →</a>` : ""}
        ${
          config.dismissForDay
            ? `<button class="promo-dismiss" id="promo-dismiss-btn">Don't show again today</button>`
            : ""
        }
        <div class="promo-ring"></div>
      </div>
    `;

    // --- Show after delay ---
    const delayMs = (config.delayInSeconds || 3) * 1000;

    setTimeout(() => {
      overlay.classList.add("promo--visible");
      document.body.style.overflow = "hidden"; // lock scroll
    }, delayMs);

    // --- Close helpers ---
    function closePopup() {
      overlay.classList.remove("promo--visible");
      document.body.style.overflow = "";
    }

    function dismissForToday() {
      if (config.dismissForDay) {
        localStorage.setItem(dismissKey, Date.now().toString());
      }
      closePopup();
    }

    // Close button
    $("#promo-close-btn").addEventListener("click", closePopup);

    // Overlay click (outside popup)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    // Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("promo--visible")) {
        closePopup();
      }
    });

    // Dismiss for today button
    const dismissBtn = $("#promo-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", dismissForToday);
    }
  }

  /* ========== SCROLL ANIMATIONS ========== */
  function animateStatValue(valueEl) {
    if (!valueEl || valueEl.dataset.counted === "true") return;

    const originalValue = valueEl.dataset.statValue || valueEl.textContent.trim();
    const match = originalValue.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const target = Number(match[1]);
    const suffix = match[2] || "";
    const duration = 1200;
    const start = performance.now();
    valueEl.dataset.counted = "true";

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      valueEl.textContent = `${Math.round(target * eased)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        valueEl.textContent = originalValue;
      }
    }

    requestAnimationFrame(tick);
  }

  function animateOnScroll(selector, visibleClass, onVisible) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => {
        el.classList.add(visibleClass);
        if (onVisible) onVisible(el);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass);
            if (onVisible) onVisible(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function initScrollAnimations() {
    animateOnScroll(".section-header", "section-header--visible");
    animateOnScroll(".course-card", "card--visible");
    animateOnScroll(".webinar-card", "card--visible");
    animateOnScroll(".cert-card", "card--visible");
    animateOnScroll(".testimonial-card", "card--visible");
    animateOnScroll(".stat-card", "card--visible", (card) => animateStatValue(card.querySelector(".stat-value")));
    animateOnScroll(".trusted-logo", "logo--visible");
    animateOnScroll(".cta-card", "card--visible");
    animateOnScroll(".counselling-card", "card--visible");
    animateOnScroll(".footer-col", "footer-col--visible");
    animateOnScroll(".footer-bottom", "footer-bottom--visible");
    animateOnScroll(".faq-item", "faq-item--visible");
  }

  function initHeroMotion() {
    const hero = $("#hero-section");
    const visual = $("#hero-visual");
    if (!hero || !visual || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      visual.style.setProperty("--hero-shift-x", `${x * 16}px`);
      visual.style.setProperty("--hero-shift-y", `${y * 12}px`);
    });

    hero.addEventListener("mouseleave", () => {
      visual.style.setProperty("--hero-shift-x", "0px");
      visual.style.setProperty("--hero-shift-y", "0px");
    });
  }

  /* ========== INIT ========== */
  async function init() {
    if (window._siteDataPromise) {
      window.siteData = await window._siteDataPromise;
    }
    renderNav();
    if ($("#hero-section")) {
      renderHero();
      renderCourses();
      renderWebinars();
      renderStats();
      renderTrustedBy();
      renderCertifications();
      renderTestimonials();
      renderCTA();
      renderCounselling();
      renderFaqs();
    }
    renderFooter();
    initHeroMotion();

    // Slight delay so DOM paints before observing
    requestAnimationFrame(() => {
      initScrollAnimations();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
