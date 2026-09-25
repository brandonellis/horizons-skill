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
export function renderWorkLinks(work, { kind, id } = {}) {
  validateWorkLinks(work);
  const actions = actionsFor(work, kind, id);
  if (!work)
    return '<p class="hw-unmapped">Tracker work has not been mapped. Retain the next proof as an explicit action.</p>';
  if (!actions.length)
    return '<p class="hw-unmapped">No action-to-ticket mapping recorded for this item.</p>';
  const ticket = (id) => work.tickets.find((t) => t.id === id);
  const ticketRow = (t) =>
    `<li data-work-ticket="${esc(t.id)}" data-work-status="${esc(t.statusType)}"><a href="${safeWorkHref(t.url)}"><strong>${esc(t.id)}</strong> ${esc(t.title)}</a><span>${esc(t.status)}</span><small>${esc(t.assignee || "Unassigned")} · updated ${esc(t.updatedAt.slice(0, 10))}</small></li>`;
  return `<div class="hw-work" data-work-target="${esc(kind + ":" + id)}"><p class="hw-observed">${esc(work.tracker.name)} checked ${esc(work.observedAt.slice(0, 16).replace("T", " "))} UTC</p>${actions.map((a) => `<article class="hw-action" data-work-action="${esc(a.id)}"><div class="hw-action-title"><h4>${esc(a.title)}</h4><span>${kinds[a.kind]}</span></div>${a.prerequisites?.length ? '<div class="hw-prerequisites"><strong>Before this work</strong><ul>' + a.prerequisites.map((p) => '<li><a href="' + safeWorkHref(ticket(p.ticketId).url) + '">' + esc(p.ticketId) + "</a> · " + esc(ticket(p.ticketId).status) + " · " + esc(ticket(p.ticketId).assignee || "Unassigned") + " · " + esc(p.note) + " <small>" + (p.basis === "ticket-description" ? "Dependency stated in description" : "Tracker dependency") + "</small></li>").join("") + "</ul></div>" : ""}<ul class="hw-tickets">${a.ticketIds.map((id) => ticketRow(ticket(id))).join("")}</ul>${!a.ticketIds.length ? '<p class="hw-unmapped">Ticket not mapped in this review</p>' : ""}<p class="hw-acceptance"><strong>Proof needed:</strong> ${esc(a.acceptance)}</p>${a.ticketIds.some((id) => ticket(id).statusType === "completed") ? '<p class="hw-delivery-note">Marked Done in the tracker. The proof requirement remains separate.</p>' : ""}<details><summary>Why this work is linked</summary><p>${esc(a.rationale)}</p><ul>${a.evidenceRefs.map((e) => '<li><a href="' + safeWorkHref(e.href) + '">' + esc(e.note) + "</a></li>").join("")}</ul></details></article>`).join("")}</div>`;
}
