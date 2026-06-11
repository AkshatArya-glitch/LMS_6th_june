/**
 * ============================================================
 *  Contact Page Data (contact-data.js)
 * ============================================================
 *  Data for the Contact page sections.
 *  Loaded by contact-app.js to populate the page.
 * ============================================================
 */

const contactPageData = {
  /* ---------- Hero Section ---------- */
  hero: {
    headline: "Contact Us",
    paragraph: "We're here to help you. Reach out to us for any queries or assistance.",
    breadcrumb: [
      { label: "Home", href: "index.html" },
      { label: "Contact Us", href: "contact.html" }
    ],
    image: "assets/certification/hero-visual.png", // Replace with contact hero image
    imageAlt: "Person holding phone with message icon"
  },

  /* ---------- Get In Touch Section ---------- */
  getInTouch: {
    heading: "Get In Touch",
    items: [
      {
        icon: "📍",
        title: "Our Location",
        description: "Main Road, Ranchi, Jharkhand 834001"
      },
      {
        icon: "📞",
        title: "Call Us",
        phone: "+91-9835131568",
        whatsappLink: "https://wa.me/919835131568?text=Hello%20EEPL%20Classroom"
      },
      {
        icon: "✉️",
        title: "Email Us",
        email: "info@eeplclassroom.com"
      }
    ],
    mapEmbed: {
      title: "EEPL Classroom",
      address: "Abhinandan Complex, East Jain",
      rating: "4.8",
      reviews: "(490)",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3640.6854563893607!2d85.25854992346949!3d23.35748737123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f44f1234567!2sEEPL%20Classroom!5e0!3m2!1sen!2sin!4v1234567890"
    }
  },

  /* ---------- Inquiry Form Section ---------- */
  inquiryForm: {
    heading: "Send an Inquiry",
    responseTime: "Average Response Time:",
    responseTimeValue: "Within 24 Hours",
    description: "Fill out the form below and our counselor will contact you shortly.",
    fields: [
      {
        type: "text",
        name: "fullName",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true
      },
      {
        type: "tel",
        name: "phone",
        label: "Phone Number",
        placeholder: "Enter your phone number",
        required: true
      },
      {
        type: "email",
        name: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: false
      },
      {
        type: "select",
        name: "interestedIn",
        label: "Interested In",
        placeholder: "Select Category / Course",
        options: [
          { value: "", label: "Select Category / Course" },
          { value: "data-analytics", label: "Data Analytics" },
          { value: "java-fullstack", label: "Java Full Stack" },
          { value: "spoken-english", label: "Spoken English" },
          { value: "jee-neet", label: "JEE / NEET" },
          { value: "certification", label: "Certification" },
          { value: "webinar", label: "Webinar" },
          { value: "other", label: "Other" }
        ],
        required: false
      },
      {
        type: "text",
        name: "city",
        label: "City",
        placeholder: "Enter your city",
        required: false
      },
      {
        type: "textarea",
        name: "message",
        label: "Message / Query",
        placeholder: "Tell us about your query...",
        maxLength: 500,
        required: false
      }
    ],
    submitLabel: "Send Inquiry",
    privacyNote: "Your information is secure and we respect your privacy.",
    characterCount: "0/500"
  },

  /* ---------- Bottom CTA Section ---------- */
  bottomCTA: {
    heading: "Ready to Get Certified?",
    description: "Take the assessment and showcase your skills.",
    buttonLabel: "Join Our Courses",
    buttonLink: "courses.html",
    leftImage: "assets/certification/cta-left.png",
    rightImage: "assets/certification/cta-right.png"
  }
};

(function () {
  const fallback = JSON.parse(JSON.stringify(contactPageData));
  const apiGet = (path) => window.eeplApiGet ? window.eeplApiGet(path) : Promise.resolve(null);

  function applySections(data, sections) {
    if (!Array.isArray(sections)) return;
    sections.forEach((section) => {
      const content = section.content || {};
      if (section.section_key === "hero") {
        data.hero = {
          ...data.hero,
          headline: section.title || data.hero.headline,
          paragraph: section.subtitle || data.hero.paragraph,
          image: content.image_url || data.hero.image,
          imageAlt: content.image_alt || data.hero.imageAlt,
        };
      }
      if (section.section_key === "cta") {
        data.bottomCTA = {
          ...data.bottomCTA,
          heading: section.title || data.bottomCTA.heading,
          description: section.subtitle || data.bottomCTA.description,
          buttonLabel: content.button_text || content.cta_primary_text || data.bottomCTA.buttonLabel,
          buttonLink: content.button_url || content.cta_primary_url || data.bottomCTA.buttonLink,
          leftImage: content.left_image_url || data.bottomCTA.leftImage,
          rightImage: content.right_image_url || data.bottomCTA.rightImage,
        };
      }
    });
  }

  async function loadContactPageData() {
    const data = JSON.parse(JSON.stringify(fallback));
    const [settings, sections, courses] = await Promise.all([
      apiGet("/contact-settings"),
      apiGet("/pages/contact/sections"),
      apiGet("/courses"),
    ]);

    if (settings) {
      const location = data.getInTouch.items.find((item) => item.title === "Our Location");
      const phone = data.getInTouch.items.find((item) => item.title === "Call Us");
      const email = data.getInTouch.items.find((item) => item.title === "Email Us");
      if (location && settings.contact_address) location.description = settings.contact_address;
      if (phone && settings.contact_phone) phone.phone = settings.contact_phone;
      if (phone && settings.contact_whatsapp) {
        phone.whatsappLink = `https://wa.me/${String(settings.contact_whatsapp).replace(/\D/g, "")}?text=Hello%20EEPL%20Classroom`;
      }
      if (email && settings.contact_email) email.email = settings.contact_email;
      if (settings.contact_map_url) data.getInTouch.mapEmbed.mapUrl = settings.contact_map_url;
    }

    applySections(data, sections);

    if (Array.isArray(courses) && courses.length) {
      const field = data.inquiryForm.fields.find((item) => item.name === "interestedIn");
      if (field) {
        field.options = [
          { value: "", label: "Select Category / Course" },
          ...courses.map((course) => ({ value: course.slug || String(course.id), label: course.title })),
          { value: "other", label: "Other" },
        ];
      }
    }

    return data;
  }

  window._contactPageDataPromise = loadContactPageData();
})();
