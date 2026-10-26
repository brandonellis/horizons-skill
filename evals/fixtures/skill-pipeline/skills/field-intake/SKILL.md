---
name: field-intake
description: Collect a cooperative's new field notes into one batch file. Synthetic fixture.
allowed-tools: Read, Write
---

# Field intake

An operator drops new field notes into `inbox/` and starts this skill.

1. Read every note in `inbox/` and the note register in `store/register.csv`.
2. Drop notes already in the register. Append the new ones to it.
3. Write `runs/<run-id>/batch.json` with the new notes.
4. Size the batch:
   - 2 or more new notes: a full run. Hand `batch.json` to `field-analyze`.
   - exactly 1 new note: a single run. Hand it to `field-analyze`; there are no
     patterns to find, so `field-analyze` writes findings but no proposal.
   - 0 new notes: stop. Nothing is handed on.
