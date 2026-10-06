import { setupBackend } from "./backend.mjs";
import "./style.css";
import model from "../models/model.json";
import { matchResume, skills } from "./ml.mjs";
import { $, escape, shell, metric, download } from "./ui.mjs";
shell({
  name: "ResumeLens",
  logo: "rl",
  tag: "CAREER INTELLIGENCE / NLP",
  title: "Make the fit visible.<br><em>Keep the story true.</em>",
  subtitle:
    "Compare a resume with a role, inspect skill coverage, and find the gaps worth addressing. Lexical evidence, not a mysterious ATS verdict.",
  number: "02",
  theme: "resume-theme",
});
const resume = `Computer Science student with Python, SQL, JavaScript and Git experience. Built a machine learning project using Pandas, NumPy and scikit-learn. Deployed a React frontend and FastAPI REST API. Wrote unit tests and documented project decisions. Comfortable with data visualization, algorithms and data structures.`;
const job = `Data Science Intern\nRequired: Python, SQL, Pandas, NumPy, scikit-learn, statistics, machine learning and data visualization. Build clean data pipelines, evaluate models, write unit tests and communicate results. Familiarity with Docker, AWS, Git and CI/CD is preferred. Strong communication and documentation skills.`;
$("#content").innerHTML =
  `<div class="notice"><strong>No invented credentials.</strong> Scores compare wording and listed skills, not hiring outcomes. Use gaps to improve truthful evidence; don't add skills you can't demonstrate. Browser mode stays local; server mode sends texts to this app backend for inference. Saving summaries is opt-in; raw texts are not stored.</div><div class="workspace"><section class="panel panel-pad"><div class="panel-head"><h2>Two documents. One view.</h2><button id="sample" class="secondary">Load sample</button></div><label for="resume">Your resume / plain text</label><textarea id="resume" maxlength="20000" placeholder="Paste skills, projects, experience and education…"></textarea><div style="height:18px"></div><label for="job">The job description</label><textarea id="job" maxlength="20000" placeholder="Paste responsibilities, required skills and preferred qualifications…"></textarea><div class="form-bottom"><button id="clear" class="secondary">Clear both</button><button id="analyze">Compare alignment ↗</button></div><div id="error" class="error" role="alert"></div></section><section class="panel" id="result" aria-live="polite"><div class="empty"><span class="empty-symbol">≍</span><h2>Match evidence, not buzzwords.</h2><p>Start with two texts. We'll separate keyword similarity from actual listed-skill coverage.</p></div></section></div><section class="method"><h3>HOW IT WORKS</h3><p>Frozen TF-IDF weights from ${model.corpus_rows} real legitimate EMSCAD job descriptions (2012–2014), exact-text deduplicated, with unigram and bigram features and cosine similarity. A separate ${Object.keys(skills).length}-skill alias dictionary produces coverage. No supervised labels, embedding API or invented accuracy metric. Negated skills, language variants and unfamiliar roles need human review.</p></section>`;
const backend = setupBackend();
$("#sample").onclick = () => {
  $("#resume").value = resume;
  $("#job").value = job;
};
$("#clear").onclick = () => {
  backend.clearSave();
  $("#resume").value = "";
  $("#job").value = "";
  $("#error").textContent = "";
  $("#result").innerHTML =
    '<div class="empty"><h2>Fresh comparison.</h2><p>Both documents and previous results have been cleared.</p></div>';
};
$("#analyze").onclick = async () => {
  const r = $("#resume").value.trim(),
    j = $("#job").value.trim();
  if (r.length < 40 || j.length < 40) {
    $("#error").textContent = "Add at least 40 characters to each document.";
    return;
  }
  let out;
  $("#analyze").disabled = true;
  try {
    out =
      (await backend.analyze({ resume: r, job: j })) ||
      matchResume(r, j, model);
  } catch (e) {
    $("#error").textContent = e.message;
    return;
  } finally {
    $("#analyze").disabled = false;
  }
  if (!out.recognizedResume || !out.recognizedJob) {
    $("#error").textContent =
      "Not enough supported English vocabulary. Try a technical role description with explicit skills.";
    return;
  }
  $("#error").textContent = "";
  const s = Math.round(out.similarity * 100),
    c = out.coverage === null ? "N/A" : Math.round(out.coverage * 100) + "%";
  $("#result").innerHTML =
    `<div class="results-head"><div><span class="eyebrow">LEXICAL ALIGNMENT</span><h2>${s >= 65 ? "Strong wording overlap" : s >= 35 ? "Some common ground" : "Room to show the fit"}</h2></div><div class="score">${s}%<small>TF-IDF cosine similarity</small></div></div><div class="result-body"><div class="metric-grid">${metric("Skill coverage", c, "Recognized JD skills in resume")}${metric("Matched", out.matched.length, "Dictionary skills in both")}${metric("Not evidenced", out.missing.length, "Listed only in the JD")}</div><h3>Evidence already present</h3><div>${out.matched.map((s) => `<span class="tag">${escape(s)}</span>`).join("") || '<p class="small">No shared dictionary skills found.</p>'}</div><div class="rule"></div><h3>Skills not found in your text</h3><div>${out.missing.map((s) => `<span class="tag missing">${escape(s)}</span>`).join("") || '<p class="small">Every recognized JD skill appears in your resume text.</p>'}</div><p class="small">Mention detection only. A phrase such as "no Docker experience" still mentions Docker. Required and preferred skills are not separated.</p><div class="rule"></div><h3>Missing high-weight role terms</h3><div>${out.keywords.map((s) => `<span class="tag missing">${escape(s)}</span>`).join("") || '<p class="small">No missing vocabulary features.</p>'}</div><div class="model-card"><strong>What to do with this</strong><p>For skills you actually have, add a concrete project, result or link. For skills you don't, build evidence first. Repeating keywords can raise similarity without improving your qualifications.</p></div><div class="result-foot"><span class="small">Not an ATS score or interview probability.</span><button id="export" class="secondary">Export analysis ↓</button></div></div>`;
  $("#export").onclick = () =>
    download("resume-lens-analysis.json", {
      ...out,
      disclaimer:
        "Lexical similarity and dictionary coverage, not an ATS or hiring probability. No raw input included.",
    });
};

for (const id of ["resume", "job"])
  $("#" + id).addEventListener("input", () => {
    $("#result").innerHTML =
      '<div class="empty"><h2>Documents changed.</h2><p>Compare again to compute fresh alignment.</p></div>';
  });

// Comparison workspace: two documents above a full-width evidence board.
const editor = document.querySelector(".workspace > .panel-pad");
const documents = document.createElement("div");
documents.className = "document-columns";
for (const id of ["resume", "job"]) {
  const column = document.createElement("section");
  column.className = "document-column";
  column.append(
    document.querySelector('label[for="' + id + '"]'),
    document.getElementById(id),
  );
  documents.append(column);
}
editor.querySelector('[style="height:18px"]')?.remove();
editor.querySelector('[style="height: 18px"]')?.remove();
editor.querySelector(".panel-head").after(documents);

document.body.classList.add("comparison-layout");
