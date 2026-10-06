import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vectorize, cosine, matchResume, extractSkills } from "../src/ml.mjs";
const model = JSON.parse(
  fs.readFileSync(new URL("../models/model.json", import.meta.url)),
);
const f = JSON.parse(
  fs.readFileSync(new URL("./parity.json", import.meta.url)),
);
test("JS cosine matches sklearn to 1e-10", () =>
  assert.ok(
    Math.abs(
      cosine(vectorize(f.resume, model), vectorize(f.job, model)) - f.expected,
    ) < 1e-10,
  ));
test("identical documents have cosine 1", () =>
  assert.ok(
    Math.abs(
      cosine(vectorize(f.resume, model), vectorize(f.resume, model)) - 1,
    ) < 1e-10,
  ));
test("aliases and boundaries avoid JavaScript as Java", () => {
  const s = extractSkills(
    "JavaScript React.js C++ postgres SQL sklearn Node.js",
  );
  assert.ok(!s.includes("Java"));
  assert.ok(s.includes("C++"));
  assert.ok(s.includes("Scikit-learn"));
  assert.ok(s.includes("Node.js"));
});
test("missing skills and no-dictionary case", () => {
  const x = matchResume("python sql", "python docker aws", model);
  assert.deepEqual(x.missing, ["Docker", "AWS"]);
  assert.equal(matchResume("hello", "unicorn", model).coverage, null);
});
test("unknown vocabulary has zero cosine", () =>
  assert.equal(
    cosine(vectorize("unicornxyz", model), vectorize("python", model)),
    0,
  ));
