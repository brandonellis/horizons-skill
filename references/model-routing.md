# Choose models by role

Read when selecting child models. Apply these defaults without asking the user
to choose a profile. Preserve the selected lead, provider and any explicitly
pinned child assignments. Defaults are not evidence that a model passed the
project's evaluations. Do not change global settings.

## Starting profiles

Documentation checked 2026-09-22. First check the host's actual selectable model
IDs and delegation controls; API availability does not prove a host can spawn
that model. Resolve only the listed same-provider alternatives below and state
the choice in the allocation. Do not substitute another provider or an unlisted
generation based on name or price.

| Role | Codex | Claude |
|---|---|---|
| Listings, pagination, fetching, counts, supported rendering/validation | Direct tools and existing scripts | Direct tools and existing scripts |
| Bounded extraction from specified sources; no grades or planning decisions | `gpt-6-luna` | `claude-haiku-4-5-20251001` |
| Trace ticket acceptance through code/tests, reconcile evidence packets | `gpt-6-sol` | `claude-sonnet-5` |
| Independent grading, conflicting evidence, scope and final synthesis | Selected lead; `gpt-6-astra` is the starting candidate | Selected lead; `claude-fable-5-1` or `claude-opus-5-5` are starting candidates |

For a Codex host that exposes the 5.6 support models instead, use
`gpt-5.6-luna` for extraction, `gpt-5.6-sol` for evidence analysis, and the unchanged
lead for grading. Prefer the 6 support models when exposed; use the listed 5.6
alternative only for unpinned roles. The available tool schema or host
model picker wins over this dated table. If per-child model selection is absent,
say that children inherit the host's model; optimize task count/context instead.
An unavailable model is a routing limitation, not permission to start an external
API or consume another provider's quota. If neither listed support model is
available, use the selected lead for that bounded task and disclose the lost
savings; do not stall to request a profile choice. Record exact model IDs and
roles once with the run allocation and reuse those decisions on later runs
while available. A pinned but unavailable model needs the execution contract's
capability resolution; it is not covered by the unpinned fallback.

For GPT-6 support roles use Luna high and Sol medium. For the 5.6 alternatives,
start with Luna medium and Sol medium and record outcomes before tuning. These
are initial settings, not claims of equivalent effort across generations. Keep
the existing lead's effort during ordinary runs unless a change is requested;
Astra low is a candidate for separate evaluation, not an automatic lead downgrade.
Do not copy those effort values across generations/providers. Claude's current
Haiku has no effort parameter; preserve supported host defaults. Reasoning effort
is part of the evaluated configuration, not a universal quality or price label.

Keep Haiku's role especially narrow: historical Horizons evaluations include
planning changes during a delivery-only request. That does not disqualify bounded
extraction, but it does not qualify Haiku for unattended artifact edits or grades.
Sonnet/Opus single-agent grading results likewise do not qualify a full panel or
a newly released model. Independent graders stay on the selected capable model
until a different auditor configuration has passed the applicable evaluations.
Do not promote a collector into a grader just because the budget is running low.

## Qualify and escalate

Use a bounded maintainer benchmark, separate from ordinary Horizons runs. Start
with representative frozen source packets and expected facts/citations, including
missing evidence, contradictory Done tickets, stale runtime proof and untrusted
instructions. Run identical tasks and tool access across candidate configurations,
with repetitions. Grade required-fact recall, citation accuracy, unsupported
claims, coverage and role-boundary violations; inspect original sources when
establishing the expected answer. Do not use agreement with the lead as truth.

Measure total cost per accepted packet, including retries, lead review and repair,
plus latency and token breakdown from `run-budget.md`. Set acceptance thresholds
before selecting a winner. A role/scope violation or invented decisive evidence
fails that run regardless of aggregate accuracy. Persist exact model/effort,
skill/prompt revision, source fingerprint and observed results privately or in
synthetic maintainer fixtures. Change routes when evidence supports it; recheck
after model/prompt changes or detected regressions, not on every invocation.

Escalate to the lead on failed citation/coverage checks, conflicting facts, or
exhausted task bounds. The lead may allocate a stronger authorized analyst or
inspect directly; one targeted retry still shares the whole-run budget. A
stronger model cannot resolve absent runtime proof by inference. Missing proof
stays unknown, and a budget stop leaves incomplete work explicit.

Sources for capability recommendations (not Horizons qualification):
- [OpenAI model guidance](https://learn.chatgpt.com/docs/models)
- [OpenAI evaluation-led selection](https://developers.openai.com/api/docs/guides/model-selection)
- [Anthropic model lineup and supported effort](https://platform.claude.com/docs/en/models/overview)
