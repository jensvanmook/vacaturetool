const fs = require("fs");
const path = require("path");

// zorg dat data folder altijd bestaat
const dataDir = path.join(__dirname, "data");
const filePath = path.join(dataDir, "vacatures.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// voorbeeld data
let vacatures = [
  {
    title: "Frontend Developer",
    company: "Tech BV",
    location: "Remote",
    description: "React developer"
  },
  {
    title: "Backend Developer",
    company: "DataCorp",
    location: "Utrecht",
    description: "Node.js API"
  }
];

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

const processed = vacatures.map(scoreJob);

processed.sort((a, b) => b.score - a.score);

fs.writeFileSync(
  filePath,
  JSON.stringify(processed, null, 2)
);

console.log("Vacatures updated:", processed.length);