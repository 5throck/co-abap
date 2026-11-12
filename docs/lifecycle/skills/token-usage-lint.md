<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/token-usage-lint.md) -->
# Token-Usage-Lint Skill — Lifecycle Record

## Metadata
- **Skill**: token-usage-lint
- **Status**: active
- **Version**: 1.1.0
- **Owner**: pm
- **Created**: 2026-08-25 (created in the co-design variant; promoted to the workspace common layer 2026-09-06)
- **Last Updated**: 2026-11-12

## Description
Token SSOT compliance lint: scans UI source for hardcoded design values (raw hex,
rgb()/hsl() literals, raw px) bypassing the project token source. Runnable companion
`scripts/design-lint.ts` implements the detection/exemption/classification
scheme; this skill documents the workflow and remediation loop.

## Changelog
- 2026-08-25: 1.0.0 — created in co-design (variant backlog closure) (upstream)
- 2026-09-06: 1.1.0 — runnable `design-lint.ts` companion; promoted to the workspace common layer (upstream)
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- `scripts/design-lint.ts` (present in this project)
- Composes with `design-foundation`; follows `ui-ux-design-intelligence`

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-06 | - | active | Promoted to the workspace common layer per ADR-0068 plan Phase 3 (upstream) | pm |
| 2026-11-12 | active | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/token-usage-lint/SKILL.md`
- [x] Frontmatter valid; scope: common
- [x] Registered in skills/SKILLS.md and docs/VERSION_MANIFEST.md

## Metadata
- **Current Phase**: production
- **Version**: 1.1.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
