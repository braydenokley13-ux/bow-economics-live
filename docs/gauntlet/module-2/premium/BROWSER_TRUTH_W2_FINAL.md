# BROWSER TRUTH — W2 FINAL re-check (browser-qa-w2, assignment w2-final-browser)

Build judged: `runtime/dist` as shipped at head `84d8983` (repair 4). Repo head at run time `62902c5`.
Nothing in `runtime/` was modified, no rebuild, no Boss CLI. Label: **AGENT-PLAYTESTED**. Never
HUMAN-TESTED, never CLASSROOM-PROVEN.

Method: one Playwright driver (`final.cjs`), run once per viewport against a private server on port
4441 with its own snapshot file. 4 desks, 5 nights, full phase walk LOBBY -> HOOK -> PLAY -> REVEAL
(stages 0-7) -> ADAPT -> COUNTERFACTUAL -> SYNTHESIS (pages 1-6) -> COMPLETE. Every rect is
`getBoundingClientRect()` taken after `window.scrollTo(0,0)`, at the desk's own viewport.

Desk roles (chosen to hit every composition the brief names):

- **desk1** Rae & Ben — varied price ($40/$48/$40/$52/$34), bowl closed. Sells out N4.
- **desk2** Nour & Ivy — holds the $16 plan price all five nights, **bowl CLOSED** -> bowl-closed
  sellouts on N2 and N4.
- **desk3** Ari & Tal — $120 every night -> **zero-turnout** nights (N1, N2, N3, N5).
- **desk4** Sam & Jo — **bowl OPEN every night**, plus **$40,000 of event money** from N2 on ->
  bowl-open sellout with money spent on N4 (the maximal-content settled frame).

## Verdict on my own IMPORTANT finding

My wave-2 IMPORTANT finding was: at 1024x600 the sellout nights and the bowl-open+spend night put
`#fhNextNight` bottom at 623-631 against a 600px viewport and the turned-away figure at bottom 710.

**OBSERVED-PASS at 1024x600. The finding is DISCHARGED.** Re-measured on the repair-4 build, every
one of the 20 settled desk-nights has `#fhNextNight` bottom <= 526 against vh 600 (worst case:
desk4 N4, bowl open + $40k spent + sellout, bottom **526**, 74px of clearance). The turned-away
figure now sits at bottom **448** on all four sellout frames, 152px inside the fold — it was 710.
Screenshot: `10-desk4-Night4-1024x600.png`, `10-desk2-Night4-1024x600.png`.

## OBSERVED-FAIL at 1366x768 — new state, same defect class

The fix did not hold at the design-target viewport for the richest frame.
**desk4 Night 4 (bowl OPEN + $40,000 event money + SELLOUT) at 1366x768: `#fhNextNight` bottom =
811 against vh 768 — OVERFLOW by 43px**, document scrollHeight 873. Screenshot
`10-desk4-Night4-1366x768.png` shows the violet NEXT: NIGHT 5 bar clipped by the bottom edge with
only its top sliver visible. It is reachable by scrolling (the page is 873px tall), so this is not
a dead end, but the night-advance control is not on screen at rest on the loudest frame of the
lesson. Requirement 5 (builder's reported 1366 settled-night NEXT band 595-697) is therefore
**UNMET**: observed band is 595-811, and the one state outside the builder's band is the one the
builder did not drive.

Regression provenance: **INFERRED, not observed.** My previous 1366 pass never drove
bowl-open + spend + sellout simultaneously; its 1366 maximum was 633 (`result-desk2-Night4`,
bowl-closed sellout). Repair 4 raised the equivalent bowl-closed sellout from 633 to 697 (+64px).
Applying the same +64 to a pre-repair desk4-N4 frame would put it near 747 — inside 768. So repair 4
plausibly converted a marginal frame into an overflowing one, but I cannot prove that without
rebuilding the previous head, which I am not permitted to do.


## Row-by-row against the brief

1. **Every settled night, `#fhNextNight` bottom <= vh** — 1024x600: **MET**, 20/20 (tables below,
   every number listed). 1366x768: **UNMET on 1/20** (desk4 Night 4, 811 > 768); the other 19 are
   595-740. OBSERVED.
2. **Sellout: turned-away figure inside the fold, second-largest figure** — bottom 448 at 1024x600
   (vh 600) and 755 at 1366x768 (vh 768) on all four sellout frames: **inside the fold at both
   sizes, OBSERVED**. Size rank, OBSERVED and stated precisely: the turned-away number is the
   **second-largest numeric figure** on the frame (1366: turnout 72px > turned-away 40px > money
   31px; 1024: 64px > 34px > 26px). It is the **third-largest text element** by font size, because
   the "FULL HOUSE" wordmark sits between them (1366: 60px; 1024: 38px). If the brief means numbers,
   MET; if it means any rendered text run, the wordmark outranks it.
3. **`#fhNights` top < vh on all five nights** — MET at both sizes, OBSERVED. `#fhNights` is the
   pre-lock rail chart; it is not rendered in the settled-result view at all (measured null there,
   which is a render fact, not a layout miss). Worst case at 1024x600 is top 488 (desk4 N3-N5);
   worst at 1366x768 is top 618 (desk4 Night 4). The chart *bottom* runs past the fold in the loud
   cases (max 904 at 1366 desk4 N4), which the brief did not require but I record.
4. **Zero-turnout night: headline, money line, NEXT all inside the fold** — MET, OBSERVED. desk3
   every night at both sizes. 1024x600 N1: headline top 127/bottom 153, CASH block 160-384 (the
   `-$520,000` figure 322-352), NEXT 392-454. 1366x768 N1: headline 117-147, CASH 156-407
   (`-$520,000` at 334-367), NEXT 568-630. The "0" turnout figure renders at 64px/72px.
5. **1366 settled NEXT bottoms still inside 768** — **UNMET**, see above. 19/20 inside (595-740),
   desk4 Night 4 at 811.
6. **Rail PIN chip fully inside the viewport** — MET, OBSERVED, both sizes, all 42 sampled states
   (pre-lock and every settled frame): every `.fh-pin-chip` rect had top>=0, left>=0, bottom<=vh,
   right<=vw. 1024x600 pre-lock: top 73, bottom 108, right 1011 of 1024.
7. **Previously discharged rows, re-confirmed** — OBSERVED at both sizes:
   - Gold/Bebas: **0 violations** across 17 audited `/play` states per viewport (34 audits;
     `#gameBody` walked element-by-element for `rgb(244,185,66)` in colour/border/background/
     outline/box-shadow and for a Bebas font-family, SVG interior carved out). No regression.
   - Reveal stages 0-7: **8/8 distinct** body hashes, both viewports. Synthesis pages 1-6:
     **6/6 distinct**, both viewports.
   - Forbidden vocabulary: raw substring count is **not** zero, and it is **unchanged from my
     previous pass** (same three hits, no regression). All three are negations in registered copy
     that deny a forecast/preview exists: HOOK hero "Five nights. Two dials. No forecast — just
     tonight's card"; HOUSE_RULES[0] "There is no preview — the dials show dollars and nothing
     else" (the brief's explicit carve-out), which is why HOOK and pre-lock each also count
     "preview"; and at 1024x600 the COMPLETE wrap "You priced five nights with no forecast".
     Zero occurrences of `project`, `estimate`, `expected`, `target`, `profit`, `readiness`,
     `momentum`, `time remaining`, `strong round`, `of capacity`, `weather` on any `/play` state at
     either viewport. No state renders a forward-looking claim; the scanner counts the denial.
   - Zero console errors and zero page errors across both full runs.
8. **No `/play` state with >200px contiguous dead region below its last content block at
   1366x768** — MET, OBSERVED. Measured as `.fh-main` bottom minus last visible child bottom:
   LOBBY 146, HOOK 22, PLAY pre-lock 22, REVEAL 22, ADAPT 22, COUNTERFACTUAL 22, SYNTHESIS 64,
   COMPLETE 64. (1024x600: 16 on every state.) Separate observation, not this row: on the 1366
   desk4-N4 sellout frame the left CASH column ends at y=501 while the right column runs to 755,
   leaving roughly 250px of empty column beside live content — column-internal, so it does not
   trip the below-last-block metric.

## Other observations (not blocking, recorded)

- At 1024x600 the `/play` COMPLETE body hash equals the SYNTHESIS page-6 hash (`7b2ec9fc9bcc`), i.e.
  advancing from SYNTHESIS to COMPLETE changed nothing on the student screen at that size. At
  1366x768 the two differ. OBSERVED; cause NOT VERIFIED.
- desk3 held $120 for five nights and drew 0, 0, 0, 10,450, 0. The N4 draw at an unchanged $120 is
  the card doing the work; noted for the economics reviewers, out of my remit.
- Documents scroll past the viewport on several settled 1024x600 frames (max doc 699 vs vh 600) but
  the NEXT control is inside the fold on all of them.

## Measurement tables (every night, no summaries)

### 1024x600 settled nights

| desk · night | state | headline | #fhNextNight bottom | vs 600 | turned-away bottom / font | doc scrollHeight |
|---|---|---|---|---|---|---|
| desk1-Night1 | settled | NIGHT 1 · 12,510 CAME AT $40 | 454 | IN FOLD | — | 600 |
| desk2-Night1 | settled | NIGHT 1 · 14,740 CAME AT $16 | 454 | IN FOLD | — | 600 |
| desk3-Night1 | settled | NIGHT 1 · 0 CAME AT $120 | 454 | IN FOLD | — | 600 |
| desk4-Night1 | settled | NIGHT 1 · 5,360 CAME AT $44 | 454 | IN FOLD | — | 600 |
| desk1-Night2 | settled | NIGHT 2 · 14,288 CAME AT $48 | 454 | IN FOLD | — | 600 |
| desk2-Night2 | SELLOUT | FULL HOUSE 17,794 of 17,794 · 238 turned away | 468 | IN FOLD | 448 / 34px IN FOLD | 674 |
| desk3-Night2 | settled | NIGHT 2 · 0 CAME AT $120 | 454 | IN FOLD | — | 600 |
| desk4-Night2 | settled | NIGHT 2 · 10,018 CAME AT $44 | 483 | IN FOLD | — | 600 |
| desk1-Night3 | settled | NIGHT 3 · 12,450 CAME AT $40 | 454 | IN FOLD | — | 600 |
| desk2-Night3 | settled | NIGHT 3 · 14,526 CAME AT $16 | 454 | IN FOLD | — | 600 |
| desk3-Night3 | settled | NIGHT 3 · 0 CAME AT $120 | 454 | IN FOLD | — | 600 |
| desk4-Night3 | settled | NIGHT 3 · 8,278 CAME AT $38 | 483 | IN FOLD | — | 600 |
| desk1-Night4 | SELLOUT | FULL HOUSE 19,800 of 19,800 · 1,275 turned away | 468 | IN FOLD | 448 / 34px IN FOLD | 699 |
| desk2-Night4 | SELLOUT | FULL HOUSE 17,794 of 17,794 · 7,256 turned away | 468 | IN FOLD | 448 / 34px IN FOLD | 699 |
| desk3-Night4 | settled | NIGHT 4 · 10,450 CAME AT $120 | 454 | IN FOLD | — | 608 |
| desk4-Night4 | SELLOUT | FULL HOUSE 19,594 of 19,594 · 1,896 turned away | 526 | IN FOLD | 448 / 34px IN FOLD | 699 |
| desk1-Night5 | settled | NIGHT 5 · 13,492 CAME AT $34 | 440 | IN FOLD | — | 600 |
| desk2-Night5 | settled | NIGHT 5 · 15,340 CAME AT $16 | 440 | IN FOLD | — | 600 |
| desk3-Night5 | settled | NIGHT 5 · 0 CAME AT $120 | 440 | IN FOLD | — | 600 |
| desk4-Night5 | settled | NIGHT 5 · 10,140 CAME AT $30 | 469 | IN FOLD | — | 615 |

### 1024x600 pre-lock nights chart

| pre-lock state | #fhNights top | #fhNights bottom | top < 600 |
|---|---|---|---|
| prelock-desk1-Night1 | 436 | 718 | yes |
| prelock-desk4-Night1 | 436 | 732 | yes |
| prelock-desk1-Night2 | 436 | 718 | yes |
| prelock-desk4-Night2 | 436 | 732 | yes |
| prelock-desk1-Night3 | 436 | 718 | yes |
| prelock-desk4-Night3 | 488 | 784 | yes |
| prelock-desk1-Night4 | 436 | 718 | yes |
| prelock-desk4-Night4 | 488 | 784 | yes |
| prelock-desk1-Night5 | 436 | 718 | yes |
| prelock-desk4-Night5 | 488 | 784 | yes |

### 1366x768 settled nights

| desk · night | state | headline | #fhNextNight bottom | vs 768 | turned-away bottom / font | doc scrollHeight |
|---|---|---|---|---|---|---|
| desk1-Night1 | settled | NIGHT 1 · 12,510 CAME AT $40 | 630 | IN FOLD | — | 768 |
| desk2-Night1 | settled | NIGHT 1 · 14,740 CAME AT $16 | 595 | IN FOLD | — | 768 |
| desk3-Night1 | settled | NIGHT 1 · 0 CAME AT $120 | 630 | IN FOLD | — | 768 |
| desk4-Night1 | settled | NIGHT 1 · 5,360 CAME AT $44 | 630 | IN FOLD | — | 768 |
| desk1-Night2 | settled | NIGHT 2 · 14,288 CAME AT $48 | 630 | IN FOLD | — | 768 |
| desk2-Night2 | SELLOUT | FULL HOUSE 17,794 of 17,794 · 238 turned away | 697 | IN FOLD | 730 / 40px IN FOLD | 768 |
| desk3-Night2 | settled | NIGHT 2 · 0 CAME AT $120 | 630 | IN FOLD | — | 768 |
| desk4-Night2 | settled | NIGHT 2 · 10,018 CAME AT $44 | 652 | IN FOLD | — | 768 |
| desk1-Night3 | settled | NIGHT 3 · 12,450 CAME AT $40 | 595 | IN FOLD | — | 768 |
| desk2-Night3 | settled | NIGHT 3 · 14,526 CAME AT $16 | 595 | IN FOLD | — | 768 |
| desk3-Night3 | settled | NIGHT 3 · 0 CAME AT $120 | 595 | IN FOLD | — | 768 |
| desk4-Night3 | settled | NIGHT 3 · 8,278 CAME AT $38 | 670 | IN FOLD | — | 768 |
| desk1-Night4 | SELLOUT | FULL HOUSE 19,800 of 19,800 · 1,275 turned away | 697 | IN FOLD | 755 / 40px IN FOLD | 791 |
| desk2-Night4 | SELLOUT | FULL HOUSE 17,794 of 17,794 · 7,256 turned away | 697 | IN FOLD | 755 / 40px IN FOLD | 791 |
| desk3-Night4 | settled | NIGHT 4 · 10,450 CAME AT $120 | 595 | IN FOLD | — | 768 |
| desk4-Night4 | SELLOUT | FULL HOUSE 19,594 of 19,594 · 1,896 turned away | 811 | **OVERFLOW +43px** | 755 / 40px IN FOLD | 873 |
| desk1-Night5 | settled | NIGHT 5 · 13,492 CAME AT $34 | 660 | IN FOLD | — | 768 |
| desk2-Night5 | settled | NIGHT 5 · 15,340 CAME AT $16 | 625 | IN FOLD | — | 768 |
| desk3-Night5 | settled | NIGHT 5 · 0 CAME AT $120 | 608 | IN FOLD | — | 768 |
| desk4-Night5 | settled | NIGHT 5 · 10,140 CAME AT $30 | 740 | IN FOLD | — | 802 |

### 1366x768 pre-lock nights chart

| pre-lock state | #fhNights top | #fhNights bottom | top < 768 |
|---|---|---|---|
| prelock-desk1-Night1 | 475 | 761 | yes |
| prelock-desk4-Night1 | 475 | 761 | yes |
| prelock-desk1-Night2 | 475 | 761 | yes |
| prelock-desk4-Night2 | 475 | 761 | yes |
| prelock-desk1-Night3 | 475 | 761 | yes |
| prelock-desk4-Night3 | 525 | 811 | yes |
| prelock-desk1-Night4 | 566 | 852 | yes |
| prelock-desk4-Night4 | 618 | 904 | yes |
| prelock-desk1-Night5 | 475 | 761 | yes |
| prelock-desk4-Night5 | 525 | 811 | yes |

## Raw artifacts

- Driver: `/tmp/claude-0/-home-user-bow-economics-live/b7d92d84-0c75-5390-a162-cde0bce24742/scratchpad/boss/w2-final-browser/final.cjs`
- Payloads: `measurements-1024x600.json`, `measurements-1366x768.json`, `run-1024b.log`, `run-1366.log` in the same folder.
- 64 screenshots: `/home/user/bow-economics-live/docs/gauntlet/module-2/premium/screens-w2-browser-final/` (index: `screens-manifest.md`).
