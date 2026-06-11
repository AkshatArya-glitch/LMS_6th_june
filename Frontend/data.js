/**
 * ============================================================
 *  EEPL Classroom — Homepage Content (API-Driven CMS Layer)
 * ============================================================
 *  Fetches from the backend CMS API first.
 *  Falls back to static data if the API is unavailable.
 * ============================================================
 */

const API_BASE = (() => {
  if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname || "";
  const frontendIndex = path.toLowerCase().indexOf("/frontend");
  if (frontendIndex >= 0) {
    return `${path.slice(0, frontendIndex)}/Backend/public/index.php/v1`;
  }
  return "/Backend/public/index.php/v1";
})();

const FRONTEND_BASE = (() => {
  const path = window.location.pathname || "";
  const frontendIndex = path.toLowerCase().indexOf("/frontend");
  if (frontendIndex >= 0) return `${path.slice(0, frontendIndex)}/Frontend`;
  return "/Frontend";
})();

function frontendUrl(path = "") {
  const clean = String(path).replace(/^\/+/, "");
  return `${FRONTEND_BASE}/${clean}`.replace(/([^:]\/)\/+/g, "$1");
}

function normalizeAssetUrl(url) {
  if (!url) return url;
  const value = String(url).trim();
  if (/^Frontend\//i.test(value)) return frontendUrl(value.replace(/^Frontend\//i, ""));
  if (/^\/Frontend\//i.test(value)) return frontendUrl(value.replace(/^\/Frontend\//i, ""));
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
  return frontendUrl(value);
}

// ── Static fallback ────────────────────────────────────────
const _staticData = {
  promotionPopup: {
    enabled: false, type: "course_discount",
    title: "Limited Time Offer!", subtitle: "Get 30% Off on Java Full Stack",
    description: "Enroll now and kickstart your career journey with our industry-ready full-stack programme.",
    image: "assets/images/popup-offer.jpg", ctaText: "Enroll Now",
    ctaLink: "courses.html?course=java-fullstack&category=computer#all-courses",
    delayInSeconds: 3, dismissForDay: true,
  },
  navigation: [
    { label: "Home", href: "index.html" }, { label: "Courses", href: "courses.html" },
    { label: "Webinar", href: "webinar.html" }, { label: "Certification", href: "certification.html" },
    { label: "Articles", href: "articles.html" }, { label: "Contact", href: "contact.html" },
  ],
  heroSlides: [{
    headline: "Learn Today.", headlineAccent: "Lead Tomorrow.",
    paragraph: "Industry-relevant courses designed to build skills, boost confidence and help you achieve your career goals.",
    cta1: { label: "Explore Courses", href: "courses.html#all-courses" },
    cta2: { label: "Book a Free Demo Class", href: "/demo" },
    image: "assets/hero-student.png", imageAlt: "Student with books smiling",
    badges: [
      { icon: "👥", value: "1000+", label: "Students Trained" },
      { icon: "🎓", value: "", label: "Expert Trainers" },
      { icon: "🏆", value: "", label: "Placement Support" },
    ],
  }],
  courses: [
    { image: "assets/course-data-analytics.png", title: "Data Analytics", duration: "3 Months", level: "Beginner to Advanced", description: "Learn data analysis, visualization, Excel, SQL, Power BI and more.", href: "courses.html?course=data-analytics&category=computer#all-courses" },
    { image: "assets/course-java-fullstack.png", title: "Java Full Stack", duration: "6 Months", level: "Beginner to Advanced", description: "Master Java, Spring Boot, React, MySQL and build real-world projects.", href: "courses.html?course=java-fullstack&category=computer#all-courses" },
    { image: "assets/course-spoken-english.png", title: "Spoken English", duration: "2 Months", level: "All Levels", description: "Improve your speaking, grammar, fluency & confidence.", href: "courses.html?course=spoken-english&category=spoken#all-courses" },
    { image: "assets/course-jee-neet.png", title: "JEE / NEET", duration: "1 Year", level: "For 11th, 12th & Droppers", description: "Complete preparation for JEE (Main + Advanced) & NEET.", href: "courses.html?course=jee-neet&category=competitive#all-courses" },
  ],
  webinars: [
    { month: "JUN", day: "14", weekday: "SAT", title: "Career in Data Analytics", time: "11:00 AM – 12:00 PM", speaker: "Mr. Abhishek Kumar", href: "webinar.html#upcoming-webinars" },
    { month: "JUN", day: "21", weekday: "SAT", title: "Full Stack Development Roadmap", time: "05:00 PM – 06:00 PM", speaker: "Mr. Rahul Sharma", href: "webinar.html#upcoming-webinars" },
    { month: "JUN", day: "28", weekday: "SAT", title: "Crack JEE/NEET with Smart Strategy", time: "04:00 PM – 05:00 PM", speaker: "Mr. S.K. Singh", href: "webinar.html#upcoming-webinars" },
  ],
  stats: [
    { icon: "👥", value: "1000+", label: "Students Trained" },
    { icon: "📚", value: "50+", label: "Courses" },
    { icon: "👍", value: "95%", label: "Satisfaction Rate" },
    { icon: "🧑‍🏫", value: "10+", label: "Expert Trainers" },
  ],
  trustedBy: [
    { name: "Ranchi University", logo: "assets/logos/ranchi-university.svg", alt: "Ranchi University", href: "#" },
    { name: "NIIT", logo: "assets/logos/niit.svg", alt: "NIIT", href: "#" },
    { name: "Tally", logo: "assets/logos/tally.svg", alt: "Tally", href: "#" },
    { name: "Microsoft Partner", logo: "assets/logos/microsoft-partner.svg", alt: "Microsoft Partner", href: "#" },
    { name: "NASSCOM Foundation", logo: "assets/logos/nasscom.svg", alt: "NASSCOM", href: "#" },
    { name: "ISO 9001:2015", logo: "assets/logos/iso.svg", alt: "ISO", href: "#" },
  ],
  certifications: [
    { icon: "🏅", title: "Industry Recognized", description: "Get certified and boost your career opportunities." },
    { icon: "✅", title: "Verified Certificates", description: "All certificates are verified and shareable." },
    { icon: "📄", title: "Add to Resume", description: "Enhance your profile with professional certifications." },
    { icon: "🚀", title: "Career Advancement", description: "Stand out and grow faster in your career." },
  ],
  testimonials: [
    { stars: 5, text: '"Best ADCA Classes in Ranchi. Faculty is very supportive and teaching quality is excellent."', name: "Rohan Kumar" },
    { stars: 5, text: '"Spoken English classes helped me a lot in building my confidence. Highly recommended!"', name: "Priya Singh" },
    { stars: 5, text: '"Great place to prepare for JEE. Weekly tests and doubt sessions are very helpful."', name: "Aman Raj" },
    { stars: 5, text: '"The Data Analytics course gave me practical skills that landed me my first internship!"', name: "Sneha Gupta" },
    { stars: 4, text: '"Java Full Stack course is comprehensive. The project-based learning approach is amazing."', name: "Vikash Kumar" },
  ],
  faqs: [],
  bottomCTA: {
    icon: "🎯", headline: "Not Sure Which Course is Right for You?",
    subtext: "Book a Free Demo Class Now and experience our teaching.",
    buttons: [
      { label: "Book a Free Demo Class", href: "/demo", style: "primary" },
      { label: "Talk to Counselor", href: "/contact", style: "secondary" },
    ],
  },
  counselling: {
    badge: "FREE COUNSELING", headline: "Start Your Learning",
    headlineAccent: "Journey Today",
    paragraph: 'Fill the form and our counselor will call you within <strong>30 minutes</strong>. Get guidance on the right course, fee structure, and batch timings — completely free.',
    features: [
      { icon: "📞", text: "Call back in 30 minutes" }, { icon: "₹", text: "Flexible fee & EMI options" },
      { icon: "🏅", text: "Govt. recognised certification" }, { icon: "💼", text: "100% placement assistance" },
    ],
    phone: "+91-9835131568", whatsappLink: "https://wa.me/919835131568",
    formTitle: "Get Free Counseling", formSubtitle: "Our team will contact you within 30 minutes",
    courses: ["Data Analytics","Java Full Stack","Spoken English","JEE / NEET","Computer Courses (ADCA / DCA)","Other"],
    submitLabel: "Submit Free Inquiry", privacyNote: "Your information is 100% secure and private.",
  },
  footer: {
    brand: { name: "Emancipation", sub: "Edutech Private Limited", logo: "assets/eepl-reference-logo.png", tagline: "Your Gateway to Success" },
    quickLinks: [
      { label: "About Us", href: "/about" }, { label: "&#127942; Our Toppers", href: "/toppers" },
      { label: "Our Faculty", href: "/faculty" }, { label: "Media Gallery", href: "media-gallery.html" },
      { label: "Blog", href: "articles.html" }, { label: "Contact Us", href: "/contact" },
    ],
    courses: [
      { label: "Computer Courses", href: "courses.html?category=computer#all-courses" },
      { label: "School Tuition", href: "courses.html?category=school#all-courses" },
      { label: "Competitive Exams", href: "courses.html?category=competitive#all-courses" },
      { label: "Spoken English", href: "courses.html?category=spoken#all-courses" },
    ],
    contact: { address: "Main Road, Ranchi, Jharkhand 834001", phone: "+91-9835131568", email: "info@eeplclassroom.com" },
    social: [
      { platform: "Facebook", icon: "fb", href: "#" }, { platform: "Instagram", icon: "ig", href: "#" },
      { platform: "YouTube", icon: "yt", href: "#" }, { platform: "LinkedIn", icon: "in", href: "#" },
    ],
    copyright: "© 2026 EEPL Classroom. All Rights Reserved.",
  },
};

// ── API fetch helpers ──────────────────────────────────────
async function _apiGet(path) {
  try {
    const res = await fetch(API_BASE + path, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

async function _apiPost(path, data) {
  try {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
      signal: AbortSignal.timeout(4000),
    });
    const json = await res.json();
    return { ok: res.ok && json.success, data: json };
  } catch {
    return { ok: false, data: { success: false, message: "Network error" } };
  }
}

window.EEPL_API_BASE = API_BASE;
window.eeplApiGet = _apiGet;
window.eeplApiPost = _apiPost;

function normalizePublicHref(href) {
  if (!href) return "#";
  if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return href;

  const original = String(href);
  if (/^Frontend\//i.test(original)) {
    return frontendUrl(original.replace(/^Frontend\//i, ""));
  }
  if (/^\/Frontend\//i.test(original)) {
    return frontendUrl(original.replace(/^\/Frontend\//i, ""));
  }
  if (original.startsWith(`${FRONTEND_BASE}/`)) {
    return original;
  }

  const clean = original.replace(/^\/+/, "");
  const route = clean.split(/[?#]/)[0].toLowerCase();
  const suffix = clean.slice(route.length);
  const aliases = {
    "": "index.html",
    "login": "login.php",
    "register": "register_user.php",
    "demo": "contact.html",
    "contact": "contact.html",
    "about": "index.html#stats-section",
    "toppers": "index.html#testimonials-section",
    "faculty": "index.html#trusted-section",
    "gallery": "media-gallery.html",
    "media-gallery": "media-gallery.html",
    "privacy": "index.html#site-footer",
    "terms": "index.html#site-footer",
    "certificate/verify": "certification.html#sample-certificate",
    "study-materials": "courses.html#study-materials",
    "notes": "courses.html#study-materials",
    "help": "contact.html",
  };

  if (aliases[route]) return frontendUrl(aliases[route]);
  if (route === "store") return frontendUrl("courses.html#study-materials");
  if (route.startsWith("courses/")) {
    const slug = route.slice("courses/".length);
    return frontendUrl(`courses.html?course=${encodeURIComponent(slug)}#all-courses`);
  }

  const publicFiles = [
    "index.html",
    "courses.html",
    "webinar.html",
    "articles.html",
    "certification.html",
    "contact.html",
    "media-gallery.html",
    "login.php",
    "register_user.php",
    "register_trainer.php",
    "user-dashboard/index.php",
    "user-dashboard/index.html",
  ];
  if (publicFiles.includes(route)) return frontendUrl(`${route}${suffix}`);

  return original.startsWith("/") ? frontendUrl("contact.html") : original;
}

function normalizeRootLinks(root = document) {
  if (root.matches?.('a[href^="/"]:not([href^="//"])')) {
    root.setAttribute("href", normalizePublicHref(root.getAttribute("href")));
  }
  root.querySelectorAll?.('a[href^="/"]:not([href^="//"])').forEach((link) => {
    link.setAttribute("href", normalizePublicHref(link.getAttribute("href")));
  });
}

window.EEPL_FRONTEND_BASE = FRONTEND_BASE;
window.eeplResolveHref = normalizePublicHref;
window.eeplResolveAsset = normalizeAssetUrl;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => normalizeRootLinks());
} else {
  normalizeRootLinks();
}

new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) normalizeRootLinks(node);
    });
  });
}).observe(document.documentElement, { childList: true, subtree: true });

function normalizeBadge(badge) {
  return {
    icon: badge.icon || "",
    value: badge.value || "",
    label: badge.label || badge.text || "",
  };
}

function normalizeCoursePricing(course) {
  const originalPrice = Number(course.price || 0);
  const discountValue = Number(course.discount_value || 0);
  const discountType = course.discount_type || "none";
  const discountActive = Number(course.discount_status) === 1
    && discountType !== "none"
    && course.discounted_price !== null
    && Number(course.discounted_price) < originalPrice;
  const finalPrice = discountActive ? Number(course.discounted_price) : originalPrice;
  const discountLabel = discountActive
    ? (discountType === "percentage"
      ? `${discountValue.toLocaleString("en-IN")}% OFF`
      : `Rs. ${discountValue.toLocaleString("en-IN")} OFF`)
    : "";
  return {
    originalPrice,
    finalPrice,
    discountActive,
    discountType,
    discountValue,
    discountLabel,
    originalPriceLabel: originalPrice > 0 ? `Rs. ${originalPrice.toLocaleString("en-IN")}` : "Free",
    priceLabel: finalPrice > 0 ? `Rs. ${finalPrice.toLocaleString("en-IN")}` : "Free",
  };
}

// ── Build siteData from API + fallback ────────────────────
async function loadSiteData() {
  // Run API calls in parallel
  const [heroSection, popularCourses, publicCourses, webinars, trustedPartners, testimonials, counters, siteSettings, navItems, homeSections, homeFaqs] = await Promise.all([
    _apiGet('/home/hero'),
    _apiGet('/home/popular-courses'),
    _apiGet('/courses'),
    _apiGet('/home/upcoming-webinars'),
    _apiGet('/home/trusted-by'),
    _apiGet('/home/testimonials'),
    _apiGet('/home/counters'),
    _apiGet('/site/settings'),
    _apiGet('/site/navigation'),
    _apiGet('/pages/home/sections'),
    _apiGet('/home/faqs'),
  ]);

  // Build siteData with API results where available, fallback to static
  const siteData = { ..._staticData };

  // ── Settings from API
  if (siteSettings) {
    if (siteSettings.contact_phone)   siteData.counselling.phone = siteSettings.contact_phone;
    if (siteSettings.contact_whatsapp) siteData.counselling.whatsappLink = 'https://wa.me/' + siteSettings.contact_whatsapp.replace(/\D/g,'');
    if (siteSettings.contact_address)  siteData.footer.contact.address = siteSettings.contact_address;
    if (siteSettings.contact_phone)    siteData.footer.contact.phone = siteSettings.contact_phone;
    if (siteSettings.contact_email)    siteData.footer.contact.email = siteSettings.contact_email;
    if (siteSettings.site_name)        siteData.footer.brand.name = siteSettings.site_name;
    if (siteSettings.site_logo) {
      siteData.footer.brand.logo = normalizeAssetUrl(siteSettings.site_logo);
      const headerLogo = document.querySelector('.header-logo-img');
      if (headerLogo) headerLogo.src = normalizeAssetUrl(siteSettings.site_logo);
    }
    if (siteSettings.site_favicon) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = normalizeAssetUrl(siteSettings.site_favicon);
    }
    if (siteSettings.seo_default_title) document.title = siteSettings.seo_default_title;
    if (siteSettings.seo_default_description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) metaDescription.setAttribute('content', siteSettings.seo_default_description);
    }
    if (siteSettings.social_facebook)  { const s = siteData.footer.social.find(x=>x.icon==='fb'); if(s) s.href = siteSettings.social_facebook; }
    if (siteSettings.social_instagram) { const s = siteData.footer.social.find(x=>x.icon==='ig'); if(s) s.href = siteSettings.social_instagram; }
    if (siteSettings.social_youtube)   { const s = siteData.footer.social.find(x=>x.icon==='yt'); if(s) s.href = siteSettings.social_youtube; }
    if (siteSettings.social_linkedin)  { const s = siteData.footer.social.find(x=>x.icon==='in'); if(s) s.href = siteSettings.social_linkedin; }
  }

  // ── Navigation from API
  if (navItems && navItems.length > 0) {
    const headerNav = navItems.filter(n => n.location === 'header');
    if (headerNav.length > 0) {
      siteData.navigation = headerNav.map(n => ({ label: n.label, href: normalizePublicHref(n.url || '#') }));
    }
  }

  // ── Hero from API
  if (heroSection && heroSection.title) {
    const c = heroSection.content || {};
    siteData.heroSlides = [{
      headline: heroSection.title,
      headlineAccent: c.highlight || '',
      paragraph: heroSection.subtitle || siteData.heroSlides[0].paragraph,
      cta1: { label: c.cta_primary_text || 'Explore Courses', href: normalizePublicHref(c.cta_primary_url || 'courses.html') },
      cta2: { label: c.cta_secondary_text || 'Free Counselling', href: normalizePublicHref(c.cta_secondary_url || 'contact.html') },
      image: normalizeAssetUrl(c.image_url) || siteData.heroSlides[0].image,
      imageAlt: 'Student learning',
      badges: Array.isArray(c.badges) ? c.badges.map(normalizeBadge) : siteData.heroSlides[0].badges,
    }];
  }

  // ── Popular Courses from API
  if (homeSections && homeSections.length > 0) {
    const ctaSection = homeSections.find(section => section.section_key === 'cta');
    if (ctaSection) {
      const c = ctaSection.content || {};
      siteData.bottomCTA = {
        ...siteData.bottomCTA,
        icon: c.icon || siteData.bottomCTA.icon,
        headline: ctaSection.title || siteData.bottomCTA.headline,
        subtext: ctaSection.subtitle || siteData.bottomCTA.subtext,
        buttons: [
          {
            label: c.btn_text || c.cta_primary_text || siteData.bottomCTA.buttons[0].label,
            href: normalizePublicHref(c.btn_url || c.cta_primary_url || siteData.bottomCTA.buttons[0].href),
            style: 'primary',
          },
          siteData.bottomCTA.buttons[1],
        ].filter(Boolean),
      };
    }
  }

  const homepageCourses = Array.isArray(popularCourses)
    ? popularCourses
    : (Array.isArray(publicCourses) ? publicCourses.filter(c => Number(c.is_popular)).slice(0, 8) : siteData.courses);
  if (homepageCourses.length > 0) {
    siteData.courses = homepageCourses.map(c => ({
      ...normalizeCoursePricing(c),
      image: normalizeAssetUrl(c.thumbnail_url) || frontendUrl('assets/course-data-analytics.png'),
      title: c.title,
      duration: c.duration ? c.duration + ' hours' : '—',
      level: c.level || 'All Levels',
      description: c.short_description || c.description?.slice(0, 120) || '',
      badge: c.badge,
      href: c.slug ? `courses.html?course=${c.slug}#all-courses` : 'courses.html#all-courses',
      price: c.price,
      trainer: c.trainer_name || '',
    }));
  } else if (Array.isArray(popularCourses)) {
    siteData.courses = [];
  }

  // ── Webinars from API
  if (webinars && webinars.length > 0) {
    siteData.webinars = webinars.map(w => {
      const d = w.starts_at ? new Date(String(w.starts_at).replace(" ", "T")) : null;
      const hasDate = d && !Number.isNaN(d.getTime());
      if (!hasDate) {
        return {
          month: 'TBA',
          day: '--',
          weekday: '',
          title: w.title,
          time: 'Time to be announced',
          speaker: w.speaker_name || 'EEPL Faculty',
          seats_left: w.seats_left,
          seats_limit: w.seats_limit,
          meet_url: w.meet_url,
          image: normalizeAssetUrl(w.banner_url || w.speaker_image_url),
          speakerImage: normalizeAssetUrl(w.speaker_image_url),
          href: `webinar.html#upcoming-webinars`,
          id: w.id,
        };
      }
      return {
        month: d ? d.toLocaleString('en-IN', { month: 'short' }).toUpperCase() : '—',
        day: d ? String(d.getDate()).padStart(2,'0') : '—',
        weekday: d ? d.toLocaleString('en-IN', { weekday: 'short' }).toUpperCase() : '—',
        title: w.title,
        time: d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
        speaker: w.speaker_name || '—',
        seats_left: w.seats_left,
        seats_limit: w.seats_limit,
        meet_url: w.meet_url,
        image: normalizeAssetUrl(w.banner_url || w.speaker_image_url),
        speakerImage: normalizeAssetUrl(w.speaker_image_url),
        href: `webinar.html#upcoming-webinars`,
        id: w.id,
      };
    });
  }

  // ── Trusted By from API
  if (trustedPartners && trustedPartners.length > 0) {
    siteData.trustedBy = trustedPartners.map(p => ({
      name: p.name, logo: normalizeAssetUrl(p.logo_url) || '', alt: p.name, href: normalizePublicHref(p.website_url || '#'),
    }));
  }

  // ── Testimonials from API
  if (testimonials && testimonials.length > 0) {
    siteData.testimonials = testimonials.map(t => ({
      stars: t.rating || 5,
      text: `"${t.quote}"`,
      name: t.name,
      role: t.role,
      image: normalizeAssetUrl(t.image_url),
    }));
  }

  if (Array.isArray(homeFaqs) && homeFaqs.length > 0) {
    siteData.faqs = homeFaqs.map(item => ({
      question: item.question,
      answer: item.answer,
    }));
  }

  // ── Counters/Stats from API
  if (counters && counters.length > 0) {
    siteData.stats = counters.map(c => ({
      icon: c.icon || '📊',
      value: c.value + (c.suffix || ''),
      label: c.label,
    }));
  }

  siteData.navigation = siteData.navigation.map(item => ({
    ...item,
    href: normalizePublicHref(item.href),
  }));
  siteData.heroSlides = siteData.heroSlides.map(slide => ({
    ...slide,
    image: normalizeAssetUrl(slide.image),
    bannerImage: normalizeAssetUrl(slide.bannerImage),
    cta1: { ...slide.cta1, href: normalizePublicHref(slide.cta1?.href) },
    cta2: { ...slide.cta2, href: normalizePublicHref(slide.cta2?.href) },
  }));
  siteData.courses = siteData.courses.map(course => ({
    ...course,
    image: normalizeAssetUrl(course.image),
    href: normalizePublicHref(course.href),
  }));
  siteData.webinars = siteData.webinars.map(webinar => ({
    ...webinar,
    href: normalizePublicHref(webinar.href),
  }));
  siteData.bottomCTA.buttons = siteData.bottomCTA.buttons.map(button => ({
    ...button,
    href: normalizePublicHref(button.href),
  }));
  siteData.promotionPopup.ctaLink = normalizePublicHref(siteData.promotionPopup.ctaLink);
  siteData.promotionPopup.image = normalizeAssetUrl(siteData.promotionPopup.image);
  siteData.footer.quickLinks = siteData.footer.quickLinks.map(link => ({
    ...link,
    href: normalizePublicHref(link.href),
  }));
  siteData.footer.courses = siteData.footer.courses.map(link => ({
    ...link,
    href: normalizePublicHref(link.href),
  }));
  siteData.footer.brand.logo = normalizeAssetUrl(siteData.footer.brand.logo);

  return siteData;
}

// Export global — app.js will wait for this promise
window._siteDataPromise = loadSiteData();
