const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// 🌐 REMOTIVE
async function fetchRemotive() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs");
    const data = await res.json();

    console.log("🔵 Remotive raw jobs:", data.jobs?.length);

    return (data.jobs || []).map(job => ({
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      description: job.description || "",
      source: "remotive"
    }));
  } catch (err) {
    console.log("❌ Remotive error:", err.message);
    return [];
  }
}

// 🌐 ARBEITNOW
async function fetchArbeitnow() {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    const data = await res.json();

    console.log("🟢 Arbeitnow raw jobs:", data.data?.length);

    return (data.data || []).map(job => ({
      title: job.title || "",
      company: job.company_name || "Unknown",
      location: job.location || "Remote",
      description: job.description || "",
      source: "arbeitnow"
    }));
  } catch (err) {
    console.log("❌ Arbeitnow error:", err.message);
    return [];
  }
}

// 🧠 SCORING (MINIMAAL - GEEN FILTER RISICO)
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 10;
  let reasons = [];

  if (text.includes("developer")) {
    score += 10;
    reasons.push("Dev role");
  }

  if (text.includes("frontend") || text.includes("react")) {
    score += 20;
    reasons.push("Frontend");
  }

  if (job.location?.toLowerCase().includes("remote")) {
    score += 10;
    reasons.push("Remote");
  }

  return {
    ...job,
    score,
    reason: reasons.join(" + ") || "General"
  };
}

// 🧹 DEDUPE
function dedupe(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = (job.title + job.company).toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function run() {
  console.log("🚀 START SCRAPER");

  const remotive = await fetchRemotive();
  const arbeitnow = await fetchArbeitnow();

  console.log("📦 Remotive:", remotive.length);
  console.log("📦 Arbeitnow:", arbeitnow.length);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 TOTAL MERGED:", jobs.length);

  jobs = jobs.filter(j => j.title && j.company);

  jobs = jobs.map(scoreJob);

  jobs = dedupe(jobs);

  jobs.sort((a, b) => b.score - a.score);

  console.log("🏁 FINAL AFTER PROCESSING:", jobs.length);

  console.log("🔥 TOP SAMPLE:", jobs.slice(0, 3));

  // ensure folder
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("💾 WRITTEN TO JSON");
}

run();