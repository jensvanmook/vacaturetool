const fs = require("fs");

// voorbeeld data (hier vervang je later met echte scraping)
let vacatures = [
  {
    title: "Frontend Developer",
    company: "Tech BV",
    location: "Remote",
    score: 85,
    reason: "React + Remote match"
  },
  {
    title: "Backend Developer",
    company: "DataCorp",
    location: "Utrecht",
    score: 70,
    reason: "Node.js match"
  }
];

// 🔥 hier zou je AI scoring / scraping logica komen
function enhanceJobs(jobs) {
  return jobs.map(job => ({
    ...job,
    score: job.score || Math.floor(Math.random() * 100),
    reason: job.reason || "Auto match"
  }));
}

vacatures = enhanceJobs(vacatures);

// 💾 opslaan naar JSON (BELANGRIJK)
fs.writeFileSync(
  "./data/vacatures.json",
  JSON.stringify(vacatures, null, 2)
);

console.log("Vacatures updated");