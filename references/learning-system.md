# Learning and evaluation views

Use this reference when discovered project data contains agents, evaluations or
learning loops and the authorized artifact includes their presentation. Discovery
alone does not authorize runtime access, paid evaluation, grading or publication.
Preserve the current audience, visual contract and canonical hub.

## Contents

- Leadership reading order
- Evidence contract
- Reusable renderer
- Interaction and fallback

## Leadership reading order

Lead with the decision: which capability is demonstrated, what evidence is
missing, who can supply it when known, and what decision that evidence enables.
Show the observation date and environment beside the conclusion. Then provide:

1. A two-dimensional learning map: one declared loop per row, with signal,
   transform, changed artifact and later consumption as columns.
2. An evidence inspector: the selected sequence, exact missing witness, linked
   work, next proof and source references. Selection must work by keyboard.
3. An evaluation matrix separating inventory coverage, measured verdicts, human
   calibration, release enforcement, run accounting and output controls.
4. Optional 3D exploration when requested or when the discovered structure makes
   it useful. Keep the map as the initial view. A graph is an alternate way to
   inspect the same records, never an additional assessment.

Do not replace Now/Next/Later or a requested Gantt with the graph. Their purpose is
to communicate decisions and delivery; the learning view explains evidence and
feedback. Connect them through stable initiative and evidence links. Preserve
shared completion observations, explicit Done labels, dates and unscheduled work.

## Evidence contract

Only draw relationships supported by discovered records. An agent registry is an
inventory, not a learning graph. If only agents are known, show their evaluation
coverage and say loop discovery is incomplete; do not invent a loop per agent.
For each declared loop distinguish its recorded verdict from proof freshness:

- `observed`: closure was explicitly assessed and all four links were witnessed
  in the selected observation, scope and revision. A persisted join may establish
  a historical execution was re-witnessed; it does not imply a new execution today.
- `carried`: the recorded closed verdict depends on identified earlier evidence.
- `unproved`: closure has not been demonstrated. This does not mean it failed.

Each stage is `observed`, `carried`, `unknown` or `attention`, with a source-backed
note explaining that state. A transform running, a memory row being written, a
Done ticket, an enabled flag or a later timestamp cannot prove later consumption.
No inferred edge may be rendered as observed. Preserve separate staging and
production conclusions; different source and served revisions remain visible.

Counts come from the complete discovered identity set. Filters never shrink the
closure denominator. Coverage denominators belong to their own observation: do
not silently apply today's agent count to an older evaluation run. Skipped,
failed, harness-invalid and quality-failing results retain their meanings.
Calibration needs dated human agreement evidence with sample size and scope;
a few labels are not a calibrated judge fleet. Advisory gates do not enforce.
Missing cost is unknown, never zero. Never blend these into an invented score.

A refresh updates the shared source model and all current projections together,
including ticket details and linked plans; retain old observations as history.
Follow `refresh-reassessment.md` for affected grades. A presentation refresh must
not silently issue letters or make an older assessment look current.

## Reusable renderer

`renderLearningSystem` is an import, not a CLI. It returns escaped static HTML
with a complete no-JavaScript and print record. Include the two assets once after
reading the incumbent visual tokens. It makes no network requests.

```js
import { renderLearningSystem } from './scripts/render-learning-system.mjs';
const section = renderLearningSystem(model, {
  id: 'learning-system', headingId: 'learning-system-heading',
  title: 'How the system learns',
});
// Include assets/learning-system.css and assets/learning-system.js in the hub.
// Inline them for a self-contained file, or retain relative local asset paths.
```

The host uses `.roadmap-shell` and its existing `--rm-ground`, `--rm-panel`,
`--rm-soft`, `--rm-ink`, `--rm-muted`, `--rm-rule`, `--rm-link`, `--rm-focus` tokens.
Adapt the scoped typography to the inherited font system; the fixture illustrates
one design, not a mandatory brand. Light/dark follow `html[data-theme]`.

Model schema version 1:

- `schemaVersion`, `assessmentId`, `observedOn` (valid ISO date), `scope`,
  `production` (explicit production observation or unknown), `sourceHref`;
  `grade` is an existing recorded letter or null, never computed by the renderer.
  When a reassessment lacks required proof, optional `previousAssessment` holds
  `grade`, `observedOn`, `sourceHref`; the current view says reassessment incomplete
  and shows the older grade with its date. Null without this record stays unassessed.
- `declaredCount` and `closedCount` must match the complete `loops` array.
- `loops[]`: stable `id`, `name`, `binding` (`native` or the recorded other binding),
  `summary`, `decision`, `action`, `missing`, `recordedVerdict` (`closed` or
  `not proved`), `proof`, `sourceHref`, `sourceLocator`, nonempty `evidence[]`;
  optional `tickets`; optional `improvement` with a safe `sourceHref` and an
  `acceptance` string array copied from an identified existing plan (keep its
  date and proposal status; never present it as completed evidence); exactly four `stages[]` in order, with IDs `signal`,
  `transform`, `artifact`, `consumption`, and `state`, `label`, `note` each.
- `metrics[]`: unique `id`, `name`, `value`, `status`, `detail`, `nextProof`,
  nonempty `evidence[]`. Preserve numerators, denominators and observation dates
  in values/details. Empty arrays mean no measured observations.
- Optional `agents[]`: unique `id`, `name`, `category`, `coverage` (`covered`,
  `uncovered`, `unknown`) and `sourceHref`. This inventory stays separate from
  loop relationships and from per-model executed coverage.
- `runs[]`: `id`, `model`, `time`, `verdict`, `reason`, `detail`, `accounting`.
  Retain enough context to distinguish quality from harness or accounting blocks.

See `evals/fixtures/learning-system/learning.json` for a synthetic full example.
Never copy a project's private measurements into the shared skill fixture.
`validateLearningSystem`, `learningSummary` and `learningGeometry` provide model
checks and deterministic geometry; none is a grading evaluator.

## Interaction and fallback

Stable identity ordering fixes position between renders. Depth separates stages and recorded binding classes for exploration; the spatial
layout is explicitly illustrative and distance is not a score. Edges follow each declared sequence and do not imply live traffic. Avoid
force jitter, endless auto-orbit and animation presented as live activity. A short
guided walkthrough may animate the recorded sequence when requested, visibly
labelled illustration rather than traffic. Supply Play/Pause, stop offscreen or
on view/selection changes, and disable automatic movement for reduced motion.
Render on demand outside the bounded walkthrough. Native controls provide selection,
rotation, zoom and reset. Show a visible named loop navigator with selected state,
Previous/Next controls and the selection position. Start 3D focused on one loop;
make the all-loop context an explicit choice. Selection changes the diagram in
place, including on phones. A separate Read evidence action focuses the inspector
and offers a return action; camera movement never changes loop selection. The inspector, textual states and symbols duplicate all
canvas information. A WebGL failure leaves the map and full text available.

Check all views at desktop and narrow mobile sizes, light/dark, keyboard,
filters, selection, deep links, no JavaScript, print and forced graphics failure.
Inspect screenshots for crowded labels as well as overflow; a passing width check
alone cannot prove visual quality. Keep evidence links and host navigation working.

Show the selected loop’s recorded summary, exact missing witness and next proof
beside the diagram. An improvement checklist can describe useful feedback, a
traceable change, verified reuse, measured benefit and reliable operation, but
label it as proposed acceptance rather than a new grading rubric or earned score.
Keep measured benefit distinct from closure, and do not imply a return-to-signal
edge unless the source establishes it.
