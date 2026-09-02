# Browser truth — W2 fold verification of repair 5 (`w2-verify-fold`)

Independent re-measurement of blocking dissent `w2-final-browser-dissent` against the built
head (`runtime/dist` at afa018d), driven in real Chromium on a real server (port 4441).
Nothing here is HUMAN-TESTED. Everything below is OBSERVED unless labelled otherwise.

## Ruling

**DISCHARGED.** At the current build, in the exact state the dissent named — Desk 1, Night 4,
upper bowl OPEN (`MORE SEATS -$95,000`), event money spent on that same night
(`EVENT MONEY -$40,000`), FULL HOUSE sellout of 22,200 with 5,150 turned away, last night's
spend verdict and the resale sentence both printed — `#fhNextNight` measures **top 511, bottom
573 in a 768px viewport at scrollY=0** (was 811 at the time of the dissent), and **464..526 in
a 600px viewport**; across all 40 desk-nights measured, zero had the advance control below the
fold at either viewport.

Repair 5 introduced **no new fold or hierarchy defect** in any state I drove. One pre-existing
1024x600 condition remains (below), and it is unchanged by repair 5 because repair 5 only moved
the 1366x768 control; at 1024x600 repair 4 had already placed it under CASH (INFERRED from the
R5-1 comment at `runtime/src/client/play/main.ts:2810`, consistent with the identical 1024
geometry I measured).

## What was driven

One session, `m2l1-full-house`, four desks, five nights each, teacher-paced with `#btnCloseNight`,
each settled night measured and screenshotted at 1366x768 then 1024x600 at `scrollY=0` before the
pair pressed NEXT. 40 desk-night x viewport measurements. Zero console errors, zero page errors.

- Desk 1 (Rae & Ben) — $10 every night, event money maxed every night, upper bowl opened on the
  only night that offers it (Night 4). Produces the dissent state on N4 and the densest
  WHAT HAPPENED column on N5 (spend line + spend verdict + resale sentence + Night-5 callback).
- Desk 2 (Nia & Tomas) — $10 every night, no spend, bowl never opened: bowl-closed sellouts
  (N1, N2, N4).
- Desk 3 (Ada & Luis) — $120 every night: zero-turnout nights (N1, N2, N3, N5; turnout `0`).
- Desk 4 (Kit & Mara) — $65 every night: ordinary nights (N2 4,232 · N3 526 · N4 15,850).

## Measured, at scrollY=0

### 1. `#fhNextNight` bottom vs viewport height (the dissent's own test)

| viewport | worst bottom | where | viewport height | margin |
|---|---|---|---|---|
| 1366x768 | **573** | d1-n4 (bowl OPEN + event money + SELLOUT) | 768 | 195px clear |
| 1024x600 | **526** | d1-n4 (same state) | 600 | 74px clear |

Every other desk-night sits lower still: 417..479 (1366) and 392..454 (1024) on ordinary,
zero-turnout and bowl-closed-sellout nights; 449..511 / 406..468 on the spend-and-sellout nights.
0 of 40 rows below the fold. The builder's figures (573 / 526) reproduce exactly.

### 2. The sellout turned-away figure

| state | 1366x768 | 1024x600 |
|---|---|---|
| d1-n4 bowl OPEN + spend + sellout | 5,150 @40px, bottom **742** of 768 | 5,150 @34px, bottom **458** of 600 |
| d2-n4 bowl closed + sellout | 7,031 @40px, bottom 742 | 7,031 @34px, bottom 458 |
| d2-n2 bowl closed + sellout | 1,441 @40px, bottom 717 | 1,441 @34px, bottom 458 |
| d1-n5 sellout + callback | 20 @40px, bottom 717 | 20 @34px, bottom 458 |

Inside the viewport in every case, at both shapes. It is the **second-largest numeric figure on
the frame in every sellout state measured** — at 1366 the order is turnout 72px > turned-away
40px > next numeric 31px (`0%` / `$111,468` / `$34,400`); at 1024 it is 64 > 34 > 26. At 1366 the
figure rides at the foot of the ARENA card (742 of 768, 26px of ground beneath it): not clipped,
but it is the lowest ink on the frame and has the least air of any block.

### 3. Turnout the largest figure; at most two figures at or above 34px

Both hold in all 40 rows. Turnout is the largest numeric figure on every frame measured
(72px at 1366, 64px at 1024). Figures at or above 34px: exactly **two** on a sellout
(turnout + turned-away), exactly **one** otherwise. No row had three. The next figure down is
31px (1366) / 26px (1024).

NOTED, not a figure: on a sellout the `FULL HOUSE` wordmark renders at 60px (1366) / 38px (1024)
— larger than the 40px turned-away number. It is a word, not a quantity, so the numeric hierarchy
is intact, but at 1366 the loudest thing on the frame after the turnout is a word, not a number.
Recording as observation, not a defect.

### 4. Contiguous dead region below the last inked block

- 1366x768: **26px** on the sellout nights, **29px** on all others. Consistent, small; the frame
  fills the viewport. No dead band was introduced by moving the control up-column — column 1
  (CASH + control) ends at 588 while column 2 ends at 742, so the empty CASH column repair 5 set
  out to fill is now occupied down to ~588 of 768.
- 1024x600: **0px** on the dense states (content continues past the fold), 3px on d2-n4,
  20px on ordinary nights, **55px** on zero-turnout nights (d3-n1/n2/n3/n5, d4-n3).

## Defects

1. ADVISORY, pre-existing, not introduced by repair 5 — **at 1024x600 the tail of WHAT HAPPENED
   falls below the fold on the two densest desk-nights.** d1-n4: last inked element is the resale
   sentence at bottom **620** in a 600px viewport (document scrollHeight 709), so
   "That money is not missing from your books — you never asked for it." is cut mid-sentence at
   rest (`d1-n4-1024x600.png`). d1-n5: the Night-5 repeat callback ends at 613 (docScroll 684).
   The text is reachable by scrolling and the advance control is above it, so the pair does not
   have to leave without the option to read it; but the R5-1 source comment's claim that
   "WHAT HAPPENED still renders above the fold at both shapes (measured)" is true of the card's
   top, not of its last sentence at 1024x600 on a dense night. Not blocking: 1024x600 is the
   first-contact floor, the control is reachable, and this geometry is repair 4's, not repair 5's.
2. ADVISORY — at 1024x600 on d1-n4 the drawn arena (the lit sold-out bowl, the frame's only
   emotional image) starts at ~478 and is almost entirely below the fold at rest. Same shape,
   same pre-existing cause.
3. At 1366x768 the sellout frame's document scrollHeight is 778 against 768 — a 10px scroll with
   no ink in it. Cosmetic; no content is hidden.

## Not verified

- Any viewport other than 1366x768 and 1024x600 on `/play`.
- `/board` and `/teach` in this run (not in scope for this assignment; the class was driven from
  `/teach` but no board or teacher frame was measured).
- REVEAL / ADAPT / COUNTERFACTUAL / SYNTHESIS phases — the run stopped after Night 5 settled.
- Real hardware, real Chromebook GPU, real students. Nothing here is HUMAN-TESTED or
  CLASSROOM-PROVEN.
- Whether states outside these four desk lines (e.g. a bowl-open sellout carrying BOTH a Night-5
  callback and a spend verdict at once) can push the control lower; the bowl is offered on Night 4
  only, so that combination does not exist in this slate (INFERRED from the measured slate).
