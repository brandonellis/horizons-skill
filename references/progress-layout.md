# Progress first: the operational artifact layout

Use this composition for a combined roadmap and assessment artifact. It answers
four questions in order: what is being assessed, whether it improved, what still
blocks the target, and which action would supply the next proof. Preserve the
project's visual identity. Do not wrap complete old reports in a new tab bar and
call that a clearer current assessment.

The creation-time audience takes precedence over this operational composition.
`stakeholder-hierarchy.md` defines the stakeholder reading path and disclosure
boundaries; it takes precedence over the detailed operational composition below.
For a stakeholder roadmap, follow `stakeholder-story.md`: delivery chart, fixed
baseline cohort, wins and forward plan first; use this assessment layout as a
compact lens or evidence drill-down. Do not replace a visual progress story with
repeated unknown-grade rows. `assets/stakeholder-visuals.css` supplies the delivery,
cohort and Gantt components alongside the progress shell.
Its primary landing view is Roadmap, with the visual grade strip alongside the
board or Gantt. This operational layout is secondary, never a reason to replace
the roadmap's visuals with full audit text.

## Contents

- The approved reading order
- Navigation is not assessment scope
- Scope and provenance rules
- Reusable implementation
- One verification round, one fix batch
- Assessment freshness before decorative grade tiles

## The approved reading order

For the **stakeholder Progress tab**, make three different measures unmistakable:

1. Lead with a few plain-language, source-linked outcomes. Technical mechanisms
   belong in the linked proof. Say whether a win is verified in code or in use.
2. Make changes in the latest component review explicit before the full
   scorecard. Distinguish changed, rechecked-but-unchanged and carried-forward
   letters. Show **Original findings** as a labeled, clickable verified/partial/open bar
   on the fixed initial denominator. Keep exact tickets and remaining acceptance
   in its collapsed register. Show **Work delivered** as supporting throughput,
   with its dated window. Put the separate prior-assessment ticket-reference set
   in an explanatory disclosure, not a competing headline fraction.
3. Show the **last assessed readiness** letters, with assessment date, scope and
   code ref visible beside the scorecard. If a later reconciliation does not
   issue grades, say so here, not only inside an explanation. Never date old
   grades with the regeneration timestamp or imply they assess current runtime.

Keep a previously assessed scalability lens alongside the component scorecard,
not hidden only in old reports. Keep its dated overall grade and measurement
status visible. Its dimension grades and full capacity ladder are a named
disclosure within Progress, following `scalability.md`; the audit stays secondary.

`renderFindingProgress` and `renderDeliveryProgress` in `scripts/render-progress.mjs`
provide these separate measures with `assets/progress-outcomes.css`. Counts must
come from their declared source sets. A changed layout is not a new assessment.
Use `.rm-progress-story` for the findings/delivery composition and
`.rm-assessment-context` for the visible scorecard scope. Preserve existing IDs.

The more detailed operational lens, when requested, follows this order:

```text
PROJECT                          Progress | Roadmap | Evidence

Assessment: [Code quality / Staging operations / Production operations]
Code audited: [repository / explicit branch / full SHA, abbreviated on screen]
Runtime evidence: [web SHA] [worker SHA] [MCP SHA] [observed time]

PROGRESS FROM THE ORIGINAL BASELINE
Initial assessment             Latest verified                Target
[same-scope result]             [same-scope result]             A+

Original findings resolved [n/N]   Awaiting verification [n]   New [n]

COMPONENT PROGRESS
Component          Initial          Latest          Change / remaining gap

WHAT STILL BLOCKS A+
Requirement                 Next action                 Proof needed
```

This is one operating view, not a gallery of equal-weight cards. Keep the title
compact. Scope, date and evidence status precede every grade. Use a comparison
row, a short measurement strip, a component table and an ordered proof list.
The letter is not the only progress signal: a flat overall must still expose
verified closures, per-component changes and completed-but-unverified work.

## Navigation is not assessment scope

- **Progress** owns the current assessment, original-baseline comparison and
  next actions. Its scope selector changes the assessment dataset, not just a
  label over the same number. Default to the scope agreed with the user.
- **Roadmap** owns NNL and the opt-in Timeline format. These are alternate
  representations of one item set, not primary navigation tabs. Persist search
  and throughline selection when switching formats. A no-date timeline shows
  the unscheduled shelf; it does not turn horizons into quarters.
- **Evidence** owns methods, source manifests, previous assessments and the
  immutable baseline. Full historical reports are collapsed here by default.
  Keep canonical source files and stable assessment anchors accessible.

Omit unavailable domains instead of fabricating them. When importing an older
roadmap, display its actual verification date and explicitly say it was not
refreshed. A layout rebuild never updates that date. Keep the original source
artifact unchanged unless the user also authorizes updating it.

## Scope and provenance rules

Use `baseline-ledger.md`'s scope-keyed evidence contract. For every repository,
record the explicit branch/ref and resolved full commit at audit time. Never
substitute the current checkout, an assumed default branch or a PR's target for
proof of what the auditor actually read. For each environment, record every
service's observed revision/image and commit where resolvable, plus observation
time and any missing measurements. A green health response alone is not identity.

Code can be assessed from one branch while production runs another revision.
Make that distinction visible. Label a historical code snapshot as historical;
do not stamp it with the regeneration date or imply all services share its SHA.
Show `Mixed revisions` or `Not verified` when appropriate, not a single reassuring
version string chosen from whichever service answered first.

**Never relabel a blended legacy operational grade as staging or production.**
Without a scope-specific original/current pair, say `Not separately assessed`
or `Not reassessed`. Retain the old combined letter only as a dated historical
result in Evidence. If code-review component ratings are preserved, label them
`As reported` and mark instrument differences as non-comparable. Do not infer an
improvement arrow from the letters alone.

Unknown counts say `Not reconciled`, not `0`. An unapproved A+ contract says
`Acceptance criteria pending`; the target is not a certification already earned.
Keep baseline closure, new findings and verification backlog as separate counts.
Never average environment grades together without an explicitly approved policy.

## Reusable implementation

Inline `assets/progress-shell.css` and `assets/progress-shell.js` into the
self-contained artifact. Load the tab controller from `artifact-views.md` before
the shell script. Do not also load the legacy interaction script on this shell:
both would own filters. The shell reads static, escaped, source-derived HTML;
it does not calculate grades, fetch data or call providers in the browser.

Required hooks:

- Root `.roadmap-shell`, inner `.rm-container`, and the existing `.view-tabs` /
  `[data-view]` tab contract. Evidence retains `data-view="history"` so current
  item filters cannot hide historical evidence. Preserve existing deep-link IDs.
- `[data-scope-select]` with values matching `[data-assessment-scope]` panels;
  `[data-roadmap-format-select]` matching `[data-roadmap-format]` panels. Each
  panel has its own ID and visible heading. Never use nested `[data-view]` panels.
- Put controls in `[data-enhance-control]` containers, initially `hidden`.
  Leave content panels visible in source HTML; optional `.rm-plain-navigation`
  anchors support readers without JavaScript.
- Roadmap representations share `data-roadmap-item`, `data-throughlines` and
  identical `data-search-text`. Give only the canonical detail its anchor ID.
  Search text is generated once per item, not independently from each view.
- Keep canonical `[data-roadmap-detail]` disclosures inside Roadmap but **outside**
  both `[data-roadmap-format]` panels. Chart navigation must not change the
  selected format just to reach details. Add `renderRoadmapReturn()` to each
  canonical disclosure. See `artifact-views.md` for origin/return behavior.
- `[data-roadmap-search]`, `[data-roadmap-theme]` (empty means all),
  `[data-roadmap-clear]`, `[data-roadmap-count]` with `role="status"`.
  A `[data-roadmap-list]` may contain `[data-filter-empty]`, initially `hidden`.
- `.rm-history-record` uses native `details`; an optional `.rm-archive-frame`
  embeds a preserved source with a descriptive title and scripts disabled by
  `sandbox="allow-same-origin"`. Provide its source link too. Generate an escaped
  plain-text transcript as `.rm-print-archive` inside the same record so archived
  evidence prints with JavaScript disabled. Print uses safe text copies, not
  executable clones of archived HTML; the script retains static transcripts.
- `[data-theme-toggle]` is an optional native button. Theme tokens are scoped
  under `.roadmap-shell`; inherited project font and palette choices still win.

All input strings must be escaped during generation, including `srcdoc`, titles,
attributes and search text. Do not inject source text as browser `innerHTML`.

## One verification round, one fix batch

Check all three assessment scopes and both roadmap formats, not just the first
screen. Prove that scope switching changes the evidence and cannot reuse the
legacy combined grade; roadmap filters cannot alter grade denominators; unique
item counts agree across formats; deep links reveal the owning view, scope,
filter and details; Back/Forward and keyboard navigation work; denied storage
does not break the UI. Inspect desktop light/dark and mobile together.

With JavaScript off, every scope has a visible heading and readable content,
and closed archive records still print their static transcripts.
Print reveals scopes, filtered items, formats and archived evidence rather than
silently printing a subset. On mobile, keep the reading order and make component
rows readable as labelled records. Never shrink a desktop table into tiny type.

## Assessment freshness before decorative grade tiles

When a current review is incomplete, make **Incomplete** the current result and
show the last letter with its original date as history. Do not let an older large
letter visually stand in for a current assessment. Put the component, current
review, dated earlier judgment and next required proof in one scan path; disclose
the rationale and recorded acceptance inline. Qualitative letters are not a
numeric progress scale, and a missing review is not a failed system.

`scripts/render-grade-register.mjs` supplies `renderGradeRegister(model, options)`;
`assets/evidence-clarity.css` inherits the existing host tokens. The model has
`observedOn` and `components[]`: unique `id`, `name`, `status` (`assessed`,
`incomplete`, `not-reassessed`), current `grade` and `observedOn` only when assessed,
optional `previous: {grade, observedOn}`, `rationale`, concise `nextProof`, recorded
`requirements[]`, and `sourceHref`. It renders supplied judgments and refuses a
current grade on an incomplete record. It never computes or upgrades a grade.

Use this register when it improves the requested assessment view; do not impose
it on an approved existing layout. Visual polish preserves the Now/Next/Later
matrix, Gantt geometry, theme colors and brand palette unless the user explicitly
asks to replace them. Changes to grades or learning diagrams do not authorize a
whole-artifact identity redesign.

Lead the grade register with reviews that still need evidence, then retain the
complete comparable rows. Keep dated prior letters visually subordinate to the
current result and next proof. Native disclosure exposes mapped work and exact
acceptance. A current tracker status belongs to its own observation date; it
cannot refresh a grade or resolve an incomplete review. Optional `work` uses the
tracker-neutral model in `learning-system.md`; retain unmapped requirements.

When linked work repeats a recorded requirement verbatim, present its acceptance
once beside the ticket, status and owner. Retain unmatched requirements explicitly;
never drop a requirement merely because another action sounds related. Name
work by its purpose instead of generic numbered checks.
