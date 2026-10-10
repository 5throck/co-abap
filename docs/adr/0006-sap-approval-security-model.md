# ADR-0006: SAP Approval Security Model

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decider:** PM (user decision, option a)
- **Related design:** [Cross-Platform Parity Design](../designs/2026-10-10-cross-platform-parity-design.md)
- **Related ADR:** [ADR-0005](0005-cross-platform-parity.md)

## Context

Agents run as the same OS user as the human, so repo-resident approval files could be forged by an agent.

## Decision (option a)

1. Approvals and grants are HMAC-signed. The key and the pending/approval stores live in `~/.config/co-abap`, outside the repo.
2. Approval needs human confirmation on `/dev/tty` by typing the id prefix.
3. A signed integrity manifest covers the policy and enforcement scripts. On mismatch the proxy drops to R0. A human runs `bun scripts/sap-integrity.ts init` and `sign`.
4. Evidence is HMAC-signed and the audit log is hash-chained.
5. JSON-RPC parsing is strict. `.env` may only narrow permissions.
6. The residual same-UID risk is accepted and documented in SECURITY.md.

## Rejected alternatives

- (b) Separate OS user for the approver: too heavy for developer machines.
- (c) Cap non-Claude platforms at R1: breaks the parity requirement.

## Consequences

Agents cannot self-approve through repo files. A same-UID attacker with shell access remains out of scope.
