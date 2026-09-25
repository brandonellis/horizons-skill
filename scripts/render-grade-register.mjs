import {
  validateWorkLinks,
  renderWorkLinks,
  workSummary,
  actionsFor,
} from "./render-work-links.mjs";
/** Render recorded assessment freshness; never compute a grade or infer comparability. */
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v + "T12:00:00Z")) &&
  new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
function link(v) {
  if (
    typeof v !== "string" ||
    !v ||
    /[\s<>"'\\]/.test(v) ||
    /^(?:\/\/|\/)|(?:^|\/)\.\.(?:\/|$)/.test(v) ||
    (/^[a-z][a-z\d+.-]*:/i.test(v) && !/^https:\/\//i.test(v))
  )
    throw Error("Safe evidence link required");
  return esc(v);
}
export function renderGradeRegister(
  model,
  { id = "component-grades", title = "Where we stand", work = null } = {},
) {
  if (
    !/^[a-z][a-z\d_-]*$/.test(id) ||
    !model ||
    !date(model.observedOn) ||
    !Array.isArray(model.components)
  )
    throw Error("Dated component records required");
  const ids = new Set();
  for (const c of model.components) {
    if (!/^[a-z][a-z\d_-]*$/.test(c.id) || ids.has(c.id))
      throw Error("Unique component identities required");
    ids.add(c.id);
    if (!["assessed", "incomplete", "not-reassessed"].includes(c.status))
      throw Error("Explicit assessment freshness required");
    if (c.status === "assessed" && (!c.grade || !date(c.observedOn)))
      throw Error("Current grade and date required");
    if (c.status !== "assessed" && c.grade != null)
      throw Error(
        "Incomplete and historical records cannot carry a current grade",
      );
    if (c.previous && (!c.previous.grade || !date(c.previous.observedOn)))
      throw Error("Previous grades must be dated");
    for (const k of ["name", "rationale", "nextProof"])
      if (typeof c[k] !== "string" || !c[k].trim())
        throw Error("Recorded " + k + " required");
    link(c.sourceHref);
    if (
      !Array.isArray(c.requirements) ||
      c.requirements.some((r) => typeof r !== "string" || !r.trim())
    )
      throw Error("Recorded requirements must be strings");
  }
  validateWorkLinks(work);
  // Only deduplicate exact recorded acceptance; retain every unmatched requirement.
  const unmatched = (c) => {
    const linked = new Set(
      actionsFor(work, "component", c.id).map((a) => a.acceptance),
    );
    return c.requirements.filter((r) => !linked.has(r));
  };
  const rows = model.components
    .map(
      (c) =>
        `<details class="fg-row" id="${id}-${esc(c.id)}" data-component-id="${esc(c.id)}" data-grade-state="${esc(c.status)}" name="${id}-review"><summary><span class="fg-name">${esc(c.name)}<small>${c.status === "assessed" ? "Reviewed" : c.status === "incomplete" ? "Review incomplete" : "Earlier review"}</small></span><span class="fg-grade" data-current="${c.status === "assessed"}">${esc(c.status === "assessed" ? c.grade : c.status === "incomplete" ? "Incomplete" : "Not renewed")}<small>${esc(c.status === "assessed" ? c.observedOn : "Current review")}</small></span><span class="fg-prior">${esc(c.previous?.grade ?? "Not recorded")}<small>${esc(c.previous?.observedOn ?? "No dated earlier grade")}</small></span><span class="fg-proof">${esc(c.nextProof)}<small>${
          work
            ? (() => {
                const w = workSummary(work, "component", c.id);
                return `${w.open} open · ${w.done} marked Done · ${w.unmapped} actions not mapped`;
              })()
            : "Open review and required proof"
        }</small></span></summary><div class="fg-detail${unmatched(c).length ? "" : " fg-detail-consolidated"}"><div><h3>Why this assessment stands</h3><p>${esc(c.rationale)}</p><a href="${link(c.sourceHref)}">Full assessment evidence</a></div>${
          unmatched(c).length
            ? "<div><h3>Required for the next review</h3><ol>" +
              unmatched(c)
                .map((r) => "<li>" + esc(r) + "</li>")
                .join("") +
              "</ol></div>"
            : work
              ? ""
              : "<div><h3>Required for the next review</h3><p>No additional acceptance criteria were recorded.</p></div>"
        }</div>${work ? `<div class="fg-linked-work"><h3>Work behind this assessment</h3>${renderWorkLinks(work, { kind: "component", id: c.id })}</div>` : ""}</details>`,
    )
    .join("");
  const pending = model.components.filter((c) => c.status === "incomplete"),
    prior = model.components.filter((c) => c.status === "not-reassessed");
  const attention = `<div class="fg-attention"><div><h3>${pending.length ? pending.length + " reviews need evidence" : "Review the next required proof"}</h3><p>${pending.length ? "Complete these reviews before drawing a current conclusion." : "Work and verification remain separate from the recorded letters."}</p></div><ul>${[...pending, ...prior].map((c) => `<li><a href="#${id}-${esc(c.id)}"><strong>${esc(c.name)}</strong><span>${esc(c.status === "incomplete" ? "Complete review" : "Renew dated assessment")}</span></a><p>${esc(c.nextProof)}</p></li>`).join("") || "<li>Expand a component for its mapped work and acceptance.</li>"}</ul></div>`;
  return `<section id="${id}" class="fg-grades"><div class="rm-structure-heading"><h2>${esc(title)}</h2><p>Assessment snapshot · ${esc(model.observedOn)}</p></div>${attention}<p class="fg-register-intro">Recorded assessments · open a row for the evidence and linked work. Tracker progress does not change a letter.</p><div class="fg-labels" aria-hidden="true"><span>Component</span><span>Current assessment</span><span>Earlier letter</span><span>Next proof</span></div>${rows}<p class="fg-method">Letters are recorded judgments, not a numeric progress scale. Code quality, operating readiness and measured impact remain separate. This view computes no grade.</p></section>`;
}
