# First useful roadmap

Read for new, ungraded roadmaps and supported starter updates. The user should
get a useful local artifact before optional grading, prioritization or hosting.
Honor the established project and brief; do not open every connected workspace.

## Creation

1. Recover audience and source scope. A request naming this repository and its
   issues selects those sources. Ask for a missing material audience or competing
   project; do not ask for known paths, optional style preferences or unused tools.
2. Read the selected sources. Produce only useful initiatives supported by them.
   Keep provisional authority labelled; source-stated placement can be used in an
   authorized draft when no material conflict exists. Missing owners, measures
   or delivery proof say `not recorded` or `not measured` in the relevant fields.
   Conflicting commitments remain unplaced (`horizon: null`) with a decision.
3. Normalize evidence into the model described below. Match the user's existing
   brand with the full workflow when a starter would overwrite it. The supplied
   starter inherits Horizons' documented readiness register; no design interview
   or external asset generation is required for that established default.
4. Run `node <skill>/scripts/roadmap-pipeline.mjs build <canonical.html> <model.json>`.
   Report its local path, source gaps and checks. No browser, runtime, issue
   creation, grade contract or hosting account is required for this first result.

## Version 1 model

See `demo/roadmap.json` for a complete synthetic example. JSON only, no arbitrary
HTML. The pipeline validates stable IDs, evidence links, timestamps and states.

- `schemaVersion: 1`, positive `revision` (1 initially), `observedAt` ISO time.
- `project`: stable `id`, `name`, `audience`; optional `headline`, `summary` and
  `synthetic: true` for invented examples, never a claim about real results.
- `sources`: `id`, `label`, `observedAt`, `kind` (`record`/`anecdote`), `confirmed`
  boolean; optional HTTP(S) `href`, local text `locator`, and concise `summary`.
- `items`: stable `id`, `title`, `stream`, `horizon` (`now`/`next`/`later`/null),
  `owner` (text/null), `problem`, `outcome`, `successMeasure`, `nextProof`, `refs`
  (source IDs), optional unresolved `decision` text.
- Each item's `delivery`: `status` (`planned`, `in-progress`, `marked-done`,
  `verified`, `blocked`, `reopened`) and `evidenceRefs`. Verified needs refs.
- Each item's `impact`: `status` (`unmeasured`/`measured`), `summary` and
  `evidenceRefs`. Measured needs refs separate from ticket closure evidence.
- `history`: initially `[]`; the pipeline appends refresh/movement records.
- Optional `gradePlanning`: an EXISTING approved `contract`, recorded `assessment`
  and evidenced `tickets` mappings per `grade-opportunities.md`. This imports a
  dated planning view, not a new grade; it is frozen during starter refresh.

The validator checks structure and provenance references, not the truth of a
source interpretation. Verify the evidence before assigning a delivery state.

## Refresh, checkpoints and recovery

Extract the current model before editing the evidence:

```sh
node <skill>/scripts/roadmap-pipeline.mjs extract <canonical.html>
node <skill>/scripts/roadmap-pipeline.mjs refresh <canonical.html> <snapshot.json>
node <skill>/scripts/roadmap-pipeline.mjs verify <canonical.html>
```

Capture extract stdout with the host's file tool or shell redirection into the
existing workspace. Retain the exact current revision, history and gradePlanning.
Change only evidence within scope. Preserve every existing item and horizon; new
items stay unplaced until a planning decision. Missing sources are coverage gaps,
not permission to drop an item. An assessed refresh uses the full grading workflow.

Add `--stage` to build/refresh/move to stop at a validated `.pending.json`
checkpoint adjacent to the entry file. `resume <canonical.html>` checks the old
file hash and completes the save. A concurrent edit, stale proposal or changed
renderer refuses. Inspect a failed checkpoint before removing that specific
checkpoint and restaging; never overwrite a changed canonical file to force it.
The checkpoint is temporary recovery data, not another published roadmap.

The writer uses an exclusive lock and atomic rename on the same filesystem.
Cooperating pipeline writers are serialized; tools bypassing its lock still need
coordination (the final hash check is not an OS-level compare-and-swap). Stale
locks require inspecting the owning process before removal. It never updates
issue trackers or hosted URLs. Use the destination's authorized update workflow
for publishing. Unsupported legacy/assessed HTML is refused; use its existing
workflow, not an automatic migration.
