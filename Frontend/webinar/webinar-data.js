const webinarPageData = {
  upcoming: [
    {
      theme: "java",
      title: "Master Java Interview Preparation",
      date: "15 June 2026",
      time: "7:00 PM - 8:30 PM",
      speaker: "Rahul Sharma",
      seats: "200 Seats Left",
    },
    {
      theme: "analytics",
      title: "AI & Data Analytics Career Roadmap 2026",
      date: "17 June 2026",
      time: "7:00 PM - 8:30 PM",
      speaker: "Neha Agarwal",
      seats: "300 Seats Left",
    },
    {
      theme: "english",
      title: "Spoken English Masterclass",
      date: "19 June 2026",
      time: "6:00 PM - 7:30 PM",
      speaker: "Anjali Mehta",
      seats: "200 Seats Left",
    },
    {
      theme: "jee",
      title: "JEE Main 2026 Strategy & Roadmap",
      date: "21 June 2026",
      time: "7:00 PM - 8:30 PM",
      speaker: "Vikas Singh",
      seats: "280 Seats Left",
    },
  ],
  stats: [
    { icon: "monitor", value: "500+", label: "Webinars Conducted" },
    { icon: "students", value: "25,000+", label: "Students Attended" },
    { icon: "trainer", value: "100+", label: "Expert Trainers" },
    { icon: "star", value: "4.8", label: "Average Rating" },
  ],
  recordings: [
    {
      theme: "bootcamp",
      title: "Java Full Stack Bootcamp",
      date: "Recorded on 10 May 2026",
    },
    {
      theme: "spoken",
      title: "Spoken English Masterclass",
      date: "Recorded on 05 May 2026",
    },
    {
      theme: "strategy",
      title: "JEE Main 2026 Strategy",
      date: "Recorded on 28 Apr 2026",
    },
    {
      theme: "career",
      title: "Career Guidance Webinar",
      date: "Recorded on 22 Apr 2026",
    },
  ],
  testimonials: [
    {
      avatar: "male",
      quote: "\"The Java webinar helped me crack my first interview.\"",
      name: "Aman Gupta",
      role: "Software Developer",
    },
    {
      avatar: "female",
      quote: "\"The Spoken English sessions boosted my confidence tremendously.\"",
      name: "Priya Sharma",
      role: "Student",
    },
    {
      avatar: "male-alt",
      quote: "\"Very informative session on JEE strategy. Highly recommended.\"",
      name: "Rohit Verma",
      role: "JEE Aspirant",
    },
  ],
  faqs: [
    {
      question: "Do webinars provide certificates?",
      answer: "Selected premium and workshop-based webinars include participation certificates. Certificate availability is mentioned on each webinar card.",
    },
    {
      question: "Can I watch recordings later?",
      answer: "Yes. Registered learners can watch available recordings later and access session notes from the recordings section.",
    },
    {
      question: "Are webinars free?",
      answer: "Many EEPL webinars are free. Some advanced career workshops may have a limited registration fee.",
    },
    {
      question: "How do I join a webinar?",
      answer: "Click Register Now, complete the basic registration step, and join using the session link shared before the webinar starts.",
    },
  ],
};

(function () {
  const fallback = JSON.parse(JSON.stringify(webinarPageData));
  const apiGet = (path) => window.eeplApiGet ? window.eeplApiGet(path) : Promise.resolve(null);

  function pickTheme(value, index) {
    const text = String(value || "").toLowerCase();
    if (text.includes("java")) return "java";
    if (text.includes("data") || text.includes("analytics") || text.includes("ai")) return "analytics";
    if (text.includes("english")) return "english";
    if (text.includes("jee") || text.includes("neet")) return "jee";
    return ["java", "analytics", "english", "jee"][index % 4];
  }

  function formatDate(value) {
    if (!value) return "Date to be announced";
    const date = new Date(value.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  }

  function formatTime(startValue, endValue) {
    const start = startValue ? new Date(startValue.replace(" ", "T")) : null;
    const end = endValue ? new Date(endValue.replace(" ", "T")) : null;
    if (!start || Number.isNaN(start.getTime())) return "Time to be announced";
    const options = { hour: "numeric", minute: "2-digit", hour12: true };
    const startText = start.toLocaleTimeString("en-IN", options);
    const endText = end && !Number.isNaN(end.getTime()) ? end.toLocaleTimeString("en-IN", options) : "";
    return endText ? `${startText} - ${endText}` : startText;
  }

  function assetUrl(value) {
    return window.eeplResolveAsset ? window.eeplResolveAsset(value) : value;
  }

  async function loadWebinarPageData() {
    const data = JSON.parse(JSON.stringify(fallback));
    const [upcoming, recordings, testimonials, faqs] = await Promise.all([
      apiGet("/webinars"),
      apiGet("/webinars/recordings"),
      apiGet("/home/testimonials"),
      apiGet("/faqs/webinar"),
    ]);

    if (Array.isArray(upcoming) && upcoming.length) {
      data.upcoming = upcoming.map((item, index) => ({
        id: item.id,
        theme: pickTheme(`${item.category} ${item.title}`, index),
        title: item.title,
        date: formatDate(item.starts_at),
        time: formatTime(item.starts_at, item.ends_at),
        speaker: item.speaker_name || "EEPL Faculty",
        image: assetUrl(item.banner_url || ""),
        speakerImage: assetUrl(item.speaker_image_url || ""),
        registrationEnabled: item.registration_enabled !== "0" && item.registration_enabled !== 0,
        seats: Number(item.seats_left || item.seats_limit)
          ? `${item.seats_left || item.seats_limit} Seats Left`
          : item.registration_enabled === "0" || item.registration_enabled === 0 ? "Registration Closed" : "Limited Seats",
      }));
    }

    if (Array.isArray(recordings) && recordings.length) {
      data.recordings = recordings.map((item, index) => ({
        theme: ["bootcamp", "spoken", "strategy", "career"][index % 4],
        title: item.title || item.webinar_title,
        date: item.recorded_at ? `Recorded on ${formatDate(item.recorded_at)}` : "Recorded Session",
        videoUrl: item.video_url,
      }));
    }

    if (Array.isArray(testimonials) && testimonials.length) {
      data.testimonials = testimonials.map((item, index) => ({
        avatar: ["male", "female", "male-alt"][index % 3],
        quote: `"${item.quote}"`,
        name: item.name,
        role: item.role || item.company_or_course || "Student",
      }));
    }

    if (Array.isArray(faqs) && faqs.length) {
      data.faqs = faqs.map((item) => ({
        question: item.question,
        answer: item.answer,
      }));
    }

    return data;
  }

  window._webinarPageDataPromise = loadWebinarPageData();
})();
