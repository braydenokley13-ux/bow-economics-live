# PLATFORM REALITY BRIEF — Module 1 Ground-Up Rebuild

**Merged from five independent codebase audits · repo at `/home/user/bow-economics-live` · branch `claude/nba-franchise-module-1-nwdafm` · verified this session where marked ✅**

Baselines confirmed this session: `npm test` → 603/603 pass, exit 0, ~37.6s. `npm run boss:doctor` → 22 PASS. `npm run boss:test` → 49/49. Chromium 1.56.1 launches; `node scripts/e2e-stale-poll.cjs` → PASS.

---

## 0. The one-paragraph verdict

The shared runtime is a genuinely content-agnostic classroom kernel and you should build M1 on it unchanged. The *clients* are not agnostic — all three surfaces dispatch on a hard-coded module-id switch, and the contract's own header comment says otherwise. The *quality bar* is set by Module 2, and it is a bar of instrumentation, not polish: claim atoms, THE ROOM, THE DESKS, gate call, payload-level reveal gating, `classEvents`, `RoundContract`, rehearsal marking, measured drawings. Module 1 has **zero** of those (grep-verified: every count is 0 across `draftDay.ts`, `tradeDeadline.ts`, `freeAgency.ts` except two `onPhaseExit`s ✅). And M1's content is entirely fictional, which the founder invariant (CLAUDE.md §3) no longer permits. The rebuild is therefore: keep the runtime, keep ~12 mechanics, throw away all content, and pay the instrumentation tax on day one rather than on day sixty.

---

## 1. WHAT THE RUNTIME GIVES YOU FREE

### 1.1 The contract (`runtime/src/shared/lessonModule.ts`)

Required members — `runtime/src/shared/lessonModule.ts:32-75`:

| Member | Line | Notes |
|---|---|---|
| `id`, `title` | :33-34 | `id` is the key everything else switches on |
| `phases: readonly CanonicalPhase[]` | :40 | must be a strictly increasing subsequence of `CANONICAL_PHASES` |
| `initialState({sessionId, seatIds, seed?})` | :52 | called **once**, at createSession, with `seatIds: []` |
| `reduce(state, action, ctx) → {ok:true,state} \| {ok:false,reason}` | :60 | the only real gate |
| `allowedActions(phase)` | :63 | **no runtime call sites** (see §8) |
| `studentView(state, seatId, phase)` | :66 | |
| `teacherView(state, phase)` | :69 | |
| `boardView(state, phase)` | :72 | **structurally never handed a seatId** |
| `aggregate(state, phase)` | :75 | called only from `test/fullHouse.test.ts:266` |

Optional hooks — exactly three:
- `round?: RoundContract<TState>` — `:97`, shape at `:155-205`
- `onPhaseExit?(state, fromPhase, toPhase)` — `:118`
- `classEvents?(prev, next, {fromPhase, toPhase})` — `:120-152`

`ReduceContext` is `{phase, seatId | "teacher", seatIds, now}` (`:20-25`).

### 1.2 Phase vocabulary (`runtime/src/shared/phases.ts`)

Ten canonical phases: `LOBBY HOOK PLAY REVEAL CONSEQUENCE ADAPT COUNTERFACTUAL ARGUE SYNTHESIS COMPLETE` (`phases.ts:10-21`). `isOrderedSubsequence` at `:40-49`. `registerModule` (`sessionService.ts:267-272`) validates this and **nothing else** ✅. The first declared phase is the session's start phase (`sessionService.ts:337`).

Teacher controls are exactly: `advance` (+1 through your list), `reveal` (jump to REVEAL), `pause`/`unpause`, `freeze`/`unfreeze`, `hook` (generic `teacher:<name>` into your reducer), `end`, `restore`, `finalCall`, `closeNow`, `cancelFinalCall` (`sessionService.ts:794-880`). **There is no "go back a phase."**

### 1.3 Session machinery you inherit without writing a line

| Capability | Where | What it gives you |
|---|---|---|
| Join codes, seats, display names | `sessionService.ts:420-450` | |
| Teacher bearer key (32-byte, SHA-256 at rest) | `sessionService.ts:339`, `:347-351` | gates `/control`, `/teacher`, `/unlock`, `/reseat` |
| Device token + rejoin PIN (scrypt on the libuv pool) | `crypto.ts:39-58` | measured fix for a 1.1s projector freeze at 30 joins |
| PIN lockout at 5 failures, teacher-only clear | `sessionService.ts` (`failedRejoinAttempts`) | |
| Reseat — same desk, new device, new PIN | `sessionService.ts` (`reseatSeat`), console at `teach/main.ts:1588` | D43 |
| Checkpoint + one-deep restore, human-labelled | `types.ts:14-37`, `sessionService.ts:1015-1030`, `:890-926` | restore itself snapshots, so a wrong restore is undoable |
| TIME CUT / FINAL CALL lifecycle | `sessionService.ts:709-762` (`sweepRound`, `closeRound`) | server-authoritative; close travels **your** reducer |
| Stale-round refusal in your own noun | `sessionService.ts:625-643` | definitive 409, non-retryable |
| Class log + WHILE YOU WERE AWAY recap | `sessionService.ts:1126-1152` (`withClassLog`), `:1171-1191` (`markSeen`), `:1194-1208` (`awayFor`) | AWAY_MS = 30s |
| Idempotent action pipeline | `sessionService.ts:594-680` + `client/shared/outbox.ts` | 60 applied ids per seat, retryable-vs-definitive refusals |
| Monotonic freshness gate | `client/shared/freshness.ts` | D32 — a surface never moves backwards |
| ETagged poll + SSE nudge | `client/shared/poll.ts`, `server/http.ts:273/:392/:416` | push decides *when*, the fetch decides *what is true* |
| Atomic snapshot + quarantine | `snapshotRepository.ts:120-185`, `:219-242` | tmp+rename, 200ms coalesce, SIGINT flush, `.corrupt-<ts>` |
| Structural board privacy | `sessionService.ts:1090` | `boardView(state, phase)` — no seat field anywhere in `BoardPayload` |

### 1.4 Free client surfaces (payload-shaped, no client code needed)

These four are the *only* parts of `/teach` that are shape-driven rather than id-switched. Emit the shape, get the panel:

- **THE ROOM** — emit `view.room`; renderer at `teach/main.ts:675-736`, mirrored type at `:453-466`.
- **THE DESKS** — emit `view.deskStrip`; renderer at `teach/main.ts:598-673`, mirrored type at `:467-471`.
- **The director panel** (NOW / ON THE PROJECTOR / WATCH FOR / TRIGGER / THE REVEALS / ASK / DON'T EXPLAIN YET / IF YOU'RE RUNNING LATE) — `renderDirector`, `teach/main.ts:1414-1566`, reading `view.director`, `view.projectorNow`, `view.watchFor`, `view.revealStages`, `view.studentScreen`, `view.simplifications`, `view.bellNote`. **This is the Random-Teacher-Standard machinery and M1 currently ships none of it** (`DIRECTED_LESSONS` at `teach/main.ts:125` is M2-only).
- **TIME CUT / FINAL CALL on all three surfaces** — declare `round` and you get `/teach`'s panel (`teach/index.html:266-283`), `/play`'s sticky bar (`play/main.ts:423`), `/board`'s countdown band (`board/main.ts:93`).

Also free, cross-cutting: the projector mirror iframe (`teach/main.ts:518-577`, D31), BOARD LIVE/QUIET/NOT SEEN (`teach/main.ts:818-830`, D44), the class clock (`classMinute()`, `teach/main.ts:1371-1382`, D42), THE DECK sticky control bar (`teach/main.ts:1272-1312` — but its `DECK_PRIMARY` id list at `:1241` is per-module).

---

## 2. WHAT YOU MUST WRITE

### 2.1 Server side — one file per lesson

`runtime/src/modules/<lesson>.ts`, registered with one line in `runtime/src/server/index.ts:26-32` ✅.

You must write, because nothing else will:

1. **Your own phase gate in every `reduce` branch.** `if (ctx.phase !== "PLAY") return {ok:false, reason:…}` — see §8 finding #1.
2. **Lazy per-seat materialisation.** `initialState` sees `seatIds: []` (`sessionService.ts:322` ✅). `join()` never calls your module. The only two working patterns: derive purely from `seatId` inside views, or materialise on first action via `ctx.seatIds.indexOf(seatId)` (`boxOffice.ts:237`, `draftDay.ts:536`). **Design for the pair that joins and never acts** — they must still be right on `/board`, in `aggregate`, and in `round.unresolved`.
3. **A module-owned desk registry.** `closeRound` and the generic teacher hook both pass `seatIds: []` (`sessionService.ts:749`, `:849` ✅). Pattern: `state.deskOrder` + `state.desks`, populated by a student action, defended with `new Set(seatIds)` intersection (`fullHouse.ts:3067-3072`; `hostTheLeague.ts:3274-3276`).
4. **Seed validation.** The envelope is exactly `{lessonModuleId, state}` (`sessionService.ts:320` ✅). Validate the source module id *and* the shape, defensively per team, and ship an honestly-labelled stock franchise for the missing/foreign/malformed case.
5. **Every sentence any human reads**, on all three surfaces (see §4.1).
6. **The optional hooks that are not really optional at this quality bar**: `round`, `onPhaseExit`, `classEvents`, plus `roomRead`, `deskStripOf`, `watchFor`, rehearsal decks, claim atoms and `moduleClaims`.

### 2.2 Client side — three hand-written renderers, no framework

There is **no bundler, no framework, no npm runtime dependency** (`runtime/package.json` `dependencies: {}` ✅). Build is `tsc -p tsconfig.json && node scripts/copy-static.mjs`. Output must be plain browser ES modules with explicit `.js` import extensions (`module: NodeNext`).

Where the code goes:
- `runtime/src/client/play/main.ts` — add a branch to the id chain at `:567-596`, plus a per-phase switch inside your renderer.
- `runtime/src/client/board/main.ts` — same, at `:129-168`.
- `runtime/src/client/teach/main.ts` — **three** places: `renderAggregate` (`:1616-1623`), the lesson-control id constants (`:84-90`) and their ~280 lines of hidden/disabled/label logic inside `render()` (`:880-1160`), and `rehearseNoteFor` (`:127`). New teacher hooks also need new markup in `teach/index.html:352-383`, a new `advanceWarnState` arm (`teach/main.ts:1157-1180`) and a new `confirmSkippingContent` branch (`:2226`).
- CSS: `runtime/src/client/shared/theme.css` (3112 lines, M1's ad-hoc class soup) or `shared/m2.css` (2198 lines, real token system, scoped behind `html[data-module="m2"]`) or a new third scope. `board/index.html` carries ~450 unscoped lesson rules in one `<style>` block at `:11-460`.

Every module-level `let` render cache you add to `play/main.ts` must be assigned in `resetSeatRenderState()` (`play/main.ts:208-247`) — enforced by grep at `clientSurfaceInvariants.test.ts:78-95`.

### 2.3 Asset reality — read this before designing anything visual

- **Only `.html .js .css .json .svg .woff2` are servable.** `STATIC_TYPES`, `server/http.ts:87-96` ✅. A `.png`/`.jpg`/`.webp`/`.mp4` request 404s.
- `copy-static.mjs:56` copies only `.svg` from `design/assets` ✅.
- Everything except `.woff2` is served `Cache-Control: no-cache` with no ETag (`http.ts:99`, `:113`) ✅. No bundler, no minifier, no gzip. A `/play` refresh pulls ~530KB (`play/main.js` 309KB + `theme.css` 90KB + `m2.css` 61KB + `arena.js` 44KB + `m2ui.js` 18KB). Thirty Chromebooks after a wifi blip ≈ 16MB off the teacher's laptop.
- No `<canvas>`, no `requestAnimationFrame`, no WebGL, no animation library anywhere. All motion is CSS keyframes plus one Web Animations call (`fhAnimate`, `play/main.ts:3687`).
- `design/` is read-only from `runtime/` ("consume, never edit" — `shared/crest.ts:1-8`).

**Proven visual techniques on this platform:** procedural SVG from arithmetic (`shared/arena.ts`, 1019 lines, seeded PRNG, squashed-ellipse camera, equal-area radial fill, in-SVG reduced-motion collapse); pure HTML-string component builders (`shared/m2ui.ts` — icon sprite, radial gauge, bar pills, dot chart with real label de-collision); CSS-sprite crop of a multi-cell SVG sheet (`shared/crest.ts`, 26 lines).

---

## 3. THE GRADE-BAND SEAM

**D38 (`docs/PRODUCT_DECISIONS.md:659-674`, ACTIVE)** records: no `gradeBand` field is built until a second band exists; when one is, it attaches at *exactly two* places — `createSession` input carried onto the session row, and the `initialState` context — "and nothing else in the runtime needs to know."

**Verified this session:** the two named points are real and clean. `gradeBand` / `grade_band` / `gradeProfile` appear **nowhere in `runtime/src`** ✅ (grep). **But D38 is incomplete.**

### 3.1 Point 1 — createSession input → session row (VERIFIED CLEAN, purely additive)

Full additive path, no branching logic anywhere along it:

| Step | File:line |
|---|---|
| Input object literal | `sessionService.ts:296-301` ✅ |
| `NewSession` | `types.ts:165-172` ✅ |
| `SessionRow` | `types.ts:96-125` ✅ |
| Row literal at creation | `snapshotRepository.ts:260` |
| Load-time default (older snapshots) | `snapshotRepository.ts:152` |
| POST body parse | `http.ts:236-246` |
| `SessionPatch` **excludes it** → correctly immutable after creation | `types.ts:174-176` ✅ |

### 3.2 Point 2 — `initialState` input object (VERIFIED CLEAN)

One call site: `const state = mod.initialState({ sessionId, seatIds: [], seed });` — `sessionService.ts:322` ✅. Additive.

### 3.3 Point 3 — THE SEED ENVELOPE (D38 DOES NOT NAME THIS; IT MUST)

`sessionService.ts:320` ✅, verbatim:

```ts
if (source) seed = { lessonModuleId: source.lessonModuleId, state: source.state };
```

A receiving module can tell **which module** produced the state and nothing else. Consequences for a dual-band M1 (D22 program #2, `PRODUCT_DECISIONS.md:311-340`):

- A 7–8 room seeded from a 5–6 room's L1 sees a well-formed seed from the right `lessonModuleId`, accepts it, and carries 5–6 franchise depth into a 7–8 lesson with **nothing in the runtime able to notice**.
- D39 (`:676-690`) requires the link picker to warn when the source is still live. That warning exists only in the `/teach` UI; the receiving module cannot detect the condition. Same class of blind spot.

**The seed envelope needs provenance:** at minimum `{lessonModuleId, gradeBand, state}`, and arguably `{sourceSessionId, sourcePhase, sourceEnded}` so D39's warning can also be a module-side guard.

### 3.4 Point 4 — the picker's own payload

`TeacherPayload.session` (built at `sessionService.ts:1273` via `teacherPayload`) has no place for a band, so `/teach`'s link picker could not warn about a cross-band link even if the data existed. `listSessions` (`sessionService.ts:405-415`) is what the picker reads.

### 3.5 Everything downstream that would need to know

1. Each module's `initialState` (content selection, scaffolding depth).
2. Each module's seed reader (reject or normalise a cross-band carry).
3. Every synthesis card and every claim atom (reading level and the formalization vocabulary differ by band).
4. The director panel's copy (`view.director`, `view.bellNote`) — a 7–8 script is not a 5–6 script.
5. `/teach`'s lesson picker and link picker (label the band, warn on a mismatch).
6. Any claims-audit harness (a band is a dimension of the sweep, not a variant of it).

**Recommendation for the rebuild:** if M1 is built dual-band from birth, plan for **three attachment points minimum** (createSession input, `initialState`, seed envelope) plus the picker payload, and amend D38 rather than silently exceeding it.

---

## 4. THE QUALITY BAR M2 SET

Grep-verified across all three M1 modules: `roomRead`, `deskStrip`, `gateCall`, `classEvents`, `round:`, `moduleClaims`, `ClaimAtom`, `watchFor`, `REHEARSAL` — **all zero** ✅. Only two `onPhaseExit` implementations exist (`tradeDeadline.ts:892`, `freeAgency.ts:961` ✅).

| # | Instrument | What it is | Where it lives | Generic or per-module |
|---|---|---|---|---|
| 1 | **Claims audit** | Every printed number is a `ClaimAtom` carrying `{id, rendered, value, format, assertsSign, bounds?, quantifier?, absent?}`; `rendered` is produced *from* `value` so the printed figure **is** the computed figure by construction. `moduleClaims(state)` enumerates every claim-carrying surface by stable id. An external harness recomputes each relation **by replaying the reducer**, and proves itself with four mutants (wrong sign / quantifier / bound / economic noun) that it must catch. | Types + builders: `hostTheLeague.ts:1484-1584`; sweep: `:4943-4993`; audit: `docs/gauntlet/module-2/stage0/l2-tuning-harness.mjs` P11 (`:1063-2040`) | **Per-module, hand-copied.** Second copy at `writeTheRule.ts:803-857` has already **drifted**: its `Claimed` (`:816`) has no `board` field, so D24's projector/teacher split is structurally unavailable in that lesson. **`fullHouse.ts` has NO claim atoms at all** ✅ — the module with the strongest loop is uncovered. |
| 1b | **Renderer-sentence rule** | Any run of ≥5 words the renderer prints must appear verbatim in the module file. Plus a forbidden-vocabulary scan of all client source. | `runtime/src/test/clientClaims.test.ts:272-309` (sentence limb), `:53-67` + `:210-246` (vocabulary) | **The vocabulary limb is the ONE automatically cross-cutting harness** — it reads all three `main.ts` in full (`:45`, `:180-185`). The sentence limb is Full-House-only, anchored to two literal comment markers (`:253-254`). |
| 2 | **THE ROOM** (D30) | Teacher-private computed read: spread over **committed decisions only** (undecided dials ghost, never count as a choice), a stacked histogram on the dial's own grid capped at 12 bars, and movement claimed **only against a number the desk chose itself** (bell-committed → `noOwnPrior`, first round → `noPrior`, both reported separately). | Module: `fullHouse.ts:3803` (`RoomDesk`), `:3824-3946` (`roomRead`), attached `:3497`. Renderer: `teach/main.ts:675-736` | **Renderer generic** (shape-driven, zero client code). **Module per-lesson** — every sentence is the lesson's own. |
| 3 | **THE DESKS** (D34-D36) | The module's handle joined to the real pair, `state` from a closed vocabulary (`in`/`deciding`/`auto`/`closed`), a module-authored `stateLabel`, at most one `note`, and a `flag` saying whether this is a reason to **walk over**. D36: only rounds the seat was actually present for count against it (`covered = joinedAtNight - 1`). | Module: `fullHouse.ts:1456-1517`, attached `:3499`. Renderer: `teach/main.ts:598-673` | Same split. Renderer generic; note the type is **mirrored by hand** on both sides (`teach/main.ts:453-478`), with no compile-time link. |
| 4 | **THE GATE CALL** (D28) | A committed pair waiting on the room gets a **stake**, not a spinner: a free, changeable-until-the-bell prediction of the one thing they can't look up. Seven rules: free (no money), changeable, gated on commitment, nothing handed to a pair that never called, **bands measured against this lesson's own outcome distribution**, forecasting-only resolution language, plus an aggregate "N of M desks are in" line that never names a seat. | `fullHouse.ts:959-1057`, reduce `:3052-3066`, payload `:3295-3306` | **Per-module by necessity** — the bands must be re-measured (L2's floors give L1 a 14% middle band, "a call nobody makes", `:974-979`). |
| 5 | **Per-beat reveal gating** (D26/D47) | Numbers are gated **into the payload** with spread operators keyed off a module-owned `beat`, never filtered out on the client — otherwise every beat's numbers sit in the desk's payload one devtools panel away, and the choreography lives where no unit test can reach it. `deskBeat` is sent so the renderer knows what it's painting. D47: a desk holds the **furthest** card the projector reached, not the current page. | `hostTheLeague.ts:3636-3742` (the one-liner is `:3641`); board mirror `:4023-4056`; L1's version `fullHouse.ts:3329-3336` | **Per-module.** Assertable with no browser: `hostTheLeague.test.ts:1960-1989` loops every beat and requires each key `undefined` before its beat. |
| 6 | **`classEvents`** | Module writes its own WHILE-YOU-WERE-AWAY recap. Class-level only (another desk reads it), past tense, settled facts, no grading, `[]` for an ordinary dial move, silent on a restore. | Contract `shared/lessonModule.ts:120-152`; impl `fullHouse.ts:2976-3001`; runtime fold-in `sessionService.ts:1125-1152` | **Contract + plumbing generic; the lines are per-module.** Omitting it is legal — the runtime falls back to naming the phase. |
| 7 | **`RoundContract`** | `closeHook` routed through your own `reduce` so a clock-close and a hand-close cannot diverge; `noun` in the lesson's language; `currentKey` so a FINAL CALL can never close the next round; a one-sentence `fallbackPolicy`; per-desk `unresolved` carrying **both** a teacher sentence naming what waiting would save **and** a second-person `selfFallback`. | Contract `shared/lessonModule.ts:155-205`; impl `fullHouse.ts:2928-2961`; exit parity `:3003-3033`; test `fullHouse.test.ts:1001` | **Runtime lifecycle fully generic; the declaration is per-module.** M1 declares none — even though L3's four day-closes are textbook rounds. |
| 8 | **Rehearsal marking** (D40) | With zero desks the console renders the **real** WATCH FOR flag shapes with stand-in desks and the **complete** synthesis deck — same length, same titles as live. Every stand-in title prefixed `REHEARSAL — `; every stand-in figure carries a STAND-IN sentence. Dated real-world content is deliberately **unmarked**. | `fullHouse.ts:3997-4052` (`rehearsalWatchFor`), `:4990-5037` (stand-in deck); enforcement `fullHouse.test.ts:1903-1953`; browser `scripts/e2e-rehearsal.cjs` | **Per-module.** D41's companion: the console must not promise a directing panel to a lesson that ships none. |
| 9 | **Measured drawings** (D25) | Any drawing whose **size** carries a quantity is measured in a real browser against the model, with a no-content baseline subtracted, a stated relative tolerance, a minimum measurable share — and the instrument is **poisoned** (fed a deliberately wrong drawing) and must reject it before any pass is believed. A drawing may only encode quantities the model actually holds. | `runtime/scripts/arena-wedge-fidelity.cjs` (10% tolerance, 3% floor, poison at `:97-110`); in-DOM poison examples `e2e-m2l3.cjs:818-845`, `e2e-m2l2.cjs:506-564`, `e2e-m2l1.cjs:1114` | **The discipline is generic; every instrument is per-drawing.** ⚠️ **Wired to no npm script** — see §8. |

**The single most transferable idea** is the closed loop formed by four rules that only work together: (1) the module authors every word; (2) every number is built by a builder so the printed figure *is* the computed figure; (3) one sweep enumerates every claim-carrying surface so a hole is detectable; (4) an **independent** implementation re-derives each relation by replaying the reducer, and is proven non-vacuous by mutants. Rule 4 is what makes 1–3 more than a naming convention.

**The one thing not to copy:** M2 L1's constant war. `renewalFans` moved 60/55 → 10 → 25; `planSlope` 0.6 → 1.8 → 3.6 → 9.0 → per-market 3.2/4.1; hundreds of lines of provenance comments including two that exist to *correct earlier comments* (`fullHouse.ts:122`, `:155`); a passing property discovered to be passing *because of* the defect it was meant to catch (D46). And the beat it bought is still too small to read off a projector (`fullHouse.ts:2419-2421`). The right method is D29's: assert the property the claim depends on, across the range the pair actually decides in and **near the optimum**, find one setting that clears it, record the tradeoff, stop.

---

## 5. EXISTING MODULE 1 — WHAT CARRIES, WHAT DIES

M1 is three well-engineered, well-tested, **entirely fictional** lessons: `draftDay.ts` 1141 LOC, `tradeDeadline.ts` 1357, `freeAgency.ts` 1738, plus ~3,100 lines of tests. M2's three lessons are 5257 / 5393 / 4589 — and almost all of that delta is the instrumentation in §4.

### 5.1 CARRIES — twelve mechanics worth rebuilding around

1. **The foregone panel + `foregoneAtLock`** (`draftDay.ts:318`, frozen at `:556`) — opportunity cost as a live, personal, *named* list, recomputed on every placement and frozen at commit for a named-players COUNTERFACTUAL. **The best single idea in M1.** Content-independent.
2. **Permanent loss** (`draftDay.ts:286-300`, `:605`) — the poached player is ineligible forever, not benched. Before this repair the worst case of the lesson's dramatic beat was "no change."
3. **Slack as mechanically-real insurance** (`adaptBudgetFor`, `draftDay.ts:338`) — repair budget is `CAP - spent`, computed by the *same* arithmetic as an ordinary affordability check, so a team that left room genuinely has more to repair with. A true, non-obvious economics idea *earned* by the mechanic.
4. **Dead cap** (`tradeDeadline.ts:106`) — a permanent line item on your books for nobody on your roster, visible for two more lessons. Rate is fiction; the shape is the strongest path-dependence device in M1.
5. **Sealed bid vs hidden reserve, with an honest publication rule** (`tradeDeadline.ts:783`, `:1207`) — only a consummated deal publishes its price; losing bids and the reserve stay private forever. Exactly what a real market discloses.
6. **The L3 market day loop** (`freeAgency.ts:831`) — one sealed revisable offer per team per day, simultaneous deterministic resolution, ask moves by demand (0 offers −$10M, 1 offer −$5M, 2+ +$5M). **The only place in M1 where another desk's decision changes what this desk can afford.** Rebuild around this.
7. **`MARKET_RULES`** (`freeAgency.ts:916`) — the market's own rules in four grade-appropriate sentences on both HOOK and PLAY. Economics is formalized after play; *button mechanics are never withheld*.
8. **`onPhaseExit` auto-resolution** (`tradeDeadline.ts:842`) — no reachable state depends on a click that never came, and the auto-resolved result runs the *identical* function so it is byte-identical to the staged one.
9. **Frozen-fact discipline (D15)** — `lockedSpend`, `deadCapCharge`, `foregoneAtLock`, `history[]`. Every one exists because live re-derivation once printed a false projector number.
10. **Zero-team graceful degradation on every card** (`draftDay.ts:1071`, `tradeDeadline.ts:1310`, `freeAgency.ts:1660`).
11. **Property tests that prove by construction** (`test/draftDay.test.ts:556`, `:593`; `tradeDeadline.test.ts:744`, `:768`; `freeAgency.test.ts:955-1061`) — cap inviolability brute-forced over every reachable build; ≥2 affordable substitutes guaranteed; worst-case rescue budget proven to be exactly $9M.
12. **Franchise identity without student identity** (`franchiseFor`, `draftDay.ts:485`) + **two-hop seed resolution with per-team validation and honest stock fallback** (`freeAgency.ts:473`, `tradeDeadline.ts:182`).

### 5.2 DIES — eleven things, with reasons

1. **The entire invented universe.** 36 invented players, 4 veterans, 12 rescue scrubs, 4 targets, 8 agents, 20 franchises, a $100M cap, a 10% dead-cap rate, a $130M cap rise (a 30% YoY jump; the real CBA caps it at 10%). Zero real players, teams, contracts, salaries, cap rules or dated facts anywhere in M1. CLAUDE.md §3 makes real sports business a founder invariant, and M2 already honours it (`fullHouse.ts:2495` cites real Indiana Fever attendance 4,066 → 17,036).
2. **The 0-100 "rating" currency.** An abstract meter, never converted to wins or revenue, never shown in the class reveal. Every downstream number (form, teamForm, playoffFactor, standings, bracket) is a meter on a meter.
3. **L2's midseason report** (`tradeDeadline.ts:575`). `currentForm = draftRating + FORM_DELTA[formTag]` where `formTag` is a pure function of the L1 market's own planted inversions. Nothing is seeded, no season is simulated. **The lesson's opening beat performs the arrival of new information and delivers none.**
4. **L2's standings** — ranks by mean form, gates nothing, decides nothing.
5. **L3's playoff bracket** (`freeAgency.ts:689`) — `computeStandings`, `computePlayoffs` and `decideMatch` use the identical comparator, so the champion is **always seed 1, in every class, forever** (verified live). Two reveal stages of guaranteed-null theater.
6. **The eight-stage per-agent factor reveal** — six of eight factors are ±2, worth 0.2 of a five-slot team form.
7. **The four stand-pat reasons as a radio group** — pre-written justifications with no mechanical consequence. The decision-card menu CLAUDE.md §8 forbids, in miniature.
8. **L1's COUNTERFACTUAL and ARGUE as separate phases** (`draftDay.ts:885`) — two static board strings. L2 already showed the right answer by dropping them.
9. **GM Awards as built** — two of four are structurally miscalibrated (see §8 finding #2), and the beat sits close to the progression layer D4 forbids.
10. **L1's uncontested private market** (`draftDay.ts:28`) — thirty teams can each sign the same player. A $100M budget puzzle played alone is closer to a worksheet with drag-and-drop than to an economic system.
11. **`classifyStrategy`** (star-stacked / balanced / mixed) — a label pinned after the fact, driving nothing.

**Visually, nothing carries.** M1's `/play` renderers (`play/main.ts:637-2126`, ~1210 lines) are `body.innerHTML = \`…\`` templates over legacy `theme.css` classes with ad-hoc inline styles. No tokens, no icon set, no drawn asset except the five-cell crest sprite.

---

## 6. HARD CONSTRAINTS — what a rebuild must not break

**Runtime behaviour**

1. **Gate your own phases.** `assertActionable` (`sessionService.ts:775-787` ✅) enforces only `ended` (410, not retryable), `frozen` (423, retryable), `paused` (423, retryable). Nothing else.
2. **Phases must be a strictly increasing subsequence of `CANONICAL_PHASES`** or `registerModule` throws (`sessionService.ts:268`).
3. **No `Math.random`, no wall-clock read outside `ctx.now`, ever, in a reducer.** Every tie-break reproducible from a snapshot.
4. **No `await` inside `reduce`, inside a view, or between a session read and its write.** Concurrency is serialised *by accident* — the repository resolves without real I/O; the only real yields on a request path are scrypt in join/rejoin, which write no session state (`sessionService.ts:576-586`).
5. **The server clock is the only clock.** Every round payload ships `serverNow` beside `finalCallEndsAt` so clients render a *duration*. No client-side deadline may rule on whether an action was in time.
6. **Version is monotonic and is the only ordering guarantee.** Any state that changes without a version bump must be bucketed into the relevant ETag fingerprint (`http.ts:273/:392/:416`), never a live millisecond count. Seat writes bump the bus `seatEpoch`, not the session version.
7. **A losing write on an ACTION must stay `retryable: true`** (`sessionService.ts:656-668`) so the client outbox holds it.
8. **State size is a first-class budget.** Every read deep-clones through JSON (`snapshotRepository.ts:45` ✅); every write re-serialises the whole store (`:219-242` ✅); the checkpoint holds a second full copy; nothing is ever pruned.

**Classroom reliability**

9. **One fallback per lesson, on every path.** A clock-close and a teacher's early exit must settle an unlocked desk **identically**.
10. **Every synchronized reveal ships a manual teacher fallback, never a pure timer.** Reveal staging is a module-side counter advanced by a teacher hook.
11. **`onPhaseExit` auto-resolution:** no reachable post-transition state may depend on a click that never came.
12. **Every irreversible teacher control needs a consequence-stating confirm supplied by the module** (`teach/main.ts:2223`, `:2226`), plus the one-step-undo note. Restore is exactly one checkpoint deep.
13. **Recoverability:** a bad decision stays generally recoverable and a stuck student has a surfaced way out (`swapSuggestionsFor`, `draftDay.ts:394`, exists because a real playtest deadlocked). Equally: a setback must never be costless.
14. **Reversible until commit; only an actual retraction costs.** Placement free until lock; an offer free to edit until withdrawal.
15. **The session survives refresh, rejoin, sleep/wake and mid-class restart.** A corrupt snapshot is quarantined and the server boots fresh and loud.
16. **≥2 genuinely different affordable options at every forced decision point in the WORST reachable case**, proven by property test, not spot-check.
17. **Cap inviolability by the SAME arithmetic that validates an ordinary purchase**, in every path including repairs and rescues.
18. **A pair is never blamed for a round they were not present for** (D36).

**Privacy**

19. **`boardView` is structurally never handed a seat identity.** `/board` and `/stream` are reachable with the **join code alone** (`http.ts:399-420` ✅) — treat everything on the projector as visible to any student at all times.
20. **`studentView` never leaks another seat's data.** A losing bid and a hidden reserve stay private forever, before *and* after the reveal.
21. **Real student names never reach any shared screen** — desk handles and fictional franchise names only.
22. **Auth shape is fixed and must not be widened:** `/control`, `/teacher`, `/seats/:id/unlock`, `/seats/:id/reseat` require the per-session teacher bearer key (D14); `/api/me` and `/actions` require the device token; `/join`, `/rejoin`, `/board`, `/stream` need only the code.

**Product / decisions that bind**

23. **D1/D2** — the four-module spine is founder-fixed. **D6** — Track 101, grades 5–6, only.
24. **D4** — no XP, levels, badges, leaderboards or progression. The class reveal *is* the reward system.
25. **D10** — "classroom-proven" is reserved for surviving a real class. Nothing has.
26. **D12** — no database, no external service, no internet, one Node process, one machine.
27. **D15** — frozen-fact discipline.
28. **D18/§9** — the L1→L2→L3 books chain persists; one corrupted upstream team must never block the rest of the class; a normalised franchise is honestly labelled stock, never disguised as carried.
29. **D25, D26, D28, D29, D30, D31, D32, D33, D34-D36, D40, D41, D42, D43, D44, D45, D47** — the M2 instrument decisions in §4, all ACTIVE.
30. **D38** — no grade-band field until a second band exists (see §3 for the correction needed if the rebuild is dual-band).
31. **CLAUDE.md §3** — real NBA people, teams, contracts, salaries and cap rules, with accessible core information plus optional domain depth. **Reality must never become a fandom test.** Simplify the interface before the economics; where the economics is simplified, record what changed, why, and the misconception risk.
32. **CLAUDE.md §12** — no shared "M1 economics engine." Each lesson owns its state shape and reducer behind the contract.
33. **Client-source rules:** forbidden vocabulary (project / forecast / estimate / expected / preview / target / profit / readiness / momentum / time remaining / strong round / of capacity / weather); every new `let` cache registered in `resetSeatRenderState()`; joining `html[data-module="m2"]` requires porting the renderer *and* widening the pinned assertion at `clientSurfaceInvariants.test.ts:53` ✅.
34. **Viewport floors:** `/play` designs to 1366×768, first contact 1024×600. `/board` must fit 1366×768 **and** 1920×1080 with **no scroll** — a projector cannot scroll, so overflow is a failure. Projector evidence-tier type clears a 2.6%-of-screen-height back-row floor.
35. **Colour is never the only carrier of meaning**; every motion collapses under `prefers-reduced-motion`.
36. **Copy is grade 5–6, concrete, numeric, Cap Room register.** The vocabulary-naming moment belongs to the teacher at SYNTHESIS.

---

## 7. TEST AND EVIDENCE INFRASTRUCTURE

### 7.1 Commands (all verified this session where marked ✅)

**Deterministic tier — from `runtime/`:**
```
npm run build     # tsc -p tsconfig.json && node scripts/copy-static.mjs
npm test          # build + node --test dist/test/*.test.js
```
✅ 603 tests, 603 pass, 0 fail, exit 0, 37.6s. Root aliases proxy to `runtime/`. **Nothing in `npm test` launches a browser.**

**Browser tier — from `runtime/` AFTER a build, each invoked by hand:**
```
node scripts/e2e-<name>.cjs
```
✅ `e2e-stale-poll.cjs` → PASS. Chromium 1.56.1; `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. No script accepts `--help`; read the header comment. No script calls `playwright install` and new ones must not.

**Scale tier:**
```
node scripts/concurrency-harness.cjs --desks 16 --rounds 3 --port 4399 --lesson <moduleId>
node scripts/latency-harness.cjs --desks 32 --samples 12
node scripts/arena-wedge-fidelity.cjs
```

**Control plane — from repo root:**
```
npm run boss:doctor   # ✅ 22 PASS, "BOW Boss harness is valid"
npm run boss:test     # ✅ 49/49 in 3.4s
npm run boss:agents   # regenerate .claude/agents from roles.json
npm run boss:check    # all three
```

### 7.2 Every instrument and what it proves

| Instrument | Proves | Lesson-bound? |
|---|---|---|
| `clientClaims.test.ts` | forbidden vocabulary in all three clients; every Full House renderer sentence is a module string | **Automatically cross-cutting** (the only one) |
| `clientSurfaceInvariants.test.ts` | per-seat render caches cleared; `[hidden]` toggles not defeated at id specificity; M2 scope granted by allowlist not id-prefix | 2 of 5 tests generic; the M2 pin is per-module |
| `roundLifecycle.test.ts` | pause/freeze retryable-vs-definitive, duplicate ids applied once, applied-action ring, FINAL CALL clamping and restart-safe expiry, CLOSE NOW, cancel, clock-close == bell-close, stale-round refusal, restore | Service-level generic; the round-contract conformance check at `:365-373` iterates a **hand-written array** at `:368` |
| `synthesisVisuals.test.ts` | every figure a synthesis caption prints is a field on the same payload (`:108`) | **Full House only** (`:26-36`) |
| `m2Harnesses.test.ts` | spawns the three M2 tuning harnesses, asserts exit 0 + `VERDICT: ALL n PROPERTIES HOLD` | M2-pinned list; **the template to copy** |
| `freshness.test.ts`, `crypto.test.ts`, `sessionBus.test.ts`, `snapshotRepository.test.ts`, `dotChart.test.ts` | shared infrastructure | Fully generic |
| `arena-wedge-fidelity.cjs` | a wedge's share of the drawing is its share of the crowd, by pixel count, with poison | Per-drawing |
| `e2e-m2l1/l2/l3.cjs` | full lesson arcs in real browsers; frame fit at both projector shapes; back-row legibility; occlusion at 1024×600; per-beat DOM diff; non-vacuity by poisoning a live frame | Per-lesson |
| `e2e-rehearsal.cjs` | all three directed lessons walked cold with zero desks, marking proven by poison; class clock; board liveness | M2 + M1L1 rehearsal path |
| `e2e-time-cut.cjs`, `e2e-away.cjs`, `e2e-stale-poll.cjs`, `e2e-realtime.cjs`, `e2e-teach-room.cjs`, `e2e-teach-deck.cjs`, `e2e-full-room.cjs`, `latency-harness.cjs` | genuinely cross-cutting runtime properties — **but all hardcoded to `m2l1-full-house`** | Should be generic; are not |
| `concurrency-harness.cjs` | every action applied exactly once or given an authoritative semantic rejection | **The only `--lesson`-parameterized instrument** |
| `e2e-l2/l3.cjs`, `e2e-l2/l3-early-advance.cjs` | the M1 chain played for real through the API, incl. the teacher-misclick confirm path | M1 L2/L3 |
| `lib/port.cjs` | `assertPortFree` — refuses to validate against a zombie server (this actually happened, 4 runs in a row) | Generic; **call it first in any new script** |

**M1 L1 has no browser-truth script at all.** `e2e-l2/l3.cjs` play Draft Day only through the raw HTTP API.

### 7.3 Minimum evidence set for a new lesson

1. `npm test` green with the new module's unit + property tests included, run this session.
2. A per-beat payload-gating test looping every beat (`hostTheLeague.test.ts:1960-1989` shape).
3. Round-contract conformance — **and add the module by hand to `roundLifecycle.test.ts:368`** or it is unchecked.
4. A rehearsal test asserting deck-length and title equality against the live deck, and that no `REHEARSAL`/`STAND-IN` string can appear in a played room (`fullHouse.test.ts:1903-1953` shape).
5. A synthesis-traceability test (clone `synthesisVisuals.test.ts`).
6. A tuning harness under `docs/gauntlet/module-1/stage0/` printing `VERDICT: ALL n PROPERTIES HOLD`, wrapped with the `m2Harnesses.test.ts:28-49` pattern, **with mutants**.
7. A browser e2e for the lesson: full arc, multi-desk, zero console errors, board frames fit at 1366×768 **and** 1920×1080, plus at least one poison frame.
8. `concurrency-harness.cjs --lesson <newId>` at 16 desks.
9. A measured-drawing instrument for any drawing whose size carries a quantity.
10. Prune the ~20 dead M1 entries from `clientClaims.allow.json` **in the same commit** that deletes the old renderers.

### 7.4 Boss process notes

- **Two runs are `active`** (`m2-quality-war`, `m2-visual-quality-war`, both level 3 ✅), which freezes `.boss/config` and `.boss/schemas` via `tools/boss/hooks/protect-run-state.mjs:46-51` and fails the config-integrity gate at `gates.mjs:186-191`.
- **The tree is dirty** — 11 modified PNGs under `docs/gauntlet/module-2/screens-l1/` ✅. `run create` rejects unexplained dirty trees; `gates.mjs:204` fails the ship gate.
- **Choose scopes by mechanism, not lesson noun.** Scopes that summon blocking reviewers: `economic-model`, `cap`, `sports-reality`/`nba`, `teach`, `board`, `synthesis`, `persistence`/`seed-chain`. `gameplay` and `visual` are non-blocking but required-to-complete. A scope like `draft-day` matches no activation rule and silently summons nobody.
- **Command-family evidence counts only** when recorded via `npm run boss -- evidence command … -- <cmd>` with exit 0 (`gates.mjs:107-110`). Never hand-edit `events.jsonl` or `state.json`.
- Builders never certify their own work; judgment claims need a COMPLETED independent role.

---

## 8. REAL DEFECTS AND RISKS FOUND — ranked, deduplicated

### BLOCKERS

**B1. The contract's own header documents a phase gate the runtime does not implement.** ✅ verified. `lessonModule.ts:8-9` — "gates actions by phase before the reducer ever sees them"; `:56-58` — "calls this only after confirming the action's declared phase matches the session's current phase." Both false. `submitAction` (`sessionService.ts:594-680`) reads no phase field and performs no comparison; the only gate is `assertActionable` (`:775-787`), which checks `ended`/`frozen`/`paused` and nothing else. The accurate comment is at `:766-774`. **This is the doc a new module author reads first.** Fix the comment as step zero of the rebuild.

**B1b. Same header, `:10-11`:** "Nothing about /teach, /play, or /board changes when a new lesson module is registered." Also false, and false for six lessons — all three clients dispatch on a hard-coded module-id chain (`play/main.ts:567`, `board/main.ts:129-168`, `teach/main.ts:1616`/`:84-90`/`:127`). A rebuild scoped on the doc comment will be badly under-estimated.

**B2. L3 `THE BARGAIN` can crown the module's designated trap and call it a triumph.** `freeAgency.ts:1417`. The award is `argmax (form + playoffFactor) / amount` — dominated by the denominator, so it structurally rewards the cheapest signing. Reproduced live: sign the marquee −7 shrinker at a decayed $15M and the reveal prints *"worth every dollar and then some — the best value signing of the window"* while `THE WALK-AWAY` calls walking away from the same agent *"a real trap."* Both in the same reveal. This is CLAUDE.md §8's named failure mode.

**B3. L3 `THE MARKET SET THE PRICE` prints a false claim on the projector.** `freeAgency.ts:1681`. "…every dollar of that moved because of offers this room actually placed" — but the largest mover is almost always an agent **nobody offered on** (zero-offer decay is −$10M/day). Reproduced live with 2 total offers: the card named an agent with **zero** offers. The mechanic is good economics; the sentence states the opposite of what happened.

**B4. No image MIME type is servable.** ✅ `http.ts:87-96`. Any Module 1 ambition involving photography, texture, court/arena imagery or video requires a server change **and** a build change (`copy-static.mjs:56`), or a data: URI inside an already-309KB uncached `main.ts`.

**B5. Every static asset is uncached and uncompressed.** ✅ `http.ts:99`. ~530KB per `/play` refresh; 30 Chromebooks after a wifi blip ≈ 16MB off a teacher's laptop. `play/main.js` ships all seven lessons' renderers to every device.

**B6. Per-module CSS explosion, with no convention.** `board/index.html:11-460` holds ~450 **unscoped** lesson rules live on every projector frame; `theme.css` (3112 lines) carries 60+ `html:not([data-module="m2"])` defensive prefixes.

**B7. The M2 design-token layer is gated behind an allowlist of exactly one renderer**, pinned by an assertion. ✅ `play/main.ts:40`; `clientSurfaceInvariants.test.ts:53`. Entering the scope switches **off** every legacy `theme.css` rule on the promise m2.css re-provides them — true only for the one ported renderer. Options are: join the scope and re-provide everything, build a third scope, or inherit the M1 class soup. There is no fourth.

**B8. Two Boss runs are active and the tree is dirty** — blocks `run create` and freezes `.boss/config` ✅ (see §7.4).

### MAJOR

**M1. A lost teacher key makes a live room permanently uncontrollable.** `types.ts:174-176` deliberately excludes `teacherKeyHash` from `SessionPatch`; no route re-mints it; the key is returned exactly once on the 201 (`sessionService.ts:341-343`). A cleared browser profile mid-period = 16 desks and nobody able to advance a phase, reveal, or end. `RAMAZ_READINESS.md:11` flags recovery as untested.

**M2. `advance` silently rewinds the class to the first phase** when the session's phase is not in the module's list. ✅ `sessionService.ts:817` — `indexOf` returns −1, `phases[0]` is truthy, `if (!next)` never fires. The snapshot loader validates only id and code (`snapshotRepository.ts:152-154`). Change M1's phase list, restart on an old snapshot, press Advance → the room jumps to LOBBY, presented as forward progress, with a checkpoint captured over the good state.

**M3. `reveal` can move a session backwards.** ✅ `sessionService.ts:826` calls `applyPhaseChange(session, "REVEAL")` with no ordering check; `:982` guards only `phase !== next`. *Correction to the raw audit:* the contract's explicit guarantee (`lessonModule.ts` `fromPhase !== toPhase`) **is** honoured. What is not guaranteed is **ordering** — an `onPhaseExit` written to trust forward language can be invoked with `fromPhase="SYNTHESIS", toPhase="REVEAL"`.

**M4. `closeHook` and teacher hooks are reduced with an empty seat roster.** ✅ `sessionService.ts:749` and `:849` both pass `seatIds: []`, while `RoundContract.unresolved` **is** handed the real roster (`:1320-1329`). So the runtime tells you who is unresolved for display, then closes the round without telling you who exists. A pair that joined and never acted is reported as about to receive a fallback and then receives nothing.

**M5. The module is never told a seat joined.** ✅ `sessionService.ts:322` (`seatIds: []`); `join()` at `:420-450` never calls the module and never bumps `session.version`. Views are pure and cannot allocate.

**M6. Every session read deep-clones the whole state through JSON.** ✅ `snapshotRepository.ts:45`, applied at `:281/:292/:298/:315`. 16 desks at 1.2s + board + console ≈ 15 reads/sec, each a full serialise+parse of state **and** checkpoint.

**M7. Every mutation re-serialises the entire store**, and the checkpoint doubles state size. ✅ `snapshotRepository.ts:222`. Nothing is ever pruned.

**M8. The seed envelope carries no provenance.** ✅ `sessionService.ts:320`. See §3.3.

**M9. L1 TRADEOFFS synthesis card states a market fact that is false.** `draftDay.ts:1103` — hardcoded "six real players … the other five"; the ROUND-2 expansion made it nine and eight (verified: 9 per position, 6 distinct prices). A factual error read aloud during the formalization stage.

**M10. L1's only public feedback surface encodes price, so the deliberately planted price/value inversions are undiscoverable.** `board/main.ts:244-256` draws bar height = spend, segments = price share; rating is in the payload and never drawn. `VERIFY_ECONOMICS.md` flagged this; the ROUND-2 market repair made it worse by planting a discovery with no place to be discovered.

**M11. L1→L2 silently deletes the franchise of any team that was shocked and did not repair.** `tradeDeadline.ts:200`. The team most affected by L1's dramatic beat is the one whose identity is destroyed, and nothing warns the teacher during ADAPT.

**M12. L2 `claimedBy` is write-only.** `tradeDeadline.ts:656`. A pair that taps the wrong crest is stuck for the lesson; the franchise they meant is unreachable for the whole class. No teacher control exists. Recorded in `runtime/README.md` known-gaps.

**M13. Sealed-bid ties in L2 and L3 are broken by HTTP arrival time.** `tradeDeadline.ts:783` / `freeAgency.ts:838`. Deterministic but economically dishonest: "why did they get him?" "their laptop was quicker." An honest in-model tie-break exists (cap room remaining, or the agent choosing).

**M14. L2's midseason report contains no new information.** `tradeDeadline.ts:575` — see §5.2 #3.

**M15. L1 PLAY has no rival contention.** `draftDay.ts:28` — see §5.2 #10.

**M16. L3's playoff bracket is mathematically incapable of any outcome but the #1 seed.** `freeAgency.ts:689`.

**M17. Inline-style rendering.** M2's visual quality is ~1000 inline `style=""` strings interpolated in TS (`play/main.ts:2347-2361` and hundreds of call sites). No cascade, no media queries, no audit, responsive behaviour reimplemented in JS. **Do not copy this** — consume the m2.css tokens as classes.

**M18. Three disagreeing responsive breakpoints.** `fhTight()` at `innerHeight<720 || innerWidth<1180` (`play/main.ts:2366`) vs m2.css `(max-width:1100px),(max-height:640px)` (`:1913`) vs `(max-height:719px),(max-width:1179px)` (`:2193`). A 1024×700 device sits in the gap.

**M19. `/play`'s M1 lessons are locked in a 640px column** (`play/index.html:16`); both escapes are one-off hacks set imperatively from the renderer.

**M20. `/board` has zero media queries** and its fit strategy is silent scroll (`board/index.html:28-31`) — `safe center` falls back to start-alignment, content becomes reachable-but-unseen, nothing reports the failure.

**M21. THE ROOM and THE DESKS cross the module/renderer boundary as untyped blobs re-declared by hand** (`teach/main.ts:453-478`). Three modules must keep two hand-written mirrors in step; a near-right shape renders `undefined` with no type error and no test.

**M22. The claim vocabulary is hand-copied and has already drifted.** `writeTheRule.ts:816` — `Claimed` has no `board` field, so D24's surface split is structurally unavailable in that lesson. `fullHouse.ts` has no claim atoms at all ✅.

**M23. D25's own evidence runs in no npm script.** ✅ `runtime/package.json:10`. No `test:e2e`, no `verify`, no CI file. D25, D26, D27, D31, D40, D42, D44 are all certified by scripts a human must remember to invoke by path — the exact lesson `m2Harnesses.test.ts:11-22` exists to encode, not applied one tier up.

**M24. Playwright is undeclared in every `package.json`** ✅ and loaded by absolute path (`require("/opt/node22/lib/node_modules/playwright")`) in all 17 scripts ✅. Fails at require-time with a module-not-found on any machine without that exact global path.

**M25. Every runtime-level browser harness is hardcoded to `m2l1-full-house`** — away, realtime, stale-poll, time-cut, teach-deck, teach-room, full-room, latency. **Parameterizing these by lesson id is the single highest-leverage infrastructure investment the rebuild can make.**

**M26. `clientClaims.allow.json` will go red.** ✅ 27 entries, **20** carrying a "Module 1" reason, only 1 marked transient. `clientClaims.test.ts:225-235` fails the suite on any non-transient entry that matches nothing.

**M27. M1 L1 has no browser-truth script at all.**

**M28. The round-contract conformance test iterates a hand-written module array** (`roundLifecycle.test.ts:368`) — a new module is silently unchecked for the very defect the test's own comment describes.

**M29. `synthesisVisuals.test.ts` is Full-House-only** (`:26-36`).

**M30. There is no M1 tuning harness** and nothing will notice its absence. `docs/gauntlet/module-1/` has no `stage0/`.

**M31. `listSessions` computes the full `teacherView` of every session just to read its header.** ✅ `sessionService.ts:413`.

### MINOR / NOTE

- `appliedActionIds` is persisted in a second, unchecked write after the state write (`sessionService.ts:673`) — a crash between them re-opens the double-apply window.
- The duplicate-action path skips `markSeen` (`sessionService.ts:609`), so a retrying desk slides up the quiet ladder while actively submitting.
- `join()` does not sweep the round before building the payload (`sessionService.ts:420`).
- `sweepRound` writes from GET paths and a version conflict there throws 409 out of a poll (`sessionService.ts:1036`) — safe today only by the no-real-I/O accident.
- `allowedActions` and `aggregate` are required members with **zero runtime call sites** (`lessonModule.ts:63`, `:75`).
- `/board` and `/stream` reachable with the join code alone (`http.ts:412`, `:399`).
- Any valid teacher key lists every session on the server (`sessionService.ts:405`) — correct on a single-teacher laptop (D12), wrong on a shared machine.
- `signedOut()` does not clear `documentElement.dataset.module` (`play/main.ts:107`) — after an M2 sign-out the PIN form renders full-bleed and unpadded.
- The forbidden-vocabulary list bans words a visually ambitious rebuild will reach for (`clientClaims.test.ts:55-67`).
- `m2ui.ts:14-20` and `arena.ts:8-51` carry **M2-specific** economic prohibitions (no line/trend series; one undifferentiated seat pool) that a Module 1 reviewer may read as universal law. Reuse the mechanics; re-derive the prohibitions.
- `m2.css` and `m2ui.ts` are linked on `/board` and `/teach` but match nothing there (only `/play` sets `data-module`) — 61KB paid for nothing, and the board reimplements charts by hand.
- The Full House renderer-sentence audit is anchored to two literal comment strings (`clientClaims.test.ts:253-254`).
- Module files are the decision archive, and comments now correct other comments (`fullHouse.ts:122`, `:155`).
- `docs/EMERGING_PRIMITIVES.md:3` is stale by five modules and one killed lesson.
- L3 hardcodes male pronouns and applies them to female-named agents (`freeAgency.ts:1470`).
- L3 `TIMING IS A PRICE` renders the literal `$—M` (`freeAgency.ts:1712`).
- L2 `NO DOMINANT STRATEGY` asserts "real winners and real regrets" in a lesson with **no outcome model** (`tradeDeadline.ts:1351`).
- L3 hardcodes "Only 2 star-tier agents" and "$100M cap" inside otherwise-computed cards (`freeAgency.ts:1691`).
- L3's personal counterfactual omits the incumbent's dead cap (`freeAgency.ts:1543`), overstating cap room — which is the standings tie-break.
- L3 `findSeatId` resolves by object identity, O(n) (`freeAgency.ts:669`).
- L1 board COUNTERFACTUAL and ARGUE carry no class data at all (`draftDay.ts:885`).
- L2's hidden reserves and L3's playoff factors are module constants — the answer key leaks on the first replay.
- L2-specific: `btnReveal` stays enabled during REVEAL, so "Jump to REVEAL" while in REVEAL silently bulk-resolves every unrevealed target with no confirm (`VERIFY_L2.md`; fixed for L3 only).
- L3 `THE WALK-AWAY` prints "in talks up to $<ask>" using the **agent's** ask, not the team's bid — a $20M lowball reads as $45M of interest.
- **`e2e-l3.cjs` flake** (`docs/gauntlet/module-2/E2E_L3_FLAKE_NOTE.md`): intermittent day-3 `submitOffer` failure, 3/6 at HEAD. Cause is `faPlayMounted`'s poll-driven remount wiping `#faComposerRoot` while a click is pending. "Pre-existing" is proven; "unaffected by M2" is explicitly **not** (n=6, p≈0.55). The note calls it "a real classroom risk in miniature" and prescribes a mount-guard or event-delegation fix.
- `runtime/README.md:4` states 595 passing; the real number is 603 ✅.
- **The premium visual clause is unmet and the war stopped mid-flight.** `GATE_L1_VISUAL.md:22` SERVICEABLE-NOT-PREMIUM; `premium/REVIEW_VISUAL_2.md:30` VERIFIED-UNMET; `premium/REVIEW_VISUAL_W2.md:19` "top-of-SERVICEABLE. Not PREMIUM" with three structural gaps open. `.boss/runs/m2-visual-quality-war/events.jsonl` ends at seq 576 mid-wave-3 with no closing verdict; `/teach` and `/board` were never re-reviewed after the `/play` rebuild. `RAMAZ_READINESS.md:16` records it correctly as open and non-blocking.

---

## 9. THE FIVE THINGS MOST LIKELY TO GO WRONG

### 1. Building to the contract's comment instead of the contract's code

`lessonModule.ts:8-11` and `:56-58` promise a runtime phase gate and client-independence. Neither exists ✅. A rebuild scoped on that header will ship reducers with unguarded branches (any action accepted in any phase) **and** will have budgeted zero client work for three hand-written renderers, ~280 lines of teacher-control gating, a new markup row in `teach/index.html`, a CSS scope decision, and an allowlist prune.

**Mitigation:** fix the three comments in the first commit. Write the phase check as the first line of every `reduce` branch, and add a module test that fires every action in every wrong phase and requires `ok:false`.

### 2. Designing a per-seat starting position the runtime cannot deliver

M1's most likely rebuild premise — *every pair runs a different real NBA franchise, with a different cap sheet and a different roster hole* — collides directly with three verified facts: `initialState` runs once with `seatIds: []` ✅ (`sessionService.ts:322`); `join()` never calls the module; `closeRound` and teacher hooks are reduced with `seatIds: []` ✅ (`:749`, `:849`). There are exactly two working patterns (pure derivation in views, or lazy materialisation via `ctx.seatIds.indexOf(seatId)`), and **both leave a hole for the pair that joins and never acts** — a hole `/board`, `aggregate`, `round.unresolved` and the close hook must each tolerate. Get this wrong and the teacher panel and the settlement disagree in front of the class.

**Mitigation:** decide the desk-registry shape before writing any content; make "the pair that joined and never touched anything" a named test case on every surface; assign franchises deterministically from join order and let a real pair claim into a pre-assigned slot rather than the reverse.

### 3. A richer, real-NBA state blowing the undeclared performance budget

Real rosters (15 players, not 5), real contracts, contract ladders, multi-round history — all plausible and all far heavier than M2's state. Every read deep-clones the whole state through JSON ✅ (`snapshotRepository.ts:45`); every write re-serialises the entire store ✅ (`:222`); the checkpoint holds a second full copy; nothing is ever pruned; `listSessions` computes and discards a full `teacherView` per row ✅ (`:413`). Add ~530KB of uncached, unminified assets per refresh ✅ and the failure mode is the projector visibly lagging the reveal on a teacher's laptop.

**Mitigation:** budget state size explicitly at design time. Keep per-session state small and derive views; or fix the clone/serialise path *first*. Run `latency-harness.cjs` and `e2e-full-room.cjs` (32 seats) against the new module early, not at the end.

### 4. Paying the instrumentation tax at the end instead of the beginning

M1 has zero of the nine M2 instruments ✅. The tempting order is "build the lesson, then add the audit." M2's own history says that fails: three false projector claims survived **four** verification rounds in M1 precisely because every synthesis body is a bare template literal that the audit cannot see. Meanwhile the *only* automatically cross-cutting harness (`clientClaims.test.ts`) will go **red** the moment the old M1 renderers are deleted — 20 of 27 allowlist entries are M1 strings and dead entries fail ✅ — so the rebuild's first red suite will be for a reason unrelated to the new code, which trains the team to treat red as noise.

**Mitigation:** in the *first* week — prune the allowlist in the same commit that deletes the renderers; stand up a `docs/gauntlet/module-1/stage0/` tuning harness with mutants and wrap it via the `m2Harnesses.test.ts:28-49` pattern; extract `ClaimAtom`/`claim`/`claimWord`/`ClaimSurface` into a shared file **now** (this is the second-use extraction M2 skipped and drifted on — it is an audit contract, not the lesson engine CLAUDE.md §12 protects); add the module to `roundLifecycle.test.ts:368`; clone `synthesisVisuals.test.ts`.

### 5. Believing a green suite means the product works

`npm test` launches no browser ✅. Every browser instrument — including the measured-drawing proof that D25 *requires* — is opt-in by memory, undeclared in any `package.json`, loaded by absolute machine path, and (except `concurrency-harness.cjs`) hardcoded to `m2l1-full-house` ✅. M1 L1 has no browser script at all. CLAUDE.md §13 makes browser truth mandatory for changed student-facing behaviour, and the tooling does not enforce it. Add the known `e2e-l3` flake — a real remount-during-click race that the flake note calls "a real classroom risk in miniature" — and the honest reading is that the deterministic tier can be perfect while the room is broken.

**Mitigation:** add a `test:e2e` / `verify` npm script and a declared Playwright devDependency in the same program that builds M1; parameterize the eight runtime-level harnesses by `--lesson`; write the M1 browser script before the second lesson, not after the third; call `assertPortFree` first in every new script; and poison every instrument before believing any pass.