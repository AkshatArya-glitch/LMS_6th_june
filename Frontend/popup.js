(function () {
  "use strict";

  const PAGE_KEYS = {
    "index.html": "home",
    "courses.html": "courses",
    "webinar.html": "webinar",
    "media-gallery.html": "media-gallery",
    "articles.html": "articles",
    "certification.html": "certification",
    "contact.html": "contact",
  };

  const TYPE_LABELS = {
    course_discount: "Course Offer",
    festival_offer: "Festival Offer",
    webinar_promo: "Webinar",
    new_course_launch: "New Launch",
    announcement: "Announcement",
  };

  const VALID_POSITIONS = new Set(["center", "top", "bottom", "bottom-right", "bottom-left"]);

  function currentPageKey() {
    const path = (window.location.pathname || "").replace(/\/+$/, "");
    if (/\/frontend$/i.test(path)) return "home";
    if (/\/webinar\/index\.html$/i.test(path)) return "webinar";
    const file = path.split("/").pop() || "index.html";
    return PAGE_KEYS[file.toLowerCase()] || null;
  }

  function apiBase() {
    if (window.EEPL_API_BASE) return window.EEPL_API_BASE.replace(/\/$/, "");
    const path = window.location.pathname || "";
    const frontendIndex = path.toLowerCase().indexOf("/frontend");
    const projectBase = frontendIndex >= 0 ? path.slice(0, frontendIndex) : "";
    return `${projectBase}/Backend/public/index.php/v1`;
  }

  function assetUrl(value) {
    if (!value) return "";
    if (window.eeplResolveAsset) return window.eeplResolveAsset(value);
    if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
    const path = window.location.pathname || "";
    const frontendIndex = path.toLowerCase().indexOf("/frontend");
    const base = frontendIndex >= 0 ? `${path.slice(0, frontendIndex)}/Frontend` : "/Frontend";
    return `${base}/${String(value).replace(/^\/+/, "")}`;
  }

  function linkUrl(value) {
    if (!value) return "#";
    return window.eeplResolveHref ? window.eeplResolveHref(value) : value;
  }

  function ensureContainer() {
    let overlay = document.getElementById("promo-overlay");
    let popup = document.getElementById("promo-popup");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "promo-overlay";
      overlay.className = "promo-overlay";
      popup = document.createElement("div");
      popup.id = "promo-popup";
      popup.className = "promo-popup";
      overlay.appendChild(popup);
      document.body.appendChild(overlay);
    }
    return { overlay, popup };
  }

  function appendFallback(popup, label) {
    const fallback = document.createElement("div");
    fallback.className = "promo-banner-fallback";
    fallback.textContent = (label || "Offer").charAt(0).toUpperCase();
    const body = popup.querySelector(".promo-body");
    popup.insertBefore(fallback, body || null);
  }

  function renderPopup(config) {
    if (!config || config.status !== "active") return;

    const dismissKey = `eepl_promo_dismissed_${config.id}`;
    const dismissedAt = Number(localStorage.getItem(dismissKey) || 0);
    if (dismissedAt) {
      const dismissed = new Date(dismissedAt);
      const now = new Date();
      if (
        dismissed.getFullYear() === now.getFullYear()
        && dismissed.getMonth() === now.getMonth()
        && dismissed.getDate() === now.getDate()
      ) return;
    }

    const { overlay, popup } = ensureContainer();
    popup.replaceChildren();
    overlay.className = "promo-overlay";
    const position = VALID_POSITIONS.has(config.position) ? config.position : "center";
    overlay.classList.add(`promo-position-${position}`);

    const close = document.createElement("button");
    close.className = "promo-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close pop up");
    close.textContent = "x";
    popup.appendChild(close);

    const badge = document.createElement("span");
    badge.className = `promo-type-badge promo-type-badge--${config.popup_type || "announcement"}`;
    badge.textContent = TYPE_LABELS[config.popup_type] || "Announcement";
    popup.appendChild(badge);

    if (config.image_url) {
      const banner = document.createElement("div");
      banner.className = "promo-banner";
      const image = document.createElement("img");
      image.src = assetUrl(config.image_url);
      image.alt = config.title || "Pop up";
      image.addEventListener("error", () => {
        banner.remove();
        appendFallback(popup, TYPE_LABELS[config.popup_type]);
      }, { once: true });
      banner.appendChild(image);
      popup.appendChild(banner);
    } else {
      appendFallback(popup, TYPE_LABELS[config.popup_type]);
    }

    const body = document.createElement("div");
    body.className = "promo-body";

    const title = document.createElement("h2");
    title.className = "promo-title";
    title.textContent = config.title || "";
    body.appendChild(title);

    if (config.message) {
      const description = document.createElement("p");
      description.className = "promo-desc";
      description.textContent = config.message;
      body.appendChild(description);
    }

    if (config.button_text) {
      const cta = document.createElement("a");
      cta.className = "promo-cta";
      cta.href = linkUrl(config.button_link || "#");
      cta.textContent = config.button_text;
      body.appendChild(cta);
    }

    const dismiss = document.createElement("button");
    dismiss.className = "promo-dismiss";
    dismiss.type = "button";
    dismiss.textContent = "Don't show again today";
    body.appendChild(dismiss);

    const ring = document.createElement("div");
    ring.className = "promo-ring";
    body.appendChild(ring);
    popup.appendChild(body);

    function hide(storeDismissal) {
      if (storeDismissal) localStorage.setItem(dismissKey, Date.now().toString());
      overlay.classList.remove("promo--visible");
      document.body.style.overflow = "";
    }

    close.addEventListener("click", () => hide(false));
    dismiss.addEventListener("click", () => hide(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) hide(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("promo--visible")) hide(false);
    });

    window.setTimeout(() => {
      overlay.classList.add("promo--visible");
      if (position === "center") document.body.style.overflow = "hidden";
    }, 1200);
  }

  async function init() {
    const pageKey = currentPageKey();
    if (!pageKey) return;
    try {
      const response = await fetch(`${apiBase()}/popups?page_key=${encodeURIComponent(pageKey)}`);
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.success && payload.data) renderPopup(payload.data);
    } catch (_) {
      // A popup should never prevent the page itself from loading.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
