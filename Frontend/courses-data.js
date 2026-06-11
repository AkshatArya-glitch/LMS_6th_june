/**
 * EEPL Classroom - Courses Page Content Data
 *
 * This file is the mock CMS/API layer for the courses page. A backend admin
 * panel can replace it with structured API responses using the same fields.
 */

const coursesPageData = {
  hero: {
    headline: "Unlock Skills.",
    headlineAccent: "Build Your Future.",
    paragraph: "Industry-relevant courses to empower you with knowledge, skills and confidence.",
    ctaPrimary: { label: "Explore Courses ->", href: "#all-courses" },
    ctaSecondary: { label: "Book a Free Demo", href: "/demo" },
    bannerImage: "assets/hero-student.png",
    overlayOpacity: 0.9,
    image: "assets/hero-student.png",
    imageAlt: "Student learning at desk",
  },

  categories: [
    { id: "all", label: "All Courses", active: true },
    { id: "popular", label: "Popular", active: false },
    { id: "computer", label: "Computer Courses", active: false },
    { id: "school", label: "School Tuition", active: false },
    { id: "competitive", label: "Competitive Exams", active: false },
    { id: "spoken", label: "Spoken English", active: false },
    { id: "certification", label: "Certification", active: false },
    { id: "beginner", label: "Beginner", active: false },
    { id: "advanced", label: "Advanced", active: false },
  ],

  courses: [
    {
      id: "data-analytics",
      image: "assets/course-data-analytics.png",
      title: "Data Analytics",
      duration: "3 Months",
      level: "Beginner to Advanced",
      category: ["computer", "popular", "beginner", "advanced", "certification"],
      description: "Learn data analysis, visualization, Excel, SQL, Power BI and more.",
      badge: "Popular",
      price: "Rs. 12,000",
      href: "/courses/data-analytics",
      ctaText: "Learn More",
      featured: true,
      sortOrder: 1,
      visible: true,
      slug: "data-analytics",
    },
    {
      id: "java-fullstack",
      image: "assets/course-java-fullstack.png",
      title: "Java Full Stack",
      duration: "6 Months",
      level: "Beginner to Advanced",
      category: ["computer", "popular", "beginner", "advanced", "certification"],
      description: "Master Java, Spring Boot, React, MySQL and build real-world projects.",
      badge: "Trending",
      price: "Rs. 18,000",
      href: "/courses/java-fullstack",
      ctaText: "Learn More",
      featured: true,
      sortOrder: 2,
      visible: true,
      slug: "java-fullstack",
    },
    {
      id: "spoken-english",
      image: "assets/course-spoken-english.png",
      title: "Spoken English",
      duration: "2 Months",
      level: "All Levels",
      category: ["spoken", "popular", "beginner"],
      description: "Improve your speaking, grammar, fluency and confidence.",
      badge: "",
      price: "Rs. 5,000",
      href: "/courses/spoken-english",
      ctaText: "Learn More",
      featured: true,
      sortOrder: 3,
      visible: true,
      slug: "spoken-english",
    },
    {
      id: "jee-neet",
      image: "assets/course-jee-neet.png",
      title: "JEE / NEET",
      duration: "1 Year",
      level: "For 11th, 12th & Droppers",
      category: ["competitive", "popular", "advanced"],
      description: "Complete preparation for JEE (Main + Advanced) and NEET.",
      badge: "Popular",
      price: "Rs. 25,000",
      href: "/courses/jee-neet",
      ctaText: "Learn More",
      featured: true,
      sortOrder: 4,
      visible: true,
      slug: "jee-neet",
    },
    {
      id: "adca",
      image: "assets/course-data-analytics.png",
      title: "ADCA (Advanced Diploma)",
      duration: "1 Year",
      level: "Beginner",
      category: ["computer", "beginner", "certification"],
      description: "Comprehensive advanced diploma covering Tally, Office, DTP and web basics.",
      badge: "New",
      price: "Rs. 15,000",
      href: "/courses/adca",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 5,
      visible: true,
      slug: "adca",
    },
    {
      id: "dca",
      image: "assets/course-java-fullstack.png",
      title: "DCA (Diploma in Computer App)",
      duration: "6 Months",
      level: "Beginner",
      category: ["computer", "beginner", "certification"],
      description: "Diploma in computer applications covering MS Office, Internet and Tally basics.",
      badge: "",
      price: "Rs. 8,000",
      href: "/courses/dca",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 6,
      visible: true,
      slug: "dca",
    },
    {
      id: "upsc-foundation",
      image: "assets/course-jee-neet.png",
      title: "UPSC Foundation",
      duration: "1 Year",
      level: "Advanced",
      category: ["competitive", "advanced"],
      description: "Foundation course for UPSC civil services covering GS papers, CSAT and optional subjects.",
      badge: "New",
      price: "Rs. 30,000",
      href: "/courses/upsc-foundation",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 7,
      visible: true,
      slug: "upsc-foundation",
    },
    {
      id: "ssc-banking",
      image: "assets/course-data-analytics.png",
      title: "SSC & Banking",
      duration: "6 Months",
      level: "Beginner to Advanced",
      category: ["competitive", "beginner", "advanced"],
      description: "Preparation for SSC CGL, CHSL, Banking PO and Clerk exams with mock tests.",
      badge: "",
      price: "Rs. 12,000",
      href: "/courses/ssc-banking",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 8,
      visible: true,
      slug: "ssc-banking",
    },
    {
      id: "python-programming",
      image: "assets/course-java-fullstack.png",
      title: "Python Programming",
      duration: "3 Months",
      level: "Beginner",
      category: ["computer", "beginner", "certification"],
      description: "Learn Python from scratch with functions, OOP, file handling and project work.",
      badge: "Trending",
      price: "Rs. 10,000",
      href: "/courses/python-programming",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 9,
      visible: true,
      slug: "python-programming",
    },
    {
      id: "web-development",
      image: "assets/course-data-analytics.png",
      title: "Web Development",
      duration: "4 Months",
      level: "Beginner to Advanced",
      category: ["computer", "beginner", "advanced", "certification"],
      description: "Build modern websites with HTML, CSS, JavaScript, React and Node.js.",
      badge: "New",
      price: "Rs. 14,000",
      href: "/courses/web-development",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 10,
      visible: true,
      slug: "web-development",
    },
    {
      id: "class-9-10-tuition",
      image: "assets/course-spoken-english.png",
      title: "Class 9 & 10 Tuition",
      duration: "Academic Year",
      level: "CBSE / ICSE / State Board",
      category: ["school", "beginner"],
      description: "Expert coaching for Maths, Science, English and Social Studies.",
      badge: "",
      price: "Rs. 8,000",
      href: "/courses/class-9-10-tuition",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 11,
      visible: true,
      slug: "class-9-10-tuition",
    },
    {
      id: "class-11-12-tuition",
      image: "assets/course-jee-neet.png",
      title: "Class 11 & 12 Tuition",
      duration: "Academic Year",
      level: "CBSE / ISC / State Board",
      category: ["school", "beginner", "advanced"],
      description: "PCM, PCB and Commerce coaching with tests and doubt clearing.",
      badge: "",
      price: "Rs. 10,000",
      href: "/courses/class-11-12-tuition",
      ctaText: "Learn More",
      featured: false,
      sortOrder: 12,
      visible: true,
      slug: "class-11-12-tuition",
    },
  ],

  exploreCategories: [
    {
      id: "competitive",
      image: "assets/course-jee-neet.png",
      title: "Competitive Exams",
      description: "UPSC, SSC, Banking, Railways, State Exams and more.",
      href: "courses.html?category=competitive#all-courses",
      ctaText: "Explore ->",
      sortOrder: 1,
      visible: true,
    },
    {
      id: "school",
      image: "assets/course-spoken-english.png",
      title: "School Tuition",
      description: "CBSE, ICSE, State Board courses for all classes.",
      href: "courses.html?category=school#all-courses",
      ctaText: "Explore ->",
      sortOrder: 2,
      visible: true,
    },
    {
      id: "computer",
      image: "assets/course-java-fullstack.png",
      title: "Computer Courses",
      description: "Programming, Web Dev., Data, AI/ML and more.",
      href: "courses.html?category=computer#all-courses",
      ctaText: "Explore ->",
      sortOrder: 3,
      visible: true,
    },
    {
      id: "spoken",
      image: "assets/course-spoken-english.png",
      title: "Spoken English",
      description: "Speak confidently in daily life and professional settings.",
      href: "courses.html?category=spoken#all-courses",
      ctaText: "Explore ->",
      sortOrder: 4,
      visible: true,
    },
  ],

  studyMaterials: [
    {
      title: "NCERT solutions",
      image: "assets/course-data-analytics.png",
      color: "#f59e0b",
      bgColor: "#fff7df",
      href: "/store?type=study-materials&item=ncert-solutions",
      sortOrder: 1,
      visible: true,
    },
    {
      title: "Previous year question papers",
      image: "assets/course-spoken-english.png",
      color: "#8b5cf6",
      bgColor: "#f3edff",
      href: "/store?type=study-materials&item=previous-year-papers",
      sortOrder: 2,
      visible: true,
    },
    {
      title: "Sample question papers",
      image: "assets/course-java-fullstack.png",
      color: "#3b82f6",
      bgColor: "#eef6ff",
      href: "/store?type=study-materials&item=sample-papers",
      sortOrder: 3,
      visible: true,
    },
    {
      title: "NCERT Books",
      image: "assets/course-jee-neet.png",
      color: "#10b981",
      bgColor: "#eafaf4",
      href: "/store?type=study-materials&item=ncert-books",
      sortOrder: 4,
      visible: true,
    },
    {
      title: "Important question papers",
      image: "assets/course-spoken-english.png",
      color: "#8b5cf6",
      bgColor: "#f3edff",
      href: "/store?type=study-materials&item=important-questions",
      sortOrder: 5,
      visible: true,
    },
  ],

  sectionHeadings: {
    popularCourses: "Popular Courses",
    exploreCourses: "Explore Courses",
    allCourses: "All Courses",
    studyMaterials: "Study Materials",
    whyChoose: "Why Choose EEPL Classroom?",
  },

  pageMeta: {
    title: "Courses - EEPL Classroom | Explore Learning Opportunities",
    description: "Discover industry-relevant courses in Data Analytics, Java Full Stack, Spoken English, JEE/NEET and more at EEPL Classroom, Ranchi.",
  },
};

(function () {
  const fallback = JSON.parse(JSON.stringify(coursesPageData));
  const apiGet = (path) => window.eeplApiGet ? window.eeplApiGet(path) : Promise.resolve(null);

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function durationLabel(value) {
    if (!value) return "";
    return /^\d+$/.test(String(value)) ? `${value} Hours` : String(value);
  }

  function priceLabel(value) {
    const amount = Number(value || 0);
    return amount > 0 ? `Rs. ${amount.toLocaleString("en-IN")}` : "Free";
  }

  function applySections(data, sections) {
    if (!Array.isArray(sections) || !sections.length) return;
    const hero = sections.find((section) => section.section_key === "hero");
    if (hero) {
      const content = hero.content || {};
      data.hero = {
        ...data.hero,
        headline: hero.title || data.hero.headline,
        headlineAccent: content.highlight || data.hero.headlineAccent,
        paragraph: hero.subtitle || data.hero.paragraph,
        ctaPrimary: {
          label: content.cta_primary_text || data.hero.ctaPrimary.label,
          href: content.cta_primary_url || data.hero.ctaPrimary.href,
        },
        ctaSecondary: {
          label: content.cta_secondary_text || data.hero.ctaSecondary.label,
          href: content.cta_secondary_url || data.hero.ctaSecondary.href,
        },
        bannerImage: content.banner_url || content.image_url || data.hero.bannerImage,
        image: content.image_url || data.hero.image,
        imageAlt: content.image_alt || data.hero.imageAlt,
      };
    }
  }

  function mapCourse(row, index) {
    const categorySlug = slug(row.category || "general");
    const categories = [categorySlug].filter(Boolean);
    if (Number(row.is_popular)) categories.push("popular");
    if (Number(row.is_featured)) categories.push("featured");
    if (row.level) categories.push(slug(row.level));
    const originalPrice = Number(row.price || 0);
    const discountValue = Number(row.discount_value || 0);
    const discountType = row.discount_type || "none";
    const discountActive = Number(row.discount_status) === 1
      && discountType !== "none"
      && row.discounted_price !== null
      && Number(row.discounted_price) < originalPrice;
    const finalPrice = discountActive ? Number(row.discounted_price) : originalPrice;

    return {
      id: row.slug || String(row.id),
      image: row.thumbnail_url || fallback.courses[index % fallback.courses.length]?.image || "assets/course-data-analytics.png",
      title: row.title,
      duration: durationLabel(row.duration) || fallback.courses[index % fallback.courses.length]?.duration || "",
      level: row.level ? titleCase(row.level) : "All Levels",
      category: categories,
      description: row.short_description || row.description || "",
      badge: row.badge || (Number(row.is_popular) ? "Popular" : ""),
      price: priceLabel(finalPrice),
      originalPrice: priceLabel(originalPrice),
      discountActive,
      discountLabel: discountActive
        ? (discountType === "percentage"
          ? `${discountValue.toLocaleString("en-IN")}% OFF`
          : `Rs. ${discountValue.toLocaleString("en-IN")} OFF`)
        : "",
      href: `courses.html?course=${encodeURIComponent(row.slug || row.id)}&category=${encodeURIComponent(categorySlug)}#all-courses`,
      ctaText: "Learn More",
      featured: Boolean(Number(row.is_featured) || Number(row.is_popular)),
      sortOrder: Number(row.sort_order || index + 1),
      visible: true,
      slug: row.slug || String(row.id),
    };
  }

  async function loadCoursesPageData() {
    const data = JSON.parse(JSON.stringify(fallback));
    const [sections, categories, courses] = await Promise.all([
      apiGet("/pages/courses/sections"),
      apiGet("/course-categories"),
      apiGet("/courses"),
    ]);

    applySections(data, sections);

    if (Array.isArray(categories) && categories.length) {
      const mapped = categories.map((category) => ({
        id: category.slug || slug(category.name),
        label: category.name,
        active: false,
      }));
      data.categories = [
        { id: "all", label: "All Courses", active: true },
        { id: "popular", label: "Popular", active: false },
        ...mapped,
        { id: "beginner", label: "Beginner", active: false },
        { id: "advanced", label: "Advanced", active: false },
      ];
      data.exploreCategories = categories.map((category, index) => ({
        id: category.slug || slug(category.name),
        image: category.image_url || fallback.exploreCategories[index % fallback.exploreCategories.length]?.image || "assets/course-data-analytics.png",
        title: category.name,
        description: category.description || `Explore ${category.name} courses.`,
        href: `courses.html?category=${encodeURIComponent(category.slug || slug(category.name))}#all-courses`,
        ctaText: "Explore ->",
        sortOrder: Number(category.sort_order || index + 1),
        visible: category.is_active !== "0",
      }));
    }

    if (Array.isArray(courses) && courses.length) {
      data.courses = courses.map(mapCourse).sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return data;
  }

  window._coursesPageDataPromise = loadCoursesPageData();
})();
