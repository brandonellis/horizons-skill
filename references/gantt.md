# Timeline: commitments without invented certainty

Use only when `gantt` is requested. Timeline is a view of the same artifact
model, not a separately maintained roadmap. An explicitly requested standalone
export uses that same model revision and links to the canonical artifact.

## Contents

- Preserve an existing chart
- Date contract
- Composition
- Progress and drift

## Preserve an existing chart

An already-requested Gantt stays part of the artifact on future updates.
Inventory and read it before deciding dates are absent. An NNL source without
dates does not erase a companion chart's windows. Recover the chart from the
canonical artifact, original source, saved build or creation record if necessary.

Retain historical source-stated windows and horizon-derived scenarios with their
original geometry, provenance and observation date. Restoring an existing
scenario is not inventing a new commitment. Label it `Historical planning
scenario`, not a current forecast; never silently promote old estimates to
commitments. A provenance warning belongs beside the chart, not instead of it.
If recovery fails, preserve its reference and name the gap rather than asserting
every item was always unscheduled. Only newly undated items go on the shelf.

## Date contract

Each item keeps `originalWindow`, `currentWindow`, `dateSource`, `confirmedAt`
and precision (`day`, `month`, `quarter`, or an explicit interval). Missing start
dates stay missing. A due date is a milestone, not an invented duration bar.

- **Committed:** solid bar or milestone, with an actual source and stated
  precision. Preserve a genuine exact date. Do not snap it to a quarter edge.
- **Proposed scenario:** outlined or hatched bar with a visible `Proposed`
  label, only after the user explicitly approves showing that scenario. It is
  not an operational forecast or a commitment. Never infer Now = this quarter,
  Next = next quarter, or Later = six months from now automatically.
- **Unscheduled:** labelled shelf below the theme's dated tracks, with next decision or missing
  input. This is the default when dates are absent, not a defect to disguise.

Batch questions about missing windows and conflicting sources, and resolve any
later ambiguity before adding dates under `execution-contract.md`. An
unapproved suggestion belongs in the conversation, not on the published chart.
Show scheduling coverage: `6 committed / 2 proposed / 4 unscheduled`.
`scripts/render-roadmap-timeline.mjs` prints it beside every chart
(`data-schedule-coverage`) and `scheduleCoverage(model).handoff` returns the
matching handoff line. Declare `timeline` in the manifest's `roadmapViews`;
verification then fails if the chart or its coverage line is missing.

## Composition

- A short commitment summary answers what is due, what is at risk, and what
  decision is needed. Do not replace it with a decorative percent-complete ring.
- Use a real shared time scale with month ticks and quarter headers. Zoom changes
  presentation only, never dates, precision or the planning horizon. Label the
  timezone/reference date used by the Today line.
- For stakeholder roadmaps, keep **theme names** in a sticky left-hand column.
  Put initiative titles and concise progress inside their colored date windows;
  include real owners when supplied. Do not repeat the quarter as each bar's
  main label when the axis already says it. Horizontal scrolling belongs to a
  named, keyboard-focusable chart region, never the page body.
  On narrow screens offer a readable schedule table with the same IDs and dates;
  do not shrink an eight-month chart to illegible bars.
- Group stakeholder schedules by primary theme. Non-overlapping initiatives
  may share a track; overlapping windows stack without moving their dates.
  Multi-theme work appears once but retains all filter memberships. A separately
  requested execution schedule can group by stream or actual owner instead.
  Preserve the approved grouping on regeneration. Throughline hue stays stable
  across the board and timeline. Status and provenance use words and shapes.
- Render an original committed window as a thin baseline track beneath the
  current one when dates change. State the approved change and source. Never
  overwrite the original date or treat an approved delay as on-time delivery.
- Draw dependencies only from source-backed item IDs. Label gates distinctly
  from work. Calculate slack or call a path "critical" only when complete
  dependency, duration and calendar inputs support it; otherwise say
  `Key dependencies`. A compelling line is not evidence of a dependency.
- A milestone, bar or shelf row opens the same item detail used by the board.
  Put essential dates, owner, status and provenance in readable text, not only
  in a hover tooltip. Never use a gradient to imply precision or progress.

## Progress and drift

Use `roadmap-reconciliation.md` on re-grades as well as refreshes. Completion
annotations come from the same observations as the board, even when an inherited
Gantt preserves old planning windows. Keep the planning date and completion-check
date separate. A fresh scorecard must not leave stale ticket counts on the bars.

Track actual delivery separately from ticket closure. Where refs exist, a
progress annotation may say `7 of 10 linked tickets done`; deduplicate refs,
map genuine completed states, and exclude canceled/duplicate refs from both
numerator and denominator with the exclusion count visible. It is not effort
completed, confidence, operational readiness or an A+ progress percentage.

A passed committed end with no verified delivery is `Past commitment, delivery
unverified` or `Slipped` when remaining work is known. Proposed windows say
`Scenario elapsed`, never `Missed commitment`. Disagreement between Done tickets
and delivery evidence remains visible. Never silently slide a bar right.

Refresh rechecks sources and reports date changes, expired commitments, missing
owners and scheduling coverage. It may update observed status after approval,
but re-dating requires an explicit human decision. If everything is unscheduled,
ship the honest shelf and a one-line request for dates, not an empty fake chart.
The timeline renderer does this itself when no window is source-stated or
approved: it renders each theme's `Dates not set` shelf under a `Gantt not
drawn` line. Report that line in the handoff; a reader who asked for a Gantt
must learn why none was drawn and what input would draw one.
