import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  renderLearningConnections,
  validateLearningTopology,
} from "./render-learning-connections.mjs";
import { renderGradeRegister } from "./render-grade-register.mjs";
const model = JSON.parse(
  fs.readFileSync(
    new URL("../evals/fixtures/learning-system/learning.json", import.meta.url),
  ),
);
const topology = {
  schemaVersion: 1,
  sourceHref: "evidence/wiring.json",
  edges: [
    {
      id: "corrections",
      from: "quality_review",
      to: "account_memory",
      channel: "corrections",
      label: "Corrections",
      state: "declared",
      description: "Review supplies corrections.",
      missing: "No retained handoff.",
      nextProof: "Join producer and consumer.",
      evidence: ["Synthetic declaration."],
    },
  ],
};
const grade = {
  observedOn: "2026-09-25",
  components: [
    {
      id: "delivery",
      name: "Delivery",
      grade: null,
      status: "incomplete",
      previous: { grade: "B", observedOn: "2026-09-20" },
      rationale: "Review breadth incomplete.",
      nextProof: "Complete required review.",
      requirements: ["Read remaining source families."],
      sourceHref: "evidence/grade.json",
    },
  ],
};
test("connected renderer keeps source snapshot immutable, all records and dates available", () => {
  const before = JSON.stringify(model),
    h = renderLearningConnections(model, topology);
  assert.equal(JSON.stringify(model), before);
  for (const l of model.loops) {
    assert(h.includes('id="learning-system-record-' + l.id + '"'));
    assert(h.includes(l.name));
  }
  assert(h.includes("data-learning-topology"));
  assert(h.includes("corrections"));
  assert(h.includes("2026-09-25"));
});
test("unknown, self and duplicate handoff identities are refused", () => {
  for (const edges of [
    [{ ...topology.edges[0], to: "missing" }],
    [{ ...topology.edges[0], to: "quality_review" }],
    [topology.edges[0], topology.edges[0]],
  ])
    assert.throws(() =>
      validateLearningTopology(model, { ...topology, edges }),
    );
});
test("witnessed handoffs need joined evidence rather than a state label", () => {
  const e = { ...topology.edges[0], state: "observed" };
  assert.throws(
    () => validateLearningTopology(model, { ...topology, edges: [e] }),
    /witness|Observed/,
  );
  e.witness = {
    producer: "run-1",
    payload: "artifact-2",
    consumer: "run-3",
    observedOn: "2026-09-25",
    scope: "synthetic staging",
  };
  assert.doesNotThrow(() =>
    validateLearningTopology(model, { ...topology, edges: [e] }),
  );
});
test("unobserved handoffs and absent topology do not become invented closure", () => {
  assert.doesNotThrow(() =>
    validateLearningTopology(model, { ...topology, edges: [] }),
  );
  assert.throws(() => validateLearningTopology(model, null));
  assert.throws(() =>
    validateLearningTopology(model, {
      ...topology,
      edges: [{ ...topology.edges[0], state: "enabled" }],
    }),
  );
});
test("feedback return is independent from four-stage closure", () => {
  assert.throws(
    () =>
      validateLearningTopology(model, {
        ...topology,
        returns: [
          {
            loopId: "account_memory",
            state: "observed",
            note: "One chain exists.",
            sourceHref: "evidence/return.json",
          },
        ],
      }),
    /return/,
  );
  assert.doesNotThrow(() =>
    validateLearningTopology(model, {
      ...topology,
      returns: [
        {
          loopId: "account_memory",
          state: "unproved",
          note: "Repeated return not joined.",
          sourceHref: "evidence/return.json",
        },
      ],
    }),
  );
});
test("unsafe evidence and invalid layout do not reach generated output", () => {
  assert.throws(() =>
    renderLearningConnections(model, {
      ...topology,
      sourceHref: "javascript:alert(1)",
    }),
  );
  assert.throws(() =>
    validateLearningTopology(model, {
      ...topology,
      layout: { unknown: { x: 0, y: 0, z: 0 } },
    }),
  );
  assert.throws(() =>
    validateLearningTopology(model, {
      ...topology,
      layout: { account_memory: { x: 2, y: 0, z: 0 } },
    }),
  );
});
test("empty inventory remains a readable no-JavaScript artifact", () => {
  const m = { ...model, loops: [], closedCount: 0, declaredCount: 0 };
  const h = renderLearningConnections(m, { ...topology, edges: [] });
  assert(h.includes("0</strong> declared loops"));
  assert(h.includes("No cross-loop handoffs were recorded"));
});
test("incomplete grade cannot borrow an earlier letter as current", () => {
  const h = renderGradeRegister(grade);
  assert(h.includes("Incomplete"));
  assert(h.includes("Last") || h.includes("2026-09-20"));
  assert.throws(
    () =>
      renderGradeRegister({
        ...grade,
        components: [{ ...grade.components[0], grade: "B" }],
      }),
    /current grade/,
  );
});
test("grade freshness requires dates, evidence and explicit review status", () => {
  assert.throws(
    () =>
      renderGradeRegister({
        ...grade,
        components: [
          { ...grade.components[0], status: "assessed", grade: "A" },
        ],
      }),
    /date/,
  );
  assert.throws(
    () =>
      renderGradeRegister({
        ...grade,
        components: [{ ...grade.components[0], previous: { grade: "B" } }],
      }),
    /dated/,
  );
  assert.throws(() =>
    renderGradeRegister({
      ...grade,
      components: [
        { ...grade.components[0], sourceHref: "javascript:alert(1)" },
      ],
    }),
  );
});
test("rendered copy is escaped and never reinterpreted as markup", () => {
  const h = renderGradeRegister({
    ...grade,
    components: [{ ...grade.components[0], name: "<script>bad</script>" }],
  });
  assert(!h.includes("<script>bad"));
  assert(h.includes("&lt;script&gt;bad"));
});
test('witness dates and duplicate returns cannot silently contradict the evidence',()=>{
 const witness={producer:'run-1',payload:'artifact-2',consumer:'run-3',observedOn:'not-a-date',scope:'synthetic'};
 assert.throws(()=>validateLearningTopology(model,{...topology,edges:[{...topology.edges[0],state:'observed',witness}]}),/date/);
 const r={loopId:'account_memory',state:'unproved',note:'Return not joined.',sourceHref:'evidence/return.json'};
 assert.throws(()=>validateLearningTopology(model,{...topology,returns:[r,r]}),/Unique/);
 const witnessed={...r,state:'observed',witness:{laterOutcome:'outcome-1',nextSignal:'signal-2',observedOn:'2026-09-25',scope:'synthetic'}};
 const h=renderLearningConnections(model,{...topology,returns:[witnessed]});
 assert(h.includes('outcome-1 · signal-2 · 2026-09-25 · synthetic'));
 assert(h.includes('Next proof: Join producer and consumer.'));
});
