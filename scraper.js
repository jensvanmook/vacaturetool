const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

// 🌐 1. MULTI PAGE / GROTERE FETCH
async function fetchVacatures() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs");
    const data = await res.json();

    // 🔥 neem veel meer jobs (200 max)
    return data.jobs.slice(0, 200).map(job => ({
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      description: job.description || "",
      url: job.url || "",
      source: "remotive"
    }));
  } catch (err) {
    console.error("API error:", err);
    return [];
  }
}

// 🧠 2. BETERE AI SCORING (breder + slimmer)
function scoreJob(job) {
  const text = (job.title + " " + job.description).toLowerCase();

  let score = 0;
  let reasons = [];

  // frontend stack
  if (text.includes("frontend") || text.includes("react") || text.includes("vue")) {
    score += 40;
    reasons.push("Frontend stack");
  }

  // backend stack
  if (text.includes("backend") || text.includes("node") || text.includes("api")) {
    score += 30;
    reasons.push("Backend stack");
  }

  // javascript ecosystem
  if (text.includes("javascript") || text.includes("typescript")) {
    score += 25;
    reasons.push("JS/TS skill");
  }

  // remote boost
  if (job.location?.toLowerCase().includes("remote")) {
    score += 25;
    reasons.push("Remote friendly");
  }

  // senior boost
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

// 🧹 3. BETERE FILTER (niet alles weggooien)
function filterJobs(jobs) {
  return jobs.filter(job => {
    return job.title && job.company;
  });
}

// 🧹 4. DEDUPE
function removeDuplicates(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = job.title + job.company;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// 🚀 5. RUNNER
async function run() {
  console.log("🔄 Fetching jobs...");

  const jobs = await fetchVacatures();

  console.log("📦 Raw jobs:", jobs.length);

  const cleaned = filterJobs(jobs);
  const scored = cleaned.map(scoreJob);
  const deduped = removeDuplicates(scored);

  // 🔥 sort op best match
  deduped.sort((a, b) => b.score - a.score);

  // 📁 ensure folder
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(deduped, null, 2)
  );

  console.log("✅ Final jobs:", deduped.length);
}

run();