# A short reading path, complete evidence

Use this composition for stakeholder roadmaps. Inherit the original audience
and visual identity. It is not a new assessment, a new baseline, an external
edition, or a replacement for an explicitly requested operational dashboard.

## Roadmap: meaning, then exploration

Open with the material change and forward direction supported by the existing
evidence. Keep it short enough that the roadmap is still the main visual.
Supporting ticket counts are activity, not the story or a readiness measure.
Keep any code-reviewed, tracker-only or historical qualifiers adjacent to the
claim, not buried in an unrelated disclosure. Do not invent customer impact.

Retain board/Gantt formats, critical-path diagrams and completion links.
Theme filters belong immediately above the chart and only affect Roadmap.
On phones, reduce the control footprint and use a stacked horizon overview
rather than showing only a clipped table. Keep a full, scrollable Gantt with
an explicit pan hint. Preserve item identity, filters, source windows and focus. Group the view/search
controls and the real move disclosure in `.rm-roadmap-controls`, before the theme
bar, with compact move-review copy. Secondary refresh detail can use a native
`.rm-refresh-note` disclosure. Keep the same DOM and keyboard reading order.

## Progress: change, standing, next proof

Make assessed component movement directly readable. `renderLetterReassessment`
returns `movement` alongside `tiles` and `details`: only freshly reviewed
components enter movement; unchanged reviews remain explicit. Carried-forward
letters keep their own dates. A changed letter can be a regression, not a win.
Do not average components into a new overall, or put an aspirational A+ beside
historical results as though they were comparable observations.

Follow concise wins with the compact scorecard and the next proof required.
Keep the scalability grade and measurement status visible. Its dimensions and
capacity ladder remain accessible in the named breakdown, not removed. Use `.rm-runtime-section` around environment proof: its heading, per-environment
subheadings and revision disclosures need separate spacing. Give
the fixed-cohort findings and delivery throughput a separate supporting role.
Place detailed runtime records, long acceptance narratives and raw timestamps
in disclosures or Evidence, with human-readable dates on the summary.

## Evidence: questions before records

Group an extensive index by the questions readers bring. A useful starting
point is progress proof, grade explanations, and baseline/planning history;
adapt these categories to the actual material rather than creating empty ones.
`renderEvidenceGroups` (import from `scripts/render-evidence-groups.mjs`)
accepts groups of existing `{ id, html }` records and
preserves each record unchanged beneath a closed, descriptive group. Its HTML
inputs must be trusted, already-rendered records, not unescaped user content.
Use section-heading spacing when groups render as `section > h2`; disclosure
header selectors apply only to groups rendered as details. Keep each record once, preserve anchor IDs, and reject uncategorized records
when transforming an existing artifact rather than silently dropping them.

The shared navigation opens nested disclosures on deep links. Keep that
behavior and the return to the originating chart. Wrap long source identifiers
inside their records without truncating or altering the actual values.

## Reusable presentation and checks

Load `assets/stakeholder-overview.css` after the shell, roadmap structure,
progress and scalability styles. It refines the existing token palette and
does not select a new visual identity. `assets/roadmap-structure.css` owns the
responsive board. Use both with the corresponding renderers.

New detail should fit an existing disclosure layer, not automatically become
another equal-weight section. A reader should understand what advanced, what
comes next and what is still unproven without opening an audit record. Check
that grade freshness, the original denominator and completed-but-linked states
remain clear. Browser review is optional maintainer tooling, not a dependency
other skill users need to install or run. Dependency-free renderer tests cover
data preservation; a bounded desktop/phone check can verify the actual reading
path, cross-view links, nested evidence and empty filters when tooling exists.
