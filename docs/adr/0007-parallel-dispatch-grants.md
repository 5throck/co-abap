# ADR-0007: Parallel Dispatch With Pre-Dispatch Grants and Staged Termination

- **Status:** Accepted
- **Date:** 2026-10-10
- **Decider:** PM (user decisions of 2026-10-10)
- **Related design:** [Cross-Platform Parity Design](../designs/2026-10-10-cross-platform-parity-design.md)
- **Related ADR:** [ADR-0006](0006-sap-approval-security-model.md)

## Decision

1. Plan rows are read or write. One human pre-dispatch grant (`sap-approve.ts --grant <runId>`) covers write rows with exact-object scope (`sapScope`). Out-of-scope calls are denied and R3 must be explicit.
2. Children get an environment allowlist.
3. The proxy ceiling is passed to each child by argv and env per platform; a missing ceiling fails closed to R0.
4. Termination is staged: SIGTERM, 10 s grace, then SIGKILL. The user rejected immediate kill and read-only-only children.
5. Each row runs in its own git worktree.
6. Hermes rows need `--allow-hermes-write`.

## Consequences

Write-capable parallel work is bounded by one human decision per run. Related: [ADR-0005](0005-cross-platform-parity.md).
