# Source Ledger — Track 101 Refoundation

Authority and provenance for every source feeding the Track 101 rebuild. When sources conflict, resolve in the order below.

## 1. Authority order

1. **Founder mandate** — highest authority. Overrides every other source, including this ledger's own contents, on any explicit contradiction.
2. **`BOW Sports Capital Podcast-4.pdf`** — raw material, not a finished curriculum (see §2).
3. **`BOW_Model_V5_Final.pdf`** — prior research, not spec (see §3).
4. **Legacy repos** — a parts bin (see §4).

## 2. `BOW Sports Capital Podcast-4.pdf` — raw material, not curriculum

This file is **not** a finished curriculum deliverable. It is a 315-page raw AI-brainstorm export (a Google Docs export of a ChatGPT planning conversation; it literally ends with the ChatGPT UI footer "ChatGPT can make mistakes. Check important info."). It contains **three mutually contradictory Track 101 module/lesson tables** (a 4x4 mastersheet pp.12-13; a differently-titled 4x3 table pp.245-253; a final planning list missing Module 4 entirely, p.311), plus a founder TODO list (pp.286-293) confirming learning objectives, standards alignment, and teacher guides do not yet exist. Treated as candidate raw material under D1 in `docs/PRODUCT_DECISIONS.md` — never cited as settled curriculum on its own authority.

- Cite: `docs/intel/CURRICULUM_RECONSTRUCTION.md` — full reconstruction of the three competing tables and the actually-produced lesson scripts, with page citations.
- Cite: `docs/intel/CURRICULUM_CRITIQUE.md` — independent critique against the product bar (grade-band drift, missing activities, age-inappropriate vocabulary).
- See also: `docs/intel/CURRICULUM_PRODUCT_TRANSLATION.md` (salvage-the-skeleton reading, in tension with CURRICULUM_CRITIQUE's discard-and-rebuild reading — the disagreement D1 resolves) and `docs/intel/paged.txt` (full 315-page plaintext extraction, page-tagged, for primary-source lookup).

## 3. `BOW_Model_V5_Final.pdf` — prior research, not spec

V5 is a 120-page prior-research document, not a build spec. It labels its own claims DECISION / WORKING SPEC / HYPOTHESIS, but per D5 in `docs/PRODUCT_DECISIONS.md`, no V5 verdict about legacy code (e.g. a "KEEP" classification) may drive a build decision without independent code-level re-verification — one of eight spot-checked V5 KEEPs was outright refuted (`101-M4-L3`, claimed "no defects found," is actually a hardcoded-answer trivia bank).

- Cite: `docs/intel/V5_PRODUCT.md` — product/economics extraction.
- Cite: `docs/intel/V5_ARCHITECTURE.md` — runtime/session architecture and control-plane/runtime split (kept per D3).
- Cite: `docs/intel/V5_PORTFOLIO.md` — V5's own simulation portfolio audit (a synthesis, not independently re-run tests).
- Cite: `docs/intel/V5_PROSECUTION.md` — adversarial review; source of the struck-scope findings in D3.
- Cite: `docs/intel/REALITY_CHECK.md` — code-level verification of V5's highest-stakes claims; the authority behind D5.

## 4. Legacy repos — a parts bin

All legacy repos are cloned shallow under `/home/user/braydenokley13-ux/<repo>`. They are a parts bin: source material to mine for code-verified mechanics per D1, never a deletion target. Nothing in this bin is removed, including repos discarded from the Track 101 build per D9 (`101-M4-L3`, `101-M3-L2`, the `-ECON` tycoon repos) — discard means "not scheduled to build," not "erased."

- Cite: `docs/intel/PORTFOLIO_T101.md` — per-repo audit of all 15 Track 101-dedicated repos, ranked strongest/weakest, with file/line citations.
- Cite: `docs/intel/PORTFOLIO_CROSS.md` — cross-cutting/portfolio-wide reuse candidates outside the 15 dedicated repos.

## 5. Intelligence reports pointer list (`docs/intel/`)

| Report | One-line description |
|---|---|
| `EXECUTIVE_BRIEF.md` | Synthesis of all other reports into current-state summary, conflicts, and recommended decisions — start here. |
| `CURRICULUM_CRITIQUE.md` | Independent critique of the source PDF against the grade 5-6 product bar; recommends discard-and-rebuild. |
| `CURRICULUM_PRODUCT_TRANSLATION.md` | Curriculum-to-product translation of the source PDF; recommends salvage-the-skeleton with mandatory re-aging. |
| `CURRICULUM_RECONSTRUCTION.md` | Reconstructs the three contradictory Track 101 tables and the actually-produced lesson scripts from the source PDF. |
| `PORTFOLIO_T101.md` | Repo-by-repo audit of the 15 Track 101-dedicated legacy repos, with code-level mechanic verification. |
| `PORTFOLIO_CROSS.md` | Cross-cutting/portfolio-wide legacy repo audit for reuse candidates outside the 15 dedicated Track 101 repos. |
| `V5_PRODUCT.md` | Extraction of V5's product and economics content, with DECISION/WORKING SPEC/HYPOTHESIS labels preserved. |
| `V5_ARCHITECTURE.md` | Extraction of V5's runtime/session architecture, control verbs, state machine, and control-plane split. |
| `V5_PORTFOLIO.md` | V5's own simulation-portfolio audit extraction (a synthesis of prior sources, not independently re-run). |
| `V5_PROSECUTION.md` | Adversarial review of V5 — commerce build order, predetermined counts, and other founder-mandate conflicts. |
| `REALITY_CHECK.md` | Code-level verification of eight of V5's highest-stakes claims against actual repo source. |
| `paged.txt` | Full plaintext extraction of `BOW Sports Capital Podcast-4.pdf`, page-tagged, for primary-source lookup. |
