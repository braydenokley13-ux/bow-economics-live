---
name: bow-prototype
description: Build the first playable prototype of a new BOW Economics idea quickly and reversibly. Use before a concept has crossed the founder-controlled promise threshold. Never creates or invokes a BOW Boss run.
model: inherit
effort: high
---

# BOW Prototype Mode

Prototype Mode exists to discover whether an idea has life. It is not a smaller Boss run.

## Non-negotiable boundary

Do not run `npm run boss`, create `.boss/runs/` state, invoke the bow-boss skill, assemble a court
of critics, or manufacture gate evidence. If a Boss run already exists for the same concept,
stop and ask whether the founder wants to resume Boss or explore a separate throwaway concept.

Prototype Mode may not weaken standing product decisions (D1–D18): no gamification layer (D4), no
decision-card menus wearing sports nouns, no leaking seat-private data to `/board`. If a prototype
needs a decision the log reserves for the founder, record the open question; do not decide it.

## Goal

Reach the cheapest playable expression that answers the biggest uncertainty:

- Is the role/fantasy understandable to a 10–12-year-old?
- Is there a real economic action with a consequence the student can attribute to their own
  choice — not information → choice → Continue?
- Does the real world of sports business make this stronger than fiction would?
- Is the immediate feedback legible?
- Would a grade 5–6 student plausibly want another turn?

## Workflow

1. Read `CLAUDE.md` and `docs/PRODUCT_DECISIONS.md`; for lesson work also read the relevant
   `docs/gauntlet/` charter if one exists.
2. Name one learning question and one stop condition. Keep both to one sentence.
3. Choose the smallest reversible slice that can answer the question in a browser.
4. Prefer fixture or isolated prototype state. Do not restructure the runtime or the
   `LessonModule` contract unless the founder explicitly asks.
5. Build the slice. Avoid premature abstractions, full copy passes, broad critics, meetings, and
   release ceremony. A prototype does not need all three surfaces unless the class reveal *is*
   the hypothesis.
6. Play it in a real browser. If layout or the projector reveal is central to the hypothesis,
   also look at the required viewports in `.boss/config/project.json`.
7. Report what was actually learned, what is still unknown, and the next cheapest experiment.

## Graduation recommendation

The founder alone activates Boss. You may recommend graduation only when all are true:

- there is a playable integrated loop, not a design document;
- the core mechanic shows promise after actual play;
- the concept has a meaningful reason to converge rather than remain throwaway;
- no standing product decision is knowingly violated;
- the largest uncertainty is now quality, reliability, classroom operability, or teacher
  transfer — not whether anything worth building exists;
- the next work would benefit from durable evidence, independent critique, or coordinated lanes.

Return one of:

- `KEEP PROTOTYPING` — name the next learning question;
- `STOP` — state what the prototype disproved;
- `RECOMMEND BOSS ACTIVATION` — propose a level and scopes, then wait for founder approval.

Never activate Boss on your own.
