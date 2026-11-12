<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/agent-lifecycle-manager.md) -->
# Agent-Lifecycle-Manager Skill Lifecycle

## Metadata
- **Skill**: agent-lifecycle-manager
- **Status**: active
- **Version**: 1.4.0
- **Owner**: pm
- **Created**: 2026-05-29
- **Last Updated**: 2026-11-12

## Description
Agent lifecycle management: hiring, tier changes, modification, and deprecation
workflows for the project's agent roster (`agents/`).

## Changelog
- **1.4.0** (2026-11-06): version aligned with `skills/agent-lifecycle-manager/SKILL.md` after the CI warning cleanup skill merge (DEC-20261106-03).
- **1.3.1** (2026-10-27): tier surfaces reworded to the ADR-0102 scalar declaration form (Step 2 frontmatter example, "Changing an Agent's Tier" order, Check F descriptions) — schema `agent_tiers` removed per DEC-20261026-03 ruling 2 (T-20261026-018 PR-1).
- **1.3.0** (2026-09-21): lifecycle modernization per 2026-09-21-agent-skill-lifecycle-modernization-design — H5 creates the agent lifecycle record + regenerates derived artifacts, F4 schedules removal_review (deprecation + 90 days), F5 prose checks promoted to enforced audit checks (13/14), DEC validator invocation explicit.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-29 | - | production | Initial skill established for agent lifecycle management (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill purpose clearly defined: Agent lifecycle management
- [x] Trigger conditions: When agent status/tier changes
- [x] Examples provided: Agent creation, modification, deprecation workflows
- [x] Successfully tested in agent lifecycle operations

## Dependencies
- lifecycle-manager procedures (PM-dispatched lifecycle operations)
- `docs/governance/agents/workflows.md` (lifecycle governance reference in this project)

## Metadata
- **Current Phase**: production
- **Version**: 1.4.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
