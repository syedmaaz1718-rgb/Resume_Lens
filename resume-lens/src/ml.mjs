export function vectorize(text, model) {
  const stop = new Set(model.stopWords || []);
  const words = (text.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) || []).filter(
    (w) => !stop.has(w),
  );
  const counts = new Map();
  const tokens = [
    ...words,
    ...words.slice(0, -1).map((w, i) => w + " " + words[i + 1]),
  ];
  for (const word of tokens) {
    const i = model.vocabulary[word];
    if (i !== undefined) counts.set(i, (counts.get(i) || 0) + 1);
  }
  let norm = 0;
  const vector = new Map();
  for (const [i, n] of counts) {
    const value = (1 + Math.log(n)) * model.idf[i];
    vector.set(i, value);
    norm += value * value;
  }
  norm = Math.sqrt(norm);
  if (norm) for (const [i, v] of vector) vector.set(i, v / norm);
  return vector;
}
export function cosine(a, b) {
  let dot = 0;
  for (const [i, v] of a) dot += v * (b.get(i) || 0);
  return Math.max(0, Math.min(1, dot));
}
export const skills = {
  Python: ["python"],
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  Java: ["java"],
  "C++": ["c++", "cpp"],
  SQL: ["sql", "postgresql", "mysql", "sqlite"],
  React: ["react", "reactjs", "react.js"],
  "Node.js": ["node", "nodejs", "node.js"],
  FastAPI: ["fastapi"],
  Django: ["django"],
  HTML: ["html"],
  CSS: ["css"],
  Git: ["git", "github"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes", "k8s"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure"],
  Linux: ["linux"],
  Pandas: ["pandas"],
  NumPy: ["numpy"],
  "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
  TensorFlow: ["tensorflow"],
  PyTorch: ["pytorch"],
  "Machine learning": ["machine learning", "ml"],
  NLP: ["nlp", "natural language processing"],
  Statistics: ["statistics", "statistical"],
  Tableau: ["tableau"],
  "Power BI": ["power bi", "powerbi"],
  Excel: ["excel"],
  Testing: ["testing", "unit tests", "pytest", "jest"],
  "REST APIs": ["rest", "restful", "api", "apis"],
  "CI/CD": ["ci/cd", "continuous integration", "ci cd"],
  "Data structures": ["data structures", "dsa"],
  Algorithms: ["algorithms", "algorithm"],
  Communication: ["communication"],
  Figma: ["figma"],
  Flutter: ["flutter"],
  Kotlin: ["kotlin"],
  MongoDB: ["mongodb"],
  Redis: ["redis"],
};
export function extractSkills(text) {
  const lower = text.toLowerCase();
  return Object.entries(skills)
    .filter(([, aliases]) =>
      aliases.some((a) =>
        new RegExp(
          "(?:^|[^a-z0-9])" +
            a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
            "(?=$|[^a-z0-9])",
          "i",
        ).test(lower),
      ),
    )
    .map(([s]) => s);
}
export function matchResume(resume, job, model) {
  const r = extractSkills(resume),
    j = extractSkills(job),
    matched = j.filter((s) => r.includes(s)),
    missing = j.filter((s) => !r.includes(s));
  const rv = vectorize(resume, model),
    jv = vectorize(job, model);
  const sim = cosine(rv, jv);
  const reverse = Object.fromEntries(
    Object.entries(model.vocabulary).map(([k, v]) => [v, k]),
  );
  const keywords = [...jv]
    .filter(([i]) => !rv.has(i))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([i]) => reverse[i]);
  return {
    similarity: sim,
    coverage: j.length ? matched.length / j.length : null,
    matched,
    missing,
    resumeSkills: r,
    jobSkills: j,
    keywords,
    recognizedResume: rv.size,
    recognizedJob: jv.size,
  };
}
