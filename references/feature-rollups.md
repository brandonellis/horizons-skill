# Feature delivery without reopening the roadmap

Run this alongside reconciliation when reporting work under broad features.
The roadmap remains a small set of strategic initiatives. A bug fix is usually
supporting delivery, not another top-level roadmap item.

## Collect and resolve

1. Preserve each feature's stable ID and original cited-ticket set. Discover
   additional work through tracker projects, milestones, parent/child relations
   and reviewed source-backed mappings. Fully paginate each queried scope.
2. Keep a canonical observation per issue ID, with title, status, completion date,
   observation time, type labels and source link. Distinguish completion from
   updated-at: a comment on an old completed issue is not new delivery. Record
   missing/archived/unavailable sources and coverage limits. An incremental query
   is only complete relative to its retained snapshot, not an atomic tracker read.
3. Use one primary feature for credit, with secondary references where necessary.
   A unique original citation takes priority over broader project membership.
   Ambiguous membership needs a reviewed decision; do not pick the first match.
   Titles and keyword similarity suggest candidates, never prove relationships.
4. Classify capability work, improvement, bug, or unknown from source labels or
   a dated reviewed decision. A security or performance label alone does not
   mean bug. Keep duplicates, cancellations and unknown states out of delivery.
5. Preserve unmapped work in Evidence with its title/status and mapping reason.
   Report queried coverage; never call an incomplete mapping a complete backlog.

## Separate states, do not blend them

Each feature disclosure presents these groups only when they contain records:
- **Milestones:** bounded outcomes, each with its own date, scope and evidence.
  A tracker percentage or a closed epic is not verified acceptance. Use
  `Reported complete` when completion has not been independently checked.
- **Completed original work:** the unchanged original citation set.
- **Completed improvements and fixes:** additional delivery beneath the feature.
- **Remaining original requirements:** exact unresolved original citations.
- **Additional work and follow-ups:** open supporting work, including known bugs.
- **Canceled/duplicate** and **status unknown:** neither delivered nor silently open.

A broad feature can evolve indefinitely. Completing a bounded milestone does not
complete all future work. A new bug does not erase the milestone; reopening it
requires evidence that its original acceptance regressed, with a new dated
observation. Preserve the old completion in history. Partial means a named
requirement is unmet, not merely that another ticket exists.

Show IDs, titles, status, completion date and observation date in drill-downs.
Avoid an unqualified `Related progress` list. Main Progress shows a few feature
rows with recent capability tasks, improvements and bug fixes, linked to detail.
Keep no more than six visible rows, disclose the rest, and do not move filters
away from the roadmap. Milestone and ticket totals are different units.

## Grading handoff

Mapped completed work is evidence for reassessment, including related fixes that
satisfy original criteria without being in the original citation list. Never
change citation denominators or automatically increase a letter by counting
tickets. Recheck affected criteria with source/runtime proof under the established
method on grade, score and assessed refresh. Record changed evidence even if the
letter stays the same. Regressions can lower a grade.

A scoped relationship/presentation update is not a full assessment refresh.
If new relevant completions are discovered during one, expose them as pending
assessment, retain dated letters, and never say those grades were freshly checked.

## Optional dependency-free helpers

`scripts/feature-rollups.mjs` exports `buildFeatureRollups(input)` and
`classifyWork(labels)`. Input schema version 1 contains `baselineId`, `observedAt`,
`since`, `features`, `issues`, and optional `decisions`.

Features have `id`, `title`, `originalIssueIds`, optional `projectIds`, `parentIds`,
`milestoneIds`, and scoped `milestones`. Decisions have `issueId`,
`primaryFeatureId`, optional `secondaryFeatureIds`, `role` and `type`, plus
`sourceHref`, `reason`, `reviewedAt`. Direct parent membership is supported;
collect descendants explicitly rather than assuming transitive completeness.
The helper rejects duplicate issue observations and ambiguous unreviewed credit.

`scripts/render-feature-rollups.mjs` supplies static escaped feature detail,
short Progress rows and work-record lists. Inline `assets/feature-rollups.css`.
Generate one canonical `feature-work-<id>` Evidence disclosure per feature;
roadmap details can reuse the body without duplicate IDs. No browser automation
or tracker connection is required for users to run these helpers.

## Keep completed delivery available without dominating the review

Lead feature evidence with remaining original requirements, open follow-ups and
unknown status. Group completed ticket detail under one counted, collapsed
Completed delivery disclosure, preserving the original category breakdown inside.
Keep dated milestones visible where they explain progress. Recent-delivery rows
can be a compact expandable summary on Progress rather than another full list.

A Done ticket does not hide an unverified acceptance, unresolved dependency or
missing operating proof. Keep that action visible and disclose the completed
implementation separately. Do not delete records, change counts, disable links
or move roadmap items to achieve a quieter page. Print and native text access
must retain the full evidence.
