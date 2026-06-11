/**
 * ============================================================
 *  Contact Page Renderer (contact-app.js)
 * ============================================================
 *  Renders all contact page sections from contactPageData
 *  defined in contact-data.js.
 * ============================================================
 */

(function () {
  "use strict";

  /* ========== UTILITIES ========== */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ========== 1. HERO SECTION ========== */
  function renderContactHero() {
    const hero = contactPageData.hero;
    
    // Hero content
    const content = $("#contact-hero-content");
    const breadcrumbHTML = hero.breadcrumb
      .map((item, idx) => {
        if (idx === hero.breadcrumb.length - 1) {
          return `<span class="contact-hero-breadcrumb-item active">${item.label}</span>`;
        }
        return `<a href="${item.href}" class="contact-hero-breadcrumb-item">${item.label}</a>`;
      })
      .join('<span class="contact-hero-breadcrumb-sep">›</span>');

    content.innerHTML = `
      <h1 class="contact-hero-headline">${hero.headline}</h1>
      <p class="contact-hero-paragraph">${hero.paragraph}</p>
      <div class="contact-hero-breadcrumb">
        ${breadcrumbHTML}
      </div>
    `;

    // Hero visual
    const visual = $("#contact-hero-visual");
    visual.innerHTML = `
      <img src="${hero.image}" alt="${hero.imageAlt}" class="contact-hero-image">
    `;
  }

  /* ========== 2. GET IN TOUCH ========== */
  function renderGetInTouch() {
    const section = contactPageData.getInTouch;
    const container = $("#contact-left");

    let itemsHTML = section.items
      .map((item) => {
        if (item.phone) {
          return `
            <div class="contact-item">
              <div class="contact-item-icon">${item.icon}</div>
              <div class="contact-item-content">
                <h3 class="contact-item-title">${item.title}</h3>
                <a href="tel:${item.phone.replace(/[^+\d]/g, '')}" class="contact-item-value contact-item-link">${item.phone}</a>
                <a href="${item.whatsappLink}" target="_blank" class="contact-item-whatsapp">
                  <span style="color: #25d366;">WhatsApp Us</span>
                </a>
              </div>
            </div>
          `;
        } else if (item.email) {
          return `
            <div class="contact-item">
              <div class="contact-item-icon">${item.icon}</div>
              <div class="contact-item-content">
                <h3 class="contact-item-title">${item.title}</h3>
                <a href="mailto:${item.email}" class="contact-item-value contact-item-link">${item.email}</a>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="contact-item">
              <div class="contact-item-icon">${item.icon}</div>
              <div class="contact-item-content">
                <h3 class="contact-item-title">${item.title}</h3>
                <p class="contact-item-value">${item.description}</p>
              </div>
            </div>
          `;
        }
      })
      .join("");

    container.innerHTML = `
      <div class="contact-left-heading">
        <h2>${section.heading}</h2>
        <div class="section-line"></div>
      </div>
      <div class="contact-items">
        ${itemsHTML}
      </div>
      <div class="contact-map-wrapper">
        <iframe 
          class="contact-map" 
          src="${section.mapEmbed.mapUrl}" 
          width="100%" 
          height="350" 
          style="border:0;" 
          allowfullscreen="" 
          loading="lazy" 
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    `;
  }

  /* ========== 3. INQUIRY FORM ========== */
  function renderInquiryForm() {
    const form = contactPageData.inquiryForm;
    const container = $("#contact-right");

    // Build form fields HTML
    let fieldsHTML = form.fields
      .map((field) => {
        if (field.type === "select") {
          return `
            <div class="form-group">
              <label class="form-label" for="${field.name}">
                ${field.label}${field.required ? ' <span class="form-required">*</span>' : ""}
              </label>
              <select 
                id="${field.name}" 
                name="${field.name}" 
                class="form-input form-select"
                ${field.required ? "required" : ""}>
                ${field.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("")}
              </select>
            </div>
          `;
        } else if (field.type === "textarea") {
          return `
            <div class="form-group">
              <label class="form-label" for="${field.name}">
                ${field.label}${field.required ? ' <span class="form-required">*</span>' : ""}
              </label>
              <textarea 
                id="${field.name}" 
                name="${field.name}" 
                class="form-input form-textarea"
                placeholder="${field.placeholder}"
                maxlength="${field.maxLength}"
                ${field.required ? "required" : ""}>
              </textarea>
              <div class="form-char-count"><span id="${field.name}-count">0</span>/${field.maxLength}</div>
            </div>
          `;
        } else {
          return `
            <div class="form-group">
              <label class="form-label" for="${field.name}">
                ${field.label}${field.required ? ' <span class="form-required">*</span>' : ""}
              </label>
              <input 
                type="${field.type}" 
                id="${field.name}" 
                name="${field.name}" 
                class="form-input"
                placeholder="${field.placeholder}"
                ${field.required ? "required" : ""}>
            </div>
          `;
        }
      })
      .join("");

    container.innerHTML = `
      <div class="contact-form-header">
        <h2 class="contact-form-title">${form.heading}</h2>
        <div class="contact-form-badge">
          <svg class="contact-badge-icon" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="12" cy="12" r="10"/>
            <text x="12" y="15" text-anchor="middle" fill="white" font-size="14">i</text>
          </svg>
          <span class="contact-badge-label">${form.responseTime}</span>
          <span class="contact-badge-value">${form.responseTimeValue}</span>
        </div>
      </div>
      <p class="contact-form-description">${form.description}</p>
      <form id="contact-form" class="contact-form" autocomplete="off">
        ${fieldsHTML}
        <button type="submit" class="btn btn-red btn-lg contact-form-submit">
          ${form.submitLabel}
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <p class="contact-form-privacy">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
          </svg>
          ${form.privacyNote}
        </p>
      </form>
    `;

    // Form submission handler
    const contactForm = $("#contact-form");
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      const messageParts = [];
      const city = String(data.city || "").trim();
      const message = String(data.message || "").trim();
      if (city) messageParts.push(`City: ${city}`);
      if (message) messageParts.push(message);
      if (window.eeplApiPost) {
        await window.eeplApiPost("/contact", {
          name: data.fullName || "",
          phone: data.phone || "",
          email: data.email || "",
          subject: data.interestedIn || "Contact Inquiry",
          message: messageParts.join("\n"),
          source_page: "contact",
        });
      }
      
      // Hide form and show success message
      const section = $("#contact-main");
      section.style.display = "none";
      
      const successMessage = $("#contact-success");
      successMessage.style.display = "flex";
      
      // Optional: Reset form
      contactForm.reset();
      
      // Optional: Auto-hide success message after 5 seconds
      setTimeout(() => {
        section.style.display = "block";
        successMessage.style.display = "none";
      }, 5000);
    });

    // Character count for textarea
    const messageField = $("#message");
    if (messageField) {
      messageField.addEventListener("input", (e) => {
        const count = e.target.value.length;
        const countDisplay = $("#message-count");
        if (countDisplay) {
          countDisplay.textContent = count;
        }
      });
    }
  }

  /* ========== 4. BOTTOM CTA SECTION ========== */
  function renderBottomCTA() {
    const cta = contactPageData.bottomCTA;
    
    // Content
    const content = $("#contact-cta-content");
    content.innerHTML = `
      <h2 class="contact-cta-headline">${cta.heading}</h2>
      <p class="contact-cta-description">${cta.description}</p>
      <a href="${cta.buttonLink}" class="btn btn-lg contact-cta-button" style="background-color: white; color: var(--red-600); border: none;">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        ${cta.buttonLabel}
      </a>
    `;

    // Images
    const visual = $("#contact-cta-visual");
    visual.innerHTML = `
      <img src="${cta.leftImage}" alt="Student learning" class="contact-cta-img contact-cta-img-left">
      <img src="${cta.rightImage}" alt="Student learning" class="contact-cta-img contact-cta-img-right">
    `;
  }

  /* ========== MARK CONTACT NAV AS ACTIVE ========== */
  function markActiveNavLink() {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.classList.remove("nav-link--active");
      if (link.getAttribute("href") === "contact.html") {
        link.classList.add("nav-link--active");
      }
    });
  }

  /* ========== MAIN INIT ========== */
  async function initContactPage() {
    if (window._contactPageDataPromise) {
      Object.assign(contactPageData, await window._contactPageDataPromise);
    }

    // Wait for nav to be rendered by app.js
    setTimeout(() => {
      markActiveNavLink();
    }, 100);

    renderContactHero();
    renderGetInTouch();
    renderInquiryForm();
    renderBottomCTA();
  }

  /* ========== DOM READY ========== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactPage);
  } else {
    initContactPage();
  }

})();
