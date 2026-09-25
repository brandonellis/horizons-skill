import assert from "node:assert/strict";
import { escapeHtml as escape } from "./render-progress.mjs";

const stateNames = {
  completed: "Done",
  started: "In progress",
  unstarted: "Todo",
  backlog: "Backlog",
  canceled: "Canceled",
  duplicate: "Duplicate",
};
const typeNames = {
  capability: "Capability work",
  improvement: "Improvement",
  bug: "Bug fix",
  unknown: "Type not classified",
};
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Not recorded";
const link = (href, label) => {
  assert(
    typeof href === "string" &&
      /^(?:https?:\/\/|#[a-z]|[a-z0-9][a-z0-9_./-]*$)/i.test(href) &&
      !/[\s<>"\\]/.test(href),
    "Use safe source links",
  );
  return `<a href="${escape(href)}">${escape(label)}</a>`;
};

export function renderWorkRecords(records) {
  if (!records.length) return "<p>None in this observation.</p>";
  return `<ul class="rm-work-records">${records.map((record) => `<li data-work-id="${escape(record.id)}" data-work-state="${escape(record.statusType || "unknown")}"><span>${record.url ? link(record.url, record.id) : escape(record.id)} · ${escape(record.title)}</span><span class="rm-work-meta">${escape(stateNames[record.statusType] || "Unknown")} · ${escape(typeNames[record.type])}${record.completed ? " · completed " + date(record.completedAt) : ""} · observed ${date(record.observedAt)}</span></li>`).join("")}</ul>`;
}

export function renderFeatureDetail(feature, { includeHeading = false } = {}) {
  const groups = [
    [
      "Completed original work",
      feature.original.filter((record) => record.completed),
    ],
    [
      "Completed capability work",
      feature.completed.filter(
        (record) =>
          record.role !== "original-requirement" &&
          record.type === "capability",
      ),
    ],
    [
      "Completed improvements and fixes",
      feature.completed.filter(
        (record) =>
          record.role !== "original-requirement" &&
          ["improvement", "bug"].includes(record.type),
      ),
    ],
    [
      "Other completed work",
      feature.completed.filter(
        (record) =>
          record.role !== "original-requirement" && record.type === "unknown",
      ),
    ],
    ["Remaining original requirements", feature.remainingOriginal],
    ["Additional work and follow-ups", feature.additionalOpen],
    ["Canceled or duplicate, not delivered", feature.excluded],
    ["Status needs verification", feature.unknown],
  ];
  const renderGroups = (groups) =>
    groups
      .filter(([, records]) => records.length)
      .map(
        ([title, records]) =>
          `<details class="rm-work-group"><summary>${title} <span>${records.length}</span></summary>${renderWorkRecords(records)}</details>`,
      )
      .join("");
  const completedCount = groups
    .slice(0, 4)
    .reduce((sum, [, records]) => sum + records.length, 0);
  const workGroups =
    renderGroups(groups.slice(4)) +
    (completedCount
      ? `<details class="rm-completed-work"><summary>Completed delivery · ${completedCount} ${completedCount === 1 ? "ticket" : "tickets"}</summary>${renderGroups(groups.slice(0, 4))}</details>`
      : "");
  const milestones = feature.milestones.length
    ? `<div class="rm-delivered-milestones"><h4>Milestones</h4><ul>${feature.milestones.map((milestone) => `<li><strong>${escape(milestone.title)}</strong> · ${escape({ delivered: "Delivered", "reported-complete": "Reported complete", "in-progress": "In progress", unknown: "Not verified" }[milestone.state])}${milestone.completedAt ? " · " + date(milestone.completedAt) : ""}<p>${escape(milestone.scope)} ${link(milestone.sourceHref, "Scope and evidence")}</p></li>`).join("")}</ul></div>`
    : "";
  const secondary = feature.secondaryRecords.filter(
    (record) => !feature.originalIssueIds.includes(record.id),
  );
  return `<div class="rm-feature-detail" data-feature-id="${escape(feature.id)}">${includeHeading ? `<h3>${escape(feature.title)}</h3>` : ""}${milestones}<p class="rm-work-context">${feature.originalIssueIds.length ? feature.original.filter((record) => record.completed).length + "/" + feature.originalIssueIds.length + " original cited tickets Done." : "No original ticket set was recorded."} Added work earns separate credit, not a changed denominator or a feature-completion percentage.</p>${workGroups}${secondary.length ? `<details class="rm-work-group"><summary>Also supports this feature <span>${secondary.length}</span></summary><p>Counted once under its primary feature, not again here.</p>${renderWorkRecords(secondary)}</details>` : ""}${!feature.records.length && !feature.original.length ? "<p>No verified ticket mapping yet. This does not mean no work was done.</p>" : ""}</div>`;
}

export function renderFeatureProgress(
  model,
  { featureIds, evidenceHref = "#feature-work-evidence" } = {},
) {
  const selected = featureIds
    ? featureIds.map((id) => {
        const feature = model.features.find((record) => record.id === id);
        assert(feature, "Unknown featured feature");
        return feature;
      })
    : model.features
        .filter((feature) => feature.newlyCompleted.length)
        .slice(0, 6);
  const rows = selected
    .map((feature) => {
      const bugs = feature.newlyCompleted.filter(
        (record) => record.type === "bug",
      ).length;
      const improvements = feature.newlyCompleted.filter(
        (record) => record.type === "improvement",
      ).length;
      const capabilities = feature.newlyCompleted.filter(
        (record) => record.type === "capability",
      ).length;
      const unknown =
        feature.newlyCompleted.length - bugs - improvements - capabilities;
      const summary =
        [
          [capabilities, "capability task", "capability tasks"],
          [improvements, "improvement", "improvements"],
          [bugs, "bug fix", "bug fixes"],
          [unknown, "other completed task", "other completed tasks"],
        ]
          .filter(([count]) => count)
          .map(
            ([count, singular, plural]) =>
              `${count} ${count === 1 ? singular : plural}`,
          )
          .join(" · ") || "Earlier delivery retained";
      return `<li>${link("#feature-work-" + feature.id, feature.title)}<span>${escape(summary)}</span></li>`;
    })
    .join("");
  return `<section class="rm-feature-progress" id="feature-progress"><details class="rm-delivery-summary"><summary>Recent delivery · ${selected.length} ${selected.length === 1 ? "feature" : "features"}</summary><p>Completed since the ${date(model.since)} snapshot, observed ${date(model.observedAt)}. Tracker completion is not deployment or acceptance verification.</p><ul class="rm-feature-rollup-list">${rows}</ul><p>${link(evidenceHref, "Explore all features, remaining work and mapping gaps")}</p></details></section>`;
}
