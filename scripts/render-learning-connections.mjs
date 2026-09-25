import {
  validateWorkLinks,
  renderWorkLinks,
  workSummary,
} from "./render-work-links.mjs";
import {
  renderLearningSystem,
  validateLearningSystem,
} from "./render-learning-system.mjs";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function safeLink(v) {
  if (
    typeof v !== "string" ||
    !v ||
    /[\s<>"'\\]/.test(v) ||
    /^(?:\/\/|\/)|(?:^|\/)\.\.(?:\/|$)/.test(v) ||
    (/^[a-z][a-z\d+.-]*:/i.test(v) && !/^https:\/\//i.test(v))
  )
    throw Error("Safe topology source required");
}
export function validateLearningTopology(model, topology) {
  validateLearningSystem(model);
  if (
    !topology ||
    topology.schemaVersion !== 1 ||
    !Array.isArray(topology.edges)
  )
    throw Error("Explicit topology required, including an empty edge array");
  safeLink(topology.sourceHref);
  const validDate = (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v + "T12:00:00Z")) &&
    new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
  const ids = new Set(model.loops.map((l) => l.id)),
    edges = new Set();
  for (const e of topology.edges) {
    if (!/^[a-z][a-z\d_-]*$/.test(e.id) || edges.has(e.id))
      throw Error("Unique handoff identities required");
    edges.add(e.id);
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to)
      throw Error("Handoff endpoints must identify distinct recorded loops");
    if (!["declared", "observed"].includes(e.state))
      throw Error("Separate declared and witnessed edges");
    for (const k of ["label", "channel", "description", "missing", "nextProof"])
      if (typeof e[k] !== "string" || !e[k].trim())
        throw Error("Recorded " + k + " required");
    if (
      !Array.isArray(e.evidence) ||
      !e.evidence.length ||
      e.evidence.some((x) => typeof x !== "string" || !x.trim())
    )
      throw Error("Handoff evidence required");
    if (
      e.state === "observed" &&
      (!e.witness ||
        !["producer", "payload", "consumer", "observedOn", "scope"].every(
          (k) => typeof e.witness[k] === "string" && e.witness[k].trim(),
        ))
    )
      throw Error(
        "Observed handoffs require producer, payload, consumer, date and scope",
      );
    if (e.state === "observed" && !validDate(e.witness.observedOn))
      throw Error("Valid handoff witness date required");
  }
  for (const [id, note] of Object.entries(topology.nodeNotes || {}))
    if (!ids.has(id) || typeof note !== "string" || !note.trim())
      throw Error("Node notes must identify recorded loops");
  for (const [id, p] of Object.entries(topology.layout || {}))
    if (
      !ids.has(id) ||
      !["x", "y", "z"].every((k) => Number.isFinite(p[k])) ||
      p.x < 0 ||
      p.x > 1 ||
      p.y < 0 ||
      p.y > 1
    )
      throw Error(
        "Layout must use recorded IDs and finite normalized coordinates",
      );
  const returnIds = new Set();
  for (const r of topology.returns || []) {
    if (returnIds.has(r.loopId))
      throw Error("Unique loop return records required");
    returnIds.add(r.loopId);
    if (
      !ids.has(r.loopId) ||
      !["unproved", "observed", "not-applicable"].includes(r.state) ||
      typeof r.note !== "string" ||
      !r.note.trim()
    )
      throw Error(
        "Explicit return state and source-backed explanation required",
      );
    safeLink(r.sourceHref);
    if (
      r.state === "observed" &&
      (!r.witness ||
        !["laterOutcome", "nextSignal", "observedOn", "scope"].every(
          (k) => typeof r.witness[k] === "string" && r.witness[k].trim(),
        ))
    )
      throw Error(
        "Observed return requires a linked later outcome and next signal",
      );
    if (r.state === "observed" && !validDate(r.witness.observedOn))
      throw Error("Valid return witness date required");
  }
  return topology;
}
function fragment(html, tag, needle) {
  const start = html.indexOf(needle);
  if (start < 0) return "";
  const from = html.lastIndexOf("<" + tag, start),
    end = html.indexOf(">", start) + 1;
  let depth = 1;
  for (const m of html
    .slice(end)
    .matchAll(new RegExp("</?" + tag + "\\b[^>]*>", "g"))) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(from, end + m.index + m[0].length);
  }
  throw Error("Unbalanced generated markup");
}
export function renderLearningConnections(
  model,
  topology,
  {
    id = "learning-system",
    headingId = id + "-heading",
    title = "How the system learns",
    work = null,
  } = {},
) {
  validateLearningTopology(model, topology);
  validateWorkLinks(work);
  const old = renderLearningSystem(model, { id, headingId, title }),
    name = (id) => model.loops.find((l) => l.id === id).name;
  const fallback = fragment(old, "div", 'class="ll-noscript"'),
    quality = fragment(old, "details", 'id="' + id + '-quality-bar"'),
    agents = fragment(old, "details", 'class="ll-agent-inventory"'),
    runs = fragment(old, "div", 'class="ll-runs"');
  const metrics = model.metrics
    .map(
      (m) =>
        `<details class="fl-metric"><summary><span>${esc(m.name)}</span><strong>${esc(m.value)}</strong><span>${esc(m.status)}</span></summary><div><p>${esc(m.detail)}</p><h4>Next proof</h4><p>${esc(m.nextProof)}</p><ul>${m.evidence.map((e) => "<li>" + esc(e) + "</li>").join("")}</ul>${work ? renderWorkLinks(work, { kind: "metric", id: m.id }) : ""}</div></details>`,
    )
    .join("");
  const buttons = topology.edges
    .map(
      (e) =>
        `<button type="button" data-flow-edge="${e.id}">${esc(e.label)}<small>${esc(name(e.from))} to ${esc(name(e.to))}</small></button>`,
    )
    .join("");
  const encode = (v) =>
    JSON.stringify(v)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
  const workTemplates = [
    ...model.loops.map((l) => ({ kind: "loop", id: l.id })),
    ...topology.edges.map((e) => ({ kind: "edge", id: e.id })),
  ]
    .map(
      (t) =>
        `<template data-work-template="${t.kind}:${t.id}">${renderWorkLinks(work, t)}</template>`,
    )
    .join("");
  const extraWork = (work?.actions || [])
    .filter(
      (a) =>
        !a.targets.some(
          (t) => t.kind === "loop" && model.loops.some((l) => l.id === t.id),
        ),
    )
    .flatMap((a) => {
      const target = a.targets.find(
        (t) =>
          (t.kind === "edge" && topology.edges.some((e) => e.id === t.id)) ||
          (t.kind === "metric" && model.metrics.some((m) => m.id === t.id)),
      );
      return target ? [renderWorkLinks({ ...work, actions: [a] }, target)] : [];
    })
    .join("");
  const allWork = work
    ? `<details class="fl-work-records"><summary>All linked work and tracker status</summary>${model.loops.map((l) => `<section><h3>${esc(l.name)}</h3>${renderWorkLinks(work, { kind: "loop", id: l.id })}</section>`).join("")}${extraWork ? "<section><h3>Additional handoff and evaluation work</h3>" + extraWork + "</section>" : ""}</details>`
    : "";
  return `<section id="${id}" class="ll-system fl-system fl-action-clarity" data-learning-connections aria-labelledby="${headingId}"><div class="rm-structure-heading"><h2 id="${headingId}">${esc(title)}</h2><p>Connections, evidence and the next improvement</p></div><div class="fl-intro"><p>See what works, where proof stops, and the work needed to close the gap.</p><a href="${esc(model.sourceHref)}">Snapshot · ${esc(model.observedOn)}</a></div><div class="fl-summary"><span><strong>${model.declaredCount}</strong> declared loops</span><span><strong>${model.closedCount}</strong> with recorded four-link closure</span><span>${esc(model.scope)}</span><span>Grade <strong>${esc(model.grade ?? "Not currently assessed")}</strong>${model.previousAssessment ? "<small>Previous " + esc(model.previousAssessment.grade) + " · " + esc(model.previousAssessment.observedOn) + "</small>" : ""}</span></div><p>Production: ${esc(model.production)}</p><div class="fl-enhanced" hidden><div class="fl-toolbar"><div role="group" aria-label="Learning views" class="fl-tabs"><button type="button" data-flow-view="inside" aria-pressed="true">Inside a loop</button><button type="button" data-flow-view="system" aria-pressed="false">Between loops</button><button type="button" data-flow-view="eval" aria-pressed="false">Evaluations & agents</button></div><div role="group" aria-label="Diagram display" class="fl-display"><button type="button" data-flow-dimension="2d" aria-pressed="true">2D map</button><button type="button" data-flow-dimension="3d" aria-pressed="false">3D explore</button></div></div><div data-flow-diagrams><div class="fl-loop-picker" hidden><label>Learning loop <select data-flow-loop>${model.loops.map((l) => '<option value="' + l.id + '">' + esc(l.name) + "</option>").join("")}</select></label><button type="button" data-flow-previous>Previous</button><button type="button" data-flow-next>Next</button><span data-flow-position></span></div><div class="fl-decision" data-flow-decision></div><div class="fl-workspace"><div class="fl-diagram-main"><div class="fl-diagram-heading"><h3 data-flow-heading>How loops feed one another</h3><p data-flow-subtitle></p></div><div class="fl-stage"><canvas hidden tabindex="0" aria-label="3D learning relationships. Drag or use arrow keys to rotate; plus and minus zoom; Home resets."></canvas><svg class="fl-lines" aria-hidden="true"></svg><div class="fl-node-labels"></div><div class="fl-edge-labels"></div></div><div class="fl-return" hidden></div><p class="fl-evidence-navigation"><button type="button" data-flow-read-evidence>Read selected evidence</button></p><div class="fl-motion"><button type="button" data-flow-play aria-pressed="false">Play signal path</button><span data-flow-caption aria-live="polite">Illustrative path, not live activity.</span></div><div class="fl-camera" hidden aria-label="3D camera">${["left", "right", "in", "out", "reset"].map((v, i) => '<button type="button" data-flow-camera="' + v + '">' + ["Rotate left", "Rotate right", "Zoom in", "Zoom out", "Reset"][i] + "</button>").join("")}</div><p data-flow-gl-status role="status"></p><div class="fl-handoffs"><h4>Select a handoff</h4><div>${buttons || "<p>No cross-loop handoffs were recorded. Inspect the loop sequences below.</p>"}</div></div></div><aside class="fl-inspector" aria-label="Selected connection or stage" tabindex="-1"><div data-flow-inspector></div><button type="button" data-flow-return>Return to diagram</button></aside></div><section class="fl-worklist" aria-label="Work to close this gap"><h3>Work to close this gap</h3><div data-flow-work></div></section><div class="fl-inventory"><h3>Explore all ${model.declaredCount} loops</h3><p>Loops without recorded handoffs remain available here. Shared artifacts alone do not establish a handoff.</p><div>${model.loops.map((l) => '<button type="button" data-flow-loop-open="' + l.id + '">' + esc(l.name) + "<small>" + esc(l.proof === "observed" ? "Closure re-witnessed" : l.proof === "carried" ? "Closure uses earlier proof" : "Closure not proved") + "</small></button>").join("")}</div></div></div><div data-flow-evaluations hidden><div class="fl-eval-heading"><h3>Coverage, verdicts and enforcement</h3><p>Read each measure separately. A suite declaration is not an executed test, and an advisory gate does not enforce its verdict.</p></div><div class="fl-eval-labels" aria-hidden="true"><span>Measure</span><span>Recorded value</span><span>What it means</span></div>${metrics}${runs}${agents}</div></div>${quality}${allWork}${workTemplates}<details class="fl-records"><summary>Complete evidence records</summary>${fallback}<h3>Cross-loop handoffs</h3><ul>${topology.edges.map((e) => "<li>" + esc(name(e.from) + " to " + name(e.to) + ": " + e.label + " · " + e.state + ". " + e.description + " Missing: " + e.missing + " Next proof: " + e.nextProof + " Evidence: " + e.evidence.join("; ") + (e.witness ? " Witness: " + Object.values(e.witness).join(" · ") : "")) + "</li>").join("")}</ul><h3>Feedback returns</h3><ul>${(topology.returns || []).map((r) => "<li>" + esc(name(r.loopId) + ": " + r.state + ". " + r.note + (r.witness ? " Witness: " + Object.values(r.witness).join(" · ") : "")) + ' <a href="' + esc(r.sourceHref) + '">Return evidence</a></li>').join("") || "<li>No feedback returns were recorded.</li>"}</ul><a href="${esc(topology.sourceHref)}">Declared wiring source</a></details><p class="ll-footnote">Snapshot ${esc(model.observedOn)}. Motion is illustrative. A four-link closure does not establish repeated benefit. This view issues no grade.</p><script type="application/json" data-learning-model>${encode(model)}</script><script type="application/json" data-learning-topology>${encode(topology)}</script></section>`;
}
