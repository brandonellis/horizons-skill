# Grade anchors — the calibration sheet for grade mode

The bar sentence ("an A means you would show this to an outside CTO without
caveats") states the intent. This sheet makes it testable by reading, so that
a fresh blind panel grades against the same standard the last one did. How it
travels between cards is in `references/report-card.md`, under "Calibration:
blind to the grades, never to the standard".

## Contents

- How to use it
- The default dimensions
- The estate component (infrastructure as code)
- The scale lens
- The testing & CI lens
- The learning-loop lens (when the project runs models or agents)
- The instrument manifest (printed in every footer)
- The coverage manifest (one per auditor, carried on the card)

## How to use it

- **Adapt once per project.** Relabel dimensions in the component's own terms
  where report-card.md allows it and swap the examples for the project's
  technology. Never change what separates one letter from the next. Record
  the adapted sheet in project memory beside the ladder rungs.
- **Carry it verbatim into every auditor prompt.** Not a summary, not a link.
- **Hold it still.** `baseline-ledger.md` freezes criteria, scope, roll-up and
  A+ checks until an explicitly approved rebaseline, with no run-count expiry.
  Changed anchors create a disclosed instrument version, not a new original.
- **A letter is earned by meeting every anchor for it.** Missing one anchor
  drops the letter, and the missed anchor is the first gap-to-next-grade
  bullet. Do not improvise plus/minus marks. If used, their observable tests
  must be confirmed in the baseline contract. Otherwise use F, D, C, B, A, A+.
- **A+ is an acceptance tier, not a compliment.** All A anchors plus the
  dimension's fixed A+ tests must pass. Define those tests once with the user;
  use `baseline-ledger.md` for operational gates and the deterministic roll-up.
  Plans, exceptions and merged-but-undeployed work cannot substitute for proof.
- **Unknown is not a low grade or a pass.** Unavailable or stale mandatory
  evidence makes coverage incomplete; keep the last verified grade dated and
  separate rather than silently carrying it into the current verdict.
- **"Watched working" means this run.** Wherever an anchor says a control was
  watched, the auditor cites the probe, log line or output it saw today. A
  README, a merge or a ticket in Done is an assertion, not a watching.

## The default dimensions

### Architecture

- **A.** Boundaries are enforced by tooling (lint zones, dependency tests, a
  build that fails on a crossed edge), not by convention. Every cross-cutting
  decision is written where a newcomer would look. No module reaches across a
  boundary to do another module's job.
- **B.** Boundaries are clear and mostly enforced. One or two known crossings
  are documented with a reason and a ticket. The diagram matches the code.
- **C.** Boundaries exist in prose and are crossed in code with no record, or
  one module has become the place everything ends up.
- **D/F.** No stated boundaries, or the stated ones are false. A change in one
  place routinely breaks another.

### Performance & efficiency

- **A.** Every hot path has a cited measurement taken inside the project's own
  re-take window. No per-unit loop runs inside a fixed tick without a bound.
  Cost per unit of work is known and flat or falling.
- **B.** The hot paths are known and most are measured. One unbounded per-unit
  loop or one quadratic path is known and ticketed.
- **C.** Performance is inferred from the absence of complaints. A quadratic
  path or an unbounded fan-out exists with no ticket.
- **D/F.** A measured ceiling is hit in normal use, or nobody can say what
  the hot paths are.

### Code quality & conventions

- **A.** Format, lint and type checks run on every change. Every shrink-only
  list is CI-enforced and shrank or held since the last card. A fix is applied
  everywhere its shape recurs, not in one place.
- **B.** Conventions are enforced and ratchets hold. At least one fix of a
  recurring shape was applied to one instance and not swept.
- **C.** Conventions are written and not enforced, or enforced and routinely
  bypassed. A ratchet grows or has no owner.
- **D/F.** No conventions, or the code contradicts the ones stated.

### Testing

- **A.** Every guarded invariant has a test that fails when the guard is
  removed, in both directions, with a vacuity floor. The suite that gates a
  merge runs in the environment it claims (a real database, a real browser
  where the code needs one). Zero specs skip themselves by default.
- **B.** Broad unit coverage. The invariants that matter most are tested in
  both directions. One class of test (integration, end-to-end, replay) is
  known missing and ticketed.
- **C.** Tests exist and pass. Several assert the absence of a failure rather
  than the presence of a behaviour. A guard test can be made vacuous without
  failing.
- **D/F.** A meaningful path has no test, or the suite is green because it
  does not run.

### Security & operational readiness

- **A.** Every control the docs name was watched working this run. A failure
  in any component can page a human, and a check exists that would notice the
  pager itself being dead. Secrets are mounted from a store and no deploy path
  can drop them. No unauthenticated surface echoes internals.
- **B.** Controls exist and most were watched working. One monitor is known
  to be pass-shaped (green on a condition it cannot evaluate) and ticketed.
  Secrets are mounted, with one hand-set value known and recorded.
- **C.** Controls are asserted from a README or a merge. An alert channel has
  never fired in a drill. A deploy path exists that silently wipes an
  environment.
- **D/F.** A live exposure is open, or the monitoring is theatre: green while
  the thing it watches is down.

## The estate component (infrastructure as code)

Relabel the five as IaC coverage · Drift · DR & backups · Observability ·
Access & secrets, and anchor them the same way:

- **A.** Every live resource is declared, and plan reports no changes on every
  tier this run. Backups are pinned and a restore was rehearsed inside the
  project's own window. Every alert has fired once on purpose.
- **B.** Declared matches applied on every tier but one known resource. A
  restore has been rehearsed once. One alert has never fired.
- **C.** Declared and applied differ by a counted number of resources. The
  restore story is a document.
- **D/F.** Declared and applied differ by an uncounted number, or a tier was
  built by hand.

## The scale lens

The ladder grades headroom to the next named rung (report-card.md). The
anchors are the ladder's own:

- **A.** The next rung holds, or every change it needs is ticketed and sized.
- **B.** The next rung degrades with a named symptom and a known fix.
- **C.** The next rung breaks and nothing is filed.
- **D/F.** The current rung is at a ceiling.

## The testing & CI lens

Grades the pipeline that ships the code, not the tests inside it:

- **A.** Every gate that blocks a merge also blocks a deploy. A disabled or
  dark gate is declared, and a test reconciles the declaration against the
  files in both directions. A red run cannot hide behind green required
  checks. The pipeline can be replayed off the hosted runner from the same
  definition.
- **B.** Gates block. One gate is known dark and declared. A red non-required
  job can freeze deploys silently, and that is ticketed.
- **C.** A gate reports success without evaluating anything, undeclared. Or a
  merge can land with a red job nobody is blocked by.
- **D/F.** The suite that gates merges does not run, or nothing gates.

## The learning-loop lens (when the project runs models or agents)

Dimensions: Eval coverage · Feedback capture · Loop closure · Run
observability & cost · Output guardrails. Every fraction is over the
discovered inventory of agents, prompts, rubrics and judges.

- **A.** Every agent has an eval set that runs on change and fails the merge
  today, on this tier, with a dated last failure. A measured fraction of
  production runs receives a signal (human correction, outcome, reviewer,
  judge), and every judge carries a dated agreement measurement against
  human labels. Every declared loop is shown closed this run: signal,
  transform, artefact changed, artefact consumed, with a dated example. Every
  run, failed ones included, carries model, tokens, cache split and cost.
  Every guardrail enforces on every tier.
- **B.** Most agents have evals; they run on a cadence someone reads rather
  than as a gate. At least one loop is shown closed with a dated example; the
  open ones name their missing link and carry a ticket. Judges exist and one
  is calibrated. Runs are priced. One guardrail is record-only on one tier,
  known and ticketed.
- **C.** Evals exist for a few agents or run by hand. Feedback is captured
  and nothing consumes it: a write-only memory, a rubric at version 1 after a
  year of signals. Judges are uncalibrated. Guardrails are record-only or
  their switch is unset on every tier.
- **D/F.** No evals; prompt changes ship on judgement alone. No run
  tracking or cost. Guardrails absent, or coded and never switched on.

## The instrument manifest (printed in every footer)

```
instrument: v<N>                anchors: grade-anchors <version, date adapted>
original baseline: <id>         active baseline: <id>
assessment: <id>                previous assessment: <id | initial>
scope: <code | named environment>  separate scope results: <IDs | not assessed>
code read: <per repository: branch/ref, full commit, observedAt>
runtime: <per environment/service: revision, image digest, commit, observedAt>
missing or mixed runtime evidence: <details | none, with measurement>
roll-up: <frozen policy>         A+ acceptance: <criterion IDs>
ledger: <durable location>      evidence windows: <per criterion/method>
panel:  <components> x <dimensions> + lenses: <list; learning loop present | absent: <why>>
reach:  repositories: <list>
        cloud CLI: <which, as which principal>   tracker API: <yes | no>
        credential stores: <list>                unauthenticated probes: <yes | no>
        sub-audits: <paths>
rungs:  <unit> R0=<measured> / <named rungs>
prior findings re-tested: <N> = held <n> / fixed <n> / retracted <n> / unknown <n>
panel error rate: <retracted> of <first seen on previous card>   (instrument, not project)
comparable to baseline: <yes | no: <what changed>>
```

## The coverage manifest (one per auditor, carried on the card)

```
component:   <name>
read:        <paths, with line ranges where a finding cites them>
ran:         <read-only commands>
probed:      <endpoints, tables, live checks>
re-took:     <measurement> = <value> (<method>, <date>)
not reached: <what, and why>
```

No letters. No findings. The next card's auditor receives this as minimum
coverage and must add to it.
