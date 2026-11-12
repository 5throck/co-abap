<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/sync.md) -->
# Sync Skill — Lifecycle Record

## Metadata
- **Skill**: sync
- **Status**: active
- **Version**: 1.9.0
- **Owner**: pm
- **Created**: 2026-07-08
- **Last Updated**: 2026-11-12

## Description
Full project sync pipeline covering lifecycle update, audit, commit, push, and
PR creation (the L0→L1 publish steps of the upstream pipeline are workspace-root
only and do not run in this project).

## Changelog
- 2026-11-07: v1.9.0 — new "Worktree Landing Variant" section: 9-step isolated-worktree landing procedure under concurrency evidence (T-20261106-010; spec `2026-11-07-session-worktree-convention-design`), including the two live-validated mechanics (CWD guard anchors to `import.meta.dir` so in-worktree dev-sync passes by construction; per-worktree private git dir for the PR body file). Docs-only body change.
- 2026-10-08: v1.8.0 — pipeline table gains step 4.85 Version-Bump Test Gate (dev-sync v1.24.0): a staged `SKILL.md` frontmatter `version:` or script `@version` header change forces `bun run test:unit` before the audit gate, FATAL on failure; skipped when `package.json` has no `test:unit` script (user directive 2026-10-08).
- 2026-09-17: v1.7.0 — instruction-policy wiring: step 3.9 now cites the PM routing path (ADR-0078); step 0 sentence split into single-instruction sentences per ADR-0079.
- 2026-09-12: v1.5.0 — Universal Design Gate (ADR-0074) phase B: pipeline step 3.9 Spec Registry Check (`audit.ts --spec-check`, `--spec-exempt=E1-E5`); missing `docs/specs/registry.json` is a loud WARN (commit 7170c3d8).
- 2026-09-12: v1.4.0 — scoped staging: task-staged-file discipline, `SYNC_SCOPED_STAGING=1` / `--scoped-staging` preview (commit 20b534a9).
- 2026-09-06: v1.3.0 — session-evidence skill review loop: `## Skills Used` session evidence recording duty (upstream design doc).
- 2026-08-16: v1.2.0 — version drift fix: aligned lifecycle doc to v1.2.0 per SKILL.md.
- 2026-07-10: v1.1.0 — pipeline documentation expanded to the full step table; sync-skills.ts integration.
- 2026-07-08: skill extracted from inline /sync command to standalone SKILL.md.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- `scripts/dev-sync.ts` — main pipeline implementation (present in this project)
- `scripts/sync-skills.ts` — platform skill distribution (present in this project)
- `scripts/audit.ts` — audit gate (present in this project)
- `scripts/lifecycle-sync-audit.ts` — lifecycle drift detection (present in this project)

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-08 | - | production | Skill extracted from inline /sync command to standalone SKILL.md (upstream) | pm |
| 2026-09-12 | production | production | v1.5.0 design-gate work: spec-check step 3.9 and scoped-staging discipline documented (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/sync/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Full pipeline sync runs via `dev-sync.ts`
- [x] Idempotent PR update verified

## Notes
- SKILL.md is distributed to `.claude/skills/sync/` and `.gemini/skills/` via sync-skills.ts (platform mirrors present in this project)
- Pipeline is idempotent: re-running /sync on the same branch updates the existing PR

## Metadata
- **Current Phase**: production
- **Version**: 1.9.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
