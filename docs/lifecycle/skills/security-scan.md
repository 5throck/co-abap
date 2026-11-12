<!-- LOCAL-PATCH(upstream-request: U-20261112-011): project-local adaptation of the delivered record (seed: workspace-root docs/lifecycle/skills/security-scan.md) -->
# Security-Scan Skill Lifecycle

## Metadata
- **Skill**: security-scan
- **Status**: active
- **Version**: 1.3.0
- **Owner**: pm
- **Created**: 2026-05-29
- **Last Updated**: 2026-11-12

## Description
Runs static analysis, secret detection (via gitleaks), dependency vulnerability
auditing (via `bun audit`), and auth-surface auditing (unauthenticated signup
endpoints) across the project.

## Changelog
- **1.3.0** (2026-11-04): added auth-surface audit step — sweep web apps for unauthenticated registration/signup endpoints granting any authenticated role, flag default-open auth surfaces; reference remediation shape = default-closed pattern (T-20261103-006 / DEC-20261103-04, upstream).
- 2026-09-12: record reconciliation — Owner corrected security-expert → pm to match SKILL.md frontmatter; Version field added (T-20260912-010, upstream).
- 2026-08-30: SKILL.md 1.1.0 → 1.2.0 — added on-demand dependency vulnerability step — `bun audit` failing on high/critical, mirroring the CI gate threshold.
- 1.0.0 → 1.1.0: mandated explicit `--config .gitleaks.toml` on all gitleaks invocations — subdirectory scans without it silently fall back to the default ruleset and lose workspace allowlists.
- 2026-11-12: lifecycle record adapted to this project (record backfill — Check LC).

## Phase History
| Date | From | To | Reason | Approver |
|------|------|-----|---------|----------|
| 2026-05-29 | - | production | Initial skill established for security scanning (upstream) | lifecycle-manager |
| 2026-11-12 | production | production | Record backfill for this project — active skill without a lifecycle record (Check LC) | pm |

## Acceptance Criteria

### Production Phase
- [x] Skill purpose clearly defined: Security vulnerability scanning
- [x] Trigger conditions: Scheduled scans, pre-PR validation, manual requests
- [x] Examples provided: Advisory scan, CVE checking, auth-surface audit
- [x] Successfully tested in security scan operations

## Dependencies
- pm (owner agent)
- gitleaks + `.gitleaks.toml` (both present in this project)
- security-monitor (local agent for findings triage)
- `bun audit` (dependency vulnerability gate)

## Metadata
- **Current Phase**: production
- **Version**: 1.3.0
- **Owner**: pm
- **Last Updated**: 2026-11-12
- **Last Reviewer**: pm
