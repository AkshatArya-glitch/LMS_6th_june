(function () {
  "use strict";

  const grid = document.getElementById("media-gallery-grid");
  const lightbox = document.getElementById("mg-lightbox");
  const lightboxImage = document.getElementById("mg-lightbox-img");
  const lightboxVideo = document.getElementById("mg-lightbox-video");
  const lightboxTitle = document.getElementById("mg-lightbox-title");

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function asset(url) {
    return window.eeplResolveAsset ? window.eeplResolveAsset(url) : url;
  }

  function titleFor(item) {
    const fallback = isVideo(item) ? "Gallery Video" : "Gallery Image";
    const title = String(item.alt_text || "").trim();
    const rawName = String(item.file_name || "").trim();
    const normalizedTitle = title.toLowerCase().replace(/\.[a-z0-9]{2,5}$/i, "");
    const normalizedFile = rawName.toLowerCase().replace(/\.[a-z0-9]{2,5}$/i, "");
    const looksLikeFilename = !title
      || normalizedTitle === normalizedFile
      || /\.[a-z0-9]{2,5}$/i.test(title)
      || /[_\\]/.test(title)
      || /^(img|images?|photos?|videos?|downloads?|screenshots?|whatsapp(?: image)?)(?:[-_ ]|$)/i.test(title)
      || /\b20\d{2}[-_ ]\d{2}[-_ ]\d{2}\b/.test(title)
      || /\d{8,}/.test(title);

    return looksLikeFilename ? fallback : title;
  }

  function isVideo(item) {
    return item.file_type === "video" || /\.(mp4|webm|ogg)(\?|$)/i.test(item.file_url || "");
  }

  function openPreview(src, title, type) {
    const video = type === "video";
    lightboxImage.hidden = video;
    lightboxVideo.hidden = !video;
    if (video) {
      lightboxVideo.src = src;
    } else {
      lightboxImage.src = src;
      lightboxImage.alt = title;
    }
    lightboxTitle.textContent = title;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePreview() {
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    document.body.style.overflow = "";
  }

  async function loadGallery() {
    const items = window.eeplApiGet ? await window.eeplApiGet("/media-gallery") : [];
    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = `<div class="mg-empty">No media gallery items available yet.</div>`;
      return;
    }
    grid.innerHTML = items.map((item) => {
      const src = asset(item.file_url);
      const title = titleFor(item);
      const category = String(item.category || "General").trim() || "General";
      const type = "image";
      const media = `<img src="${esc(src)}" alt="${esc(title)}" loading="lazy" onerror="this.closest('.mg-card').remove()">`;
      return `
        <article class="mg-card">
          <button type="button" data-preview="${esc(src)}" data-title="${esc(category)}" data-type="${type}">
            ${media}
          </button>
          <div class="mg-card-body">
            <span class="mg-category">${esc(category)}</span>
          </div>
        </article>`;
    }).join("");
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preview]");
    if (!button) return;
    openPreview(button.dataset.preview, button.dataset.title || "Media gallery item", button.dataset.type);
  });

  document.getElementById("mg-lightbox").addEventListener("click", (event) => {
    if (event.target === lightbox) closePreview();
  });
  document.querySelector(".mg-lightbox-close").addEventListener("click", closePreview);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closePreview();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadGallery);
  } else {
    loadGallery();
  }
})();
