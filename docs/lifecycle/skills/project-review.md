<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/project-review.md) -->
# Project-Review Skill Lifecycle

## Metadata
- **Skill**: project-review
- **Status**: active
- **Version**: 1.3.3
- **Owner**: pm
- **Created**: 2026-07-03
- **Last Updated**: 2026-11-12

## Description
Performs a comprehensive review of the current project: machine validator
baseline first, then parallel specialist agents (scope-triageable: full /
scoped / baseline-only). Auto-detects project type and agent roster,
produces a prioritized, class-tagged findings report persisted to
docs/reports/, and wires deferred outcomes to recorded follow-ups.

## Changelog
- **1.3.3**: delivered to this project via the variant template pipeline; this record's version is normalized to the delivered SKILL.md frontmatter. The workspace-root seed changelog documents through 1.3.2 — the root-level release note for the 1.3.3 bump was not part of the delivered seed.
- **1.3.1** (2026-09-26): prose fix — Antigravity fallback now references the meeting-facilitation skill instead of the retired `/meeting` slash command (T-20260926-027, spec 2026-09-26-meeting-command-retirement).
- **1.3.2** (2026-10-08): Step 1.5 full mode corrected to 4 paired slots; review→resync→upgrade loop documented (upstream).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Phase History

| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-03 | - | production | Backfilled lifecycle record for existing production skill (upstream) | pm |
| 2026-07-10 | production | production | v1.1.0 — added conditional base-map MCP integration with Step 0 detection, Step 4c cross-validation, graceful degradation (upstream) | pm |
| 2026-09-08 | production | production | v1.2.0 — machine-baseline-first (Step 0), scope triage full/scoped/baseline-only (Step 1.5), 4-slot dispatch cap with fallbacks, Class column + report persistence to docs/reports/, post-fix verification + ratchet check (upstream) | pm |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill SKILL.md exists at `skills/project-review/SKILL.md`
- [x] Frontmatter valid: name, description, status, scope, version, owner populated
- [x] Triggers defined: project review, review project, audit project, quality review
- [x] Machine baseline battery precedes agent dispatch; report persisted under docs/reports/
- [x] Scope triage (full / scoped / baseline-only) with the 4-slot dispatch cap
- [x] `script-gap` findings classified for the validator-hardening loop (deferred outcomes recorded; `scripts/ticket.ts` is workspace-root only, so this project records follow-ups in-repo)

## Dependencies
- pm (owner agent; dispatches and covers unstaffed domains)
- project `agents/` roster — review domains are mapped to available agents at dispatch (auto-detected, not hard-coded); unstaffed domains covered directly by PM
- base-map MCP (optional — local model tools for cross-validation)

## Metadata
- **Current Phase**: production
- **Version**: 1.3.3
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
