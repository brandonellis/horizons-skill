# Baseline ledger: one starting point, a verifiable path to A+

Load with `report-card.md` for `grade` or `score`. This is the authority for
baseline identity, persistence and roll-up. WSJF is prioritization, not this
assessment. An assessed roadmap's refresh runs the same established method and
evidence checks as `grade`; delivery counts alone never award a letter. See
`refresh-reassessment.md` for relevance and scope, and `letter-reassessment.md`
to distinguish existing qualitative methods from new deterministic contracts.

Read in order: baseline resolution; frozen contract; repeatable letters/A+;
evidence and changes; persistence; acceptance scenarios.

For the executable implementation and legacy adoption procedure, also read
`executable-grading.md`. Use the evaluator for supported contracts, preserve old
records with a separate history lock, and require exact contract approval before
activating a reconstructed rubric. A policy written in Markdown alone does not
prove that two runs will produce the same aggregate.

## Contents

- Resolve the original, not just the latest
- Freeze the contract, not the state of the world
- Repeatable letters and a real operational A+
- Evidence and changes, without rewriting history
- Assessment scope and revision identity
- Persist before publishing
- Acceptance scenarios before shipping a grade

## Resolve the original, not just the latest

1. Read the canonical artifact and its assessment ledger before auditing.
   Resolve by project identity, not title alone. Memory is a pointer, not the
   source of truth. Follow `baselineId` to the initial assessment; separately
   resolve `previousAssessmentId` to the most recent observation.
2. If no ledger exists, follow prior cards to the earliest applicable initial
   assessment. Preserve its published grades, date, evidence and findings
   verbatim. An explicit card URL selects that card's lineage; it does not
   silently make that card a new baseline.
3. Propose a baseline contract once: scope, environments, components, criterion
   IDs, anchors, roll-up, evidence freshness windows, required A+ checks and
   finding inventory. Reuse what was already agreed. Confirm missing decisions
   together before calling the contract established; later material ambiguities
   still require clarification under `execution-contract.md`.
4. A legacy letter with no reproducible rubric stays **originally reported**.
   Do not reverse-engineer numeric scores or fabricate missing findings.
   Describe the unmapped criteria and compare only supported measurements.
   No comparable letter trend until the user approves the reconstructed rubric.
   This does not freeze future qualitative assessments when the original
   calibration and scope are recoverable. Continue that method with fresh,
   explicitly qualitative judgments while the replacement remains a draft.
5. If the baseline cannot be read, publish only a local **uncompared draft**.
   Ask for the missing source. Never fall back to the last card or create a new
   initial baseline because credentials expired or memory was empty.

On a genuinely first run, the first accepted assessment is both baseline and
current. Show `Initial assessment`, not `0% improvement` or a fabricated delta.

## Freeze the contract, not the state of the world

The baseline has no three-run expiry. Freeze the original finding IDs and
denominator, criterion IDs, scope, anchor version, aggregation policy and A+
acceptance conditions until an explicit user-approved rebaseline. Titles may
change without changing identity. A split finding retains its original parent;
that parent closes only when all required children pass verification.

Keep three columns distinct: **Initial baseline / Previous assessment / Current
assessment**. The default comparison is current against initial. An optional
"since previous" delta is secondary, never a replacement baseline.

New findings receive new IDs and a first-seen assessment. They do not enlarge
the original burn-down denominator or disappear to protect the trend. Show:

- `Verified resolved: 9 of the original 12` and the three remaining IDs.
- `New since baseline: 4 open` in a separate register.
- `Reopened: 1` when closure evidence no longer holds. Reopening reduces the
  current resolved count, but never rewrites the earlier observation.
- `Retracted: 1` when a re-test shows a finding was never true as written.
  A retraction keeps the finding's ID and original record, appends the
  contradicting evidence and the retracting assessment, is excluded from both
  the resolved count and the remaining count, and does not shrink the
  denominator. It is never a closure, and a previously resolved finding that
  is retracted is not "reopened". The rule and the re-test that produces it
  are in `report-card.md`, "The previous card's findings are re-tested".
- `A+ criteria verified: 18 of 24`, a different denominator from findings.

Zero baseline findings renders `No initial findings`, not `100% complete`.

Counts must lead to the actual findings. Every cohort mark links to its stable
finding ID, and each fixed/partial/open count opens that exact set. Show the
ticket reference and title, verified work, unmet original requirements, source
evidence, and separate tracker/deployment status. A partial label needs both a
verified original requirement and a specifically identified unmet one. Do not
make a closed parent partial because of a newly discovered follow-up. Unknown
verification stays unknown, not an assertion that no implementation work exists.

`scripts/render-cohort-findings.mjs` validates and renders that breakdown with
`assets/cohort-findings.css` and the shared shell. Keep the full register collapsed
until requested, with short partial-reason previews near the visual. When a
browser-testing session is already available, the optional maintainer/artifact
QA helper `checkCohortFindings(page)` in `scripts/check-cohort-findings.mjs`
clicks counts and marks, not just their colors. It is not a prerequisite to use
the skill; report browser checks not performed when tools are unavailable.
Canceled, duplicate, accepted-risk and ticket-Done are not verified closures.
Deduplicate once with an explicit mapping; never count a finding twice because
it appears in two views, multiple tickets or two throughlines.

## Repeatable letters and a real operational A+

Also show source-backed delivery progress per `stakeholder-story.md`. Missing
rubric mappings do not prevent counting a clearly labelled original ticketed
cohort's tracker status. Keep such observations separate from verified findings,
readiness grades and the immutable original assessment. Do not call a ticketed
subset the entire baseline or hide all completed work behind `Not reconciled`.

At baseline creation, translate the adapted anchors into stable, observable
criterion IDs. Each criterion records applicability, dimension, required tier,
pass/fail test, evidence method and freshness window. Confirm which dimensions
are mandatory. Do not add harder acceptance tests during synthesis.

For a new baseline, use this default policy unless the user approves another:

- Per dimension, award the highest **fully satisfied** anchored tier: F, D, C,
  B or A. Split any combined D/F anchor into explicit project-specific tests
  during confirmation. Plus/minus thresholds are optional, but must have
  explicit tests frozen at baseline; never improvise them from "momentum".
- A+ requires all A anchors **and** the dimension's pre-agreed A+ acceptance
  checks. These name the actual target operating scenario, measurement window,
  recovery/failure exercise where applicable, and regression guard. A ticket to
  run the check later does not pass it. No A+ test on record means A is the
  highest awardable tier, not permission to invent an "extra credit" test.
- Roll up each verdict using the **lowest mandatory dimension across all
  components and standing lenses**. Print the limiting cells. No averages,
  GPA conversions, discretionary uplift or weights hidden in prose. A custom
  aggregation policy must be explicit, versioned and approved at baseline.
- A required criterion that was not checked or has stale evidence is **unknown**,
  not a pass, a zero, or the last grade carried forward. If any mandatory cell
  is unknown, the overall is `Incomplete`; show verified cells and the last
  verified overall with its date separately. It cannot answer GO or A+.

An overall **operational A+** additionally requires all of these this run:

1. Every mandatory cell meets its frozen A+ checks on every in-scope tier.
2. No unresolved baseline finding, blocking new finding, live exposure or
   activation gap remains. Original accepted risks stay visible and unclosed.
3. Required regression controls actually evaluate; a disabled or always-green
   gate cannot pass. Deployment identity and applied configuration match the
   evidence. A merge, PR approval or a healthy endpoint alone is insufficient.
4. All required evidence is current within its agreed window. "Watched working
   this run" anchors still require this run; a freshness window cannot weaken
   them. Missing access and hypothetical headroom cannot earn an upgrade.
5. Scope coverage is complete. Newly discovered components, environments or
   agents needing criteria block an estate-wide A+ until assessed under an
   approved scope version. State the approved scope beside any scoped A+.

Keep as-written and operational roll-ups separate. Grade exceptions may qualify
an ordinary letter under `report-card.md`; they never waive A+ checks or turn
unverified work into verified closure. A+ is a dated operational claim, not a
permanent badge. Later regressions must lower it. Keep recommending the next
highest-impact verified gap, not manufacturing work after the target is met.

## Evidence and changes, without rewriting history

Each observation records finding/criterion ID, result (`pass`, `fail`, `unknown`,
or pre-approved `not-applicable`), evidence reference, observed time, environment,
revision or configuration identity, and verification method. Store only the
minimum safe evidence; never secrets, raw credentials or customer payloads.

- **Code / activation:** earned as-written / operational movement on unchanged
  criteria. Cite what changed and the verification. An actual regression counts.
- **Information:** newly discovered truth on existing scope updates the current
  verdict. Label it `new evidence`, not remediation or regression. Append a
  dated correction record referencing the original assessment, never mutate
  that assessment or overwrite its reported letter. A finding shown never to
  have been true is `retracted`, not `resolved`: same append-only rule, and
  the record must name what contradicts it.
- **Instrument / scope:** show baseline-scope results and new-scope findings
  separately, with the coverage gap explicit. Do not automatically promote the
  expanded panel to baseline on the next run. Unreached baseline checks are
  unknown, not removed from the denominator.

A rebaseline requires a stated reason and explicit user approval. Create a new
baseline version with parent ID, old-to-new criterion/finding mapping and the
approval record. Keep the original entry and full history accessible. Comparisons
across incompatible contracts say `Not comparable`; no joining the charts with
an improvement arrow. New access does not erase the original program.

## Assessment scope and revision identity

Key results by scope: `code`, then each named runtime environment such as
`staging` and `production`. Each has its own original/current assessment IDs,
cells, coverage, evidence windows and overall. A selector changes the dataset,
not the label over a shared letter. An approved cross-environment roll-up may
exist separately, but never substitutes for environment-specific results.

Freeze `sourceCodeRefs[]` at audit time: repository, explicit branch/ref, full
resolved commit and observedAt. The current checkout and default branch are not
evidence of what an earlier auditor read. Record `runtimeRefs[]` independently:
environment, service, revision, image digest, resolved commit, observedAt and
verification status. Missing values are null with a reason. Preserve mixed
service revisions rather than choosing one as the environment version. An HTTP
200 or green CI alone does not verify the deployed commit.

Older blended operational ratings belong in `legacyCombined`, with their
original source and observation date. Do not migrate them into staging or
production cells. Render missing pairs as `Not separately assessed` or
`Not reassessed`; render unpopulated finding counts as `Not reconciled`, not 0.
Keep these presentation mappings outside immutable historical assessment
records. Do not append a fresh assessment merely to record a layout rebuild.
Retain any legacy revision fields in existing records; richer manifests belong
in new assessments or separately attributed import metadata.

## Persist before publishing

Reconcile the existing roadmap through `roadmap-reconciliation.md` before
publishing a re-grade. Its completion observations cover all roadmap items,
including delivered work outside the original finding cohort. Keep them in the
shared artifact model, separate from immutable assessments and grading criteria.
An unchanged grade must not leave the board or Gantt on stale completion data.

Use a machine-readable ledger, not prose memory alone. Default local home is
`docs/roadmap/assessment-ledger.json` in the project repo; if repo writes are not
appropriate, agree a durable private document or attachment instead. Record its
location in memory and the artifact contract. The artifact may embed a
publish-safe copy, but never publish sensitive evidence merely because it lives
in the private ledger. Do not commit or push a project's ledger without authority.

Minimum schema, with stable opaque IDs and ISO timestamps:

```text
schemaVersion: 1
projectId, artifactUrl, ledgerRevision
originalBaselineId, activeBaselineId
baselines[]:
  id, parentBaselineId, initialAssessmentId, createdAt, approvalRef
  scope: components[], environments[], mandatoryCells[]
  instrument: version, anchors, aggregation, coverage, evidenceWindows
  criteria[]: id, cellId, tier, test, method, applicability
  initialFindingIds[], aPlusGateCriterionIds[]
findings[]:
  id, criterionIds[], firstSeenAssessmentId, severity, blocking, sourceRefs[]
assessments[]:
  id, baselineId, previousAssessmentId, observedAt, instrumentVersion
  scopeCoverage, sourceCodeRefs[], runtimeRefs[], observations[], findingStates[]
  resultsByScope: code, <each runtime environment>
    originalAssessmentId, currentAssessmentId, cells[], coverage, overall
  legacyCombined: originalSourceRef, observedAt, asReportedResults
  asWrittenCells[], operationalCells[], overalls, movementClasses[]
  baselineResolvedIds[], newOpenFindingIds[], activationGapIds[], exposureIds[]
  sourceRefs[], correctionNotes[], contentHash
```

A `findingStates[]` entry carries `status` from `resolved | partial | open |
unknown | retracted`; a `retracted` entry also carries `contradictedBy[]`
(evidence references) and `retractedInAssessmentId`. The engine refuses a
retraction without both, and `compareFindings` reports `retractedIds`,
`newRetractedIds` and `sincePrevious.newlyRetractedIds` beside the resolved
sets so the panel's error rate can be printed from the same arrays that
produce every other count.

Arrays of IDs are the source of counts. Compare exact sets, not just totals.
Validate unique IDs, valid references, required fields, approved baseline
identity, matching frozen criteria and every earlier assessment hash before
appending. A missing historical finding or criterion is an error, not deletion.
Sort identifiers and use a deterministic JSON serialization for the assessment
hash, excluding `contentHash` itself and mutable publication metadata. A hash
detects accidental rewrites; it is not authentication. Never regenerate IDs from
titles, row positions or run dates. Append amendments as separate dated records.

Read the remote artifact and ledger revision again immediately before writing.
On a revision conflict, stop and reconcile; never overwrite another session's
assessment. Build the new ledger and artifact from the same in-memory revision,
validate both, save the ledger, then update the hub and verify it by reading it
back. If publishing fails, keep that assessment ID and retry publication, not
the audit. The hub advertises only its last successfully published revision.

Every artifact is one current view over **immutable dated assessments**. A
single canonical URL may be republished; previous assessments and baseline
content must remain accessible in History at stable fragment IDs. Standalone
immutable exports are optional snapshots, labelled with assessment ID and a
link back to the hub where permissions allow. Keep the local hub at the same
directory and entry path; append history and evidence within it instead of
cloning the entire workspace per assessment. Migrate old cards by linking or
preserving their content, not replacing them with the newest grade.

## Acceptance scenarios before shipping a grade

- Unchanged evidence and criteria reproduce the same letters and denominators.
- Closing a ticket without deployment improves neither operational letter nor
  verified burn-down. Live proof can improve both in a later observation.
- Reopening an original finding reduces resolved progress; adding a new finding
  changes the new-findings register, not the initial denominator.
- Retracting a finding changes neither the resolved count nor the denominator,
  and the original record stays readable with the contradicting evidence.
- Losing credentials yields incomplete coverage, never a better letter.
- A newly discovered live exposure blocks A+ even with an otherwise perfect
  baseline panel. An accepted exception cannot hide it.
- An instrument change or explicit comparison to another date does not replace
  the initial baseline. Rebaseline approval creates lineage, not deletion.
- Reloading from the saved ledger and artifact alone recovers the same baseline,
  history, current verdict and next required checks without conversational memory.
