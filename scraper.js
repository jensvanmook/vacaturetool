const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// ======================================================
// 👤 JOUW PROFIEL (PERSONALIZATION ENGINE)
// ======================================================
const profile = {
  naam: "Jens van Mook",
  locatie: "Oss",

  minimum_salaris: 4700,
  gewenst_salaris: 5500,

  rollen: [
    "Product Owner",
    "Product Manager",
    "Digital Consultant",
    "Digital Strategist"
  ],

  must_haves: [
    "hybride",
    "digitale omgeving",
    "eigenaarschap"
  ],

  uitsluiten: [
    "gemeente",
    "overheid",
    "provincie"
  ]
};

// ======================================================
// 🌐 1. REMOTIVE
// ======================================================
async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();

  console.log("🔵 Remotive:", data.jobs?.length);

  return (data.jobs || []).map(job => ({
    title: job.title || "",
    company: job.company_name || "",
    location: job.candidate_required_location || "Remote",
    description: job.description || "",
    url: job.url || "",
    salary: job.salary || null,
    source: "remotive"
  }));
}

// ======================================================
// 🌐 2. ARBEITNOW
// ======================================================
async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  const data = await res.json();

  console.log("🟢 Arbeitnow:", data.data?.length);

  return (data.data || []).map(job => ({
    title: job.title || "",
    company: job.company_name || "Unknown",
    location: job.location || "",
    description: job.description || "",
    url: job.url || "",
    salary: null,
    source: "arbeitnow"
  }));
}

// ======================================================
// 🧠 PERSONAL AI SCORING ENGINE
// ======================================================
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 20; // baseline (belangrijk!)

  let reasons = [];

  // ❌ EXCLUSION FILTER (hard penalty)
  for (const bad of profile.uitsluiten) {
    if (text.includes(bad)) {
      score -= 100;
      reasons.push("Excluded sector");
    }
  }

  // 🎯 ROLE MATCHING (BELANGRIJKSTE FACTOR)
  for (const role of profile.rollen) {
    const r = role.toLowerCase();
    if (text.includes(r)) {
      score += 60;
      reasons.push("Role match: " + role);
    }
  }

  // 🧠 STRATEGIC / PRODUCT KEYWORDS BOOST
  if (
    text.includes("product") ||
    text.includes("owner") ||
    text.includes("manager") ||
    text.includes("consultant") ||
    text.includes("strategy")
  ) {
    score += 25;
    reasons.push("Strategic role");
  }

  // 🏢 MUST HAVES
  for (const mh of profile.must_haves) {
    if (text.includes(mh)) {
      score += 20;
      reasons.push("Must-have: " + mh);
    }
  }

  // 📍 LOCATION MATCH (REGIO OSS / NL BOOST)
  if (
    job.location?.toLowerCase().includes("netherlands") ||
    job.location?.toLowerCase().includes("nl") ||
    job.location?.toLowerCase().includes("remote") ||
    job.location?.toLowerCase().includes("hybrid")
  ) {
    score += 15;
    reasons.push("Location match");
  }

  // 💰 SALARY CHECK (OPTIONEEL)
  if (job.salary) {
    const salaryText = job.salary.toString();
    if (salaryText.includes(profile.minimum_salaris)) {
      score += 30;
      reasons.push("Salary match");
    }
  }

  return {
    ...job,
    score,
    reason: reasons.length ? reasons.join(" + ") : "Low relevance"
  };
}

// ======================================================
// 🧹 DEDUPE
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
  console.log("🚀 PERSONAL JOB ENGINE STARTED");

  const [remotive, arbeitnow] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow()
  ]);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 TOTAL RAW:", jobs.length);

  jobs = jobs.filter(j => j.title && j.company);

  jobs = jobs.map(scoreJob);

  jobs = dedupe(jobs);

  jobs.sort((a, b) => b.score - a.score);

  console.log("🏁 FINAL JOBS:", jobs.length);
  console.log("🔥 TOP 3:");
  console.log(jobs.slice(0, 3));

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("💾 WRITTEN PERSONALIZED RESULTS");
}

run();