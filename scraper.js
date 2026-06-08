const fs = require("fs");

const DATA_FILE = "./data/vacatures.json";

// 🔥 1. echte API (Remotive - gratis)
async function fetchVacatures() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();

  return data.jobs.slice(0, 10).map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location,
    url: job.url,
    description: job.description
  }));
}

// 🧠 simpele AI scoring
function scoreJob(job) {
  let score = 0;

  const text = (job.title + job.description).toLowerCase();

  if (text.includes("frontend")) score += 40;
  if (text.includes("backend")) score += 30;
  if (text.includes("react")) score += 30;
  if (text.includes("javascript")) score += 20;
  if (job.location.toLowerCase().includes("remote")) score += 20;

  let reasons = [];

  if (text.includes("frontend")) reasons.push("Frontend match");
  if (text.includes("backend")) reasons.push("Backend match");
  if (text.includes("react")) reasons.push("React skill");
  if (job.location.toLowerCase().includes("remote")) reasons.push("Remote");

  return {
    ...job,
    score,
    reason: reasons.join(" + ") || "General match"
  };
}

async function run() {
  try {
    const jobs = await fetchVacatures();

    const processed = jobs
      .map(scoreJob)
      .sort((a, b) => b.score - a.score);

    fs.writeFileSync(DATA_FILE, JSON.stringify(processed, null, 2));

    console.log("✅ Live vacatures updated:", processed.length);
  } catch (err) {
    console.error("❌ Scraper error:", err);
  }
}

run();