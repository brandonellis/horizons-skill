# Skill pipeline — how a project's skills chain

Load for `skill-pipeline`, or when the user asks to see how skills, agents or
pipeline steps chain together. Never select this mode on your own: a roadmap
refresh adds the view only when the user named it or it is already part of the
artifact. The page answers four questions: which steps run in what order, who
decides at each gate, which tools and stores each step needs, and which avenues
(branches) a run can take.

## Contents

- When the view belongs
- Discover the flow from the skills
- Build the model
- Render and place it
- Report

## When the view belongs

Include it only when two or more steps chain: one step's output is the next
step's input, stated in the skills themselves. A list of unrelated skills is not
a flow; say so and stop. One skill with several internal phases is a flow only
when the skill names the phases as separate runs or hand-offs.

## Discover the flow from the skills

Read the named skills folder or the named skills. If neither is given, ask which
skills to read; do not scan the whole machine. From each skill's own files take:

- **Steps:** each skill (or each run it says it starts) is a `run` node. A step
  that runs once per item (one run per deal, per file) is `multiple: true`.
- **Hand-offs:** a step's stated input or output naming another step ("reads
  the file intake wrote", "then run report") is a `handoff` edge. No stated
  hand-off, no edge.
- **Gates:** a decision the skill says only a person makes (approve, sign off,
  activate, send) is a `person` node joined by `gate` edges. Name the role the
  skill names; never invent an owner. A person who only starts a run joins it
  by a `handoff`, not a `gate`: a gate is a decision, not a start.
- **Tools and stores:** tools from `allowed-tools`, tool lists or named calls;
  stores the skill reads or writes (folders, registers, sheets). Each is joined
  to the steps that use it by a `uses` edge.
- **Avenues:** branches the skill states (batch size, no new input, a rejected
  row, a test mode). Each becomes a scenario with a one-sentence note in plain
  words and the nodes and edges it lights.
- **Status:** `live` only with evidence the tool or step works today (it is
  served, deployed or callable). A tool, step or skill marked unshipped, disabled
  or ticketed is `building`, with the ticket as its `tag`. No evidence: omit
  status rather than guess.

Every node, edge and avenue must trace to a line in a skill file. If the skills
disagree, show what each says and ask; never fill a gap with a plausible step.

## Build the model

`renderSkillFlow(model, { id, title, lede, caption })` from
`scripts/render-skill-flow.mjs`, with `assets/skill-flow.css` once and
`skillFlowScript` once per page:

- `lanes[]` (`id`, `label`), top to bottom. The usual four are people, steps,
  tools and stores; use fewer when a lane would be empty.
- `nodes[]`: `id`, `kind` (`run`, `person`, `tool`, `store`), `lane`, `col`
  (left to right, run order; a half column such as `1.5` sets a tool or store between two steps so it does not sit on another edge), optional `row` inside a lane, `label`, `sub`,
  `tag`, `status` (`live`, `building`), `optional`, `multiple`.
- `edges[]`: `from`, `to`, `kind` (`handoff`, `gate`, `uses`), `label`, and an
  `id` when an avenue must light that edge alone.
- `scenarios[]`: `id`, `label`, `note`, `members` (node or edge ids). An element
  no avenue names is on in every avenue; an unnamed edge is on when both its
  ends are.
- `order[]`: `node`, `title`, `detail`. Steps owned by a person are marked.

The renderer refuses unknown kinds, edges to missing nodes, avenue members that
do not exist, duplicate ids, two nodes in one grid cell, a gate with no person,
and a model with no hand-off between two steps. Fix the model; do not loosen it.

## Render and place it

- **Standalone:** one page with a heading that says what the pipeline does, a
  one-paragraph lede naming the skills read, the section, and a sources footer
  listing each skill file with its date or revision.
- **Inside a roadmap:** its own view, never a section inside Roadmap,
  Progress or Evidence. `renderSkillFlowView(model, { id, tabLabel })` returns
  the tab and the view; add the tab beside the existing ones, name it after the
  pipeline, and declare `id` in the manifest's `pipelineViews` so
  `verify-artifact.mjs` checks the tab and view exist, in both directions. Two
  pipelines are two tabs. Link to the view from the items and tickets that build
  it. A pipeline whose skills are not yet live is planned work: say so in the
  lede and keep the being-built tools on the status panel.

The chips dim everything off the chosen avenue and the active hand-offs move;
reduced motion stops the movement. Without JavaScript every avenue is listed as
text, and print shows the whole flow.

## Report

State the skills read, the step and gate counts, any hand-off the skills
implied but did not state (left out, named), and any status left blank for lack
of evidence.
