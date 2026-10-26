---
name: field-analyze
description: Analyze each field note in a batch and propose changes to the planting guide. Synthetic fixture.
allowed-tools: Read, Write, web_search, weather_history
---

# Field analyze

Reads `runs/<run-id>/batch.json` written by `field-intake`. Starts one run per
note in the batch.

For each note:

- Look up public reports on the crop with `web_search`.
- Pull the season's rainfall with `weather_history`. This tool is not shipped
  yet (SYN-12); until it is, record rainfall as unknown.

Then, across all notes:

- Write `runs/<run-id>/findings.md`.
- When two or more notes share a pattern, write `runs/<run-id>/proposal.md`, one
  row per suggested change to the planting guide in `store/planting-guide.md`.
  Read the guide only after the findings are written.

Hand `findings.md` and any `proposal.md` to `field-report`.
