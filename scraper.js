const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "vacatures.json");

async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();

  console.log("🔵 REMOTIVE COUNT:", data.jobs?.length);

  return (data.jobs || []).map(j => ({
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location,
    description: j.description,
    source: "remotive"
  }));
}

async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  const data = await res.json();

  console.log("🟢 ARBEITNOW COUNT:", data.data?.length);

  return (data.data || []).map(j => ({
    title: j.title,
    company: j.company_name || "Unknown",
    location: j.location,
    description: j.description,
    source: "arbeitnow"
  }));
}

function score(job) {
  return {
    ...job,
    score: 1
  };
}

function dedupe(jobs) {
  const seen = new Set();

  return jobs.filter(j => {
    const key = (j.title + j.company).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function run() {
  console.log("🚀 SCRAPER START");

  const remotive = await fetchRemotive();
  const arbeitnow = await fetchArbeitnow();

  console.log("📦 REMOTIVE:", remotive.length);
  console.log("📦 ARBEITNOW:", arbeitnow.length);

  let jobs = [...remotive, ...arbeitnow];

  console.log("📦 MERGED:", jobs.length);

  jobs = dedupe(jobs);

  console.log("📦 AFTER DEDUPE:", jobs.length);

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));

  console.log("💾 WRITTEN OK");
}

run();