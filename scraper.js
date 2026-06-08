const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// ======================================================
// 🌐 1. REMOTIVE (GROOTSTE FREE SOURCE)
// ======================================================
async function fetchRemotive() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs");
    const data = await res.json();

    const jobs = data.jobs || [];

    console.log("🔵 Remotive jobs:", jobs.length);

    return jobs.map(job => ({
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      description: job.description || "",
      url: job.url || "",
      source: "remotive"
    }));
  } catch (err) {
    console.error("Remotive error:", err.message);
    return [];
  }
}

// ======================================================
// 🌐 2. ARBEITNOW (EU JOB BOARD)
// ======================================================
async function fetchArbeitnow() {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    const data = await res.json();

    const jobs = data.data || [];

    console.log("🟢 Arbeitnow jobs:", jobs.length);

    return jobs.map(job => ({
      title: job.title || "",
      company: job.company_name || "Unknown",
      location: job.location || "Remote",
      description: job.description || "",
      url: job.url || "",
      source: "arbeitnow"
    }));
  } catch (err) {
    console.error("Arbeitnow error:", err.message);
    return [];
  }
}

// ======================================================
// 🌐 3. REMOTIVE CATEGORY FILTERS (EXTRA VOLUMES)
// ======================================================
async function fetchRemotiveByCategory() {
  const categories = [
    "software-dev",
    "design",
    "marketing",
    "data",
    "devops"
  ];

  let all = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?category=${cat}`
      );

      const data = await res.json();

      console.log(`🟣 Remotive category ${cat}:`, data.jobs?.length || 0);

      all = all.concat(data.jobs || []);
    } catch (e) {
      console.log("Category error:", cat);
    }
  }

  return all.map(job => ({
    title: job.title || "",
    company: job.company_name || "",
    location: job.candidate_required_location || "Remote",
    description: job.description || "",
    url: job.url || "",
    source: "remotive-category"
  }));
}

// ======================================================
// 🧠 SCORE (LIGHT – NIET FILTEREN)
// ======================================================
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 10;
  let reasons = [];

  if (text.includes("frontend") || text.includes("react") || text.includes("vue")) {
    score += 25;
    reasons.push("Frontend");
  }

  if (text.includes("backend") || text.includes("node") || text.includes("api")) {
    score += 20;
    reasons.push("Backend");
  }

  if (text.includes("developer") || text.includes("engineer")) {
    score += 15;
    reasons.push("Dev role");
  }

  if (text.includes("javascript") || text.includes("typescript")) {
    score += 15;
    reasons.push("JS/TS");
  }

  if (job.location?.toLowerCase().includes("remote")) {
    score += 15;
    reasons.push("Remote");
  }

  return {
    ...job,
    score,
    reason: reasons.join(" + ") || "General job"
  };
}

// ======================================================
// 🧹 DEDUPE (OPTIMIZED)
// ======================================================
function dedupe(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = (job.title + job.company).toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// ======================================================
// 🚀 MAIN
// ======================================================
async function run() {
  console.log("🚀 START V4 SCRAPER (MULTI-SOURCE + CATEGORY EXPANSION)");

  const [remotive, arbeitnow, remotiveCats] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow(),
    fetchRemotiveByCategory()
  ]);

  let jobs = [
    ...remotive,
    ...arbeitnow,
    ...remotiveCats
  ];

  console.log("📦 TOTAL RAW JOBS:", jobs.length);

  jobs = jobs.filter(j => j.title && j.company);

  jobs = jobs.map(scoreJob);

  jobs = dedupe(jobs);

  jobs.sort((a, b) => b.score - a.score);

  console.log("🏁 FINAL JOB COUNT:", jobs.length);

  console.log("🔥 TOP 3:", jobs.slice(0, 3));

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("💾 WRITTEN SUCCESS");
}

run();