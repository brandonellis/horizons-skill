# The writing floor — prose rules for roadmap pages

Self-contained: everything needed is in this file. (Forked once from an in-house
outreach-writing discipline on 2026-09-01 — provenance only, not a dependency;
this copy is owned by the roadmap skill and evolves independently.)
Apply to every "why" paragraph, thesis, risk entry, figcaption, and tooltip.

## Contents

- Hard rules
- The tests (run on the finished prose)
- Sentence craft (should-fix)
- The banned-phrase list (complete for documents)
- Not adopted (outreach-only, no analog on a document)

## Hard rules

1. **Zero em dashes.** Banned in every part of the page: prose, comments, JS
   strings, figcaptions. Decided by the user 2026-09-01, matching the house-wide
   rule. Replacements: a period and a new sentence; a comma when the dash was a
   parenthetical; a colon when introducing; a semicolon joining two clauses that
   belong together. Hyphens are word-joiners, not substitutes. Enforce with the
   gate before every publish:

   ```bash
   grep -c '—' <page>.html   # must return 0
   ```

2. **No disguised assertions.** Never characterize a system's or business's state
   as if verified when it is inferred. This is the prose form of the skill's
   measured-vs-attested rule: "looked fine from outside" is honest; "was fine" is
   a claim someone has to defend.

3. **No banned phrases** (the list below).

4. **No rebuttal cadence.** Do not close a status with a short rebuttal or a
   manufactured contrast ("Idea: not yet scoped. No done-when until someone
   decides what it is."; "Not a feature. A platform."). Once is a voice; on a
   card wall it is the pattern a reader stops trusting. State the condition and
   the next step plainly: "Not scoped yet; needs an owner to define done."

## The tests (run on the finished prose)

1. **The said-aloud test.** Read each "why" sentence out loud. Any sentence you
   would not say across a table, in these words, fails. Grammatical and on-message
   is not the bar; audible is. ("Documentation specificity quietly slips out" is
   literary; "just falls through" is said.)
2. **Plain English, tested per reader.** The test is never "is this term real,"
   it is "would the non-technical reader use this word unprompted." Real
   engineering vocabulary fails it constantly ("cutover", "idempotent",
   "backfill"). Name the experience instead; the precise term lives in the ticket
   ref.
3. **Scene, not concept.** Compression produces definitional register; spend the
   words on a picture instead. "A rep wakes up knowing exactly what to do across
   every account" beats "an NBA engine with outcome attribution." A person in it,
   events in order, the system named once. The rule is not "be brief": it is
   *make the reader see it happen, then get out.*
4. **The swap test.** If a theme card's "why" sentence would be equally true of
   any B2B startup, it has not earned its place. Rewrite it from this project's
   specifics or cut it.

## Sentence craft (should-fix)

- **Two commas per sentence, maximum. Thirty words, maximum.** A dense sentence
  passes every word-choice rule and still reads as written, not said. The fix:
  cut at the comma doing the most work; start the next sentence with the point,
  not a connective.
- **"X and also Y" is banned outright.** Real writers write "X. Y."
- Contractions where the sentence is conversational; the uncontracted form only
  as deliberate emphasis ("this must not run" carries weight "mustn't" loses).

## The banned-phrase list (complete for documents)

**Hollow buzzwords** (drop, or replace with the specific thing): leverage (as a
verb — "leverage your data" → "use your data"), robust, seamless, streamline
(generic), game-changing, revolutionary, cutting-edge, dive into, deep dive,
unleash, harness the power of, unlock the potential, take X to the next level,
empower, transform (as buzzword), elevate, optimize (when vague), supercharge,
turbocharge, synergy, holistic approach, best-in-class, world-class,
industry-leading.

**Fillers** (delete; the sentence is stronger without them): in today's
fast-paced world, at the end of the day, it goes without saying, needless to
say, in a nutshell, low-hanging fruit, move the needle, here's the thing.

**Fake engagement** (delete): let's take a look, join me on this journey, buckle
up, let me paint a picture, let that sink in.

**Bookend tells** (delete): starting or ending a paragraph with "Basically,"
"Clearly," or "Interestingly." Rhetorical "Have you ever wondered..." openers.

**Hype absolutes** (replace with the specific population): everyone, always,
never (in claims about the market or the system), only solution.

**Pivot signposts** (cut the signpost; the next sentence must stand alone): "The
part that matters:", "Here's where it gets interesting:", "Where this breaks
down:", and any sentence whose only job is to announce the next sentence.

**Summary-of-evidence transitions** (cut; if the evidence is significant the
reader knows): "That's a lot of momentum converging at once," "That's a
significant shift," "That's no small undertaking."

**Manufactured consequence chains** (one concrete consequence beats three
cascading ones): "When X slips, Y spikes. When Y spikes, Z burns out. When Z
burns out..." reads constructed, not observed.

**Literary-register narration** (say it the way a person would): "quietly slips
out" → "just falls through"; "spikes" (volume) → "goes way up"; "will redirect"
→ "point the right way"; vague deixis like "that one" → name the thing.

## Not adopted (outreach-only, no analog on a document)

CTA and duration rules, channel forms, the one-trigger rule, research-dump and
LinkedIn-source opener rules, voice profiles and sender calibration,
motion-noise conflict resolution. A roadmap page has no sender and asks for no
meeting.
