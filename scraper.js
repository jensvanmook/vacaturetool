// scraper.js
// 🇳🇱 NL ONLY JOB SCRAPER ENGINE (STRICT MODE)

console.log("🔥 SCRAPER VERSION: NL-ONLY-HARDLOCK-V1");
console.log("🚀 STARTING CLEAN JOB ENGINE");

// ----------------------------
// IMPORTS
// ----------------------------

const fs = require("fs");

// ----------------------------
// CONFIG
// ----------------------------

// ❌ EVERYTHING OUTSIDE NL IS BLOCKED
const BLOCKED = [
  "canada",
  "united states",
  "usa",
  "us",
  "latam",
  "brazil",
  "mexico",
  "argentina",
  "india",
  "israel",
  "americas",
  "europe",
  "germany",
  "france",
  "spain",
  "italy",
  "poland",
  "uk",
  "united kingdom",
  "remote",
  "worldwide"
];

// ----------------------------
// FETCH FUNCTIONS
// ----------------------------

async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();

  return data.jobs.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "",
    description: job.description,
    source: "remotive"
  }));
}

async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  const data = await res.json();

  return data.data.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.location || "",
    description: job.description,
    source: "arbeitnow"
  }));
}

// ----------------------------
// NL STRICT FILTER
// ----------------------------

function isNLOnly(job) {
  const loc = (job.location || "").toLowerCase();

  // ❌ HARD BLOCK EVERYTHING NON-NL
  if (BLOCKED.some(b => loc.includes(b))) {
    return false;
  }

  // ✅ MUST EXPLICITLY CONTAIN NETHERLANDS SIGNAL
  const isNL =
    loc.includes("netherlands") ||
    loc.includes("holland") ||
    loc.includes("nl") ||
    loc.includes("the netherlands");

  return isNL;
}

// ----------------------------
// DEDUPE
// ----------------------------

function dedupe(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = (job.title + job.company).toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}

// ----------------------------
// MAIN RUNNER
// ----------------------------

async function run() {
  const remotive = await fetchRemotive();
  const arbeitnow = await fetchArbeitnow();

  const raw = [...remotive, ...arbeitnow];

  console.log("📦 RAW:", raw.length);

  // FILTER
  const filtered = raw.filter(isNLOnly);

  console.log("🇳🇱 NL ONLY RESULT:", filtered.length);

  const final = dedupe(filtered);

  console.log("🏁 FINAL:", final.length);

  console.log("🔥 TOP 3:", final.slice(0, 3));

  // SAVE
  fs.writeFileSync(
    "./data/vacatures.json",
    JSON.stringify(final, null, 2)
  );

  console.log("💾 WRITTEN NL-ONLY RESULTS");
}

run();