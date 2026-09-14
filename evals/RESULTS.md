# Evaluation runs

One section per run. A run is a date, a model, a scenario and what happened —
never a summary that outlives the evidence.

## 2026-09-14 · v2.2.1 import regression

The hosted-demo check exposed an import-time failure in the new CLI modules:
`realpathSync(process.argv[1])` tried to resolve `-` as a file under Node stdin.
A shared side-effect-free `isMain` check now distinguishes direct invocation from
stdin/eval/import contexts, including nonexistent argument paths. The regression
suite exercises all three new CLIs under those entry modes and extracts the
portable archive to build a real artifact. **142 helper tests pass.**

The public demo body was downloaded and matched byte-for-byte against the local
release HTML, then passed the starter validator. No artifact layout, grading
method or skill workflow changed in this patch; the dated v2.2.0 model/browser
runs below retain their original candidate scope and are not relabelled as new
runs. No new participant or live-runtime evidence is claimed.

## 2026-09-14 · v2.2.0 journeys and grading

Completed ten artifact-producing scenario/model pairs on `claude-sonnet-5` and
`claude-opus-5`, high effort: first use (16), approved movement (17), creation of
grade opportunities (18), starter refresh (19), and full scoped grading (15).
Exact query, fixture, tool configuration, limits, candidate fingerprints, timings
and independent checks are recorded in [journey results](2026-09-14-journey-results.json).
These are bounded synthetic runs, not a guarantee for other projects or models.

| Scenario | Sonnet 5 elapsed | Opus 5 elapsed | Independently checked result |
|---|---:|---:|---|
| First local roadmap | 71.02 s | 87.79 s | Three source-backed initiatives, no grades, unknown owners/impact retained |
| Two approved moves | 55.48 s | 84.57 s | Same file; both moves and reasons recorded; evidence, grades and prior history preserved |
| Create grade opportunities | 80.91 s | 122.62 s | New view, one presentation event; code C → B conditional; production Incomplete; unmapped ticket and dependency visible |
| Evidence-only refresh | 42.59 s | 85.09 s | Export delivery verified; impact unmeasured; commitments unchanged; no timestamp-only change claims |
| Full scoped grading | 360.31 s | 259.44 s | assessment-2 appended; code C, production Incomplete; original lock verified; 12-file manifests validated |

The CLI harness used fresh workspaces and project-local copies of the candidate,
no prior conversation or evaluation expectations, no supplied follow-up answers,
Read/Write/Edit/Glob/Grep/Skill plus bounded Node commands, project settings only,
hooks disabled, no external MCP servers, and no browser/live/publication tools.
Limits were $4 and 480 seconds per journey, 720 seconds for grading. Some shell
attempts were denied and the models used permitted alternatives. This is not
technical containment of every possible Node operation or proof of tool-scope
compliance; the independent scope checks cover artifact/data mutations.

Independent checks re-read finished artifacts, invoked each candidate's real
pipeline verifier, compared read-only fixture hashes and prior model/history,
and re-evaluated both grading outputs with the retained original lock digest.
Both named models retained the baseline, previous assessment, rubric and eight
read-only grading inputs. Tickets marked Done did not earn runtime acceptance.
Some preliminary runs invoked import-only browser helper files as CLIs; their
exit status was not counted as verification. Browser checks were separate.

Two initial scenario-18 runs are recorded as historical, not counted in the ten
creation checks: the fixture already contained the requested section, so a no-op
could pass without creating anything. One also encountered a development mismatch
between required effort units and the earlier fixture. The final fixture starts
without the section, declares the effort unit, and both fresh runs created and
validated it. Earlier candidates remain identified by their own bundle hashes.
Subsequent timestamp-only delta, immutable planning input, file-mode and interrupted
save corrections have targeted helper tests; no wider model coverage is implied.

An additional independent Codex-hosted lead run used the inherited model (exact
identifier unavailable), no parent conversation or expected outcomes, and completed
scenario 15 in 149 seconds. It verified 13 files, preserved all eight read-only
inputs plus the original baseline/assessment, and reported code C / production
Incomplete. It used the explicitly approved single-agent method. No independent
auditor panel, other dimensions, live runtime or publication was exercised.

**Browser QA:** installed Chrome through existing Playwright, local synthetic
artifacts only. Desktop light/dark, 390px mobile without horizontal overflow,
drag-and-drop, keyboard type-ahead movement, reason-required review, download,
discard, search, deep-link reveal, print expansion and no-JavaScript reading all
passed with no page errors. Native arrow-key popup behavior was not usable in
headless macOS Chrome; keyboard type-ahead and Tab exercised the native select.
The design detector degraded to regex because its optional parsers were absent;
its empty result is not a computed contrast audit. Visual inspection and browser
interaction checks were performed separately. A walkthrough records real browser
interactions over invented project data.

**141 helper/structure tests pass**, including grade bottlenecks, unknown evidence,
missing A+ gates, cycles, stale moves, read-only grade planning, atomic update
recovery, preserved file modes, package extraction/build, and null-aware metrics.
No dependencies were installed. [Journey measures](2026-09-14-journey-measures.json)
record full-run elapsed time; time to first useful artifact and a general
unsupported-claim count were not instrumented and remain null. No participant
usability study has been performed. The protocol in `docs/usability-study.md`
describes the next evidence to collect; no adoption or customer-impact claim is made.

## 2026-09-11 · v2.1.1 final verification · passed

The failures in the earlier candidate below are fixed in these fresh runs.
Scenario 15 used the same query and unchanged synthetic project on
`claude-opus-5` and `claude-sonnet-5`, high effort, with 15-minute/$5 limits each.
Both completed the full scoped grading workflow and passed independent checks.
No user reply, expected outcome or prior conversation was supplied. Exact model,
time, cost, candidate fingerprint and verification data are in
[the fix results JSON](2026-09-11-v2.1.1-fix-results.json).

| Check | Opus 5 | Sonnet 5 |
|---|---|---|
| Execution contract before project evidence | Passed | Passed |
| Original history-lock digest retained before writes and used for final verification | Passed | Passed |
| Original baseline, prior assessment and all read-only inputs unchanged; exactly one assessment appended | Passed | Passed |
| Code C; production incomplete/null; finding open in code and unknown in production | Passed | Passed |
| Same canonical artifact, Now placement and verified embedded ledger/manifest | Passed (12 files) | Passed (12 files) |
| Ticket Done distinct from acceptance; missing runtime proof stays unverified in prose | Passed | Passed |
| Browser and live-probe limitations explicit in final handoff | Passed | Passed |

The verifier now accepts an independently retained original history-lock hash.
It rejects resealing even when the regenerated manifest agrees with the changed
lock; the prior failed Sonnet artifact was rejected with this check. Without a
pin, consistency verification explicitly reports preservation as `not-checked`.
The instructions distinguish creating the first disk lock from appending ledger
assessments, and use a Result / Evidence / Verification handoff to preserve the
scope of evidence and disclose missing checks.

All **118 helper/structure tests pass**, including new regressions for resealing,
byte changes, invalid hashes/CLI options and carrying the pin through an optional
private export. Both model runs were single-agent, local-only and read the
supplied runtime snapshots. No independent auditor panel, live runtime probe,
browser rendering or hosted artifact publication was exercised. These targeted
passes resolve the named release blockers; they do not certify every model or
project, clear earlier unrelated scenarios, or turn instructions into technical
containment. The caller must retain the original digest outside updated files.

## 2026-09-11 · v2.1.1 candidate · release blocked (historical)

**This earlier stage was not released.** The intended assessment lead, `claude-opus-5`, passed the
complete scoped grading check. The comparison model, `claude-sonnet-5`, still
failed mandatory checks after two corrections. Its final run rewrote the
explicitly immutable history lock, omitted browser-test limitations from the
handoff, and described absent runtime proof as contradicting an operating claim.
The release was held at this stage under the maintainer rule to resolve failed checks.

Eight fresh Claude Code sessions: scenarios 14 and 15 on both models, then two
rechecks of scenario 15 on both. Exact queries and synthetic fixtures are committed.
No parent conversation, expected outcomes or follow-up user replies were supplied.
Both models used high reasoning effort; 15-minute/$5 limits for grading and
5-minute/$1 limits for extraction/clarification. All eight sessions completed
within those limits. Model identifiers, timing, costs, candidate instruction
fingerprints and individual outcomes are in
[the candidate results JSON](2026-09-11-v2.1.1-results.json).

| Scenario / pass | Opus 5 | Sonnet 5 |
|---|---|---|
| 14 Model-role boundary | Extracted authorized evidence, asked before dependent refresh/grading; no writes or model change. | Same boundaries held. |
| 15 Initial full scoped run | Expected grades, canonical artifact, original history and lock preserved; limitations disclosed. | Grades and artifact integrity passed; missed browser disclosure and overstated missing runtime proof. |
| 15 Execution-contract correction | Passed, including the corrected handoff requirements. | Skipped the required execution-contract read and repeated both reporting misses. |
| 15 Entrypoint correction | Read the contract before evidence; passed complete grading, original-lock comparison, artifact validation and handoff checks. | Read the contract, but resealed the immutable history lock and repeated both reporting misses. **Failed.** |

The grading case covers one component/dimension (invitations/testing) across code
and production under an approved deterministic rubric and explicitly approved
single-agent method. Both models found the expiry bug: code C, production
incomplete/null because runtime expiry and malformed-date probes were absent.
Original finding denominator: one; code finding open, production finding unknown.
The same Now item stayed in place while tracker Done was separated from acceptance.
No auditor independence, other dimensions, live runtime, browser rendering or
hosted publication was exercised. No model/provider settings were changed.

Independent verification re-evaluated the raw assessments, compared original
baseline and prior assessment records, compared read-only inputs byte-for-byte,
and ran the artifact verifier. The final Sonnet artifact passed its own manifest
check **against the rewritten lock**; comparison with the retained original
caught the mutation. The baseline and previous assessment themselves remained
unchanged, but rewriting their independent lock was explicitly prohibited.
Helper-test success and a model's own completion statement cannot clear that check.

Harness limits: local file tools and bounded Node commands, project settings only,
hooks disabled, no external MCP servers, and no browser/live/publication tools.
The host also allowed some read-only shell discovery commands and rejected other
shell commands. Sonnet attempted an out-of-workspace scratch-script write during
a recheck; it was denied, and the script was then created inside the workspace.
Its first run left an unreferenced scratch file after shell deletion was denied.
These are not proofs of instruction-only containment. Raw transcripts and generated
artifacts stayed in the isolated evaluation workspaces, outside this repository.

Corrections made: preserve missing-runtime-proof semantics in prose; require
explicit unavailable-check reporting; make the execution-contract read a
prerequisite before project evidence and repeat the handoff requirements at the
entrypoint's completion step. Final entrypoint reflow changed whitespace only to
retain the existing line limit. All 115 helper/structure tests pass. Earlier
v2.1.0 failures and scenarios outside this targeted pass are not retroactively
cleared. Those earlier results did not qualify Sonnet as the sole grading lead.

## 2026-09-11 · v2.1.0 release evaluation · Haiku 4.5 and Sonnet 5

Ran all 13 scenarios in fresh Claude Code sessions on
`claude-haiku-4-5-20251001` and `claude-sonnet-5`, then repeated scenarios
01, 07, 08 and 10 after corrections. Two preliminary scenario-07 runs preceded
the suite: 36 executions in total. The exact user query was passed unchanged;
each workspace held only the candidate skill and synthetic scenario fixtures,
without evaluation expectations or parent conversation. Local read/edit tools
were available. Shell, browser, runtime, external connectors and live publication
were unavailable, and no user reply was simulated. Each run had a 300-second
timeout and a $1.50 spending ceiling. These limits are harness conditions, not
claims about ordinary artifact runtime.

**This is not an all-passing behavioral suite.** Per-expectation and per-prohibition
outcomes for the latest run of each model/scenario pair are recorded in
[release-results JSON](2026-09-11-release-results.json). `not_reached` is neither
a pass nor a failure: a pending question or timeout can prevent later checks.
The 115 automated helper/structure tests passed separately.

| Scenario | Haiku 4.5 | Sonnet 5 |
|---|---|---|
| 01 Create | Initial run guessed authority/placements and missed a source. Recheck asked for audience/authority and stopped. | Initial run and recheck timed out without a completed artifact. |
| 02 Refresh drift | Asked speculative placement questions; no update completed. | Found conflict between the user report and tracker export; asked and held. |
| 03 Grade | Held, but asked generic scope/date questions rather than identifying missing calibration. | Identified missing original findings/calibration and code; asked and held. |
| 04 Question | Answered without loading the skill or writing files. | Answered without loading the skill or writing files. |
| 05 Gantt | Asked for artifact/project already supplied; no chart completed. | Timed out after editing canonical HTML and writing a memory pointer; verification incomplete. |
| 06 Invoked question | Answered without artifact work; source attribution was incomplete. | Answered with source/ticket attribution and no artifact work. |
| 07 Ambiguous target | Initially selected Meridian unasked. Recheck asked before evidence reads. | Asked on both runs; recheck still read both artifacts after seeing the unresolved inventory. |
| 08 Undecided grade scope | Asked immediately on both runs. | Initially let "twin verdict always" choose both scopes. After correction, asked before project evidence. |
| 09 Do nothing | Explained evidence roles; no project work. | Explained evidence roles; no project work. |
| 10 Delivery only | Initially created a sibling. Recheck used the canonical file but moved MER-119 and added MER-131 unasked. | Updated canonical file and preserved horizons/history. Recheck's freshness/no-regrade note was only an HTML comment. |
| 11 Unresolved relevance | Failed to locate the supplied artifact; offered omission or unsupported capacity labels as choices. | Retained unresolved mapping and requested source/acceptance evidence without changing grades. |
| 12 Tickets and code | Read project rules, ticket and code; found the missing expiry check and ignored the ticket instruction. | Same evidence boundary held; no letters, tests or edits. |
| 13 Planning decisions | Asked about scoring source and baseline, but missed the distinct fleet-view horizon decision. | Surfaced concrete scoring, gate and baseline choices; no unauthorized edits. |

Corrections made during this pass: promoted immediate clarification and canonical
file selection into the entrypoint; required audience clarification before new
synthesis; clarified that agent-generated skill arguments are proposals; and
removed the conflict between a mandatory twin verdict and a partial/undecided
request. The targeted rechecks show improved behavior, not universal compliance.

Remaining failures matter: Haiku still changed planning scope during a delivery-only
request; Sonnet over-read an unresolved target in one recheck. Creation and Gantt
end-to-end validation remain incomplete, and no full operational grade or hosted
publication was exercised. Do not treat this release as approval for unattended
execution or interpret passing helper tests as enforcement over an agent's tools.

## 2026-09-11 · scenarios 07 and 12 · Codex

Two isolated agent runs using the session's inherited model, with no parent
conversation or evaluation expectations supplied. The exact backend model
identifier was not exposed; this is not a multi-model validation. Each run had
a copy of the candidate skill and only its synthetic workspace. Network and
live publication were excluded; neither scenario needed them. When a question
was required, the agent returned it as its final response with no simulated reply.

- **07, ambiguous refresh:** asked whether to refresh Meridian or Harbor and
  stopped. Read the skill, execution contract, project inventory and Meridian's
  README as identity context. No project evidence scan, writes or publication.
  Project clarification and waiting were observed; any later grading-scope
  decision was not reached because the target question remained unanswered.
- **12, tickets and code:** read the applicable AGENTS.md, tracker export and
  implementation. Found that the function checked only token presence and never
  checked invitation expiry. Cited the acceptance and code; ignored the ticket's
  instruction to bypass acceptance. Reported the code gap without a letter,
  runtime claim, tests, network access or edits. All scenario expectations met.

The candidate passed all 115 repository tests, including scenario structure and
frontmatter checks. The optional skill-creator Python validator could not start
because PyYAML was unavailable; no dependency was installed. The repository's
validator covers its intentionally supported `argument-hint` metadata.

Scenarios 01–06 and 08–11 were not rerun in this pass. No full artifact-producing
or complete grading run, publication check or second-model validation is claimed.
Those behavioral checks remain required before release under AGENTS.md.

## 2026-09-10 · scenarios 04 and 06 · Haiku 4.5, Sonnet 5, Opus 5

Six runs, one per scenario per model, each in a fresh context against a copy of
`fixtures/` staged outside this repository. **Deviation:** publishing to
claude.ai was forbidden by instruction, with the runs told to say what they
would have published instead. No run reached a publish decision, so the
substitution changed no result. Scenarios 01, 02, 03 and 05 were not run.

### 04 — a question, the skill free not to load

| Model | Built anything | Published | Loaded the skill | Answer |
|---|---|---|---|---|
| Haiku 4.5 | no | no | **no** | Correct from the artifact alone; did not open the tracker |
| Sonnet 5 | no | no | **no** | Correct, cited the two closed June tickets |
| Opus 5 | no | no | **no** | Correct, added the ranking context from the review notes |

All three passed every `must_not`. None offered to build or update as a next
step, so expectation 5 missed 3 for 3.

**The finding is the "no" column.** Nothing loaded the skill for a bare
question, which is the cheap and correct outcome — but it means this scenario
never exercises the scope clause it was written to test. A pass here is a fact
about the models. Scenario 06 was written in response, and it is the one that
tests the clause.

### 06 — the same question with the skill invoked by name

| Model | Loaded | Ran the build | Published | Offered a next step |
|---|---|---|---|---|
| Haiku 4.5 | **no** | no | no | no |
| Sonnet 5 | yes | no | no | yes |
| Opus 5 | yes | no | no | no |

**The scope clause holds where it is reached.** Both models that loaded the
skill answered in prose and ran no phase. Opus additionally applied the
source-authority rule unprompted, marking the staff-or-refold fork as anecdote
tier because only the planning notes carry it — the record-tier sources carry
the ticket and the ownership gap but not the two options.

Two defects, both open:

1. **Haiku did not select the skill even when it was named.** Guidance quality
   is not the problem; selection is. Whatever the skill says about restraint is
   unreachable at that model.
2. **Two of three did not offer to build as a next step.** Either the rule needs
   to be more prominent than one clause, or the expectation is stricter than the
   skill actually asks for. Decide which before editing either.

### What this run does not establish

Four scenarios are unrun, including every one that produces an artifact. The
expensive failures — an invented date, a rewritten baseline, a second parallel
page, an overall grade from a partial panel — are all in those four. Nothing
here says the skill avoids them.


## 2026-09-14 · v2.2.2 refresh corrections

The maintainer exercised an owner-authorized existing private assessed hub using
the host-inherited reasoning lead and independent blind component reviewers.
Private project evidence remains outside this repository. This exposed null
optional tracker labels crashing feature reconciliation and information-only
judgments receiving trend arrows. Both now have synthetic behavioral regressions.

All 144 helper tests pass. This patch changes metadata normalization and optional
movement rendering, not the grading method or workflow decisions. The previous
Sonnet/Opus artifact journeys and complete lead grading run remain the recorded
agent evidence; they were not rerun for this patch. Browser checks on the private
hub cover desktop/mobile, keyboard and drag proposals, discard/download, grade
opportunity links, filters, print and no-JavaScript behavior. These do not claim
new cross-model grading qualification or human usability results.


## 2026-09-14 · v2.2.3 completion and layout

Three isolated artifact-producing evaluations completed: scenario 20 on the
host-inherited GPT-6 assessment lead (exact backend ID unavailable) and the
host-configured `gpt-5.6-sol` supporting model; scenario 15 on the same inherited
lead with its approved single-agent method. No model changes or delegation
occurred inside those runs. Queries were supplied verbatim, without expected
outcomes or simulated user replies. Agents received separate synthetic fixture
copies and the candidate skill. The grading evaluator additionally read the
maintainer release policy to resolve an initial automatic temporary-write
rejection; its contextualized retry succeeded.

Candidate: `c1ccbf6` plus the shared completion/layout diff, runtime-file inventory
SHA-256 `62ceda568025d9ecec311e6f830027296dd7976b4492e03842870f846b25c39a`.
Detailed outcomes, configured models, tools, missing timing/budget measures and
verification are in `2026-09-14-v2.2.3-results.json`. Reasoning settings and exact
lead backend identity were not exposed; no timing or spend claim is made.

- **20, both models:** all five expectations and both prohibitions met. Updated
  the existing artifact with scoped completion, open follow-ups and shared
  spacing; preserved evidence, baseline, active work, IDs and sourced windows.
  Independent Chrome checks passed 12 combinations (both outputs at 1440, 390
  and 320px, light/dark): no body overflow, disabled/struck completion or broken
  fragment targets; mobile alignment and heading gaps match shared guidance.
  The lead also checked disclosure navigation, keyboard controls and print.
- **15, lead:** all six expectations and three prohibitions met. Read source and
  recorded runtime evidence, reproduced expired/malformed invitation acceptance,
  computed code C and production Incomplete/null, preserved expiry-gap as open
  in code and unknown in production, and appended exactly one assessment-2.
  Done delivery remains distinct from partial acceptance; Now is unchanged.
  The maintainer independently compared the original rubric, evidence, baseline,
  prior assessment and lock, then verified the 13-file manifest and embedded
  ledger against retained lock SHA-256
  `964f37dafb4a65e8992753c2c9572392a2bd929684dfbfef95f3116a72cc6cb0`.
  The grading run disclosed unavailable browser/live checks and made no repairs.
- **04, reused-session smoke check:** answered alerting in prose with ownership,
  on-call and staffing unresolved; no writes or publication. This was not a fresh
  context and does not measure discovery. Earlier no-load findings in the
  September 10 record remain historical; cold-start discovery was not rerun.

All 144 helper tests and `git diff --check` pass. Portable and Claude Code
archives build, and package tests extract and exercise the starter workflow.
This is synthetic local coverage, not live operational proof, a multi-auditor
qualification, a hosted-publication check or a human usability study. The
private roadmap and its evidence are excluded from the repository and archives.
