/* Articles page data (articles-data.js) */
const articlesPageData = {
  categories: [
    "All Articles",
    "Certifications",
    "Competitive Exams",
    "Technology",
    "Career",
    "Study Tips",
    "Industry Insights",
    "Guides & Tutorials",
  ],
  popularExams: ["SSC","Banking","UPSC","IBPS","RRB","State PSC","Teaching Exams"],
  tags: ["Certification","IT Skills","SSC CGL","Bank PO","Digital Marketing","Python","Data Science","UPSC"],
  newsletter: {
    title: "Newsletter",
    text: "Subscribe to get the latest articles and updates.",
    placeholder: "Enter your email",
    cta: "Subscribe"
  },
  tabs: ["All Articles","Certifications","Competitive Exams","Technology","Career","Guides & Tips","Industry Insights"],
  articles: [
    {
      id: 1,
      category: "CERTIFICATIONS",
      date: "May 10, 2024",
      readTime: "6 min read",
      title: "Top 5 Benefits of Getting Certified in Your IT Career",
      desc: "Discover how industry-recognized certifications can boost your career and open new opportunities.",
      image: "assets/articles/certifications.jpg",
      slug: "benefits-certified-it"
    },
    {
      id: 2,
      category: "COMPETITIVE EXAMS",
      date: "May 08, 2024",
      readTime: "7 min read",
      title: "SSC CGL 2024: Complete Preparation Strategy",
      desc: "Detailed strategy, syllabus, and tips to help you crack SSC CGL exam in first attempt.",
      image: "assets/articles/ssc-cgl.jpg",
      slug: "ssc-cgl-2024-strategy"
    },
    {
      id: 3,
      category: "TECHNOLOGY",
      date: "May 06, 2024",
      readTime: "5 min read",
      title: "Top Programming Languages to Learn in 2024",
      desc: "Explore the most in-demand programming languages and their career opportunities.",
      image: "assets/articles/technology.jpg",
      slug: "top-languages-2024"
    },
    {
      id: 4,
      category: "CAREER",
      date: "May 03, 2024",
      readTime: "6 min read",
      title: "How Certifications Improve Your Job Opportunities",
      desc: "Learn how the right certification can help you stand out and get better job opportunities.",
      image: "assets/articles/career.jpg",
      slug: "certifications-improve-jobs"
    },
    {
      id: 5,
      category: "STUDY TIPS",
      date: "Apr 30, 2024",
      readTime: "5 min read",
      title: "Effective Study Tips to Crack Any Exam",
      desc: "Proven study techniques and time management tips to improve your preparation.",
      image: "assets/articles/study-tips.jpg",
      slug: "effective-study-tips"
    },
    {
      id: 6,
      category: "BANKING EXAMS",
      date: "Apr 28, 2024",
      readTime: "6 min read",
      title: "IBPS PO 2024: Exam Pattern & Preparation Tips",
      desc: "Check the latest exam pattern, syllabus, and preparation tips for IBPS PO exam.",
      image: "assets/articles/banking.jpg",
      slug: "ibps-po-2024"
    },
    {
      id: 7,
      category: "UPSC",
      date: "Apr 25, 2024",
      readTime: "7 min read",
      title: "UPSC Civil Services Exam: A Complete Guide",
      desc: "Syllabus, strategy, books, and tips to help you crack UPSC CSE exam.",
      image: "assets/articles/upsc.jpg",
      slug: "upsc-complete-guide"
    },
    {
      id: 8,
      category: "DATA SCIENCE",
      date: "Apr 25, 2024",
      readTime: "6 min read",
      title: "Data Science Roadmap for Beginners",
      desc: "Step-by-step roadmap to become a data scientist from scratch in 2024.",
      image: "assets/articles/data-science.jpg",
      slug: "data-science-roadmap"
    },
    {
      id: 9,
      category: "TEACHING EXAMS",
      date: "Apr 20, 2024",
      readTime: "6 min read",
      title: "CTET 2024: Preparation Tips & Syllabus",
      desc: "Complete guide to CTET exam pattern, syllabus and preparation strategy.",
      image: "assets/articles/teaching.jpg",
      slug: "ctet-2024"
    }
  ],
  pagination: {
    page: 1,
    totalPages: 10
  }
};

(function () {
  const fallback = JSON.parse(JSON.stringify(articlesPageData));
  const apiGet = (path) => window.eeplApiGet ? window.eeplApiGet(path) : Promise.resolve(null);

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  }

  function categoryLabel(row, categoriesById) {
    const category = categoriesById[row.category_id];
    if (category) return category.name.toUpperCase();
    return row.type === "blog" ? "BLOG" : "ARTICLE";
  }

  function assetUrl(value) {
    return window.eeplResolveAsset ? window.eeplResolveAsset(value) : value;
  }

  async function loadArticlesPageData() {
    const data = JSON.parse(JSON.stringify(fallback));
    const [posts, categories] = await Promise.all([
      apiGet("/articles"),
      apiGet("/content-categories"),
    ]);

    const articleCategories = Array.isArray(categories)
      ? categories.filter((item) => item.type === "article" || item.type === "both")
      : [];

    if (articleCategories.length) {
      const labels = articleCategories.map((item) => item.name);
      data.categories = ["All Articles", ...labels];
      data.tabs = ["All Articles", ...labels];
    }

    if (Array.isArray(posts) && posts.length) {
      const byId = {};
      articleCategories.forEach((item) => { byId[item.id] = item; });
      data.articles = posts.map((post) => ({
        id: post.id,
        category: categoryLabel(post, byId),
        date: formatDate(post.published_at),
        readTime: `${post.reading_time || 5} min read`,
        title: post.title,
        desc: post.excerpt || "",
        image: assetUrl(post.featured_image_url) || fallback.articles[0].image,
        slug: post.slug,
      }));
      data.pagination = { page: 1, totalPages: 1 };
    }

    return data;
  }

  window._articlesPageDataPromise = loadArticlesPageData();
})();
