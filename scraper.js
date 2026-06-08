console.log("🔥 SCRAPER VERSION: FINAL-NL-FILTER-V1");

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// 👤 PROFIEL (JOUW FOCUS)
const profile = {
  rollen: [
    "product owner",
    "product manager",
    "digital consultant",
    "digital strategist"
  ],

  uitsluiten: [
    "government",
    "municipality",
    "province",
    "overheid",
    "gemeente",
    "public sector"
  ],

  nlSignals: [
    "netherlands",
    "nederland",
    "amsterdam",
    "rotterdam",
    "utrecht",
    "eindhoven",
    "den haag",
    "nl"
  ]
};

// ======================================================
// 🌐 REMOTIVE
// ======================================================
async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();

  console.log("🔵 Remotive:", data.jobs?.length || 0);

  return (data.jobs || []).map(job => ({
    title: job.title || "",
    company: job.company_name || "",
    location: job.candidate_required_location || "Remote",
    description: job.description || "",
    source: "remotive"
  }));
}

// ======================================================
// 🌐 ARBEITNOW
// ======================================================
async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  const data = await res.json();

  console.log("🟢 Arbeitnow:", data.data?.length || 0);

  return (data.data || []).map(job => ({
    title: job.title || "",
    company: job.company_name || "Unknown",
    location: job.location || "",
    description: job.description || "",
    source: "arbeitnow"
  }));
}

// ======================================================
// 🔧 NORMALISATIE (BELANGRIJK)
// ======================================================
function normalize(job) {
  return {
    ...job,
    _text: (
      job.title +
      " " +
      job.description +
      " " +
      job.location
    ).toLowerCase()
  };
}

// ======================================================
// 🌍 FILTER: NL / RELEVANT
// ======================================================
function isAllowed(job) {
  const text = job._text;

  // ❌ EXCLUDE SECTORS
  if (profile.uitsluiten.some(x => text.includes(x))) {
    return false;
  }

  // ❌ HARD BLOCK USA/Canada signals
  const badRegions = [
    "united states",
    "usa",
    "canada",
    "toronto",
    "new york",
    "california",
    "texas"
  ];

  if (badRegions.some(x => text.includes(x))) {
    return false;
  }

  // ✔ NL / EU SIGNALS
  const nlMatch = profile.nlSignals.some(x => text.includes(x));

  const remoteOk = text.includes("remote") || text.includes("hybrid");

  return nlMatch || remoteOk;
}

// ======================================================
// 🧠 SCORING ENGINE
// ======================================================
function scoreJob(job) {
  const text = job._text;

  let score = 20;
  let reasons = [];

  // rol match
  for (const role of profile.rollen) {
    if (text.includes(role)) {
      score += 60;
      reasons.push("Role: " + role);
    }
  }

  // strategy/product boost
  if (
    text.includes("product") ||
    text.includes("strategy") ||
    text.includes("consultant") ||
    text.includes("owner")
  ) {
    score += 25;
    reasons.push("Strategic role");
  }

  // remote boost
  if (text.includes("remote")) {
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
  console.log("🚀 CLEAN PERSONAL JOB ENGINE START");

  const [remotive, arbeitnow] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow()
  ]);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 RAW:", jobs.length);

  // normalize
  jobs = jobs.map(normalize);

  // filter
  jobs = jobs.filter(isAllowed);

  console.log("🌍 AFTER FILTER:", jobs.length);

  // score
  jobs = jobs.map(scoreJob);

  // dedupe
  jobs = dedupe(jobs);

  // sort
  jobs.sort((a, b) => b.score - a.score);

  console.log("🏁 FINAL:", jobs.length);
  console.log("🔥 TOP 3:", jobs.slice(0, 3));

  // save
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("💾 WRITTEN CLEAN RESULTS");
}

run();