# Shared meeting decisions in Claude artifacts

Use when a roadmap published as a Claude artifact needs meeting changes visible
across users and computers, with later reconciliation into the local roadmap.
This reference instructs artifact generation and updates. It does not install a
service or change an existing artifact merely because the skill was loaded.

## Storage choice

Use Claude's native **shared persistent storage** for JSON meeting records.
Claude supplies the artifact runtime and access controls. Do not introduce a
server, database deployment, hosting selection, API keys or custom sign-in flow.
Do not substitute localStorage, sessionStorage, IndexedDB or personal artifact
storage for shared state.

Check the storage API exposed by the current artifact runtime and explicitly
select its shared scope. Do not invent an API or assume every HTML preview has
it. If unavailable, retain drafts in memory, offer JSON export, and report that
shared saving is unavailable. A download is a handoff, not cross-computer sync.

Anthropic documents text persistence and separate personal/shared scopes in
[artifact storage](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them).
Legacy artifacts require publication before storage works. Use the existing
publication authorization; do not publish merely to make a local test pass.

## Generated artifact behavior

- Load saved decisions when opening the artifact and provide a refresh action.
  Overlay valid pending moves on the published roadmap with a visible saved
  meeting decision label; leave the underlying evidence and grades intact.
- Review moves and reasons before saving. Keep stable project/item IDs and a
  versioned JSON record containing a unique decision ID, base revision/digest,
  timestamp, and each item's original horizon, target horizon and reason.
  Preserve an author label if supplied; do not invent a verified identity.
- Prefer a separate immutable record per decision, keyed by project and decision
  ID, over overwriting one shared snapshot. Reuse that ID on retries. Do not
  claim transactional saves unless the runtime actually provides them.
- Re-read before reconciliation. Retain conflicting decisions for review when
  they move the same item from incompatible starting states; never silently
  choose a winner. Timestamps alone do not resolve planning conflicts.
- Show Saved only after the storage operation confirms success. A failed read
  means unavailable state, not an empty log. A failed save retains the draft.
- Export/import the versioned JSON, including decision IDs, for local handoff
  and migration. Explain that meeting decisions are shared with artifact users.

## Local reconciliation and subsequent versions

Before a refresh or move, read pending shared decisions through the available
artifact tools, or consume an exported JSON file. A local coding agent cannot
assume it can call the artifact's runtime storage API from a terminal.

Validate project, item IDs, base revision/digest and original placements against
the current canonical roadmap. Apply compatible, authorized decisions through
`roadmap-moves.md`; preserve existing layout, evidence, dates, grading and history.
If the base changed, review against the current roadmap before applying. Reuse
existing authorization for the exact decisions and resolve genuine conflicts.

Record each applied decision ID in the canonical planning history so importing
the same JSON twice does not move items twice. Include those IDs in subsequent
artifact versions to distinguish incorporated decisions from pending ones.
Keep saved meeting state, local application and publication visibly distinct.
Saving in the artifact does not itself edit local files or issue trackers.

Update the existing artifact identity and retain its storage namespace and keys.
Never initialize by overwriting saved decisions with bundled defaults. Verify
storage continuity after an update; do not promise it for a copied or newly
created artifact. If a new artifact is necessary, export and import the decision
JSON explicitly and verify the transfer. Do not unpublish as an update step:
[legacy unpublishing deletes stored data](https://support.claude.com/en/articles/9547008-share-artifacts).

## Verification and handoff

For a generated artifact, check a save is visible to another user, survives
reopening and an update to the same artifact, and can be exported, applied
locally and imported again without duplication. Check conflicting moves and
failed saves preserve decisions. Use synthetic data for these checks.

If the Claude runtime or a second user is unavailable, report those checks as
unverified. Skill edits or simulated storage tests alone do not establish live
persistence. When only updating this skill, report the instruction changes;
do not generate, deploy or modify a user's roadmap to demonstrate them.
