// scraper.js
// 🇳🇱 ZERO-LEAK NL ONLY ENGINE

console.log("🔥 NL ONLY SCRAPER - ZERO LEAK MODE");

const fs = require("fs");

// ----------------------------
// FETCHERS
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
// HARD NL FILTER (STRICT)
// ----------------------------

function isNLOnly(job) {
  const loc = (job.location || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // ONLY ACCEPT THESE EXACT NL SIGNALS
  return (
    loc === "netherlands" ||
    loc === "the netherlands" ||
    loc.includes("netherlands") ||
    loc.includes("holland") ||
    loc.includes("amsterdam") ||
    loc.includes("rotterdam") ||
    loc.includes("utrecht") ||
    loc.includes("eindhoven") ||
    loc.includes("den haag") ||
    loc.includes("netherlands, remote")
  );
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
// MAIN
// ----------------------------

async function run() {
  const remotive = await fetchRemotive();
  const arbeitnow = await fetchArbeitnow();

  const raw = [...remotive, ...arbeitnow];

  console.log("📦 RAW:", raw.length);

  const filtered = raw.filter(isNLOnly);

  console.log("🇳🇱 NL ONLY FINAL:", filtered.length);

  const final = dedupe(filtered);

  console.log("🏁 DEDUPED:", final.length);

  console.log("🔥 TOP 5:", final.slice(0, 5));

  fs.writeFileSync(
    "./data/vacatures.json",
    JSON.stringify(final, null, 2)
  );

  console.log("💾 SAVED CLEAN NL DATA");
}

run();