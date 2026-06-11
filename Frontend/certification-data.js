/**
 * ============================================================
 *  EEPL Classroom — Certification Page Data (CMS Mock Layer)
 * ============================================================
 *  All visible certification page content is defined here.
 *  A future admin panel / CMS should update ONLY this file
 *  (or replace it with API responses) — components stay untouched.
 * ============================================================
 */

const certificationPageData = {
  /* ---------- Assets ---------- */
  assets: {
    heroImage: "assets/certification/hero-visual.png",
    sampleCertificate: "assets/certification/sample-certificate.png",
    ctaLeftImage: "assets/certification/cta-left.png",
    ctaRightImage: "assets/certification/cta-right.png",
  },

  /* ---------- Routes / Links ---------- */
  links: {
    startTest: "#certification-programs",
    viewCertificates: "#sample-certificate",
    verifyCertificate: "/certificate/verify",
  },

  /* ---------- Hero ---------- */
  hero: {
    headline: "Advance Your IT Skills.",
    headlineAccent: "Get Certified.",
    description: "100% Online Computer Courses with Industry Recognized Certificates.",
    cta1: { label: "Start Certification Test", href: "#certification-programs" },
    cta2: { label: "View Certificates", href: "#sample-certificate" },
  },

  /* ---------- Certification Programs (8 cards) ---------- */
  programs: [
    {
      id: "java",
      icon: "java",
      title: "Java Programming Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=java-fullstack&category=computer#all-courses",
    },
    {
      id: "python",
      icon: "python",
      title: "Python Programming Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=python-programming&category=computer#all-courses",
    },
    {
      id: "web",
      icon: "web",
      title: "Web Development Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=web-development&category=computer#all-courses",
    },
    {
      id: "c",
      icon: "c",
      title: "C Programming Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=dca&category=computer#all-courses",
    },
    {
      id: "cpp",
      icon: "cpp",
      title: "C++ Programming Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=adca&category=computer#all-courses",
    },
    {
      id: "ds",
      icon: "ds",
      title: "Data Structures Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=web-development&category=computer#all-courses",
    },
    {
      id: "sql",
      icon: "sql",
      title: "SQL Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=data-analytics&category=computer#all-courses",
    },
    {
      id: "basics",
      icon: "basics",
      title: "Computer Basics Certification",
      features: ["All Levels", "Lifetime Access", "Practice Tests"],
      feeLabel: "Certificate Fee",
      fee: "₹999",
      href: "courses.html?course=dca&category=computer#all-courses",
    },
  ],

  /* ---------- Fee Structure ---------- */
  fees: [
    ["All Computer Certification Courses", "Free", "₹999"],
  ],

  /* ---------- Sample Certificate ---------- */
  sampleCertificate: {
    title: "Sample Certificate",
    description: "This is how your e-certificate will look after successful completion.",
    features: [
      "Unique Verification ID",
      "Digital & Shareable",
      "Industry Recognized",
      "Lifetime Validity",
    ],
  },

  /* ---------- Benefits of Certificate ---------- */
  benefits: [
    {
      icon: "career",
      title: "Boost Your Career",
      description: "Stand out to employers and increase your job opportunities.",
    },
    {
      icon: "skills",
      title: "Improve Your Skills",
      description: "Validate your knowledge and stay ahead in the competitive world.",
    },
    {
      icon: "credibility",
      title: "Build Credibility",
      description: "Earn industry-recognized certificates that build trust and credibility.",
    },
    {
      icon: "share",
      title: "Share Anywhere",
      description: "Digital certificate is easy to share on LinkedIn, resume, and more.",
    },
    {
      icon: "lifetime",
      title: "Lifetime Validity",
      description: "Your certificate is valid for life. Learn once, get recognized forever.",
    },
    {
      icon: "global",
      title: "Global Recognition",
      description: "Accepted and recognized across industries worldwide.",
    },
  ],

  /* ---------- Footer columns (certification-specific) ---------- */
  footer: {
    quickLinks: [
      { label: "Courses", href: "courses.html" },
      { label: "Certification", href: "certification.html" },
      { label: "CertVerify", href: "/certificate/verify" },
      { label: "Articles", href: "articles.html" },
    ],
    resources: [
      { label: "FAQ", href: "#" },
      { label: "Guidelines", href: "#" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
};

(function () {
  const fallback = JSON.parse(JSON.stringify(certificationPageData));
  const apiGet = (path) => window.eeplApiGet ? window.eeplApiGet(path) : Promise.resolve(null);

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function priceLabel(value) {
    const amount = Number(value || 0);
    return amount > 0 ? `Rs. ${amount.toLocaleString("en-IN")}` : "Free";
  }

  function durationLabel(value) {
    if (!value) return "Lifetime Access";
    return /^\d+$/.test(String(value)) ? `${value} Hours` : String(value);
  }

  function iconFor(title, index) {
    const text = String(title || "").toLowerCase();
    if (text.includes("java")) return "java";
    if (text.includes("python")) return "python";
    if (text.includes("web")) return "web";
    if (text.includes("sql") || text.includes("data")) return "sql";
    return ["java", "python", "web", "c", "cpp", "ds", "sql", "basics"][index % 8];
  }

  function applySections(data, sections) {
    if (!Array.isArray(sections)) return;
    sections.forEach((section) => {
      const content = section.content || {};
      if (section.section_key === "hero") {
        data.hero = {
          ...data.hero,
          headline: section.title || data.hero.headline,
          headlineAccent: content.highlight || data.hero.headlineAccent,
          description: section.subtitle || data.hero.description,
          cta1: {
            label: content.cta_primary_text || data.hero.cta1.label,
            href: content.cta_primary_url || data.hero.cta1.href,
          },
          cta2: {
            label: content.cta_secondary_text || data.hero.cta2.label,
            href: content.cta_secondary_url || data.hero.cta2.href,
          },
        };
        if (content.image_url) data.assets.heroImage = content.image_url;
      }
      if (section.section_key === "programs" && Array.isArray(content.items)) data.programs = content.items;
      if (section.section_key === "fees" && Array.isArray(content.items)) data.fees = content.items;
      if (section.section_key === "benefits" && Array.isArray(content.items)) data.benefits = content.items;
      if (section.section_key === "sample_certificate") {
        data.sampleCertificate = {
          ...data.sampleCertificate,
          title: section.title || data.sampleCertificate.title,
          description: section.subtitle || data.sampleCertificate.description,
          features: content.features || data.sampleCertificate.features,
        };
        if (content.image_url) data.assets.sampleCertificate = content.image_url;
      }
    });
  }

  async function loadCertificationPageData() {
    const data = JSON.parse(JSON.stringify(fallback));
    const [sections, courses] = await Promise.all([
      apiGet("/pages/certification/sections"),
      apiGet("/courses"),
    ]);

    applySections(data, sections);

    const certCourses = Array.isArray(courses)
      ? courses.filter((course) => String(course.category || "").toLowerCase().includes("cert"))
      : [];
    if (certCourses.length) {
      data.programs = certCourses.slice(0, 8).map((course, index) => ({
        id: course.slug || slug(course.title),
        icon: iconFor(course.title, index),
        title: course.title,
        features: [
          course.level ? String(course.level).replace(/^\w/, (c) => c.toUpperCase()) : "All Levels",
          durationLabel(course.duration),
          "Practice Tests",
        ],
        feeLabel: "Course Fee",
        fee: priceLabel(course.price),
        href: `courses.html?course=${encodeURIComponent(course.slug || course.id)}&category=certification#all-courses`,
      }));
    }

    return data;
  }

  window._certificationPageDataPromise = loadCertificationPageData();
})();
