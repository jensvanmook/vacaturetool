const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");


// 🌐 1. SOURCE 1: REMOTIVE (FREE)
async function fetchRemotive() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs");
    const data = await res.json();

    return data.jobs.slice(0, 100).map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location,
      description: job.description,
      url: job.url,
      source: "remotive"
    }));
  } catch (e) {
    console.error("Remotive error:", e);
    return [];
  }
}


// 🌐 2. SOURCE 2: ARBEITNOW (FREE API)
async function fetchArbeitnow() {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    const data = await res.json();

    return data.data.slice(0, 100).map(job => ({
      title: job.title,
      company: job.company_name || "Unknown",
      location: job.location || "Remote",
      description: job.description,
      url: job.url,
      source: "arbeitnow"
    }));
  } catch (e) {
    console.error("Arbeitnow error:", e);
    return [];
  }
}


// 🧠 3. AI SCORING ENGINE
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 0;
  let reasons = [];

  if (text.includes("frontend") || text.includes("react") || text.includes("vue")) {
    score += 40;
    reasons.push("Frontend match");
  }

  if (text.includes("backend") || text.includes("node") || text.includes("api")) {
    score += 35;
    reasons.push("Backend match");
  }

  if (text.includes("javascript") || text.includes("typescript")) {
    score += 25;
    reasons.push("JS/TS skill");
  }

  if (job.location?.toLowerCase().includes("remote")) {
    score += 25;
    reasons.push("Remote");
  }

  if (text.includes("senior")) {
    score += 10;
    reasons.push("Senior level");
  }

  return {
    ...job,
    score,
    reason: reasons.length ? reasons.join(" + ") : "General match"
  };
}


// 🧹 4. MERGE + DEDUPE
function mergeAndDeduplicate(allJobs) {
  const seen = new Set();

  return allJobs.filter(job => {
    const key = (job.title + job.company).toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}


// 🚀 5. MAIN RUN
async function run() {
  console.log("🔄 Fetching from multiple sources...");

  const [remotive, arbeitnow] = await Promise.all([
    fetchRemotive(),
    fetchArbeitnow()
  ]);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 Total raw jobs:", jobs.length);

  jobs = jobs.map(scoreJob);

  jobs = mergeAndDeduplicate(jobs);

  jobs.sort((a, b) => b.score - a.score);

  // 📁 ensure folder
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(jobs, null, 2)
  );

  console.log("✅ Final jobs after merge:", jobs.length);
}

run();