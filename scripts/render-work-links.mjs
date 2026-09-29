/** Tracker-neutral evidence mappings. Tracker delivery never establishes runtime proof. */
export const escapeWorkText = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function safeWorkHref(value) {
  if (
    typeof value !== "string" ||
    !value ||
    /[\s<>"'\\]/.test(value) ||
    /^(?:\/\/|\/)|(?:^|\/)\.\.(?:\/|$)/.test(value) ||
    (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https:\/\//i.test(value))
  )
    throw Error("Safe work source link required");
  return escapeWorkText(value);
}
const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
  Number.isFinite(Date.parse(value));
export function validateWorkLinks(work) {
  if (work == null) return null;
  if (
    work.schemaVersion !== 1 ||
    !validDate(work.observedAt) ||
    !work.tracker?.name ||
    !Array.isArray(work.tickets) ||
    !Array.isArray(work.actions)
  )
    throw Error("Dated tracker work model required");
  safeWorkHref(work.sourceHref);
  const tickets = new Set(),
    actions = new Set();
  for (const t of work.tickets) {
    if (
      !t.id ||
      tickets.has(t.id) ||
      !t.title ||
      !t.status ||
      ![
        "backlog",
        "unstarted",
        "started",
        "completed",
        "canceled",
        "unknown",
      ].includes(t.statusType)
    )
      throw Error("Unique tracker records and explicit status required");
    tickets.add(t.id);
    safeWorkHref(t.url);
    if (!validDate(t.updatedAt)) throw Error("Ticket update date required");
  }
  for (const a of work.actions) {
    if (
      !/^[a-z][a-z\d_-]*$/.test(a.id) ||
      actions.has(a.id) ||
      !a.title ||
      !a.acceptance ||
      !a.rationale ||
      !["activate", "build", "verify", "decide", "review"].includes(a.kind)
    )
      throw Error("Explicit work action and acceptance required");
    actions.add(a.id);
    if (
      !Array.isArray(a.targets) ||
      !a.targets.length ||
      a.targets.some(
        (t) =>
          !["loop", "component", "edge", "metric"].includes(t.kind) || !t.id,
      )
    )
      throw Error("Action target required");
    if (
      !Array.isArray(a.ticketIds) ||
      a.ticketIds.some((id) => !tickets.has(id))
    )
      throw Error("Every linked ticket must be recorded");
    if (!Array.isArray(a.evidenceRefs) || !a.evidenceRefs.length)
      throw Error("Mapping evidence required");
    a.evidenceRefs.forEach((e) => {
      safeWorkHref(e.href);
      if (!e.note) throw Error("Mapping explanation required");
    });
    for (const p of a.prerequisites || []) {
      if (
        !tickets.has(p.ticketId) ||
        !["tracker-relation", "ticket-description"].includes(p.basis) ||
        !p.note
      )
        throw Error("Prerequisite needs recorded ticket and provenance");
    }
  }
  if (work.operatingContext) {
    const c = work.operatingContext;
    if (
      !validDate(c.recordedAt) ||
      !c.statement ||
      !c.implication ||
      !c.evidenceBoundary
    )
      throw Error(
        "Operating context needs a dated statement and evidence boundary",
      );
    safeWorkHref(c.sourceHref);
  }
  const guideTargets = new Set();
  for (const g of work.teamGuides || []) {
    const key = g.target?.kind + ":" + g.target?.id;
    if (
      !["loop", "component", "edge", "metric"].includes(g.target?.kind) ||
      !g.target?.id ||
      guideTargets.has(key)
    )
      throw Error("Unique team-guide target required");
    guideTargets.add(key);
    for (const k of [
      "title",
      "environment",
      "ownership",
      "startWith",
      "blocked",
    ])
      if (typeof g[k] !== "string" || !g[k].trim())
        throw Error("Team guide needs " + k);
    if (
      !Array.isArray(g.steps) ||
      !g.steps.length ||
      g.steps.some((s) => !s.role || !s.instruction)
    )
      throw Error("Team steps need a role and instruction");
    if (
      !Array.isArray(g.completion) ||
      !g.completion.length ||
      g.completion.some((s) => typeof s !== "string" || !s.trim())
    )
      throw Error("Completion evidence required");
    safeWorkHref(g.sourceHref);
  }
  return work;
}
export function actionsFor(work, kind, id) {
  return (
    work?.actions.filter((a) =>
      a.targets.some((t) => t.kind === kind && t.id === id),
    ) || []
  );
}
export function workSummary(work, kind, id) {
  const actions = actionsFor(work, kind, id),
    ids = [...new Set(actions.flatMap((a) => a.ticketIds))],
    tickets = (work?.tickets || []).filter((t) => ids.includes(t.id));
  return {
    actions: actions.length,
    open: tickets.filter(
      (t) => !["completed", "canceled"].includes(t.statusType),
    ).length,
    done: tickets.filter((t) => t.statusType === "completed").length,
    unmapped: actions.filter((a) => !a.ticketIds.length).length,
  };
}
const esc = escapeWorkText,
  kinds = {
    activate: "Activate",
    build: "Build",
    verify: "Verify",
    decide: "Decide",
    review: "Review",
  };
export function renderOperatingContext(work) {
  validateWorkLinks(work);
  const c = work?.operatingContext;
  return c
    ? `<aside class="hw-context" aria-label="Current operating context"><h3>Working context</h3><p><strong>${esc(c.statement)}</strong></p><p>${esc(c.implication)}</p><p class="hw-boundary">${esc(c.evidenceBoundary)}</p><a href="${safeWorkHref(c.sourceHref)}">Context recorded ${esc(c.recordedAt.slice(0, 10))}</a></aside>`
    : "";
}
export function renderTeamGuide(work, kind, id) {
  validateWorkLinks(work);
  const g = work?.teamGuides?.find(
    (g) => g.target.kind === kind && g.target.id === id,
  );
  if (!g) return "";
  return `<section class="hw-team-guide" data-team-guide="${esc(kind + ":" + id)}"><h4>${esc(g.title)}</h4><p class="hw-team-scope">${esc(g.environment)}</p><p>${esc(g.ownership)}</p><p class="hw-team-start"><strong>Start here:</strong> <span data-team-start>${esc(g.startWith)}</span></p><ol class="hw-team-steps">${g.steps.map((s) => `<li><strong>${esc(s.role)}</strong><p>${esc(s.instruction)}</p></li>`).join("")}</ol><div class="hw-team-complete"><h5>Complete when</h5><ul>${g.completion.map((c) => "<li>" + esc(c) + "</li>").join("")}</ul></div><p><strong>If blocked:</strong> ${esc(g.blocked)}</p><a href="${safeWorkHref(g.sourceHref)}">Instruction basis and evidence template</a></section>`;
}
export function renderWorkLinks(work, { kind, id } = {}) {
  validateWorkLinks(work);
  const actions = actionsFor(work, kind, id),
    guide = renderTeamGuide(work, kind, id);
  if (!work)
    return '<p class="hw-unmapped">Tracker work has not been mapped. Retain the next proof as an explicit action.</p>';
  if (!actions.length)
    return (
      guide +
      '<p class="hw-unmapped">No action-to-ticket mapping recorded for this item.</p>'
    );
  const ticket = (id) => work.tickets.find((t) => t.id === id);
  const ticketRow = (t) =>
    `<li data-work-ticket="${esc(t.id)}" data-work-status="${esc(t.statusType)}"><a href="${safeWorkHref(t.url)}"><strong>${esc(t.id)}</strong> ${esc(t.title)}</a><span>${esc(t.status)}</span><small>${esc(t.assignee || "Unassigned")} · updated ${esc(t.updatedAt.slice(0, 10))}</small></li>`;
  const ticketList = (a) => {
    const linked = a.ticketIds.map(ticket),
      active = linked.filter((t) => t.statusType !== "completed"),
      done = linked.filter((t) => t.statusType === "completed");
    return (
      (active.length
        ? `<ul class="hw-tickets">${active.map(ticketRow).join("")}</ul>`
        : "") +
      (done.length
        ? `<details class="hw-completed"><summary>Completed implementation · ${done.length} ${done.length === 1 ? "ticket" : "tickets"}</summary><ul class="hw-tickets">${done.map(ticketRow).join("")}</ul><p class="hw-delivery-note">Marked Done in the tracker. The proof requirement remains separate.</p></details>`
        : "")
    );
  };
  return `<div class="hw-work" data-work-target="${esc(kind + ":" + id)}">${guide}<p class="hw-observed">${esc(work.tracker.name)} checked ${esc(work.observedAt.slice(0, 16).replace("T", " "))} UTC</p>${actions.map((a) => `<article class="hw-action" data-work-action="${esc(a.id)}"><div class="hw-action-title"><h4>${esc(a.title)}</h4><span>${kinds[a.kind]}</span></div>${a.prerequisites?.length ? '<div class="hw-prerequisites"><strong>Before this work</strong><ul>' + a.prerequisites.map((p) => '<li><a href="' + safeWorkHref(ticket(p.ticketId).url) + '">' + esc(p.ticketId) + "</a> · " + esc(ticket(p.ticketId).status) + " · " + esc(ticket(p.ticketId).assignee || "Unassigned") + " · " + esc(p.note) + " <small>" + (p.basis === "ticket-description" ? "Dependency stated in description" : "Tracker dependency") + "</small></li>").join("") + "</ul></div>" : ""}${ticketList(a)}${!a.ticketIds.length ? '<p class="hw-unmapped">Ticket not mapped in this review</p>' : ""}<p class="hw-acceptance"><strong>Proof needed:</strong> ${esc(a.acceptance)}</p><details><summary>Why this work is linked</summary><p>${esc(a.rationale)}</p><ul>${a.evidenceRefs.map((e) => '<li><a href="' + safeWorkHref(e.href) + '">' + esc(e.note) + "</a></li>").join("")}</ul></details></article>`).join("")}</div>`;
}
