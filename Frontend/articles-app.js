(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const state = {
    category: "All Articles",
    search: "",
    sort: "newest",
  };

  const socialIconMap = {
    fb: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12Z"/></svg>`,
    ig: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>`,
    yt: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.6V8.4L15.8 12l-6.3 3.6Z"/></svg>`,
    in: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.11 20.45H3.56V9h3.55v11.45Z"/></svg>`,
  };

  const contactIcons = {
    phone: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 3v8H5v-2h5V5h3Zm5.6-1.6 1.4 1.4-3.2 3.2H20v2h-6.6V3.4h2v3.2l3.2-3.2Z"/></svg>`,
  };

  const sidebarIcons = {
    "All Articles": "book",
    Certifications: "award",
    "Competitive Exams": "target",
    Technology: "cpu",
    Career: "briefcase",
    "Study Tips": "clipboard",
    "Industry Insights": "chart",
    "Guides & Tutorials": "home",
  };

  function icon(name) {
    const icons = {
      book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3-3V4Z"/><path d="M5 17V4"/></svg>`,
      award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="m9 12-1 8 4-2 4 2-1-8"/></svg>`,
      target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3m10-10h-3M5 12H2"/></svg>`,
      cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/></svg>`,
      briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-12 5h18"/></svg>`,
      clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z"/><path d="M9 12h6m-6 4h4"/></svg>`,
      chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5m0 14h16"/><path d="M8 16v-5m5 5V8m5 8v-9"/></svg>`,
      home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>`,
    };
    return icons[name] || icons.book;
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function renderNav() {
    const nav = siteData.navigation
      .filter((item) => item.label !== "EEPL Store")
      .map((item) => ({
        ...item,
        active: item.label === "Articles",
      }));

    ["#nav-list", "#mobile-nav-list"].forEach((selector) => {
      const list = $(selector);
      if (!list) return;
      list.innerHTML = nav
        .map((item) => `<li><a href="${item.href}" class="nav-link ${item.active ? "nav-link--active" : ""}">${item.label}</a></li>`)
        .join("");
    });

    const hamburger = $("#hamburger-btn");
    const mobileMenu = $("#mobile-menu");
    if (hamburger && mobileMenu) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("open");
        mobileMenu.classList.toggle("open");
      });
    }

    window.addEventListener("scroll", () => {
      const header = $("#site-header");
      if (header) header.classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  function renderFooter() {
    const f = siteData.footer;
    const grid = $("#footer-grid");
    if (!grid) return;

    const quickLinks = [
      { label: "Courses", href: "courses.html" },
      { label: "Certification", href: "certification.html" },
      { label: "CertVerify", href: "certification.html#sample-certificate" },
      { label: "Articles", href: "articles.html" },
      { label: "Contact", href: "contact.html" },
    ];

    const resources = [
      { label: "FAQ", href: "#" },
      { label: "Guidelines", href: "#" },
      { label: "Terms & Conditions", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ];

    grid.innerHTML = `
      <div class="footer-col footer-brand">
        <div class="footer-logo">
          <img src="${f.brand.logo}" alt="${f.brand.name} ${f.brand.sub}" class="footer-logo-img">
        </div>
        <p class="footer-tagline">Your trusted partner in online certification.</p>
        <div class="footer-social">
          ${f.social.map((s) => `<a href="${s.href}" class="social-icon" aria-label="${s.platform}" title="${s.platform}">${socialIconMap[s.icon] || s.icon}</a>`).join("")}
        </div>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Quick Links</h3>
        <ul class="footer-links">
          ${quickLinks.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
        </ul>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Resources</h3>
        <ul class="footer-links">
          ${resources.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
        </ul>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Contact Info</h3>
        <ul class="footer-contact">
          <li><span class="footer-contact-icon">${contactIcons.phone}</span><a href="tel:${f.contact.phone.replace(/[^+\d]/g, "")}">${f.contact.phone}</a></li>
          <li><span class="footer-contact-icon">${contactIcons.email}</span><a href="mailto:${f.contact.email}">${f.contact.email}</a></li>
          <li><span class="footer-contact-icon">${contactIcons.target}</span><a href="#">www.emancipation.com</a></li>
        </ul>
      </div>
    `;

    const copyright = $("#footer-copyright");
    if (copyright) copyright.textContent = "\u00a9 2024 Emancipation. All Rights Reserved.";
  }

  function renderSidebar() {
    const sidebar = $("#articles-sidebar");
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="sidebar-card">
        <h4>Categories</h4>
        <ul class="sidebar-list" id="cat-list">
          ${articlesPageData.categories
            .map((cat) => `
              <li class="sidebar-item ${cat === state.category ? "active" : ""}" data-category="${escapeHTML(cat)}">
                ${icon(sidebarIcons[cat])}
                <span>${cat}</span>
              </li>
            `)
            .join("")}
        </ul>
      </div>
      <div class="sidebar-card">
        <h4>Popular Exams</h4>
        <ul class="sidebar-list">
          ${articlesPageData.popularExams
            .map((exam) => `<li class="exam-item">${icon("target")}<span>${exam}</span></li>`)
            .join("")}
        </ul>
        <a class="btn btn-outline-red btn-sm" href="courses.html?category=competitive#all-courses">View All Exams</a>
      </div>
      <div class="sidebar-card">
        <h4>Popular Tags</h4>
        <div class="tag-cloud">
          ${articlesPageData.tags.map((tag) => `<button class="tag" type="button" data-tag="${escapeHTML(tag)}">${tag}</button>`).join("")}
        </div>
        <a class="btn btn-outline-red btn-sm" href="#">View All Tags</a>
      </div>
      <div class="sidebar-card newsletter-card">
        <h4>${articlesPageData.newsletter.title}</h4>
        <p>${articlesPageData.newsletter.text}</p>
        <div class="newsletter-form">
          <input id="newsletter-email" type="email" placeholder="${articlesPageData.newsletter.placeholder}">
          <button id="newsletter-btn" class="btn btn-red btn-sm" type="button">${articlesPageData.newsletter.cta}</button>
        </div>
      </div>
    `;

    const categoryList = $("#cat-list");
    if (categoryList) categoryList.addEventListener("click", (event) => {
      const item = event.target.closest("[data-category]");
      if (!item) return;
      state.category = item.dataset.category;
      setActiveControls();
      renderCards();
    });

    sidebar.querySelectorAll("[data-tag]").forEach((button) => {
      button.addEventListener("click", () => {
        state.search = button.dataset.tag;
        const search = $("#articles-search");
        if (search) search.value = state.search;
        renderCards();
      });
    });

    const newsletterButton = $("#newsletter-btn");
    if (newsletterButton) newsletterButton.addEventListener("click", () => {
      const input = $("#newsletter-email");
      const button = $("#newsletter-btn");
      if (!input || !button || !input.value.trim()) return;
      button.textContent = "Subscribed";
      input.value = "";
      setTimeout(() => {
        button.textContent = articlesPageData.newsletter.cta;
      }, 1400);
    });
  }

  function renderTabs() {
    const tabs = $("#articles-tabs");
    if (!tabs) return;

    tabs.innerHTML = articlesPageData.tabs
      .map((tab) => `<button class="tab ${tab === "All Articles" ? "active" : ""}" type="button" role="tab" data-tab="${tab}">${tab}</button>`)
      .join("");

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button) return;
      state.category = button.dataset.tab;
      setActiveControls();
      renderCards();
    });
  }

  function categoryMatches(articleCategory, selectedCategory) {
    if (!selectedCategory || selectedCategory === "All Articles") return true;
    const article = normalize(articleCategory);
    const selected = normalize(selectedCategory)
      .replace("guides-tips", "guides-tutorials")
      .replace("certifications", "certifications");
    return article.includes(selected) || selected.includes(article);
  }

  function getFilteredArticles() {
    const query = normalize(state.search);
    return articlesPageData.articles
      .filter((article) => categoryMatches(article.category, state.category))
      .filter((article) => {
        if (!query) return true;
        return [article.title, article.desc, article.category].some((value) => normalize(value).includes(query));
      })
      .sort((a, b) => {
        const direction = state.sort === "newest" ? -1 : 1;
        return (new Date(a.date) - new Date(b.date)) * direction;
      });
  }

  function renderCards() {
    const wrap = $("#articles-grid-cards");
    if (!wrap) return;

    const articles = getFilteredArticles();
    if (!articles.length) {
      wrap.innerHTML = `<div class="articles-empty">No articles found.</div>`;
      return;
    }

    wrap.innerHTML = articles
      .map((article) => {
        return `
          <article class="article-card">
            <div class="article-thumb">
              <img src="${article.image}" alt="${escapeHTML(article.title)}" loading="lazy" onerror="this.closest('.article-thumb').classList.add('article-thumb--fallback');this.remove();">
            </div>
            <div class="article-body">
              <div class="article-meta">
                <span>${article.date}</span>
                <span class="article-dot" aria-hidden="true"></span>
                <span>${article.readTime}</span>
              </div>
              <h3 class="article-title">${article.title}</h3>
              <p class="article-desc">${article.desc}</p>
              <a class="read-more" href="articles.html?article=${encodeURIComponent(article.slug || article.id)}">Read More <span aria-hidden="true">&rarr;</span></a>
            </div>
          </article>
        `;
      })
      .join("");

    requestAnimationFrame(() => {
      wrap.querySelectorAll(".article-card").forEach((card, index) => {
        setTimeout(() => card.classList.add("articles-visible"), index * 45);
      });
    });
  }

  function renderPagination() {
    const el = $("#articles-pagination");
    if (!el) return;

    el.innerHTML = `
      <div class="pagination">
        <button type="button" aria-label="Previous page">&larr;</button>
        <button type="button" class="active" aria-current="page">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <span class="dots">...</span>
        <button type="button">10</button>
        <button type="button" aria-label="Next page">&rarr;</button>
      </div>
    `;
  }

  function setActiveControls() {
    document.querySelectorAll("[data-category]").forEach((item) => {
      item.classList.toggle("active", item.dataset.category === state.category);
    });

    document.querySelectorAll("[data-tab]").forEach((tab) => {
      const exact = tab.dataset.tab === state.category;
      const allArticles = state.category === "All Articles" && tab.dataset.tab === "All Articles";
      tab.classList.toggle("active", exact || allArticles);
    });
  }

  function bindControls() {
    const search = $("#articles-search");
    if (search) search.addEventListener("input", (event) => {
      state.search = event.target.value.trim();
      renderCards();
    });

    const sort = $("#sort-select");
    if (sort) sort.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderCards();
    });
  }

  function revealFooter() {
    document.querySelectorAll(".footer-col").forEach((item) => item.classList.add("footer-col--visible"));
    const footerBottom = $(".footer-bottom");
    if (footerBottom) footerBottom.classList.add("footer-bottom--visible");
  }

  async function init() {
    if (window._siteDataPromise) {
      window.siteData = await window._siteDataPromise;
    }
    if (window._articlesPageDataPromise) {
      Object.assign(articlesPageData, await window._articlesPageDataPromise);
    }
    const selectedArticle = new URLSearchParams(window.location.search).get("article");
    if (selectedArticle) {
      const article = articlesPageData.articles.find((item) => String(item.slug || item.id) === selectedArticle);
      if (article) state.search = article.title;
    }
    renderNav();
    renderFooter();
    renderSidebar();
    renderTabs();
    renderCards();
    renderPagination();
    bindControls();
    const search = $("#articles-search");
    if (search && state.search) search.value = state.search;
    requestAnimationFrame(revealFooter);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
