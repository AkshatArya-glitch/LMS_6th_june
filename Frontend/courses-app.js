/**
 * EEPL Classroom - Courses Page Renderer
 *
 * The middle page content is driven by coursesPageData. Header and footer
 * consume siteData so their labels, links, and contact details stay aligned
 * with the home page.
 */

(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const icons = {
    clock: `<svg class="course-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3.2 1.9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
    users: `<svg class="course-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m8 0c2.8.7 5 2.4 5 5v1H3v-1c0-2.6 2.2-4.3 5-5"/></svg>`,
    fb: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`,
    ig: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    yt: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    in: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.941v5.665H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.371 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11-.002-4.124 2.062 2.062 0 01.002 4.124zM7.114 20.452H3.558V9h3.556v11.452z"/></svg>`,
    address: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.75A2.75 2.75 0 1112 6.25a2.75 2.75 0 010 5.5z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z"/></svg>`,
  };

  const courseState = {
    category: "all",
    search: "",
  };

  const courseAliases = {
    python: "python-programming",
    "c-programming": "dca",
    "cpp-programming": "adca",
    "data-structures": "web-development",
    sql: "data-analytics",
    "computer-basics": "dca",
  };

  function renderNav() {
    const list = $("#nav-list");
    const mobileList = $("#mobile-nav-list");
    const nav = siteData.navigation.map((item) => ({
      ...item,
      active: item.label === "Courses",
    }));

    nav.forEach((item) => {
      const html = `<li><a href="${item.href}" class="nav-link ${item.active ? "nav-link--active" : ""}">${item.label}</a></li>`;
      list.insertAdjacentHTML("beforeend", html);
      mobileList.insertAdjacentHTML("beforeend", html);
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

  function renderHero() {
    const d = coursesPageData.hero;

    $("#cp-hero-content").innerHTML = `
      <div class="cp-hero-accent-row">
        <div class="cp-hero-accent-bar"></div>
        <div>
          <h1 class="cp-hero-headline">
            ${redLead(d.headline)}<br>
            ${redLead(d.headlineAccent)}
          </h1>
        </div>
      </div>
      <p class="cp-hero-paragraph">${d.paragraph}</p>
      <div class="cp-hero-ctas">
        <a href="${d.ctaPrimary.href}" class="btn btn-red btn-lg">${d.ctaPrimary.label}</a>
      </div>
    `;

    $("#cp-hero-visual").innerHTML = `
      <div class="cp-float-scene">
        <div class="cp-ghost-icon cp-ghost-video"></div>
        <div class="cp-ghost-icon cp-ghost-chat"></div>
        <div class="cp-ghost-icon cp-ghost-bell"></div>
        <div class="cp-plant" aria-hidden="true">
          <span class="cp-leaf cp-leaf-1"></span>
          <span class="cp-leaf cp-leaf-2"></span>
          <span class="cp-leaf cp-leaf-3"></span>
          <span class="cp-leaf cp-leaf-4"></span>
          <span class="cp-stem"></span>
          <span class="cp-pot"></span>
        </div>
        <div class="cp-laptop" aria-hidden="true">
          <div class="cp-laptop-screen">
            <img src="assets/eepl-reference-logo.png" alt="">
          </div>
          <div class="cp-laptop-base"></div>
        </div>
        <div class="cp-books" aria-hidden="true">
          <span class="cp-grad-cap"></span>
          <span class="cp-book cp-book-red"></span>
          <span class="cp-book cp-book-white"></span>
          <span class="cp-book cp-book-dark"></span>
        </div>
      </div>
    `;
  }

  function redLead(text) {
    const parts = text.trim().split(/\s+/);
    const first = parts.shift() || "";
    return `<span class="cp-hero-headline-red">${first}</span> ${parts.join(" ")}`;
  }

  function renderPopularCourses() {
    const popular = coursesPageData.courses
      .filter((course) => course.featured && course.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    $("#cp-popular-grid").innerHTML = popular.map(courseCardHTML).join("");
    $("#cp-popular-title").textContent = coursesPageData.sectionHeadings.popularCourses;
  }

  function courseCardHTML(course) {
    return `
      <a href="${course.href}" class="course-card" data-category="${(course.category || []).join(",")}" data-title="${course.title.toLowerCase()}">
        <div class="course-card-img">
          <img src="${course.image}" alt="${course.title}" onerror="this.parentElement.classList.add('img-fallback')">
          <div class="course-card-img-overlay">${course.title.charAt(0)}</div>
        </div>
        <div class="course-card-body">
          <h3 class="course-card-title">${course.title}</h3>
          <div class="course-meta">
            <span class="course-meta-item">${icons.clock} ${course.duration}</span>
            <span class="course-meta-item">${icons.users} ${course.level}</span>
          </div>
          ${course.price ? `
            <div class="course-card-extra">
              <span class="course-pricing">
                ${course.discountActive ? `<span class="course-price-original">${course.originalPrice}</span>` : ""}
                <span class="course-price">${course.price}</span>
                ${course.discountActive ? `<span class="course-discount-badge">${course.discountLabel}</span>` : ""}
              </span>
            </div>` : ""}
          <p class="course-card-desc">${course.description}</p>
          <span class="btn btn-outline-red btn-sm">${course.ctaText || "Learn More"}</span>
        </div>
      </a>
    `;
  }

  function renderExploreCategories() {
    $("#cp-explore-grid").innerHTML = coursesPageData.exploreCategories
      .filter((category) => category.visible !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (category) => `
          <a href="${category.href}" class="cp-explore-card" id="cp-explore-${category.id}" data-category="${category.id}">
            <div class="cp-explore-icon-wrapper">
              <img src="${category.image}" alt="" class="cp-explore-img">
            </div>
            <div class="cp-explore-info">
              <h3 class="cp-explore-title">${category.title}</h3>
              <p class="cp-explore-desc">${category.description}</p>
              <span class="cp-explore-cta">${category.ctaText}</span>
            </div>
          </a>
        `
      )
      .join("");

    $("#cp-explore-title").textContent = coursesPageData.sectionHeadings.exploreCourses;

    document.querySelectorAll(".cp-explore-card[data-category]").forEach((card) => {
      card.addEventListener("click", (event) => {
        const category = card.dataset.category;
        if (!category) return;
        event.preventDefault();
        setCategory(category, true);
      });
    });
  }

  function renderAllCourses() {
    const title = $("#cp-all-title");
    if (title) title.textContent = coursesPageData.sectionHeadings.allCourses;

    renderFilters();
    renderAllCoursesGrid();
  }

  function renderFilters() {
    const chips = $("#cp-filter-chips");
    if (!chips) return;

    chips.innerHTML = coursesPageData.categories
      .map(
        (category) => `
          <button class="cp-chip ${category.id === courseState.category ? "cp-chip--active" : ""}" type="button" data-category="${category.id}">
            ${category.label}
          </button>
        `
      )
      .join("");

    chips.querySelectorAll(".cp-chip").forEach((chip) => {
      chip.addEventListener("click", () => setCategory(chip.dataset.category || "all", false));
    });

    const search = $("#cp-course-search");
    if (search) {
      search.value = courseState.search;
      search.oninput = (event) => {
        courseState.search = event.target.value.trim().toLowerCase();
        renderAllCoursesGrid();
      };
    }
  }

  function renderAllCoursesGrid() {
    const grid = $("#cp-all-grid");
    if (!grid) return;

    const courses = coursesPageData.courses
      .filter((course) => course.visible)
      .filter((course) => {
        if (courseState.category === "all") return true;
        if (courseState.category === "popular") return course.featured || (course.category || []).includes("popular");
        return (course.category || []).includes(courseState.category);
      })
      .filter((course) => {
        if (!courseState.search) return true;
        const haystack = `${course.title} ${course.description} ${course.duration} ${course.level} ${(course.category || []).join(" ")}`.toLowerCase();
        return haystack.includes(courseState.search);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (!courses.length) {
      grid.innerHTML = `
        <div class="cp-empty-state">
          <div class="cp-empty-icon" aria-hidden="true">0</div>
          <h3 class="cp-empty-title">No courses found</h3>
          <p class="cp-empty-text">Try another category or search term.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = courses.map(courseCardHTML).join("");
    requestAnimationFrame(() => {
      document.querySelectorAll("#cp-all-grid .course-card").forEach((card) => card.classList.add("card--visible"));
    });
  }

  function setCategory(category, scrollToAllCourses) {
    courseState.category = category || "all";
    renderFilters();
    renderAllCoursesGrid();

    const url = new URL(window.location.href);
    if (courseState.category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", courseState.category);
    }
    history.replaceState({}, "", `${url.pathname}${url.search}#all-courses`);

    if (scrollToAllCourses) {
      $("#all-courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initCourseStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category && coursesPageData.categories.some((item) => item.id === category)) {
      courseState.category = category;
    }

    const course = params.get("course");
    if (course) {
      const normalizedCourse = courseAliases[course] || course;
      const matched = coursesPageData.courses.find((item) => item.slug === normalizedCourse || item.id === normalizedCourse);
      if (matched && matched.category && matched.category.length) {
        courseState.category = matched.category.includes("popular") ? matched.category.find((item) => item !== "popular") || "popular" : matched.category[0];
      }
    }
  }

  function renderStudyMaterials() {
    $("#cp-materials-grid").innerHTML = coursesPageData.studyMaterials
      .filter((material) => material.visible !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (material) => `
          <a href="${material.href}" class="cp-material-card" style="--mat-color: ${material.color}; --mat-bg: ${material.bgColor};">
            <div class="cp-material-content">
              <span class="cp-material-title">${material.title}</span>
            </div>
            <img src="${material.image}" alt="" class="cp-material-img">
          </a>
        `
      )
      .join("");

    $("#cp-materials-title").textContent = coursesPageData.sectionHeadings.studyMaterials;
  }

  function renderFooter() {
    const f = siteData.footer;
    $("#footer-grid").innerHTML = `
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
          ${f.social.map((social) => `<a href="${social.href}" class="social-icon" aria-label="${social.platform}" title="${social.platform}">${icons[social.icon] || social.icon}</a>`).join("")}
        </div>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Quick Links</h3>
        <ul class="footer-links">
          ${f.quickLinks.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join("")}
        </ul>
      </div>
      <div class="footer-col">
        <h3 class="footer-heading">Courses</h3>
        <ul class="footer-links">
          ${f.courses.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join("")}
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

    $("#footer-copyright").textContent = f.copyright;
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
      { threshold: 0.1 }
    );

    elements.forEach((element) => observer.observe(element));
  }

  function initScrollAnimations() {
    animateOnScroll(".section-header", "section-header--visible");
    animateOnScroll(".course-card", "card--visible");
    animateOnScroll(".cp-explore-card", "card--visible");
    animateOnScroll(".cp-material-card", "card--visible");
    animateOnScroll(".footer-col", "footer-col--visible");
    animateOnScroll(".footer-bottom", "footer-bottom--visible");
  }

  async function init() {
    if (window._siteDataPromise) {
      window.siteData = await window._siteDataPromise;
    }
    if (window._coursesPageDataPromise) {
      Object.assign(coursesPageData, await window._coursesPageDataPromise);
    }
    if (coursesPageData.pageMeta) {
      if (coursesPageData.pageMeta.title) document.title = coursesPageData.pageMeta.title;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && coursesPageData.pageMeta.description) meta.setAttribute("content", coursesPageData.pageMeta.description);
    }
    renderNav();
    renderHero();
    renderPopularCourses();
    renderExploreCategories();
    initCourseStateFromURL();
    renderAllCourses();
    renderStudyMaterials();
    renderFooter();

    requestAnimationFrame(initScrollAnimations);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
