---
name: field-report
description: Turn findings and an approved proposal into the members' summary. Synthetic fixture.
allowed-tools: Read, Write, render_document
---

# Field report

Reads `findings.md` and `proposal.md` from `field-analyze`.

1. The steward approves or rejects each proposal row. Only the steward decides;
   this skill never approves a row itself. A rejected row is logged in
   `store/register.csv` and not used.
2. Build the members' summary from the approved rows with `render_document`.
3. A person sends the summary to members. This skill never sends it.

With no proposal (a single-note run), skip step 1 and summarize the findings only.
