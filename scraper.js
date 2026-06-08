const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// 🌐 SOURCE 1: REMOTIVE
async function fetchRemotive() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs");
    const data = await res.json();

    return (data.jobs || []).map(job => ({
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      description: job.description || "",
      url: job.url || "",
      source: "remotive"
    }));
  } catch (err) {
    console.error("❌ Remotive error:", err.message);
    return [];
  }
}

// 🌐 SOURCE 2: ARBEITNOW
async function fetchArbeitnow() {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    const data = await res.json();

    return (data.data || []).map(job => ({
      title: job.title || "",
      company: job.company_name || "Unknown",
      location: job.location || "Remote",
      description: job.description || "",
      url: job.url || "",
      source: "arbeitnow"
    }));
  } catch (err) {
    console.error("❌ Arbeitnow error:", err.message);
    return [];
  }
}

// 🧠 BETERE AI SCORING (BELANGRIJK: baseline score voorkomt dat alles verdwijnt)
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 15; // 🔥 baseline zodat bijna alles “meedoet”
  let reasons = [];

  if (text.includes("frontend") || text.includes("react") || text.includes("vue") || text.includes("ui")) {
    score += 30;
    reasons.push("Frontend/UI");
  }

  if (text.includes("backend") || text.includes("api") || text.includes("node") || text.includes("server")) {
    score += 25;
    reasons.push("Backend/API");
  }

  if (text.includes("javascript") || text.includes("typescript")) {
    score += 20;
    reasons.push("JS/TS");
  }

  if (text.includes("developer") || text.includes("engineer") || text.includes("software")) {
    score += 15;
    reasons.push("Developer role");
  }

  if (job.location?.toLowerCase().includes("remote")) {
    score += 20;
    reasons.push("Remote");
  }

  return {
    ...job,
    score,
    reason: reasons.length ? reasons.join(" + ") : "General dev job"
  };
}

// 🧹 DEDUPE (voorkomt dubbele jobs)
function dedupeJobs(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = (job.title + job.company).toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// 🧪 CLEANING (NIET TE AGRESSIEF)
function cleanJobs(jobs) {
  return jobs.filter(job => job.title && job.company);
}

// 🚀 MAIN RUNNER
async function run() {
  console.log("🔄 Starting multi-source job fetch...");

  const [remotive, arbeitnow] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow()
  ]);

  console.log("📦 Remotive jobs:", remotive.length);
  console.log("📦 Arbeitnow jobs:", arbeitnow.length);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 Combined jobs:", jobs.length);

  jobs = cleanJobs(jobs);

  jobs = jobs.map(scoreJob);

  jobs = dedupeJobs(jobs);

  jobs.sort((a, b) => b.score - a.score);

  // 📁 ensure folder exists
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("✅ FINAL JOBS:", jobs.length);
  console.log("🏆 TOP JOB:", jobs[0]?.title);
}

run();