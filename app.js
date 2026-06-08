const container = document.getElementById("jobs");

async function loadJobs() {
  try {
    const res = await fetch("./data/vacatures.json");
    const jobs = await res.json();

    renderJobs(jobs);
  } catch (err) {
    console.error("Fout bij laden vacatures:", err);
  }
}

function renderJobs(jobs) {
  container.innerHTML = "";

  jobs
    .sort((a, b) => b.score - a.score)
    .forEach(job => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h2>${job.title}</h2>
        <p><strong>${job.company}</strong></p>
        <p>📍 ${job.location}</p>
        <p>⭐ Score: ${job.score}</p>
        <p>🧠 ${job.reason}</p>
      `;

      container.appendChild(card);
    });
}

loadJobs();