# Evaluations

Maintainer-facing. Not loaded when the skill runs, and deliberately not linked
from `SKILL.md`: a scenario file read mid-run is context spent on a rehearsal of
the thing being done.

Each `*.eval.json` follows the published evaluation shape (`skills`, `query`,
`files`, `expected_behavior`) plus two fields this skill needs:

- **`gap`** — what a model does WITHOUT the skill. An evaluation that passes
  identically with and without the skill measures the model, not the skill, so
  every scenario here names the failure it exists to catch.
- **`must_not`** — behaviors that fail the scenario however good the rest is.
  Most of this skill's value is restraint: no invented dates, no second
  artifact, no rewritten baseline, no build in answer to a question.

## Running one

There is no built-in runner, by design of the format. Run a scenario by hand:

1. Start a session with the skill available and no memory of this repository.
2. Copy `fixtures/` somewhere outside the skill directory so the run cannot read
   the evaluation that grades it, and open that copy as the working directory.
3. Paste the `query` verbatim. Supply nothing else — a hint given by hand is the
   thing being tested.
4. Grade each `expected_behavior` and `must_not` line as met, missed or not
   reached. A missed line is a skill defect until proven a model defect: rerun
   it on another model before editing the skill.

`node --test scripts/evals.test.mjs` checks the scenario files themselves — the
shape, the fixtures they name, the model-independence of `gap`, and that the
fixtures stay synthetic. It cannot tell you whether the skill passes them.

## Release model coverage

Run changed scenarios on more than one model, including the model intended to
lead assessments. Supporting-model runs can expose instruction weaknesses;
they do not qualify a different model as a grading lead. Keep runtime guidance
provider-neutral and name the exact evaluated models only in the run record.

Before release, complete a grading scenario on that lead model. Supply a
synthetic project with a recoverable rubric, original baseline and history,
tickets and code at a declared revision, and dated runtime evidence for the
selected environment. Include a ticket/code disagreement and an operational
claim without proof so the run must distinguish delivery, implementation and
operating evidence. Establish scope and permitted local writes in the query;
provide any required auditor tools or explicitly agreed review method. Never
weaken the method or invent a user reply just to finish the evaluation.

Check the complete path: source coverage and reconciliation, criterion findings
and unknowns, executable grading under the established method, immutable
baseline/prior history, a new assessment appended to the ledger, and a validated
update to the canonical local artifact. Keep publication outside the run unless
separately authorized. Commit the synthetic scenario and fixtures so the result
can be reproduced. Scenario 03's missing-baseline clarification is a separate
test and cannot stand in for this completed assessment.
Compare the history lock with the retained pre-run bytes, and inspect that the
agent verified with the original `--history-lock-sha256` (or API option). A
rewritten lock and manifest agreeing with each other is not preservation.

Record in `RESULTS.md`: skill revision or candidate diff, exact model identifier
(or explicitly unavailable), reasoning settings when exposed, tools and auditor
configuration, time/spend limits, supplied user replies, checks reached, actual
outcomes and artifact validation. A timeout, budget cutoff, pending question or
helper-test pass is not a completed grading run. Resolve failed or incomplete
required checks before release; do not recast harness limits as model incapacity
or claim an untested model is qualified. Earlier releases' results remain
historical evidence and are not retroactively certified by this requirement.

## The fixture

`fixtures/meridian/` is an invented freight-telemetry project: two planning
documents that disagree in the usual way (a decided architecture memo, an
undecided set of review notes), a tracker export with **no target dates on any
open issue**, two Done tickets, and three deliberately undecided questions.
`fixtures/prior-artifact.html` is a trimmed prior page carrying a direction
contract, a permanent baseline and one dated observation, for the modes that
must update rather than rebuild.

Nothing in the fixture describes a real company, product or person, and nothing
from any user's project belongs here.

`fixtures/projects.json` and `harbor-artifact.html` add a second project with no
selected target. `fixtures/ticket-code/` pairs a Done ticket with code that fails
its acceptance, applicable repository instructions and an untrusted instruction
inside the ticket. These exercise scope clarification and the evidence boundary.

Scenarios 07–12 cover ambiguous project selection, uncertain grading scope,
explicit no-action, delivery-only scope, unresolved relevance and ticket/code
disagreement. Scenario 03 deliberately lacks a recoverable grading method: its
expected outcome is a clarification request, not a completed assessment.
Scenario 13 exercises unresolved WSJF, horizon and baseline-scope decisions.
Scenario 14 exercises the selected-model boundary and an explicitly undecided
action. Scenario 15 is a complete, deliberately scoped grading run with an
approved executable rubric and a single-agent review method. Its
`fixtures/complete-grade/` workspace includes code and dated production snapshots,
an immutable baseline/history lock, and a canonical artifact with a valid initial
manifest. The evaluation must independently interpret those inputs, execute the
grading helper and verify the updated artifact; expected grades are kept in the
scenario definition, outside the agent's workspace. It does not validate a full
multi-auditor panel, other dimensions, live probes or hosted publication.
The fresh-build case allows further clarification as new gaps emerge; question
cases do not require an unsolicited offer to create an artifact.
Question scenarios stop at the question when no answer is supplied; do not invent
an answer to make the run complete. The automated suite validates scenario files,
not these behavioral outcomes. Record any tool or model limitations in RESULTS.

## First-use and recurring-review journeys

Scenarios 16–19 exercise the lightweight path with all necessary scope decisions
supplied: a first ungraded artifact from raw planning/issue sources, two approved
horizon moves, creating a grade-opportunities view from recorded observations,
and evidence-only refresh. Scenario 18 starts without a grade-planning view so
checking an existing section is not a substitute for producing the requested one.
All fixtures are synthetic. An actual participant study remains separate; see
`docs/usability-study.md` for tasks and consented measurement boundaries.

For each run, record exact model, candidate fingerprint, tools, budget, elapsed
time, supplied replies and final artifact verification. Measure successful task
completion separately from a model returning normally. Record missing measures
as null. `scripts/summarize-evals.mjs <runs.json>` summarizes records with:

- `scenario`, `model`, `status` (completed/failed/blocked/timeout), `elapsedSeconds`.
- `firstUsefulArtifactSeconds`, `clarificationRounds`, `unsupportedClaims`,
  `scopeRegressions`: measured nonnegative numbers or null.
- `historyPreserved`: true, false or null when not evaluated/applicable.

Do not infer first-use latency from whole-run elapsed time or call a helper-test
pass an end-to-end success. Publish completion counts with their scenario and
model coverage; blocked and timed-out runs remain in the denominator. No telemetry
is collected from users or generated artifacts by these helpers.
