<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/service-design.md) -->
# Service-Design Skill — Lifecycle Record

## Metadata
- **Skill**: service-design
- **Status**: active
- **Version**: 1.1.0
- **Owner**: pm
- **Created**: 2026-07-19 (created in the co-design variant; promoted to the workspace common layer 2026-09-27)
- **Last Updated**: 2026-11-12

## Description
End-to-end service design procedure: stakeholder discovery, customer journey mapping
(with the mandatory diversity-profile review), service blueprinting
(frontstage/backstage), touchpoint design, process optimization, and service
validation with output contracts. Delivered to this project through the variant
template pipeline.

## Changelog
- 2026-07-19: 1.0.0 — created in co-design (upstream)
- 2026-09-27: 1.1.0 — co-design batch update (body current as of promotion) (upstream)
- 2026-09-27: promoted to the workspace common layer; body unchanged except defect cleanup (stray trailing `",` artifact removed from the body tail) (upstream)
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Dependencies
- Composes with `ui-ux-design-intelligence` (follows), `accessibility-audit`
  (follows), `token-usage-lint` (follows); the diversity-profile review is
  embedded as a mandatory journey-mapping step

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-19 | - | active | Created in co-design variant (upstream) | pm |
| 2026-09-27 | active (co-design) | active (common) | Promoted to the workspace common layer per upstream PM ruling (ADR-0080 meeting P7) | pm |
| 2026-11-12 | active | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md frontmatter: scope common, English-only body
- [x] Registry lockstep: skills/SKILLS.md row, this record, docs/VERSION_MANIFEST.md — consistent at 1.1.0
- [x] Validators: verify-skills / validate-skills / verify-skill-graph pass

## Metadata
- **Current Phase**: production
- **Version**: 1.1.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
