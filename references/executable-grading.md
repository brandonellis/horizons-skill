# Executable grading and outcome-led updates

Read with `baseline-ledger.md`. Use `scripts/assessment-engine.mjs` for supported
contracts instead of asking an auditor to invent an aggregate letter. The engine
has no dependencies and performs no network requests or writes. It checks the
shape, provenance, freshness and arithmetic of observations, not whether a human
or auditor's source interpretation is true. Audit the evidence before recording
pass/fail. A successful validator is not an operational test.

This deterministic engine is not the only valid existing grading method.
Read `letter-reassessment.md` before choosing it. When a legacy qualitative
method is recoverable, continue that method and record fresh auditor letters
with `scripts/letter-reassessment.mjs`. A separate draft proposal does not block
that reassessment. It also does not make qualitative letters deterministic or
authorize an operational A+ claim.

## Contents

- Adopt once, without rewriting legacy grades
- Contract and observation interface
- Progress even when the letter stays still
- Verify before publishing

## Adopt once, without rewriting legacy grades

1. Preserve the original baseline, finding cohort and every dated assessment.
   Create a disk history lock with `sealHistory(ledger)` only when adopting a
   ledger that has no lock. An existing lock is an immutable input: never
   reseal, append to, reformat or overwrite it. New assessments go in the ledger.
   `verifyHistory(originalLock, updatedLedger)` permits those appended records
   without changing the lock. An in-memory seal of the pre-update ledger can
   additionally check every prior assessment; it is not a replacement disk lock.
2. Write a private contract proposal with stable scope/cell/criterion IDs. A cell
   names a component, dimension and scope; every cell has positive cumulative
   acceptance tests for D, C, B and A. F is the fallback when known evidence fails
   D. A+ needs explicit additional tests; without them the ceiling is A. Do not
   encode descriptive failure anchors as positive prerequisites for higher tiers.
3. Present missing decisions together: tests and applicability, aggregation,
   evidence windows, operating scenarios and A+ requirements. Approval to improve
   a skill does not approve newly invented thresholds. Keep the proposal `draft`
   until the user accepts the exact contract. Drafts never award letters.
4. Record `approval.reference`, `approval.approvedAt` and the hash returned by
   `contractFingerprint(contract)`, then mark it `approved`. A changed criterion,
   threshold, denominator or scope invalidates the approval hash. This instrument
   adoption is not a replacement project baseline. Retain any unmeasured legacy
   mapping as unknown; do not back-calculate earlier letters.

The supported policy is whole tiers F/D/C/B/A/A+, cumulative criteria and the
lowest mandatory cell per scope. A custom or plus/minus contract needs explicit
approval and an implementation with behavioral tests before use. Never silently
approximate it with a GPA or the nearest supported tier.

## Contract and observation interface

See the synthetic `fixture()` in `scripts/assessment-engine.test.mjs` for a complete,
executable example. It is deliberately generic, not project evidence.

Contract fields: `schemaVersion: 1`, `id`, `baselineId`, `status`, `scopes`,
`initialFindingIds`, `findingEvidenceMaxAgeHours`, `aggregation`, `cells`, `criteria`.
Each cell has `id`, `component`, `dimension`, `scope`, `mandatory`. Each criterion
has `id`, `cellId`, `tier`, `test`, `method`, `maxAgeHours`, `thisAssessment` and,
only if pre-approved, `notApplicableReason`.

Assessment fields: `id`, `baselineId`, `contractId`, `contractHash`, `observedAt`,
`sourceCodeRefs`, `runtimeRefs`, `observations`, `findings`, `coverageGaps`.
Evidence-backed observations name `criterionId`, `result`, `evidenceRefs`,
`observedAt`, `assessmentId`, `subject`. Code subjects contain `scope: code`,
`repository`, full `commit`; runtime subjects contain `scope`, `service`,
`revision`, full `commit`, and immutable `imageDigest`. A subject must exactly
match an independently collected source/runtime reference in the assessment.
Missing provenance, stale evidence, another run's evidence where this run is
required, a future timestamp or a different scope cannot pass.

Findings name `id`, `scope`, `status` (open/partial/resolved/unknown), `blocking`
and the same evidence fields for closure. Include every original finding in each
scope; use unknown rather than dropping inaccessible findings. New findings stay
outside the original denominator. Model new live exposures and activation gaps as
blocking findings; record uncovered components/tiers in `coverageGaps`. No UI
filter may be passed to the evaluator as a smaller contract.

## Progress even when the letter stays still

For refresh-triggered reassessment, first apply `refresh-reassessment.md`.
Unchanged letters must distinguish an evaluated limiting criterion from a
reassessment that is blocked or not performed. The evaluator's draft-contract
refusal is not permission to label an old grade as newly verified.

First reconcile every existing roadmap item using `roadmap-reconciliation.md`.
`compareFindings` compares audit findings only; it does not read a tracker,
discover completed roadmap outcomes or update Now/Next/Later and Gantt for you.
Feed the reconciled delivery observations to those views in the same revision.

Use `compareFindings(initialIds, previousStatesOrNull, currentStates)` for exact
resolved, partial, open, unknown, reopened and newly discovered ID sets. Compare
like scopes and verification standards. If the previous assessment lacks finding
states, pass null and say the delta is unavailable. Never treat missing previous
data as all-open or call newly observed proof a newly shipped feature.

Use `scripts/render-progress.mjs` and `assets/progress-outcomes.css` with the existing
shell for three to five outcome-led wins, concise expandable next-check lists and
planned/observed milestone comparisons. Component grade links open next checks;
the full audit is one further deliberate step. Each win names an outcome, proof,
scope and evidence link. Each next check names owner, original acceptance, target
environment and source. Ticket counts remain a secondary activity signal.
An action list is not a promise that closing those tickets earns a particular
letter. Do not manufacture owners, dates, customer metrics or completion events.

Keep the original Roadmap/Progress/Evidence navigation, audience and Gantt
geometry. Retain initial commitments alongside later forecasts and actual dates.
When only an observation date is known, label it that way. No inferred dates on
unscheduled work. New engineering priorities can be proposed in the roadmap
without claiming they are committed, implemented or deployed.

## Verify before publishing

**Before the first update write**, run the verifier on the existing manifest and
retain its `historyLockSha256` outside the files being updated (for example, in
the run's tool output or a caller variable). This initial inspection reports
`historyLockPreservation: "not-checked"`: no earlier bytes have been compared.
After the update, pass that same original digest:

```sh
node scripts/verify-artifact.mjs /path/publication-manifest.json --history-lock-sha256 ORIGINAL_HASH
```

For imports use `verifyArtifact(manifestPath, { expectedHistoryLockSha256 })`.
Success must report `historyLockPreservation: "verified"`. The verifier also
refuses a bundle whose current assessment carries a `retracted` finding while
the page has no `data-panel-error-rate` element; see `report-card.md`, "The
previous card's findings are re-tested". A new manifest and a
resealed lock can agree with each other while destroying the original evidence;
the retained digest rejects that case. Never take the expected hash from the
updated manifest or replace it with a new digest to make verification pass.
Restore an accidentally changed lock from its retained original; if no trusted
original or prior digest is available, report preservation as unverified and ask
for that source before claiming a completed update. The pin detects drift, not
malicious replacement of both the caller's trusted digest and the artifact.

Maintainers changing the shared executable helpers run
`node --test scripts/*.test.mjs` with Node available. Skill users do not need
to run the repository regression suite or install browser-testing dependencies
to generate an artifact. Browser QA is optional and capability-aware; source
and ledger checks still apply, and unavailable checks must be disclosed.

Project artifact verification runs in the canonical workspace by default, using
a private `publication-manifest.json` with `schemaVersion: 1`, `visibility:
private`, `assessmentId`, `audience`, `artifactFile`, `ledgerFile`, `historyLockFile`
and an explicit `files` array of relative `path` + SHA-256. Include linked archives
and evidence files needed for the private artifact. Do not include the publication
manifest in its own file list. Embed the same ledger in a JSON script with ID
`roadmap-history`, escaping `<` as `\u003c`.

`node scripts/verify-artifact.mjs /private/path/publication-manifest.json` verifies
internal file integrity, history consistency, audience and embedded/saved ledger
agreement. Updates also require the original hash flag described above; an
unpinned pass does not establish that the original history lock was preserved.
Do not add `--private-bundle` to ordinary refresh, grade or score runs. Use it
only for an explicitly requested export or when an authorized publication needs
packaging: `--private-bundle NEW_DIRECTORY` creates an allowlisted owner-only
copy and reverifies it. The destination must not exist. For publication staging,
choose an unused child path inside an owner-only temporary directory, not a dated
sibling of the canonical workspace. This is staging, not uploading. Follow the
temporary-file lifecycle in `artifact-views.md`; never make the bundle canonical.
Re-read remote revision before actual publication; conflicts require reconcile,
not overwrite. Advertise a hosted update only after the destination is read back.

If no authenticated private destination is available, update and verify the stable
local hub in place and report the missing destination once. Do not prepare another
bundle or claim a hosted update. Never publish the private hub through a public
Pages site or put its data in the skill repo.
External audience exports need separately approved, allowlisted data; hiding an
Evidence tab is not sanitization. A hash is an accidental-drift guard, not a
signature or a guarantee that an intentionally edited manifest is trustworthy.
