# What would raise this grade?

Use when asked to prioritize tickets by potential grade improvement. This is a
planning projection over a recorded assessment, not a new assessment, business
priority ranking or WSJF. Keep the original rubric, letters and history intact.
A question alone gets a conversational answer; a requested artifact change adds
this section to its existing Progress view with a link from the grade strip.

For a supported starter artifact, add or update the read-only planning view with
`node <skill>/scripts/roadmap-pipeline.mjs priorities <canonical.html> <grade-planning.json>`.
This explicit presentation action records the assessment reference in roadmap
history; it neither appends an assessment nor changes evidence freshness.
Existing assessment and contract bytes in the model remain fixed; priorities
may update ticket mappings, not replace observations. A new assessment uses
the grading workflow. An identical planning input is an unchanged, no-write result.

## Deterministic contracts

Import `gradeOpportunities` and `renderGradeOpportunities` from
`scripts/grade-opportunities.mjs`. Input is `{ contract, assessment, tickets, effortUnit? }`.
When any ticket has an effort estimate, `effortUnit` must name the common unit.
The helper evaluates the existing observations with `assessment-engine.mjs` and
finds unmet criteria through the next mandatory grade gate. Unknown evidence at
other tiers remains a completeness blocker. It never fabricates observations or
simulates a pass with invented proof.

Each ticket has `id`, `title`, `criterionIds`, `mappingEvidenceRefs`, `dependsOn`
(ticket IDs), and optional positive `effort` in one declared consistent unit.
Map only from acceptance requirements or inspected code/findings, not word
similarity. Missing mappings stay visible; cycles or unknown dependencies refuse.
Ticket state Done alone has no effect on the projection.

Order by: restore missing assessment evidence, unlock the overall grade,
improve a component, no demonstrated uplift, mapping needed. This is a declared
grade-only ordering, not a fabricated numerical score. Supplied effort breaks
ties; absent effort stays unestimated. Show dependencies before execution even
when a dependent ticket ranks highly. Never move tickets or edit tracker priority
from this ordering without a separate user instruction.

Show each ticket's mapped criterion, component and environment; current letter
or Incomplete; the exact next test and verification method; other tickets at the
same gate; and evidence supporting the mapping. A shared gate needs ALL unmet
checks, not whichever single ticket is first. Unmapped checks and coverage gaps
remain explicit. An A+ path also needs verified finding closure and every frozen
acceptance check. Preserve separate code/production views and dated observations.

A complete known contract may show `C → B if verified` at the group level. An
Incomplete scope says restore evidence first, with no claimed letter prediction.
Every projection remains conditional on fresh reassessment and existing passes
remaining valid. No percentage likelihood, numerical uplift per ticket or claimed
causality is inferred. No cross-component bottleneck is hidden by a local uplift.

## Qualitative assessments

Recover the established anchors and recorded next-grade requirements. Have the
assessment lead map tickets to those requirements with citations and explain
which gaps still hold the component back. Label this `Directional opportunity
under the existing qualitative method`. Do not force qualitative letters into the
deterministic helper or invent a numeric conversion. Unknown mappings prompt a
targeted question; the artifact can retain identified gaps without a promised
letter increase. Grade/score is the separate action that earns a new letter.
