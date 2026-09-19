# Changelog

## 2.3.0 - 2026-09-19

- Re-test the previous assessment's open findings before any new auditing.
  Each gets exactly one outcome: held, fixed, retracted or unknown. A
  retraction keeps the finding's ID and record, appends the contradicting
  evidence and the retracting assessment, never counts as a fix and never
  shrinks the denominator. The retraction fraction over findings first seen
  on the previous card is printed in the measurement band and the instrument
  manifest as the panel's own error rate.
- Add `retracted` to the assessment engine, cohort register, progress
  segments and finding filters, rendered by form rather than grade hue. The
  engine refuses a retraction without contradicting evidence, excludes it
  from blockers and reports `retractedIds`, `newRetractedIds` and
  `newlyRetractedIds` beside the resolved sets. `verify-artifact` refuses a
  bundle that retracts in the ledger while the page prints no
  `data-panel-error-rate` element, a gap a supporting-model eval run exposed.
- Two auditor rules from production use: a log line is evidence of what was
  printed, not of what happened; a merged declaration is not an applied one.
  Prompts are checked for expanded calibration and coverage content before
  fan-out.
- Add a re-test scenario (21) with a synthetic prior finding that the
  recorded source contradicts.

## 2.2.3 - 2026-09-14

- Show completed scope with a checked, readable neutral badge. Keep outstanding
  follow-ups separate and evidence links accessible; avoid crossed-out titles
  and disabled controls. Share this presentation across desktop/mobile boards
  and Gantt views.
- Tighten mobile controls and stop neighboring roadmap items stretching each
  other. Standardize Evidence headings, environment-proof spacing, grade rows
  and standalone link targets through shared styles and authoring guidance.
- Add a synthetic completion/layout scenario covering presentation-only updates
  with preserved evidence, baseline, dates and active work.

## 2.2.2 - 2026-09-14

- Accept null optional tracker labels as unknown work type so a complete delivery
  refresh does not crash or invent a classification. Reject malformed label data
  with a clear validation error.
- Honor information and instrument movement classifications in qualitative grade
  rendering: retain current and previous letters without earned-trend arrows.
- Add behavioral regressions for preserved delivery, input immutability, malformed
  metadata and non-trend grade changes. 144 helper tests pass.

## 2.2.1 - 2026-09-14

- Keep the new CLI helpers inert when imported from `node -`, `node -e`, or a
  module whose argument is not an existing file. Preserve symlink-aware direct
  execution through a shared `isMain` helper.
- Add stdin/eval/nonexistent-argument regression checks; extracted release
  packages still build a validated artifact. 142 helper tests pass.
- Verify the hosted synthetic demo matches the released local artifact exactly.

## 2.2.0 - 2026-09-14

- Shorten the entrypoint and route simple creation to a local, ungraded workflow;
  preserve the complete established/custom/graded workflow in a routed reference.
- Add a versioned roadmap model and dependency-free normalize/refresh/render/
  validate pipeline with resumable checkpoints, atomic replacement, concurrent
  edit refusal, file-mode preservation and immutable planning/assessment inputs.
- Make evidence-backed changes and upcoming decisions visible; separate customer
  problem, intended outcome, success measure, delivery and observed impact.
  A timestamp-only source recheck is not a substantive change.
- Add drag-and-drop and keyboard-accessible horizon movement, proposed-state
  review, required reasons, downloadable proposals and approved canonical updates
  with preserved evidence, grades, dates and movement history. No tracker edits.
- Add grade-opportunity planning from approved existing rubrics and observations:
  exact criterion/proof mappings, shared gates, dependencies, component versus
  overall effects, missing mappings and incomplete evidence. Grade-only ordering
  is separate from business priority/WSJF; no projected letter is earned by Done.
- Publish a synthetic interactive demo, before/after example, screenshot and
  recorded walkthrough; rewrite onboarding around user outcomes and real requests.
- Build tested Claude Code and portable release archives with checksums; remove
  host-only frontmatter automatically for the portable package.
- Add artifact-producing first-use, movement, priority and refresh evaluations,
  null-aware journey measurements and a real-user study protocol. Record two-model
  runs and independent lead grading, plus browser acceptance and preservation tests.

## 2.1.1 - 2026-09-11

- Keep model and provider selection under the user and host's control. Define
  reasoning-lead and supporting extraction roles without prescribing model
  families; require evidence checks before supporting findings affect grades.
- Require release evaluations to include the intended assessment lead and a
  completed grading run through canonical artifact and history validation.
  Record model/tool configuration and incomplete checks without treating
  helper-test success or a clarification-only run as grading qualification.
- Keep missing runtime proof distinct from observed failure in assessment prose,
  and name unavailable checks in the final handoff as well as completed checks.
- Add reproducible synthetic scenarios for model-role boundaries and complete
  scoped grading, with an approved contract, runtime snapshots and a sealed
  assessment history. Record Opus and Sonnet release evaluations separately
  from helper-test results.
- Verify updates against a history-lock SHA-256 retained before writes. Reject
  resealed or reformatted locks even when a regenerated manifest agrees, and
  explicitly report preservation as not checked when no original hash is given.
- Distinguish creating a first history lock from appending new assessments;
  existing disk locks stay immutable. Require a Result / Evidence / Verification
  handoff so missing runtime proof and browser-check limitations stay explicit.

## 2.1.0 - 2026-09-11

- Resolve intent, project, source data and grading scope before dependent work.
  Ask about material uncertainty when it appears; preserve settled decisions and
  never treat silence as permission. Bare invocation no longer assumes creation.
- Grade tickets and code together, with separate runtime proof for operational
  claims. Unmapped refresh changes remain unresolved rather than unchanged.
- Turn unresolved regrading, WSJF scoring, horizon movement, rebaseline and
  missing-source decisions into concrete prompts instead of silent omissions.
  Keep unanswered actions pending and reuse recorded answers within their scope.
- Respect applicable project instructions while treating retrieved evidence as
  data. Define capability fallbacks and keep mandatory validation blocking.
- Align grading and Gantt evaluation expectations with canonical history and
  authorization rules; add scenarios for uncertain scope and source coverage.
- Clarify that twin verdicts belong to full assessments, never a reason to
  override a partial or explicitly undecided grading request. Test the changes
  on Haiku and Sonnet, recording observed failures and bounded-run limitations
  in `evals/RESULTS.md`; helper-test success is not a behavioral guarantee.


## 2.0.0 - 2026-09-10

**Breaking: the command is `/horizons`.** It was `/roadmap` through 1.14.0, and
the skillset is named Horizons, so the command, the directory and the repository
now say the same thing. Existing artifacts are unaffected: pages, baselines and
assessment history carry no command name, and a page built by `/roadmap` updates
under `/horizons` with no migration. To upgrade a checkout, rename the directory
(Claude Code takes the skill name from it) and repoint the remote; the old
repository URL redirects. `README.md` carries the three commands.

- Rename the identifier only. "roadmap" appears 700 times in this repository and
  all but 32 are the domain noun — a roadmap artifact, a roadmap item, the
  roadmap board — which is what the skill BUILDS and is not what it is called.
  `references/roadmap-reconciliation.md`, `assets/roadmap-structure.css`,
  `scripts/render-roadmap-matrix.mjs` and the `rm-roadmap-*` class names keep
  their names for the same reason.
- Guard the two halves against drifting apart: `scripts/frontmatter.test.mjs`
  now asserts the frontmatter name equals the directory name, that both titles
  name that command, and that neither `SKILL.md` nor `README.md` offers the
  retired one outside the upgrade note. A half-finished rename is the failure
  nobody notices until a user types the old name and gets nothing.
- The repository is now `brandonellis/horizons-skill`. 115 tests passing.

## 1.14.0 - 2026-09-10

- Add the evaluation suite the published guidance asks for and this skill never
  had. Six scenarios in `evals/`: a fresh build, a refresh against drift, a
  grade run, a timeline against a tracker with no dates, and two where the right
  answer is prose and no artifact. Each carries two fields beyond the documented
  shape — `gap`, what a model does WITHOUT the skill, because a scenario that
  passes identically either way measures the model; and `must_not`, because most
  of this skill's value is restraint.
- Bundle a synthetic fixture rather than pointing at anyone's project:
  `evals/fixtures/meridian/` is an invented freight-telemetry project whose two
  planning documents disagree in the usual way, whose tracker carries no target
  date on any open issue, and which leaves three questions explicitly undecided.
  `evals/fixtures/prior-artifact.html` is a trimmed prior page with a direction
  contract, a permanent baseline and one dated observation, for the modes that
  must update rather than rebuild.
- Guard the suite with `scripts/evals.test.mjs`: the minimum of three scenarios,
  unique ids, fixtures that exist and are not empty, at least four expectations
  each, a stated gap, a non-empty `must_not`, coverage of building AND updating
  AND not building, and fixtures that stay synthetic. Expectations written on
  words with no observable meaning ("handles it properly") are rejected.
- Run two scenarios across Haiku 4.5, Sonnet 5 and Opus 5, recorded with their
  date in `evals/RESULTS.md`. The scope clause holds wherever it is reached: no
  model built or published in answer to a question. Two defects stay open —
  Haiku did not select the skill even when it was named, and two of three models
  did not offer to build as a next step. Four scenarios are unrun, and every one
  that produces an artifact is among them.
- Require the run in `AGENTS.md`: a change to a mode, a phase or a decided rule
  needs its scenario run by hand on more than one model before release. The test
  suite checks the scenario files; it cannot tell you the skill still passes
  them. 114 tests passing.

## 1.13.0 - 2026-09-10

- Give every reference over 100 lines a generated `## Contents` block. Eleven
  files qualified and none had one, including the three largest, so a partial
  read of a long reference could not see what it contained. The block sits under
  the lead paragraph that says when to load the file, never above it.
- Generate rather than hand-keep it: `scripts/build-reference-contents.mjs`
  rewrites the blocks and `scripts/reference-contents.test.mjs` asserts each one
  equals its file's headings in both directions, so a renamed or added section
  reddens the build instead of leaving a table of contents that lies.
- Name the two renderer modules nothing pointed at.
  `scripts/render-letter-reassessment.mjs` and
  `scripts/render-evidence-groups.mjs` were reachable only by guessing a
  function name; a script no file names cannot be used. The letter reference now
  also documents the `assessment.lenses` input, its per-lens shape and its
  refusals.
- State the calling convention once: `scripts/` are ES modules to import, and
  the two executed commands are named. A renderer's value is the shapes it
  refuses, which hand-written markup silently discards.
- Add `scripts/frontmatter.test.mjs`: the published name and description limits,
  third person, a trigger clause, every mode discoverable from metadata, and the
  500-line body budget (494 today, six lines of headroom). It also requires every
  non-spec frontmatter key to be declared with its cost and documented in the
  README. `argument-hint` is that key and is kept deliberately, so the README now
  tells an importer to delete the line before a claude.ai upload or
  `package_skill.py` run, which refuse it by name. 109 tests passing.

## 1.12.1 - 2026-09-10

- Fix the strip note's sentence break. A lens named with a question ("Does it
  learn?") produced "Does it learn?." and a counted preamble that read as
  boilerplate. The note now lists lens names and adds a full stop only when the
  last name carries none. 102 tests passing.

## 1.12.0 - 2026-09-10

- Put standing lens letters on the grade strip. `renderLetterReassessment` now
  takes `assessment.lenses` and renders a tile per lens after the component
  panel, with a `lens` marker, its own assessment date and a link to the lens
  section. Lens grades were rendered only in their own sections further down the
  page, so on a real card the estate's two lowest letters were absent from the
  one place a reader looks for letters, and the strip read as the whole picture.
- Keep the widening visible rather than silent. Component tiles now declare
  `data-grade-scope="component"` and lens tiles `data-grade-scope="lens"`, and
  the renderer returns a `lensNote` naming which tiles are lenses and stating
  that they grade a different question on their own scale and sit outside the
  baseline, its finding denominator and any overall letter. A lens on the strip
  is a presentation change; it still never joins an overall grade.
- Refuse a lens that cannot be read honestly: a missing or malformed letter, a
  missing or unparseable date, an unknown status, a duplicate, or an id that
  collides with a component all throw rather than render. A lens whose status is
  not `assessed` prints "Last assessed" and takes the carried-forward weight, so
  a stale lens beside fresh component letters cannot pass as current.
- Style and guard the tile: lens tiles claim their own grid track and carry a
  marker badge, asserted outside any media query by `rendered-classes.test.mjs`.
  101 tests passing.

## 1.11.0 - 2026-09-10

- Load the fonts the shipped CSS names. `assets/` referenced "Barlow Condensed"
  and "JetBrains Mono" while nothing in the skill ever loaded them, so every
  artifact built from these assets rendered in the system UI font while claiming
  a typographic register. Add `references/visual-identity.md` with the concrete
  Google Fonts link, correct the false belief that the Artifact CSP blocks font
  CDNs, and put the link in the copy-ready view shell.
- Settle palette and type once per project instead of per run. The same project
  was producing a different invented visual world in every session. Introduce a
  recorded BRAND CONTRACT: inherit the project's existing tokens, theme seed or
  brand palette, map the shell tokens onto it, and record it in the page's
  DIRECTION CONTRACT and in memory so later runs apply it rather than redeciding.
  Keep the grade scale semantic and separate from any brand accent.
- Guard both with `scripts/visual-identity.test.mjs`: a webfont named by the
  shipped CSS must have a documented way to load it, the load instruction must be
  a real CSP-permitted link with preconnect and `display=swap`, and the brand
  contract must name where it is recorded. 96 tests passing.

## 1.10.2 - 2026-09-10

- Give the grade tiles their own base layout. `stakeholder-overview.css` shipped
  only the overrides for `.rm-grade-grid` and `.rm-grade-tile`, so
  `renderLetterReassessment` output rendered as an inline run of links at every
  width outside the 600px media query. Tiles are now a real grid of anchors,
  with carried-forward and blocked letters distinguished by weight rather than
  by hue.
- Guard the class against returning: a new regression test fails when any class
  that owns a layout declares it only inside a media query, and checks that a
  tile keeps `text-decoration: none` and `min-width: 0`. 93 tests passing.

## 1.10.1 - 2026-09-10

- Require refresh, grade, score and format updates to reuse the canonical
  workspace, entry file and URL. Preserve the baseline, append history and new
  evidence inside the hub, and verify updates before replacing the current page.
- Remove automatic private-bundle creation when hosting is unavailable. Make
  exports explicit and publication staging temporary; do not delete existing
  copies without permission or treat a staged bundle as the working roadmap.
- Mark the shared workflow rules as execution instructions for every agent and
  add a Claude maintainer entry point importing the same `AGENTS.md` policy.

## 1.10.0 - 2026-09-10

- Roll completed capabilities, improvements and bug fixes up beneath broad
  features using source-backed relationships. Preserve original requirements,
  scoped milestones and grading baselines; separate open follow-ups and mapping
  gaps. Add deduplicated feature credit and static status-aware drill-downs.
- Require a complete maintainer release handoff: validation, a dated changelog,
  an annotated version tag, a published GitHub Release and remote verification.
  Keep this policy separate from ordinary skill execution in user projects.
- Document the feature-rollup helpers and validate them with the expanded
  dependency-free regression suite: 91 tests passing.

## 1.9.0 — 2026-09-10

The stakeholder release: a summary-first reading path through the artifact,
standing assessment lenses that survive a partial refresh, and real letter
reassessment in place of ticket-acceptance review.

- Give stakeholder artifacts a summary-first reading path across Roadmap,
  Progress and Evidence. Show dated component grade movement separately from
  targets, keep scalability visible with an on-demand capacity breakdown, and
  group evidence by reader question without losing source anchors. Add a
  phone-readable board from the same placements and reusable hierarchy styles.

- Preserve scalability as a standing assessment lens across partial refreshes.
  Restore its dated grade, dimension grades and capacity ladder without changing
  the initial baseline. Add a reusable renderer and fail bundle verification
  when a registered lens or its evidence disappears.

- Run actual letter assessments, not just ticket acceptance reviews. Preserve
  established qualitative methods while replacement rubrics await approval,
  record fresh component judgments with a tested helper, and render the new
  results. Preserve baseline/history, explain unchanged letters, and never infer
  a fresh overall or operational grade from a partial source review.

- Make refresh conditionally reassess relevant grading criteria on assessed
  artifacts. Reconcile completed work, reopenings and changed evidence, then
  verify affected criteria and update supported grades under the same approved
  baseline contract. Distinguish unchanged, not reassessed and blocked results;
  preserve explicit delivery-only mode and never award letters from counts.

- Add source-scoped muted completion styling across matrix, Gantt and details.
  Keep explanation links, keyboard focus and filtering active. Completed
  milestones require a visible remaining-work label and never imply that the
  entire initiative is finished. Ticket counts alone do not trigger the style.

- Compose stakeholder Gantts as theme lanes under one continuous calendar, with
  initiative titles and progress inside the bars instead of repeated quarters.
  Pack non-overlapping windows without changing dates, retain cross-theme
  membership and filters, and separate undated priorities from calendar tracks.

- Clarify stakeholder Progress with separate outcome, fixed-cohort, throughput
  and dated readiness layers. Add validated finding/delivery renderers; keep
  assessment-reference counts in supporting detail without changing any grade.
- Keep initiative details shared across roadmap formats. Restore the originating
  chart/view, filters, scroll and focus through visible return links and browser
  history, with shared-link/no-JavaScript fallbacks and optional maintainer QA.

- Persist approved horizon changes across regeneration. Reprioritized work with
  no new dates can appear in its current Gantt group as explicitly unscheduled,
  without inheriting an obsolete scenario or inventing a delivery commitment.

- Restore compact Gantt rows with a quarter/month axis, original schedule
  geometry and source-versus-scenario styling. Keep completion labels distinct
  from schedule bars and move detailed acceptance into linked drill-downs.
- Scope theme filters to Roadmap only. Place them immediately above the active
  matrix or Gantt, with no intervening sections. Preserve the selection between
  roadmap formats without showing controls or filtering Progress and Evidence.

- Preserve the streams-by-horizons pill matrix and source-backed critical-path
  diagram when regenerating. Add a reusable accessible matrix renderer with
  shared theme filters, stable detail links and deduplicated item identities.
  Completion notes enhance the visuals instead of replacing them with cards.

- Reconcile the whole roadmap during every re-grade, rather than offering a
  separate refresh. Check linked issues, original subtasks and outcome/milestone
  completion, including work outside the audit cohort. Update board, Gantt and
  Progress together; show delivered work and remaining acceptance without
  changing baseline criteria, planning commitments or grades from ticket counts.
- Separate maintainer regression tests from ordinary skill use. Browser QA is
  optional when tools are already available, with no browser/framework install
  prerequisite. Disclose unperformed checks instead of claiming verification.

- Make cohort counts and individual marks open exact ticket records. Partial
  findings show verified work and unmet original acceptance, with separate
  tracker and tier status. Keep the detailed register secondary and test its
  actual count/cell navigation, not merely its colors.

- Restore the colored theme key as shared filter controls, including inline
  board/Gantt tags, synchronized selection, search-aware unique counts and clear.
  Add model tests and a browser check that clicks the real visual controls rather
  than only exercising the legacy dropdown. Keep global grades unfiltered.

- Add an executable whole-tier assessment engine with approved-contract hashes,
  cumulative criteria, separate environment verdicts, evidence freshness and
  deployment identity checks. New findings cannot enlarge the initial cohort.
- Add append-only history locks, behavioral regression tests and an allowlisted
  private-bundle verifier. Packaging does not claim an upload or enable sharing.
- Lead progress with verified outcomes and expandable component next-checks;
  retain original Gantt geometry and distinguish observations from actual dates.
- Make legacy rubric adoption an explicit proposal and approval, never a silent
  reinterpretation of historical letters or a replacement baseline.

- Preserve the creation-time audience and purpose across every mode. Lead with
  visual progress, meaningful wins and the forward roadmap; keep audits in detail.
- Separate all delivered work, fixed baseline-cohort tracker status and verified
  operational readiness so an unchanged letter cannot hide implementation work.
- Restore inherited Gantt windows and scenario provenance instead of replacing
  an existing chart with all-unscheduled text. Add reusable stakeholder visuals.

- Preserve one initial grading baseline across all `grade`/`score` iterations.
  Add a durable assessment ledger, immutable dated history, fixed criterion IDs
  and finding denominators, legacy-card migration and explicit rebaseline lineage.
- Replace discretionary overall grades with a baseline-approved roll-up and
  fixed operational A+ acceptance checks. Keep as-written and deployed reality
  separate; missing evidence is Incomplete. New risks and regressions stay visible.
- Add `score` as an explicit alias of `grade`, distinct from WSJF prioritization.
- Share one artifact across Progress, Roadmap and Evidence views,
  with stable item IDs, per-view freshness and keyboard-accessible, deep-linkable
  tabs. Preserve old records rather than creating a fresh grade universe each run.
- Strengthen NNL design around outcomes, current commitments, entry conditions,
  options and approved movement. Improve timeline provenance, original/current
  commitment tracks, milestones, unscheduled work and mobile schedule readability.
- Remove automatic horizon-to-quarter dates and forced half-quarter snapping.
  Proposed schedules require approval; genuine exact dates retain their precision.
- Extend filters across item representations, remove the five-throughline limit,
  restore explicit expanded collapse preferences, reveal nested deep links, and
  expose full content in print and no-JavaScript views.
- Add a reusable progress-first shell with separate code/staging/production
  assessment datasets, explicit audited refs and per-service runtime identity.
  Keep legacy blended operational ratings in history, not environment grades.
- Place NNL and opt-in Timeline formats under Roadmap, with shared search and
  throughline filters. Collapse original reports under Evidence. Preserve
  unknown counts, original sources and verification dates on layout-only rebuilds.

These rules govern subsequent invocations. Existing published artifacts and
assessment contracts are not silently overwritten or regraded by this update.

## 1.8.0 — 2026-09-08

The learning loop: a conditional third lens for projects that run models or
agents.

- **Runs when the auditor finds a model call site or an agent definition**,
  discovered from the code like components are; absent otherwise, with the
  reason in the footer. Adding it to a chain that lacked it is a panel change
  and follows the quarantine rule.
- **Inventory first.** Agents, prompts, rubrics, judges and learning stores
  are counted, and every measurement is a fraction of that count, so a new
  agent shipped without an eval lowers the fraction on the next card
  unprompted.
- **A loop is closed only when four links are shown this run**: signal (with
  the fraction of production runs that receive one), transform (with its last
  run date), artefact changed (cited, dated example since the baseline), and
  artefact consumed by a later run. A memory written and never read is a
  write-only loop and grades as no loop. Closed over declared enters the
  measurement band, with the missing link named for each open one.
- **An eval is graded on whether it can fail**: today, on this tier, with the
  date it last did. Dark gates are findings, as in the testing & CI lens.
- **A judge is measured against humans or it is asserted**: dated agreement
  measurement with sample size, or its numbers inherit unknown quality.
- **Guardrails graded as deployed, per tier**: switch polarity and value read
  on every tier; record-only is an activation gap and joins that count.
- **Runs priced or not observable**: model, tokens, cache split and cost on
  every run including failed ones; model changes since the baseline listed so
  a letter that moved with the model can be called a code move.
- Stable labels: Eval coverage · Feedback capture · Loop closure · Run
  observability & cost · Output guardrails. Anchors added to
  `references/grade-anchors.md`; prompt ingredient 12; measurement band item
  6; page anatomy gains the section after the ladder; instrument manifest
  records the lens as present or absent.

## 1.7.0 — 2026-09-08

Two questions, two instruments: the burn-down becomes the headline, letters
become a snapshot unless the instrument held still, and the blind rule stops
destroying calibration.

Prompted by a critique of a six-card chain whose letters had moved for
reasons that were not the code: a lens added mid-chain dragged the overall
below cards never measured on it; reach widened on every run and one letter
fall was filed as "partly methodology" in a footnote; the blind rule left
seven fresh agents per run sharing one sentence of rubric, so an unchanged
component moved four letters in a day; and synthesis lowered a grade on an
unchanged system because the panel's information improved. Meanwhile the
counts (ratchet sizes, closed exposures, a raised IOPS ceiling) all pointed
the same way and needed no interpretation.

- **The measurement band leads the card.** Above any letter: the burn-down
  (how many of the baseline's findings this run VERIFIED closed, with ticket
  status alone reported as "claimed"), live exposures closed, the activation
  gap as a single count of declared-but-unapplied things, every ratchet's
  size and direction, and ceilings that moved. Each names how it was taken so
  the next card re-takes it. These answer "did it improve"; the letters
  answer "how good is this"; the card no longer fuses the two.
- **The instrument is versioned and frozen for three cards.** Panel, reach
  and anchors are printed in the footer as an instrument manifest. A card is
  comparable to its baseline only when all three match; otherwise its letters
  are a snapshot, shown without arrows, and the card names what changed.
  Widening reach is a decision declared before the run, never something
  noticed in synthesis; "partly methodology" is split and the methodology
  part leaves the trend.
- **A new lens or dimension is quarantined from the overall** on the card
  where it first appears (marked "first measured"), and when panels differ
  the card prints two overalls, labelled.
- **Blind to the grades, never to the standard.** New
  `references/grade-anchors.md`: letter anchors per dimension that make the
  bar sentence testable by reading, adapted once per project and carried
  verbatim into every auditor prompt. Every auditor also ends with a
  **coverage manifest** (paths read, commands run, probes made, measurements
  re-taken, what was not reached), and the next card hands it to that
  component's auditor as minimum coverage. No letters, no findings: it
  anchors where the auditor looks, not what it concludes.
- **Every letter move is classified**: code, activation, information,
  instrument. Only the first two carry arrows. An information move (the
  system did not change; the card looked harder) RESTATES the baseline in
  prose and memory and never records a rise or a fall. Unclassifiable moves
  default to information: a false arrow costs more than a missing one.
- Ladder: switching between extrapolating from the baseline's numbers and
  deriving them afresh is an instrument change, and its letter is a snapshot.
- Auditor prompt ingredients 9 to 11 (calibration sheet, baseline coverage
  manifest, own manifest in the output); page anatomy gains the measurement
  band and grows the footer; SKILL.md's non-negotiable list goes from six
  rules to eight; README contents list and usage table updated in the same
  commit.

## 1.6.0 — 2026-09-06

The exception register: a gap the team has priced and chosen stops being
graded as a failure.

- **New grading rule in grade mode.** Some gaps are resourcing decisions, not
  defects — an unbought plan tier, managed service, second host or staging
  environment. Grading those as failures every run teaches a team to stop
  reading the card. A register entry suppresses its cell's penalty, under
  four conditions the card re-tests on every run.
- **The four conditions**, all required: a named change with a **dated
  price**; a **measurable trigger** the card can evaluate; a **compensating
  control the card VERIFIED LIVE this run** (never asserted from a README or
  inferred from a merge); and **not lapsed** — the exception ends the run
  after its trigger fires, and the cell then grades as found until the
  purchase lands. Fail any one and it is an ordinary finding again, with the
  failing condition written into the card.
- **Two refusals.** An exception never suppresses a **live exposure**: an
  active disclosure is a finding whatever the budget. And a compensating
  control of "we are careful" is prose, not a control.
- **Rendered by form, never by hue** (dashed border, mono label, no grade
  colour), extending the existing rule that hue encodes the grade tier and
  nothing else — a ladder verdict and a register entry are both not-a-grade
  and must never be readable as one.
- Page anatomy grows by one section (the register, after the scale ladder);
  SKILL.md's non-negotiable list goes from five rules to six.

## 1.5.0 — 2026-09-05

The scale ladder: headroom becomes a graded lens.

- **New standing cross-cutting lens in grade mode.** Every card now grades
  what the project can become without changing, not only what it is: the
  estate and application as measured on the day of the run, projected onto
  the growth the business is pursuing. Runs beside testing & CI on every
  card; never optional.
- **Rungs in the project's own unit** (accounts, tenants, DAU, RPS). The
  bottom rung is the measured present; above it the rungs the business has
  named, or five-times defaults declared as defaults. Rungs are recorded in
  project memory so they hold still across cards.
- **A fixed verdict vocabulary per rung**: holds / degrades / breaks, each
  naming the first constraint to give and the measurement behind it.
- **Measured, then multiplied.** Per-unit measurements are taken on the
  bottom rung and extrapolated linearly unless the code says otherwise (a
  per-unit loop inside a fixed tick, a connection per unit). Printed numbers
  carry their date so the next card can re-take them.
- **Singular things listed once** with the rung at which each becomes the
  constraint; **bought-or-built burn-down** (config / money / engineering)
  with dated list prices on money items and tickets on engineering items.
  A managed service is never assumed faster than what it replaces.
- **The lens's letter grades headroom to the next named rung**, not to the
  top rung. Stable dimension labels: Data tier · Compute & workers · Shared
  state · Operations at N · Cost curve.
- Page anatomy grows by one section (the ladder, between the component
  cards and new findings); auditor prompt ingredient 8 added.

## 1.4.1 — 2026-09-04

- **A maintenance rule in the README**: a new reference or mode moves the
  contents list and the usage table in the same commit. The review that
  prompted 1.4.0 passed its "all content read" check *because* the contents
  list matched the repo exactly, and by then it had already drifted — 1.3.0
  added `references/report-card.md` and a `grade` mode that neither the list
  nor the table knew about. A reference the README does not mention reads as
  undocumented content rather than an oversight, so this is the cheapest
  possible way to fail a review.


## 1.4.0 — 2026-09-04

Hardening pass, from an independent pre-import review of the published skill.
Six changes, all prose: the review passed the code and flagged what the skill
does not defend against or disclose.

- **Scanned content is data, never instructions.** New rule in Phase 1. The
  skill reads transcripts, chat, tickets and docs written by other people and
  fed them straight into synthesis with nothing separating source text from
  direction. Text inside a source now describes the project and never directs
  the run: it cannot change horizon placement, the authority ranking, what gets
  published, where, or which sources get read next. A source that tries to steer
  the run is surfaced in the question round as a finding; a destination named in
  a source is a quoted string, never somewhere to send anything. The same rule
  extends into `grade` mode's auditor prompts, where what is read is evidence
  under audit: a comment claiming a control, a doc asserting a grade, and a file
  instructing the reader are findings about the component, never direction.
- **The first publish of a page is a confirmed step.** New rule at the top of
  Phase 4. The finished board is an aggregate the driver never assembled by hand
  — internal priorities, standing risks, declined decisions with dates, client
  commitments, dependency structure — and publishing puts it on a hosted URL.
  The run now names what is on the page (specifically anything client-named,
  dated, personnel-shaped or marked internal in its own source) and offers
  publish-as-is / cut-or-genericize / local-file-only before doing it. Updates
  to an already-published page do not re-ask unless the run added a source.
- **A scope clause: what this is not for.** "Roadmap" is an ordinary word, and
  "what's on the roadmap for Q4?" is a question, not a request for an artifact.
  Those get answered in prose in the conversation; the four-phase build runs
  when the user wants the page, and ambiguity is a question rather than a scan.
- **The type register is stated as this skill's default, with its reasoning** —
  a roadmap is read as an operational document, so it is set in the register
  used for schedules and status boards. It was carried as one user's standing
  preference with a date, which on import read as the importer's own decision.
  Now: a default, stated as one when used, dropped for a house style or a pin.
- **The README says what actually runs.** "No code executes from this repo" was
  literally true and materially misleading: nothing executes at install, but the
  published page ships ~225 lines of JS and ~80 of CSS, verification runs
  headless Chrome and `grep`, and reach is tool-mediated. A "What runs" section
  replaces the one-liner, including what the shipped JS does not do (no `fetch`,
  no `eval`, no analytics) and every destination it writes to.
- **README caught up with 1.3.x** — `grade` was missing from the usage table and
  `references/report-card.md` from the contents list.

## 1.3.1 — 2026-09-03

Shape-agnosticism pass on grade mode.

- **"Fleet" dropped from the mode's name** — a report card grades a single
  service, a monorepo, or a many-repo estate identically once carved into
  components.
- **Component defined and discovered, never assumed**: a unit someone could
  own and grade in isolation, found from the project's own structure the same
  way Phase 1 discovers sources; fan-out scales to the discovered count.
- Repo-shaped language (per-repo cards, repos-by-dimensions board, "the
  fleet is B+") generalized to components throughout.

## 1.3.0 — 2026-09-03

Grade mode: the fleet report card. Generalized from two real audits of a
five-repo multi-tenant fleet (a baseline, then a pre-deploy re-grade).

- **New `grade [<baseline-card-url>]` mode.** A letter-graded, evidence-cited
  audit of code + infrastructure: one blind, read-only auditor per component
  plus a cross-cutting lens; five stable dimensions; every grade carries cited
  evidence and its gaps-to-the-next-grade-up. The bar is stated in every
  auditor prompt: an A means showable to an outside CTO without caveats.
- **The twin verdict.** As-written AND operational reality — merged-but-not-
  deployed is an activation gap, credited in one and debited in the other.
  A gate answer (GO / HOLD) joins them when the run gates a decision.
- **Every card is a dated record** — a new artifact per run, never a
  republish; each card links its predecessor, and the chain is the trend
  line (the deliberate inverse of the horizons update-in-place rule).
- **Counts are grades**: shrink-only list sizes and directions report as
  quality metrics; a debt moving from unmeasured to pinned earns explicit
  credit even when the letter holds ("same letter, different substance").
- **Synthesis discipline**: letter-move accounting, the outlier rule (a grade
  that does not follow from its own evidence goes back to its auditor, never
  silently adjusted), tickets filed for new findings before publishing, and
  the roadmap-drift handoff (end a grade run by offering the horizons
  refresh).
- New reference: `references/report-card.md` (methodology, auditor prompt
  ingredients, fan-out scaling, page anatomy).

## 1.2.0 — 2026-09-02

Optional WSJF cost-of-delay scoring layer.

- **New `wsjf [<path-or-url>]` mode.** Bare invocation bootstraps a scoring
  worksheet from the synthesized themes (proposed scores, one confirmation
  round — only a confirmed sheet ever renders); a target points at existing
  scoring (committed file, CSV, or connected sheet). The source is recorded in
  the DIRECTION CONTRACT and inherited by every later run.
- **Scores rank, they never place.** A `wsjf N.N` chip on scored cards,
  within-horizon ordering by score, and a cost-of-delay strip near the top of
  the page (anatomy grew from 14 to 15 parts). An item's horizon still comes
  from what the sources state.
- **Fixed-date items outrank their score** — cliff-shaped delay curves are
  what a flat score hides.
- **Refresh gains scoring drift classes**: stale scores, orphan rows, unscored
  new themes; re-scoring is a human decision the drift report requests.
- New reference: `references/wsjf.md` (worksheet format, validation, rendering).

## 1.1.0 — 2026-09-02

Feedback round from real readers of a shipped roadmap.

- **Source authority tiers.** Phase 1's source inventory classifies every source
  *record* vs *anecdote*, inferred then confirmed with the driver; the blessed
  ranking persists in the page's DIRECTION CONTRACT so update runs inherit it.
- **Conflicts surfaced, not blended.** New synthesis rule (record decides,
  anecdote fills gaps and is marked) and a new optional page section, "Where the
  sources disagree" (page anatomy grew from 13 to 14 parts). Anecdote-only
  claims carry a mono chip on their detail card.
- **Unreadable authoritative sources are a named footer gap**, never a silent
  omission.
- **Progressive density.** Detail sections ship collapsed by default on heavy
  pages (20+ themes or multi-project boards), with an interaction-layer note on
  making the loader honor a stored "expanded" over the markup default.

## 1.0.0 — 2026-09-01

Initial build, generalized from a shipped Horizons roadmap page.

- Four modes: create, update (artifact-url), refresh (drift report then fix),
  gantt (dated variant, explicit request only), plus help.
- Four phases: discover sources, synthesize (themes, horizons, streams,
  throughlines, critical path, out-of-scope, standing risks), build the page,
  publish and record.
- References: page anatomy (13 parts), interaction layer (filter, collapse,
  derived tooltips), writing floor.
- Decided rules: undated Now/Next/Later by default; dates sourced never
  invented; risks framed as discipline plus a gap; counts re-derived from the
  finished document; refinement preserves, redesign replaces.
