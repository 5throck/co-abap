# Performance-Tuning Skill — Lifecycle Record

## Metadata
- **Skill**: performance-tuning
- **Status**: active
- **Version**: 1.0.1
- **Owner**: dba
- **Created**: 2026-07-10 (first commit adding `skills/performance-tuning/` in this checkout)
- **Last Updated**: 2026-11-12

## Description
ABAP performance investigation workflow using TraceExecution, ListSQLTraces, and
GetCallGraph: diagnose slow programs and expensive SQL, review performance risk on
large tables (VBAK, BSEG, ACDOCA, etc.), and document findings before they reach
production.

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-07-10 | - | production | Authored 2026-07-10 (first commit adding the skill path — the test/CI hardening + SAP operational-skills wave, #85); delivered with the variant template | pm |
| 2026-11-12 | production | production | Lifecycle record backfill — active skill without a record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/performance-tuning/SKILL.md`
- [x] Frontmatter valid: name, description, status, version, owner (dba) populated
- [x] Workflow uses TraceExecution / ListSQLTraces / GetCallGraph with a defined report format
- [x] Anti-patterns to flag and severity disposition documented

## Metadata
- **Current Phase**: production
- **Version**: 1.0.1
- **Owner**: dba
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
