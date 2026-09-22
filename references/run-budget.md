# Whole-run budget and delegation

Read before delegation or usage reporting. Applies across providers; keep the
selected models and the established grading method. This is an execution policy,
not a host-enforced token cap. Do not load maintainer evaluations during a run.
When selecting child models, read `model-routing.md` for provider-specific
defaults and qualification rules; do not load it for mechanical work.

## Allocate before fan-out

Record one compact allocation in the existing private working notes: requested
mode, required roles/scopes, source snapshot IDs, selected models, agent-start
ceiling, retry allowance, and any user/host token, cost or tool-call ceilings.
Include the lead, all descendants, failed attempts, verification and final
synthesis in the resource accounting. Retain the allocation on resume; restarting
an agent does not reset the budget. Do not invent a dollar or token allowance.

Derive the agent-start ceiling from the required panel plus justified additional
tasks, not from the number of available slots. For mechanical work, use direct
tools/scripts in the lead's workflow. Spawn a collector only when interpreting
its bounded sources earns the extra context and review cost. Group related
extraction work instead of one agent per file or ticket. Independent auditors
remain separate. Delegate no further children without an allocation from the
lead; descendants and replacement agents count against the same ceiling.

Default to at most one targeted retry per failed task, within the same allocation.
Retry only with a concrete correction (missing source, narrower question or
corrected tool call); do not repeat a failed broad scan unchanged. Preserve any
usable partial evidence. A new agent for a retry needs an available start slot.
Before expensive work, reserve room within known limits for lead review and
mandatory verification. When a limit is reached, stop starting work, checkpoint
and report incomplete scope. Never waive checks or manufacture a passing grade.
If a known token/cost cap cannot be measured or enforced by this host, disclose
that before fan-out; do not assert it will be honored or launch budget-dependent
work without resolving that limitation. Without numerical limits, proceed with
the bounded task allocation; missing telemetry alone is not a new approval gate.

## Collect once; inspect independently

Use a shared index of raw source snapshots keyed by source ID, revision, scope,
environment and observation time. Record pagination/coverage and retrieval
failures. Reuse only while the grading contract permits freshness and identity;
fresh runtime proof and the prepublication tracker check still run when required.
References point to the original source and exact lines/records, not only to a
collector's summary. An auditor may inspect additional original evidence within
scope when needed to verify or falsify a claim. Missing evidence stays unknown.

Give collectors the specific question, source subset, allowed tools, output
shape and stop condition, plus applicable instructions. Avoid copying the parent
conversation, full artifact, unrelated references or other agents' output.
Prefer a fresh bounded context where supported. Collectors need no visual/layout
references. Auditors still receive verbatim calibration and minimum coverage;
keep previous letters, other auditors' judgments and expected verdicts out.

Collector output is a compact evidence packet: source IDs and revision/time,
facts with exact citations, coverage, contradictions and explicit unknowns.
Return a packet path plus a brief summary when local files are supported; keep
raw evidence accessible. Do not truncate required facts to meet a prose quota.
The lead checks citations and coverage before using a packet for grading.
Collectors do not decide scope, horizons or grades. Escalate missing required
evidence, conflicting claims or exhausted search bounds to the lead; self-rated
confidence alone is not an escalation test. Changing models requires an existing
authorized route. Use existing renderers and validators for mechanical output.

Refreshes follow `refresh-reassessment.md`: reassess affected scopes and their
dependencies, resolve relevance gaps, and leave untouched assessments dated.
Budget savings never convert unresolved relevance into verified irrelevance.

## Record and report usage

Use host telemetry when exposed. Keep usage private in the existing workspace,
outside the published artifact. Do not reread entire transcripts to estimate it.
The optional dependency-free CLI `node scripts/summarize-usage.mjs <ledger.json>`
reports totals, role breakdowns and budget status. It does not intercept calls or
enforce spending. A missing counter is null, never zero or an estimate.

Ledger shape: `version: 1`, `completeCallLog` (boolean), `agents`, `calls`,
and optional `limits`. Agents have unique `id`, `parentId` (null for the single
lead), `role` and `model` (null if unavailable). Calls have unique `id`, `agentId`,
and nullable `inputTokens`, `cachedInputTokens`, `outputTokens`, `reasoningTokens`,
`costUsd`, `toolCalls`. One call record per invocation, including retries and
failed calls. Normalize host counters first: input includes cached input; output
includes reasoning. Those subsets are not added again. Cost is the measured
model charge, not an inferred token price or a subscription-allowance estimate;
track tool/service charges separately when relevant to a user's spending cap.

Set `completeCallLog` true only when all lead/child calls are covered. Do not mix
session cumulative totals with per-call records or include a parent total that
already includes children. If only cumulative snapshots exist, normalize their
nonoverlapping deltas first; otherwise mark coverage incomplete. Missing calls
or agents without usage records prevent complete totals. Known subtotals remain
visible even when the total is unknown.

Optional limits are `totalTokens`, `costUsd` (model charges only), `agentStarts`
(children including replacements) and `toolCalls`. Unknown usage cannot prove
a limit is satisfied. The helper reports observed consumption even when it is
already over a limit; it is not a preflight guarantee of the next call's cost.
At handoff give agent starts, retries when known, measured totals/coverage and
unfinished work. Do not equate API cost, raw tokens and subscription allowance.
