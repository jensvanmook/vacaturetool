const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// 👤 JOUW PROFIEL
const profile = {
  rollen: [
    "Product Owner",
    "Product Manager",
    "Digital Consultant",
    "Digital Strategist"
  ],

  uitsluiten: [
    "government",
    "governmental",
    "public sector",
    "municipality",
    "province",
    "overheid",
    "gemeente",
    "provincie"
  ]
};

// ======================================================
// 🌐 REMOTIVE
// ======================================================
async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();

  console.log("🔵 Remotive raw:", data.jobs?.length);

  return (data.jobs || []).map(job => ({
    title: job.title || "",
    company: job.company_name || "",
    location: job.candidate_required_location || "",
    description: job.description || "",
    url: job.url || "",
    source: "remotive"
  }));
}

// ======================================================
// 🌐 ARBEITNOW
// ======================================================
async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  const data = await res.json();

  console.log("🟢 Arbeitnow raw:", data.data?.length);

  return (data.data || []).map(job => ({
    title: job.title || "",
    company: job.company_name || "",
    location: job.location || "",
    description: job.description || "",
    url: job.url || "",
    source: "arbeitnow"
  }));
}

// ======================================================
// 🌍 HARD NEDERLAND FILTER
// ======================================================
function isNL(job) {
  const text = (
    job.title +
    job.description +
    job.location
  ).toLowerCase();

  return (
    text.includes("netherlands") ||
    text.includes("nederland") ||
    text.includes("nl") ||
    text.includes("amsterdam") ||
    text.includes("rotterdam") ||
    text.includes("utrecht") ||
    text.includes("eindhoven") ||
    text.includes("den haag") ||
    text.includes("remote") // remote mag blijven
  );
}

// ======================================================
// ❌ EXCLUSION FILTER
// ======================================================
function isExcluded(job) {
  const text = (job.title + job.description).toLowerCase();

  return profile.uitsluiten.some(word =>
    text.includes(word.toLowerCase())
  );
}

// ======================================================
// 🧠 SCORING
// ======================================================
function scoreJob(job) {
  const text = (job.title + job.description).toLowerCase();

  let score = 20;
  let reasons = [];

  for (const role of profile.rollen) {
    if (text.includes(role.toLowerCase())) {
      score += 50;
      reasons.push("Role match: " + role);
    }
  }

  if (
    text.includes("product") ||
    text.includes("manager") ||
    text.includes("consultant") ||
    text.includes("strategy")
  ) {
    score += 20;
    reasons.push("Strategic role");
  }

  if (job.location?.toLowerCase().includes("remote")) {
    score += 10;
    reasons.push("Remote");
  }

  return {
    ...job,
    score,
    reason: reasons.join(" + ") || "General match"
  };
}

// ======================================================
// 🧹 DEDUPE
// ======================================================
function dedupe(jobs) {
  const seen = new Set();

  return jobs.filter(j => {
    const key = (j.title + j.company).toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// ======================================================
// 🚀 MAIN
// ======================================================
async function run() {
  console.log("🚀 NL PERSONAL JOB ENGINE START");

  const [remotive, arbeitnow] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow()
  ]);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 RAW:", jobs.length);

  // 🌍 FILTER 1: NEDERLAND ONLY
  jobs = jobs.filter(isNL);

  console.log("🌍 AFTER NL FILTER:", jobs.length);

  // ❌ FILTER 2: EXCLUSIONS
  jobs = jobs.filter(j => !isExcluded(j));

  console.log("❌ AFTER EXCLUSION FILTER:", jobs.length);

  // 🧠 SCORE
  jobs = jobs.map(scoreJob);

  // 🧹 CLEAN
  jobs = dedupe(jobs);

  // 📊 SORT
  jobs.sort((a, b) => b.score - a.score);

  console.log("🏁 FINAL:", jobs.length);
  console.log("🔥 TOP 3:", jobs.slice(0, 3));

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("💾 WRITTEN NL FILTERED JOBS");
}

run();