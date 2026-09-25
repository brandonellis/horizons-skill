import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  validateWorkLinks,
  renderWorkLinks,
  workSummary,
} from "./render-work-links.mjs";
import { renderLearningConnections } from "./render-learning-connections.mjs";
import { renderGradeRegister } from "./render-grade-register.mjs";
const read = (n) =>
  JSON.parse(
    fs.readFileSync(
      new URL("../evals/fixtures/action-clarity/" + n, import.meta.url),
    ),
  );
const work = read("work.json");
test("completed delivery and missing proof stay distinct without modifying observations", () => {
  const before = JSON.stringify(work),
    h = renderWorkLinks(work, { kind: "loop", id: "account_memory" });
  assert.match(h, /SYN-17/);
  assert.match(h, /Casey/);
  assert.match(h, /Done/);
  assert.match(h, /proof requirement remains separate/);
  assert.match(h, /Ticket not mapped in this review/);
  assert.match(h, /Retain a current producer/);
  assert.deepEqual(workSummary(work, "loop", "account_memory"), {
    actions: 2,
    open: 0,
    done: 1,
    unmapped: 1,
  });
  assert.equal(JSON.stringify(work), before);
});
test("prerequisite provenance and unassigned owner remain explicit", () => {
  const h = renderWorkLinks(work, { kind: "loop", id: "quality_review" });
  for (const text of [
    "SYN-18",
    "SYN-19",
    "Riley",
    "Unassigned",
    "Dependency stated in description",
    "Join the approved finding",
  ])
    assert(h.includes(text));
});
test("unmapped and absent tracker inputs make no fabricated ticket", () => {
  assert.match(
    renderWorkLinks(null, { kind: "loop", id: "x" }),
    /not been mapped/,
  );
  assert.match(
    renderWorkLinks(work, { kind: "loop", id: "x" }),
    /No action-to-ticket mapping/,
  );
});
test("unsafe links, unrecorded dependencies and fabricated status fail validation", () => {
  for (const edit of [
    (w) => (w.tickets[0].url = "javascript:alert(1)"),
    (w) => (w.actions[0].ticketIds = ["NEW-1"]),
    (w) => (w.actions[0].evidenceRefs = []),
    (w) => (w.actions[1].prerequisites[0].ticketId = "NEW-2"),
    (w) => (w.tickets[0].statusType = "verified"),
    (w) => (w.observedAt = "September 25, 2026"),
    (w) => (w.tickets[0].updatedAt = "2026-09-25"),
    (w) => (w.actions[0].evidenceRefs[0].href = "//attacker.test"),
  ]) {
    const w = structuredClone(work);
    edit(w);
    assert.throws(() => validateWorkLinks(w));
  }
});
test("untrusted tracker prose is escaped and canceled work does not count as delivered", () => {
  const w = structuredClone(work);
  w.tickets[0].title = "<img src=x onerror=alert(1)>";
  w.tickets[0].statusType = "canceled";
  assert(
    !renderWorkLinks(w, { kind: "loop", id: "account_memory" }).includes(
      "<img",
    ),
  );
  assert.equal(workSummary(w, "loop", "account_memory").done, 0);
});
test("grade and learning renderers share dated work without changing recorded grades", () => {
  const grades = read("grades.json"),
    model = read("learning.json"),
    topology = read("topology.json"),
    before = JSON.stringify({ grades, model, topology });
  const g = renderGradeRegister(grades, { work }),
    l = renderLearningConnections(model, topology, { work });
  assert.match(g, /SYN-17/);
  assert.match(g, /SYN-18/);
  assert.match(g, /fg-attention/);
  assert.match(l, /fl-work-records/);
  assert.match(l, /data-work-template="loop:account_memory"/);
  assert.equal(JSON.stringify({ grades, model, topology }), before);
});

test("grade consolidation removes exact repeated acceptance while retaining unmatched criteria", () => {
  const grades = read("grades.json"),
    w = structuredClone(work);
  const component = grades.components.find((c) => c.id === "runtime");
  w.actions[0].acceptance = component.requirements[0];
  const h = renderGradeRegister(grades, { work: w });
  const count = h.split(component.requirements[0]).length - 1;
  assert.equal(count, 1);
  for (const r of component.requirements.slice(1)) assert(h.includes(r));
});

test("text and print records retain work mapped only to a handoff or evaluation", () => {
  const w = structuredClone(work),
    model = read("learning.json"),
    topology = read("topology.json");
  w.actions[0].targets = [{ kind: "metric", id: model.metrics[0].id }];
  w.actions[1].targets = [{ kind: "edge", id: "corrections" }];
  const h = renderLearningConnections(model, topology, { work: w });
  const records = h.slice(
    h.indexOf('<details class="fl-work-records">'),
    h.indexOf("<template data-work-template"),
  );
  assert(records.includes("SYN-17"));
  assert(records.includes("SYN-18"));
  assert(records.includes("SYN-19"));
});
