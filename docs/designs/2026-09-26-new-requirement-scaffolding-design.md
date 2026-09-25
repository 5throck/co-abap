# Design — new-requirement.ts root fix + standard 05/06 scaffolding

- **Date**: 2026-09-26
- **Status**: implemented
- **Scope**: `scripts/co-abap/new-requirement.ts` (variant-local script, L2)
- **Trigger**: Open issues from REQ-001 cycle — (a) `projectRoot` resolves `scripts/` instead of the repo root, so REQ folders land under `scripts/deliverables/` and RTM insertion reports "index.md not found"; (b) `--help`/`-h` are parsed as the title (created junk folders during readiness testing); (c) the standard deliverable set grew to include `05_unit_test_plan.md` (Stage 4) and `06_release_report.md` (Stage 5), which the scaffolder should pre-create.

## Requirements
1. REQ folders are created under `<repoRoot>/deliverables/` regardless of the caller's working directory.
2. `--help` and `-h` print usage and exit 0 without creating anything.
3. Scaffolding produces `01_srs.md`, `05_unit_test_plan.md`, `06_release_report.md` with REQ-NNN / title placeholders filled.
4. Existing behaviors kept: RTM row insertion with CRLF/LF preservation, REQ-ID allocation from existing folders, slug rules.

## Design
- Root resolution: `path.resolve(scriptDir, "..", "..")` (script lives two levels below the repo root). The `projectRoot` parameter signature stays so tests can inject.
- Help handling: check `--help`/`-h` in `main()` before title validation.
- Scaffolding: loop over the file list `01_srs.md`, `05_unit_test_plan.md`, `06_release_report.md`; share one `fill()` helper (REQ-NNN → id, [Requirement Title]/[Requirement Name] → title). Missing template file → skip with a warning instead of failing (templates are workspace-delivered).

## Test plan
- `--help` prints usage, exit 0, no folder created.
- Real run creates `deliverables/REQ-NNN-<slug>/{01,05,06}.md` at the correct root and inserts the RTM row (verified, then cleaned up).
- `bunx tsc --noEmit` over `scripts/` stays at the zero-error baseline.

## Risks
- None outside the variant script; upstream (`templates/common`) does not carry `new-requirement.ts`.
