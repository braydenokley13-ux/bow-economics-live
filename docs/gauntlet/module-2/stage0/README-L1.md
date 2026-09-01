# Stage-0 Lesson-1 prototypes — three rival signature loops

Builder deliverable, Boss run `m2-quality-war`, assignment `proto-l1-trio`. Disposable, self-contained,
single-file HTML/CSS/JS (no frameworks, no external resources — run from `file://`). Purpose: let an
independent critic *play* each rival Lesson-1 loop and judge fun + economics before anything is built
for real. Visual polish is deliberately absent; interaction-cadence fidelity is not.

All three: zero RNG (deterministic, seedable via `newRun(seed)`), real NBA teams/markets, hidden demand
constants kept in a JS closure (not on `window`) with a `?debug=1` cheat mode for verification, and the
`window.__stage0` / `window.__stage0Actions` instrumentation contract described below.

---

## l1a-replay-dial.html — Design A, "Full House," U1 (the Replay Dial)

**Question this file must answer:** does the dial stay fun once the live number it ripples over stops
being tonight's truth and becomes last Saturday's history instead?

**Implements:** THE BOOK (last Saturday's actual price/turnout/money, fixed), THE SLATE (three
announced nights — real NBA opponents — different from last Saturday), THE DIAL with a live Replay
readout computed **only against last Saturday's hidden curve**, never tonight's. Round 1: **one** price
locked for all three nights (matching the pre-2010 one-price-per-homestand era, SR-13); REVEAL shows
each night's true, different outcome, including a resale-market line when a night sells out below the
capacity-clearing price. Round 2: the action space expands to **three separate dials**, one per night,
each carrying one announced exogenous shifter ("star ruled out," "nationally televised") before the
student commits — matching Design A's Beat 6.

**Deliberately omits:** THE HOUSE goodwill mechanic beyond the single Renewals-style resale line;
market-scaled bill/payroll obligation (no CASH-vs-obligation scoreboard, since U1 is only about whether
the dial mechanic itself survives the repair — a full two-book scoreboard is L1C's territory, not
duplicated here); per-fan in-arena ancillary spend (C12) — kept out to isolate the Replay-Dial question
from the loss-leader question, which L1C already tests directly.

**How numbers were modeled:** hidden linear demand `fans = base(draw, day) − sensitivity × price`,
capacity-clamped, `base` driven by a printed 0–100 "Draw" rating and a day multiplier. Real anchors:
Knicks/MSG market (SR-1), $76B national deal referenced in the footnote (SR-2), the "star ruled out"
shifter modeled on the real 2010/2014 LeBron James Cleveland demand shock (SR-11), synthesis line
citing the Giants' real 2009-10 dynamic pricing (SR-13). All curve constants are **modeled from real
market-size ranges, not any team's actual measured demand** — stated in the on-page footnote per SR-1's
open item.

---

## l1b-release.html — Design B, "Season on Sale," Stage-0 question 1 (SELL)

**Question this file must answer:** is "how much do I put on sale tonight" a felt decision, or a
shrug/slider-wiggle? Do ≥6 of 8 pairs (in the real Stage-0) change release size between nights for a
reason they can state?

**Implements:** THE HOUSE as 100 draggable-equivalent blocks (1 block = 200 seats, per Design B's own
spec), three block states (SOLD AS PASSES / ON SALE TONIGHT / HELD). Wave 1 (sell passes **before** the
schedule exists, cheaper, irreversible) → schedule release (new information, teacher/manual-triggered)
→ Wave 2 (passes now cost more, since the buyer knows the schedule too) → six real-NBA-opponent game
nights, each releasing 0..HELD blocks. **The going rate falls as more blocks are released** (flooding
the market drops the rate — the design's central claim), and **the student never sets a price at all**:
price is the market's answer to the quantity released. Released blocks are gone for good; held blocks
carry forward, creating the season-long inventory-allocation tension (spend early on a weak night vs.
hold for the marquee finale). Each night's card shows real-opponent facts and **history only**
("a comparable Tuesday last season released 18 blocks and cleared about $10,700/block") — never a
forecast of tonight.

**Deliberately omits:** L2/L3 continuity (this is an L1-only Stage-0 slice); the full DRAW/reinvest
mechanic (that is Design B's L2, out of scope for this trio); a supermajority/vote UI (L3-only). The
in-arena ancillary term is included (a flat $/seat rate on every occupied seat, pass or released) since
Design B names it as load-bearing for the intertemporal tension, unlike L1A above.

**How numbers were modeled:** `rate(release, night) = peak(night) × max(0, 1 − release/50)`, where
`peak(night) = base_rate + draw_factor × Draw`. Wave-1/Wave-2 season-pass prices, per-seat ancillary
spend, and the season bill are modeled illustrative magnitudes, not audited figures. Real anchors:
Golden State Warriors/Chase Center as the operated market (SR-12, privately financed arena, league's
highest 2024-25 revenue), the $76B national deal referenced as the fixed pipe that never moves with
release volume (SR-2), the Giants' 2009-10 dynamic-pricing synthesis line (SR-13). One night (Night 5,
a real Nuggets/Mavericks/Suns matchup depending on seed) carries a pre-announced, printed-before-commit
exogenous shifter, in the spirit of Design B's disputed R7 amendment (post-commitment surprise is not
used here — the shifter is always shown on the card before the release dial is touched).

---

## l1c-blind-price.html — Design C, "Full House," U1 (price the night blind)

**Question this file must answer:** does blind commitment (history-only feedback, zero revenue preview)
feel like reasoning or like guessing? Do ≥70% of (simulated) pairs move price in the shifter-indicated
direction from N2→N3, with an economic reason rather than "we just tried a number"?

**Implements:** Design C's exact five-card N1–N5 sequence (bottom-of-table Tuesday visitor; a stronger
Saturday visitor; a nationally-televised marquee Wednesday visitor pulling two shifters in opposite
directions; a demand-shock Saturday modeled on the real Caitlin Clark/Fever attendance jump, SR-6; N5
replaying N1's exact card so the only variable left is the student's own accumulated Renewals). **No
revenue preview anywhere** — the pre-commit dial shows dollars and nothing else; the only feedback
available before locking is the student's own printed history table (price, turnout, fill % per night
already played) and tonight's printed card. Two non-collapsible scoreboards from minute one: CASH and
RENEWALS, with renewals moving symmetrically around a public reference price ($44) rather than around
the hidden revenue-maximizing price — so the cash-optimal and renewals-optimal prices are structurally
different numbers, per Design C's FL1 antidote. The loss-leader term (C12, in-arena ancillary spend) is
tuned to actually move the true total-revenue-maximizing price several dollars below the ticket-only
optimum, and an underpricing resale-capture line ("your cheap seats resold outside the building")
supplies R6's antidote to a moral-about-greed reading. A "Two Peaks" synthesis panel and the N1-vs-N5
comparison appear only after all five nights are locked (mirroring the design's board-moment
sequencing, never as a pre-commit leak).

**Deliberately omits:** the market-scaled bill/payroll threshold as a pass/fail obligation (CASH is
shown as a running total, not checked against a bill, since Design C's L1 doc does not specify one
explicitly the way Design A's repair does); the class-aggregate Two-Peaks board (this is a solo Stage-0
seat, so the synthesis panel recomputes Night 3's own curve rather than aggregating a room of pairs).

**How numbers were modeled:** hidden linear demand `fans = base(draw) − 300×price`, capacity-clamped
at a modeled MSG-scale 19,800; `base = 14,000 + 210×Draw`, nudged by the running Renewals score so
path dependence is felt across nights, not just declared. Real anchors: Knicks/MSG (SR-1), the Fever
attendance shock 4,066→17,036 with six real clubs moving venues (SR-6), the Giants' 2009-10 dynamic
pricing (SR-13). All curves are **modeled from real market-size ranges, not the Knicks' actual measured
demand** (footnote on-page, per SR-1's open item).

---

## Instrumentation contract (all three files)

- `window.__stage0` — plain JSON-able object: `runCount`, `seed`, current phase/night index, running
  scoreboard values, and `log[]` (one entry per control adjustment and per lock, each carrying
  `adjustCountBeforeLock`, `timeToLockMs`, `committedValue`, and the resolved `outcome`). With
  `?debug=1` appended to the URL, `window.__stage0.debug` additionally exposes the true hidden curve
  constants for verification — never present without the query param.
- `window.__stage0Actions = { setControl(value), lock(), nextNight(), newRun(seed) }` — a Playwright
  driver can play an entire run headlessly through these four calls. `nextNight()` is a real transition
  in l1a (reveal1→round2, reveal2→done) and l1b (scheduleReveal→wave2; nightly transitions happen
  automatically inside `lock()`); in l1c the loop auto-advances on every `lock()`, so `nextNight()` is a
  documented no-op kept only for calling-convention symmetry across the three files.
- A visible run counter and a one-click "New run" button (`newRunBtn`) reset state via `newRun()`.
- A collapsible `<details>` "session log" panel renders the same log human-readably in the page.

## What none of these three files claim

None of these prototypes are wired to a class layer, a board view, or L2/L3 continuity — each is a
single seat's Lesson-1 loop only, exactly as each design's own Stage-0 uncertainty section calls for.
None have been played by an actual student or teacher; "fun" and "economics" verdicts belong to the
critic who plays them, not to this builder.
