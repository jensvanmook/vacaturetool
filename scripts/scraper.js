const fs = require("fs");

// 🔍 HIER KOMT LATER JE ECHTE SCRAPING BRON
async function fetchVacatures() {
  // nu nog mock data (later API / scraping)
  return [
    {
      title: "Frontend Developer",
      company: "Tech BV",
      location: "Remote",
      description: "React developer met ervaring in UI"
    },
    {
      title: "Backend Developer",
      company: "DataCorp",
      location: "Utrecht",
      description: "Node.js + databases"
    }
  ];
}

// 🧠 simpele AI scoring engine (basis versie)
function scoreJob(job) {
  let score = 0;

  if (job.title.toLowerCase().includes("frontend")) score += 40;
  if (job.title.toLowerCase().includes("backend")) score += 30;
  if (job.location.toLowerCase().includes("remote")) score += 30;

  let reason = [];

  if (job.title.toLowerCase().includes("frontend")) reason.push("Frontend match");
  if (job.title.toLowerCase().includes("backend")) reason.push("Backend match");
  if (job.location.toLowerCase().includes("remote")) reason.push("Remote mogelijk");

  return {
    ...job,
    score,
    reason: reason.join(" + ") || "Generic match"
  };
}

async function run() {
  const vacatures = await fetchVacatures();

  const processed = vacatures.map(scoreJob);

  // sorteer op best match
  processed.sort((a, b) => b.score - a.score);

  fs.writeFileSync(
    "./data/vacatures.json",
    JSON.stringify(processed, null, 2)
  );

  console.log("✅ Vacatures updated:", processed.length);
}

run();