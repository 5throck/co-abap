# Post-Write-Chain Skill — Lifecycle Record

## Metadata
- **Skill**: post-write-chain
- **Status**: active
- **Version**: 1.3.2
- **Owner**: test-runner
- **Created**: 2026-05-19 (first commit adding `skills/post-write-chain/` in this checkout — the plugin-aligned layout restructure)
- **Last Updated**: 2026-11-12

## Description
Mandatory post-write quality gate for SAP ABAP objects, enforced after every
WriteSource, EditSource, or Activate operation: SyntaxCheck → RunUnitTests →
GetCodeCoverage → RunATCCheck, with ATC priority levels and the code coverage
gate.

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-19 | - | production | Authored (first commit adding the skill path, at the plugin-aligned layout restructure); delivered with the variant template | pm |
| 2026-11-12 | production | production | Lifecycle record backfill — active skill without a record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] SKILL.md exists at `skills/post-write-chain/SKILL.md`
- [x] Frontmatter valid: name, description, status, version, owner (test-runner) populated
- [x] Four-step gate chain documented (SyntaxCheck → RunUnitTests → GetCodeCoverage → RunATCCheck)
- [x] Enforcement rules and ATC priority handling present

## Metadata
- **Current Phase**: production
- **Version**: 1.3.2
- **Owner**: test-runner
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
