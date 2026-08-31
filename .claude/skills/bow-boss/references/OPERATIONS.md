# BOW Boss operations reference

Commands use `npm run boss -- ...`. Add `--json` where supported for machine output.

## Roles

```bash
npm run boss -- role activate <run> --role <role-id> --actor <identity> \
  --assignment <id> --model <optional-current-model> --reason "<why>"

npm run boss -- role complete <run> --assignment <id> --actor <identity> \
  --output <role-output.json>
```

The output JSON contains `status`, `sections`, `evidenceIds`, optional `cost`, and optional
`dissent`. Exact section keys live in `.boss/config/roles.json` and the matching agent file.

## Evidence and claims

Record an existing file by immutable copy:

```bash
npm run boss -- evidence file <run> --id <id> --kind screenshot --label "<label>" \
  --file <path> --metadata '{"viewport":"1366x768"}' --tags viewport-1366x768 --actor <identity>
```

Run and record a deterministic command:

```bash
npm run boss -- evidence command <run> --id <id> --kind test --label "unit suite" \
  --tags test --actor <identity> -- npm test
```

The command's real exit code is recorded and returned. A nonzero command remains evidence of
failure and the CLI exits nonzero.

```bash
npm run boss -- claim add <run> --id <id> --kind tests-pass \
  --statement "<exact progress claim>" --evidence <ids> --actor <builder>

npm run boss -- claim reconcile <run> --id <id> --actor <analyst>
```

Deterministic kinds: `tests-pass`, `viewport-verified`, `build-pass`, `lint-pass`,
`typecheck-pass`, `ci-pass`, and `e2e-pass`. `sports-reality-current` and
`teacher-transferable` are screened deterministically (missing or stale `verifiedAsOf` dates and
builder-notes-only transfer evidence contradict them) but confirmation still needs `--status`
and `--reason` from a completed independent read-only reviewer, as does every other judgment
kind (for example `gameplay-strong`).

## Dissent

```bash
npm run boss -- dissent add <run> --id <id> --category economic-truth \
  --severity blocking --finding "<finding>" --evidence <ids> --actor <critic> --role <role>

npm run boss -- dissent resolve <run> --id <id> --resolution "<evidence-backed resolution>" \
  --evidence <ids> --actor <lead>
```

Resolution preserves the original dissent.

## Meetings

```bash
npm run boss -- meeting open <run> --id <id> --type economics-review \
  --question "<one decision>" --why "<why independent memos are insufficient>" \
  --attendees <role-list> --evidence <ids> --expected-value 3 --estimated-cost 2 --actor <lead>

npm run boss -- meeting opinion <run> --id <id> --attendee <role> \
  --position "<position>" --reasoning "<evidence-backed memo>" --evidence <ids> --actor <identity>

npm run boss -- meeting close <run> --id <id> --decision <decision.json> --actor <lead>
```

The decision JSON requires `decision`, `disagreementMap`, `dissent`, `actions`, and
`revisitEvidence`. Every attendee must record an independent pre-opinion first.

## Git lanes and rollback

Register a worktree that already exists, then reserve paths:

```bash
npm run boss -- git lane-register <run> --id <lane> --owner <identity> \
  --branch <branch> --worktree <absolute-path> --actor <lead>

npm run boss -- git reserve <run> --id <reservation> --path <repo-relative-path> \
  --owner <identity> --lane <lane> --reason "<task>" --actor <lead>
```

Ancestor/descendant overlaps owned by different actors are rejected. Release reservations after
integration. Boss does not delete worktrees automatically.

On a clean committed tree:

```bash
npm run boss -- git checkpoint <run> --reason "known-good after wave N" --actor <lead>
```

## Gates, verdicts, overrides, and ship case

```bash
npm run boss -- gate evaluate <run> --gate wave --actor <lead>
npm run boss -- verdict record <run> --value REPAIR --reason "<why>" --actor <lead>
npm run boss -- override record <run> --subject <subject> \
  --boss-recommendation REPAIR --decision "proceed with accepted risk" \
  --risk-accepted "<specific risk>" --reason "<founder reason>" --actor <founder>
npm run boss -- ship-case <run> --actor <lead>
npm run boss -- gate evaluate <run> --gate ship --actor <lead>
```

PASS is rejected unless the latest gate is eligible. Overrides remain first-class history but do
not fabricate gate eligibility.

## Lessons, precedents, and metrics

```bash
npm run boss -- lesson add --input <lesson.json>
npm run boss -- lesson promote --id <id> --status <next-status> --runs <ids> --evidence <ids>
npm run boss -- precedent add --input <precedent.json>
npm run boss -- precedent query --scopes <comma-list>
npm run boss -- metrics aggregate
```

Promotions move one maturity step at a time. Repeated evidence needs two runs. A permanent rule
needs named founder approval and reason.
