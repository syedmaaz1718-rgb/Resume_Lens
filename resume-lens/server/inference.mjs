import fs from "node:fs";
import { matchResume } from "../src/ml.mjs";
const model = JSON.parse(
  fs.readFileSync(new URL("../models/model.json", import.meta.url)),
);
export function infer(body) {
  for (const k of ["resume", "job"])
    if (
      typeof body?.[k] !== "string" ||
      body[k].trim().length < 40 ||
      body[k].length > 20000
    )
      throw Object.assign(
        Error("Both documents must contain40–20,000 characters."),
        { status: 400 },
      );
  const out = matchResume(body.resume.trim(), body.job.trim(), model);
  if (!out.recognizedResume || !out.recognizedJob)
    throw Object.assign(Error("Too little supported vocabulary."), {
      status: 400,
    });
  return {
    ...out,
    model: "Frozen TF-IDF cosine + skill aliases",
    disclaimer:
      "Lexical similarity, not ATS probability or qualification verification.",
  };
}
