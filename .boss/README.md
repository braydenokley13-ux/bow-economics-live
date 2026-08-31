# BOW Boss project state

This directory is BOW's project-local development control plane.

- `config/` is reviewed harness policy.
- `schemas/` documents machine contracts enforced by `tools/boss/`.
- `templates/` contains founder- and agent-facing starting artifacts.
- `runs/` contains append-only run histories and their derived views.
- `lessons/` and `precedents/` contain reviewed institutional memory.
- `metrics/` contains aggregate harness measurements derived from runs.

`events.jsonl` inside a run is the source of truth. `state.json`, `SUMMARY.md`, and ship cases are
derived views and must not be hand-edited.

Run `npm run boss -- doctor` to validate the installation. Do not create a run for first-prototype
work; use `.claude/skills/bow-prototype/SKILL.md` instead.
