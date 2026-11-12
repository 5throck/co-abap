<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/skill-lifecycle-manager.md) -->
# Skill-Lifecycle-Manager Skill Lifecycle

## Metadata
- **Skill**: skill-lifecycle-manager
- **Status**: active
- **Version**: 1.5.0
- **Owner**: pm
- **Created**: 2026-05-29
- **Last Updated**: 2026-11-12

## Description
Skill lifecycle management: creation, modification, deprecation, and removal
workflows for `skills/`, including registry lockstep (skills/SKILLS.md, docs/VERSION_MANIFEST.md)
and lifecycle-record duties enforced by `scripts/skill-lifecycle-audit.ts`.

## Changelog
- **1.5.0** (2026-09-21): lifecycle modernization per 2026-09-21-agent-skill-lifecycle-modernization-design — R1-R3 evidence_refs mandatory + DEC frontmatter compliance, new Registry Lockstep Checklist section, Deprecate gains superseded_by/removal-date/version-bump requirements, Remove covers mirrors + derived-artifact regeneration + record retirement (upstream).
- 2026-09-06: v1.3.0 — whole-skill revision principle section added (SKILL.md + scripts/ + references/ revised together in one approved change; upstream design doc docs/designs/2026-09-06-skill-session-review-design.md).
- 2026-09-18: v1.4.0 — Skill Request Workflow (agent-initiated, PM-approved; Steps R1–R3) and Skill Deprecation & Removal sections added (upstream).
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC). This project's Check LC / MV run via `scripts/skill-lifecycle-audit.ts` (U-20261028-011 made the check run in delivered projects).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-29 | - | production | Initial skill established for skill lifecycle management (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill purpose clearly defined: Skill lifecycle management
- [x] Trigger conditions: When skill is created, modified, or deprecated
- [x] Examples provided: Skill creation, validation, deprecation workflows
- [x] Successfully tested in skill lifecycle operations

## Dependencies
- `scripts/skill-lifecycle-audit.ts` (Check LC / MV enforcement — present in this project)
- pm (owner agent; approves skill requests)

## Metadata
- **Current Phase**: production
- **Version**: 1.5.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
