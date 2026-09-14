# Reviewed roadmap movement

Use when the user asks to shift or reprioritize placement, or supplies a browser
movement proposal. Dragging and Move to are equivalent ways to stage a proposal.
Planning authorization does not grant permission to update the issue tracker.

## Starter artifacts

The artifact supports drag-and-drop and labelled native select controls. A move
previews the new horizon, is visibly marked proposed, and requires a reason.
Review moves lists every original and proposed placement. Discard restores the
original view; download exports a JSON proposal. Both remain local. The page
clearly states that a download has not saved the canonical roadmap.

Apply an explicitly approved proposal with:

```sh
node <skill>/scripts/roadmap-pipeline.mjs move <canonical.html> <proposal.json> --approve '<reference to the user decision>'
```

The proposal has `schemaVersion: 1`, `projectId`, `baseRevision`, `baseDigest`
(SHA-256 of the embedded model serialized as JSON), and `moves` with `itemId`,
`from`, `to`, `reason`. Browser output supplies these fields. For a conversational
move, build the same proposal from the current model after resolving the reason
from the user's instruction. Do not ask for approval again when the instruction
already authorizes these exact moves; do not invent an approval reference.

Each move appends its date, reason and approval reference to history, increments
the roadmap revision, and preserves evidence observation time, delivery, impact,
assessment data and dates. A stale model hash/revision, duplicate item or invalid
horizon is refused. No automatic priority score can authorize a move.

## Established artifacts

Use the existing shared model, IDs, visual contract and movement history. Do not
replace a custom or graded artifact with the starter renderer. Add equivalent
staging controls with the same review and persistence semantics where supported.
Preserve grade ledgers and immutable locks. Moving between horizons is distinct
from moving a dated Gantt bar: schedule changes need explicit dates and their own
source or approved scenario, retaining original commitments.

## Interaction verification

Test native keyboard selection and drag to the same destination; reason required;
multiple moves; moving back; discard; JSON download; stale proposal rejection;
deep links after movement; small screens; and persisted history after applying.
Filters affect display only, never proposal contents or grade denominators.
Do not label a browser-only preview Saved. The host applies approved proposals.
