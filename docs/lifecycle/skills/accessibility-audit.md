<!-- LOCAL-PATCH(upstream-request: U-20261113-003): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/accessibility-audit.md) -->
# Accessibility-Audit Skill — Lifecycle Record

## Metadata
- **Skill**: accessibility-audit
- **Status**: active
- **Version**: 1.1.0
- **Owner**: pm
- **Created**: 2026-08-06 (created in the co-design variant; upstream promotion history in Changelog)
- **Last Updated**: 2026-11-12

## Description
Automated WCAG 2.1 Level AA accessibility evaluation rules, DOM audit patterns, and
remediation guidance using axe-core for UI components, templates, and web applications.
Delivered to this project through the variant template pipeline.

## Changelog
- 2026-08-06: 1.0.0 — created in co-design
- 2026-09-06: 1.1.0 — promoted to the workspace common layer (scope common); body unchanged
- 2026-11-12: lifecycle record adapted to this project (record backfill — the skill was active without a project-local record; Check LC)

## Dependencies
- None (procedural skill); composed with `design-foundation` and `token-usage-lint`

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-09-06 | - | active | Promoted to the workspace common layer per ADR-0068 plan Phase 3 (upstream) | pm |
| 2026-11-12 | active | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/accessibility-audit/SKILL.md`
- [x] Frontmatter valid; scope: common
- [x] Registered in skills/SKILLS.md and docs/VERSION_MANIFEST.md

## Metadata
- **Current Phase**: production
- **Version**: 1.1.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
