# W2 repair 5 — frames

Every frame is `fullPage:false` at `scrollY = 0`, so what is outside the image is what a
pair cannot see without scrolling. `before-` is head `10755ed`; `after-` is the repaired
build (R5-1 … R5-5).

| frame | shows |
| --- | --- |
| `*-result-n5-d1-1366-cheap-NY.png` | the worst overflow I reproduced: Night 5 sellout that repeats Night 1's card, 1366x768. BEFORE `#fhNextNight` bottom 790 (clipped); AFTER 497. |
| `*-result-n4-d1-1366-cheap-NY.png` | the densest settled state: bowl open + $120,000 event money + sold out, 1366x768. BEFORE NEXT 736 / no turnout cause; AFTER NEXT 573, cause line under the hero, turned-away 742. |
| `*-result-n1-d3-1366-high-NY.png` | zero turnout at $120. AFTER carries the zero-night limb of the turnout cause. |
| `*-result-n4-d5-1024-cheap-NY.png` | the same dense state at 1024x600 (repair 4's band held: NEXT 526). |
| `*-closed-d2-1366-ladder-MEM.png` | books closed, ladder $46/$60/$80/$100/$46. BEFORE 4 labels for 5 nights (N1, the callback's own night, dropped); AFTER 5/5, 0 intersections. |
| `*-closed-d4-1366-flat16-MEM.png` | books closed, flat $16 x5. BEFORE 3 labels for 5 nights; AFTER 5/5. |
| `*-reveal-final-d2-1366-ladder-MEM.png`, `*-reveal-final-d4-1366-flat16-MEM.png` | the same two charts at REVEAL, where the N5 -> N1 callback is argued. |
| `*-prelock-n5-d9-1366-auto-NY.png` | the desk whose Nights 1-3 the bell auto-committed. BEFORE the dial reads "the price you charged on Night 3"; AFTER no cue. |
| `after-counterfactual-d2-1366-ladder-MEM.png` | the repeat card carrying the R5-4 sentence. |
| `measure-before.json`, `measure-after.json` | every rectangle, figure size, chart label set and cue string behind the report's tables. |
