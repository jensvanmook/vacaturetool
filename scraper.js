const fs = require("fs");
const path = require("path");

// 📁 safe output pad
const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// 🌐 1. VACATURES OPHALEN VAN INTERNET (ECHTE API)
async function fetchVacatures() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs");
    const data = await res.json();

    // 🔥 pak eerste 20 jobs
    return data.jobs.slice(0, 20).map(job => ({
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      description: job.description || "",
      url: job.url || "",
      source: "remotive"
    }));
  } catch (err) {
    console.error("❌ Error fetching API:", err);

    // fallback zodat pipeline nooit crasht
    return [];
  }
}

// 🧠 2. SIMPLE AI SCORING ENGINE
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 0;
  let reasons = [];

  if (text.includes("frontend")) {
    score += 40;
    reasons.push("Frontend match");
  }

  if (text.includes("backend")) {
    score += 30;
    reasons.push("Backend match");
  }

  if (text.includes("react")) {
    score += 25;
    reasons.push("React skill");
  }

  if (text.includes("javascript")) {
    score += 20;
    reasons.push("JavaScript skill");
  }

  if (text.includes("node")) {
    score += 20;
    reasons.push("Node.js skill");
  }

  if (job.location?.toLowerCase().includes("remote")) {
    score += 20;
    reasons.push("Remote mogelijk");
  }

  return {
    ...job,
    score,
    reason: reasons.length ? reasons.join(" + ") : "General match"
  };
}

// 🧹 3. OPTIONAL: DUPLICATES CLEANING
function removeDuplicates(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = job.title + job.company;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// 🚀 4. MAIN RUNNER
async function run() {
  console.log("🔄 Fetching jobs...");

  const jobs = await fetchVacatures();

  if (!jobs.length) {
    console.log("⚠️ No jobs found, stopping.");
    return;
  }

  console.log(`📦 Jobs fetched: ${jobs.length}`);

  const scored = jobs.map(scoreJob);

  const cleaned = removeDuplicates(scored);

  cleaned.sort((a, b) => b.score - a.score);

  // 📁 zorg dat folder bestaat
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 💾 schrijf JSON
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(cleaned, null, 2)
  );

  console.log("✅ Vacatures updated:", cleaned.length);
}

run();