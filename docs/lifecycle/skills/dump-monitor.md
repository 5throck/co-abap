# Dump-Monitor Skill — Lifecycle Record

## Metadata
- **Skill**: dump-monitor
- **Status**: active
- **Version**: 1.0.1
- **Owner**: devops-admin
- **Created**: 2026-07-10 (first commit adding `skills/dump-monitor/` in this checkout)
- **Last Updated**: 2026-11-12

## Description
SAP system health workflow using ListDumps/GetDump: detect ABAP short dumps on a
periodic or incident-driven basis, produce a standardized dump-monitoring report,
and route new findings into `/triage` for investigation.

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-10 | - | production | Authored 2026-07-10 (first commit adding the skill path — the test/CI hardening + SAP operational-skills wave, #85); delivered with the variant template | pm |
| 2026-11-12 | production | production | Lifecycle record backfill — active skill without a record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/dump-monitor/SKILL.md`
- [x] Frontmatter valid: name, description, status, version, owner (devops-admin) populated
- [x] Workflow uses the ListDumps/GetDump tooling with a defined report format
- [x] Routing of new dump findings into triage is documented

## Metadata
- **Current Phase**: production
- **Version**: 1.0.1
- **Owner**: devops-admin
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
