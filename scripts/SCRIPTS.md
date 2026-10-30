# SCRIPTS.md —Script Lifecycle Registry

> This file is the Single Source of Truth (Tier 1 SSOT) for all directly-invokable scripts in `scripts/` (workspace root) — i.e. scripts run via `bun scripts/<name>.ts` or `bun run <alias>`. Internal library/helper modules under `scripts/lib/`, `scripts/helpers/`, `scripts/hooks/`, `scripts/tests/`, and `scripts/co-abap/` that are imported by other scripts rather than run standalone are ALSO registered below — the Registry is the full tracked-script inventory (130 of 205 rows live in subdirectories), which keeps every file's `@version` header under Check A comparison. LOCAL-PATCH(upstream-request: U-20261028-012): corrected 2026-10-28 — the previous "intentionally excluded" prose contradicted the registry (design docs/designs/2026-10-28-project-review-remediation-design.md).
> Template `templates/common/scripts/` (Tier 2) is a snapshot published from here via `bun run propagate:apply`.
> Project `scripts/` (Tier 3) is a snapshot created from Tier 2 at `new-project` time.
>
> **Machine parsing**: `verify-scripts.ts --verify` reads the `## Registry` section only.
> **Human reading**: see `## Guide` section below for purpose, usage, and deprecation notes.

---

## Architecture: TypeScript-Only Policy (ADR-0036)

> **Policy change (2026-06-11)**: All scripts are TypeScript executed via Bun. The former Tier 1 sh/ps1 bootstrap tier has been abolished. See ADR-0036 (workspace root: `docs/adr/0036-script-ts-migration.md`) for rationale.

## Error Handling Standard (ADR-0054)

> **Policy (2026-08-16)**: Error and exit paths in all scripts MUST use `scripts/lib/error-handling.ts` (`die()`, `fatalError()` + `logError()`, `withSyncErrorHandling()`). Migration is **incremental** — a script migrates when it is otherwise modified (no pure-consistency rewrites). When migrating an L0+L1 script, sync the change to `templates/common/scripts/` in the same commit. See ADR-0054 (workspace root: `docs/adr/0054-error-handling-standardization.md`) and `docs/context.md` §8.11.

All scripts in this workspace are written in TypeScript and executed via `bun`. There is no longer a distinction between "bootstrap" and "ops" tiers — Bun is a hard prerequisite for the workspace and is assumed to be installed before any script runs.

**Single rule**: every new script must be a `.ts` file. No `.sh` or `.ps1` files will be accepted.

**Invocation pattern**:
```bash
bun scripts/<name>.ts [args]       # direct
bun run <alias>                     # via package.json alias (preferred for CI)
```

### Ops & Automation Scripts (Bun/TypeScript)
*   **Purpose**: All scripting tasks — project scaffolding, pipeline, code generation, linting, syncing, lifecycle audits.
*   **Implementation**: Written in TypeScript (`.ts`), executed via the Bun runtime.
*   **Execution**: `bun scripts/<name>.ts` or via `package.json` alias.
*   **Examples**: `upgrade-project.ts`, `cleanup-completed-md.ts`, `audit.ts`, `dev-sync.ts`.

---

## Registry

<!-- verify-scripts.ts parses rows between the Registry header and the next ## header. -->
<!-- Required columns: script | source | version | status | removal-date | security-advisory | layer | pair -->
<!-- status: active | deprecated | experimental -->
<!-- removal-date: YYYY-MM-DD (required when status=deprecated) or —-->
<!-- security-advisory: CVE-XXXX or —-->
<!-- Layer column values (ONLY 2 TYPES USED). L0/L1/L2/L3 here follow
     context.md's Terminology Definition (L1=templates/common, L2=templates/co-*,
     L3=Projects/*); these Layer values predate that document and use L2 to mean
     "reaches a scaffolded project," which context.md calls L3 — not renamed here
     since layer-filter.ts and verify-scripts.ts parse these literal strings:
  L0           = workspace root only; must NOT be copied to templates/common/ or L3 projects
  L0+L1        = exists in scripts/ AND templates/common/scripts/; scaffold-copies to L3 at new-project time
  L0+L1+L2     = reserved for future use (Fork Model architecture - not currently used)
-->
<!-- pair: reserved field (was used for sh/ps1 pair tracking — abolished per ADR-0036) -->
<!-- Check A (lifecycle-sync-audit.ts): verifies @version header == registry version (formal consistency only). Semantic content alignment —whether file content actually reflects version history —is NOT verified by tooling. Use git log to confirm content for Type-2 fixes. -->

| script | source | version | status | removal-date | security-advisory | layer | pair |
|--------|--------|---------|--------|--------------|-------------------|-------|------|
| `helpers/upgrade-versions.ts` | L0+L1 | 1.2.0 | active | —| —| L0+L1 | —|
| `resolve-variants.ts` | L0 | 1.0.3 | active | —| —| L0+L1 | —|
| `regenerate-agents-md.ts` | L0 | 1.4.0 | active | —| —| L0+L1 | —|
| `validate-templates.ts` | L0 | 1.65.0 | active | —| —| L0+L1 | —|
| `agent-create.ts` | L0 | 1.0.1 | active | —| —| L0+L1 | —|
| `agent-delete.ts` | L0 | 1.0.1 | active | —| —| L0+L1 | —|
| `agent-lifecycle-audit.ts` | L0 | 1.9.0 | active | —| —| L0+L1 | —|
| `agent-list.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `agent-verify.ts` | L0 | 1.0.2 | active | —| —| L0+L1 | —|
| `analyze-git-history.ts` | L0 | 1.0.2 | active | —| —| L0+L1 | —|
| `archive-memory.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `audit.ts` | L0 | 2.60.0 | active | —| —| L0+L1 | —|
| `cleanup-completed-md.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `clear-pm-approval.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `compile-tokens.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `design-lint.ts` | L0 | 2.5.0 | active | —| —| L0+L1 | —|
| `retry-handler.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `setup-github-branch-protection.ts` | L0 | 1.0.1 | active | `--repo`, `--branch`, `--check` (repeatable), `--dry-run` | —| L0+L1 | —|
| `sync-md.ts` | L0 | 1.4.0 | active | —| —| L0+L1 | —|
| `sync-skills.ts` | L0 | 1.11.0 | active | `--dir <path>`, `--all-variants` | — | L0+L1 | — |
| `verify-skills.ts` | L0 | 1.5.2 | active | —| —| L0+L1 | —|
| `dev-sync.ts` | L0 | 1.35.0 | active | —| —| L0+L1 | —|
| `dispatch-parallel.ts` | L0 | 2.4.1 | active | —| —| L0+L1 | —|
| `render-commands.ts` | L3 | 1.1.0 | active | Renders config/commands/*.md into .claude/commands, .codex/prompts and .gemini/commands/*.toml (--check fails on drift) | —| L3 | —|
| `validate-platform-parity.ts` | L3 | 1.0.0 | active | Cross-platform parity validator: rendered commands, MCP proxy routing, instruction sections, skills mirrors, schema models | —| L3 | —|
| `tests/dispatch-parallel.test.ts` | L3 | 1.5.1 | active | Stub-CLI tests for fan-out, prompt identity, timeout, failure isolation | — | L3 | — |
| `tests/render-commands.test.ts` | L3 | 1.1.0 | active | v1.1.0 (2026-10-14, T-20261013-009 phase 2): re-homed to the fleet .claude-SSOT renderer model. Renderer and drift tests | — | L3 | — |
| `tests/validate-platform-parity.test.ts` | L3 | 1.0.0 | active | Parity validator fixtures | — | L3 | — |
| `dispatch-serial.ts` | L0 | 1.1.2 | active | —| —| L0+L1 | —|
| `dispatch.ts` | L0 | 1.2.0 | active | v1.2.0: parallel mode forwards --platform/--plan to dispatch-parallel.ts | —| L0+L1 | —|
| `gen-pr-body.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `generate-ide-rules.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `generate-skill-graph.ts` | L0 | 2.0.0 | active | —| —| L0+L1 | —|
| `handbook/apply-handbook-theme.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/build-search-index.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-a11y.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-authoring.ts` | L0 | 1.2.0 | active | — | — | common | — |
| `handbook/check-external-links.ts` | L0 | 1.2.0 | active | — | — | common | — |
| `handbook/check-i18n-parity.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-labels.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-links.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-lint.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-search.ts` | L0 | 2.0.0 | active | — | — | common | — |
| `handbook/check-spell.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-structure.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-symmetry.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/check-tables.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/deploy-handbook.ts` | L0 | 1.1.0 | active | — | — | common | — |
| `handbook/extract-copycode.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/handbook-doctor.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/handbook-sync-audit.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/nav-utils.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/scaffold-handbook.ts` | L0 | 1.2.0 | active | — | — | common | — |
| `handbook/update-footers.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `handbook/validate-handbook.ts` | L0 | 1.1.0 | active | — | — | common | — |
| `handbook/validate-nav.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `helpers/extends-validator.ts` | L0 | 1.0.1 | active | —| —| L0+L1 | —|
| `helpers/merge-frontmatter.ts` | L0 | 1.8.6 | active | —| —| L0+L1 | —|
| `helpers/security-validator.ts` | L0 | 1.1.1 | active | —| —| L0+L1 | —|
| `helpers/context-sections.ts` | L0 | 1.8.0 | active | —| —| L0+L1 | —|
| `helpers/pm-md-parser.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `helpers/template-utils.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `tests/apply-handbook-theme.test.ts` | L0 | 1.0.1 | active | — | — | common | — |
| `tests/check-structure.test.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `tests/deploy-readme-patch.test.ts` | L0 | 1.0.0 | active | — | — | common | — |
| `tests/validate-docs-links.test.ts` | L3 | 1.0.0 | active | — | — | L3 | — |
| `tests/sap-action-gate.test.ts` | L3 | 2.0.0 | active | Gate/audit tests (temp HOME); legacy approval files ignored, evidence MAC | — | L3 | — |
| `hooks/gateguard-fact-force.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `hooks/post-write-lifecycle-check.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `hooks/pre-commit.ts` | L0 | 1.12.0 | active | Re-renders platform command copies after stamping config/commands (LOCAL-PATCH)| —| L0+L1 | —|
| `hooks/pre-push.ts` | L0 | 1.7.0 | active | —| —| L0+L1 | —|
| `hooks/sap-action-gate.ts` | L3 | 3.0.0 | active | Shared R0-R3 policy evaluator (used in-process by sap-mcp-proxy.ts); R3 always needs a proxy approval (legacy session approval files removed); advisory-only when run as a hook — design docs/designs/2026-10-10-sap-write-safety-gate-design.md | —| L3 | —|
| `hooks/sap-action-audit.ts` | L3 | 2.0.0 | active | Audit/evidence recorder called by sap-mcp-proxy.ts; HMAC-signed evidence entries, clientId/grant fields (hashes only) | —| L3 | —|
| `lib/sap-action-lib.ts` | L3 | 2.1.0 | active | Shared policy/evidence/audit logic; secure store outside the workspace (~/.config/co-abap: HMAC key, signed approvals/pending, integrity manifest, dispatch grants), HMAC'd evidence and audit hash chain | —| L3 | —|
| `sap-mcp-proxy.ts` | L3 | 2.1.0 | active | Stdio MCP proxy in front of vsp: single SAP enforcement point; strict JSON-RPC, MAC-verified client-bound approvals, integrity manifest (R0-only on mismatch), --max-class/SAP_PROXY_MAX_CLASS, dispatch grants, .env can only narrow, stderr redaction, graceful SIGTERM drain — design docs/designs/2026-10-10-cross-platform-parity-design.md | —| L3 | —|
| `sap-approve.ts` | L3 | 2.1.0 | active | Human CLI: approve a pending call or sign a dispatch grant (--grant/--revoke-grant) via /dev/tty with typed id prefix; approver = OS user; HMAC-signed | —| L3 | —|
| `tests/sap-mcp-proxy.test.ts` | L3 | 2.1.1 | active | Proxy contract tests (temp HOME + stub vsp): replay, approvals/MAC/client binding, integrity, max class, strict JSON-RPC, grants, shutdown | — | L3 | — |
| `tests/sap-approve.test.ts` | L3 | 2.1.0 | active | Secure store, approval MAC, CLI confirmation, audit chain, integrity manifest, dispatch grant tests | — | L3 | — |
| `tests/fixtures/stub-vsp.ts` | L3 | 1.1.0 | active | Stub vsp (echo MCP server, optional delay, logs EOF/SIGTERM) used by the proxy tests | — | L3 | — |
| `tests/fixtures/sap-secure-home.ts` | L3 | 1.0.0 | active | Test helper: temp HOME with approval key and signed manifest | — | L3 | — |
| `sap-integrity.ts` | L3 | 1.0.0 | active | Human CLI: init/sign the HMAC-signed integrity manifest (policy + enforcement code), verify, verify-audit | — | L3 | — |
| `lib/context-md-schema.ts` | L0 | 1.0.1 | active | —| —| L0+L1 | —|
| `lib/auth.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `lib/encoding-utils.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `lib/error-handling.ts` | L0 | 1.4.0 | active | —| —| L0+L1 | —|
| `lib/language-guard.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `lib/pipeline-state.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `lib/platform-context.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `lib/ssrf.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `lifecycle-sync-audit.ts` | L0 | 1.19.0 | active | —| —| L0+L1 | —|
| `md-to-ooxml.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `qa-gate.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `readme-lifecycle-audit.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `check-project-meta.ts` | L3 | 1.1.0 | active | — | — | L3 | — |
| `tests/check-project-meta.test.ts` | L3 | 1.1.0 | active | — | — | L3 | — |
| `harness-metrics.ts` | L3 | 1.0.0 | active | — | — | L3 | — |
| `tests/harness-metrics.test.ts` | L3 | 1.0.0 | active | — | — | L3 | — |
| `render-pdf-deck.ts` | L0 | 1.0.1 | active | —| —| L0+L1 | —|
| `skill-lifecycle-audit.ts` | L0 | 1.10.0 | active | —| —| L0+L1 | —|
| `skill-session-review.ts` | L0 | 1.2.0 | active | `--date`, `--json`, `--dry-run` | —| L0+L1 | —|
| `sync-skill-status.ts` | L0 | 1.1.0 | active | — | — | L0+L1 | — |
| `team-builder.ts` | L0 | 1.5.0 | active | —| —| L0+L1 | —|
| `test-runner.ts` | L0 | 1.7.0 | active | `--parallel`, `--sequential`, `--concurrency <n>`, `--timeout <ms>` | —| L0+L1 | —|
| `translate-readme.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `validate-agents.ts` | L0 | 1.4.1 | active | —| —| L0+L1 | —|
| `validate-doc-folder.ts` | L0 | 1.2.1 | active | —| —| L0+L1 | —|
| `validate-docs-links.ts` | L0 | 1.6.0 | active | —| —| L0+L1 | —|
| `validate-md-language.ts` | L0 | 1.16.1 | active | —| —| L0+L1 | —|
| `validate-model-registry.ts` | L0 | 2.2.0 | active | —| —| L0+L1 | —|
| `validate-procedures.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `validate-skills.ts` | L0 | 1.5.2 | active | —| —| L0+L1 | —|
| `validate-decisions.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `verify-agent-deliverables.ts` | L0 | 1.0.1 | active | —| —| L0+L1 | —|
| `verify-skill-graph.ts` | L0 | 2.0.0 | active | —| —| L0+L1 | —|
| `verify-memory.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `verify-platform-lifecycle.ts` | L0 | 1.6.1 | active | —| —| L0+L1 | —|
| `verify-readme-sync.ts` | L0 | 1.5.0 | active | —| —| L0+L1 | —|
| `verify-scripts.ts` | L0 | 1.13.0 | active | —| —| L0+L1 | —|
| `validate-pm-extends.ts` | L0 | 0.3.1 | active | —| —| L0+L1 | —|
| `validate-variant-readiness.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `typecheck.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `lib/local-date.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `spec-register.ts` | L0 | 1.6.0 | active | `--file`, `--source`, `--update`, `--status`, `--list`, `--ref`, `--id` | —| L0+L1 | —|
| `lib/git-status.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `helpers/l0-ref-policy.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `lib/constitution-scrub.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `lib/propagation-map-schema.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `helpers/markers.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `helpers/layer-filter.ts` | L0 | 1.5.0 | active | —| —| L0+L1 | —|
| `generate-version-manifest.ts` | L0 | 1.11.0 | active | shallow-tolerant `--check` (T-20260916-013); emits `validate-md-language:allowlist` markers around the generated Skills table (T-20260912-015) | —| L0+L1 | —|
| `helpers/rollback-partial-project.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `helpers/scaffold-markers.ts` | L0 | 1.9.0 | active | Shared scaffold marker constants + (marker→source) mapping + delivery-tree derivations + transient test-fixture predicate (T-20260916-001) | —| L0+L1 | —|
| `lib/managed-block-parity.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `lib/platform-delivery.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `lib/platform-mirror-freshness.ts` | L0 | 1.1.0 | active | Pure platform-skill-mirror vs skills/ SSOT version comparison for the platform-mirror-freshness check (T-20260916-008) | —| L0+L1 | —|
| `lib/variant-overlay-guard.ts` | L0 | 1.0.0 | active | —| —| L0+L1 | —|
| `lint-instructions.ts` | L0 | 1.0.0 | active | `--dir`, `--strict` | —| L0+L1 | —|
| `helpers/merge-state.ts` | L0 | 1.0.0 | active | §3.3 shared-file taxonomy + unresolved-conflict parsing for dev-sync main-drift/--conclude-merge (ADR-0081/T-20260918-002) | —| L0+L1 | —|
| `bootstrap-stages.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `evidence-backport-scan.ts` | L0 | 1.2.0 | active | Evidence Backporting scanner — read-only form detection (F1/F2/F3/F0/MIXED) + M1-M6 maturity bar over Projects/co-* evidence planes (ADR-0084 Decision 6, design §4); consumes graph-delta-log.ts output for M2/M4/M6b with git-log fallback; project-resync Step 2b | —| L0+L1 | —|
| `generate-raci.ts` | L0 | 1.2.0 | active | RACI matrix generator per ADR-0083 P4, ADR-0084 §3.4; derives A/R from procedures, accepts explicit C/I; loads governance/_human-roles.yaml when present; emits actor_types map when registry exists; sets schema_version: "1.1" for registries | —| L0+L1 | —|
| `graph-delta-log.ts` | L0 | 1.1.0 | active | Graph Delta Log — compute and persist per-scope structural diffs between committed and derived skill graphs (ADR-0084 §5); two-layer delivery (workspace root + projects); consumed by evidence-backport-scan.ts maturity bar (M2, M4, M6b tests) | —| L0+L1 | —|
| `migrate-quality-gates.ts` | L0 | 1.1.0 | active | Convert quality_gates prose entries to decision gates; automate classification (GATE vs INVARIANT vs MANUAL), YAML output, procedure schema updates, and _output-types.yaml enrichment (ADR-0083 P5); decider_agent derived from stage owner_agent, not procedure owner_agent | —| L0+L1 | —|
| `validate-process.ts` | L0 | 1.0.0 | active | Process/stages validation (ADR-0083 DEG-P-*), distinctness check (`--determinism` flag) | —| L0+L1 | —|
| `validate-raci.ts` | L0 | 1.2.0 | active | RACI validation per ADR-0083 DEG-R-01..05 + ADR-0084 DEG-R-06/07; DEG-R-06: human-accountable must match gate; DEG-R-07: actor_types key set must equal R/A/C/I union | —| L0+L1 | —|
| `lib/dependency-guard.ts` | L0 | 1.0.2 | active | DEPENDENCY GUARD — scans delivered scripts' bare-package imports vs project package.json, reports missing packages in the upgrade plan (T-20260920-001) | —| L0+L1 | —|
| `lib/upgrade-policy.ts` | L0 | 1.31.0 | active | exports `lifecyclelessText()` (equal-version agent drift) + `isDeliveredDiff()` (dev-sync 3.9 auto-E5, rollout hardening 2026-09-21) | —| L0+L1 | —|
| `helpers/golden-reference-loader.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `helpers/mirror-hygiene.ts` | L0 | 1.0.0 | active | v1.0.0 mirror-hygiene scanner (R6, spec docs/designs/2026-09-25-verifier-platform-expansion-design.md): a platform skill mirror contains only skill directories; stray files (SKILLS.md/README*.md) and non-skill dirs are findings; wired into validate-templates checkMirrorHygiene (WARN soak) | —| L0+L1 | —|
| `helpers/registries/capability-registry.ts` | L0 | 1.1.0 | active | —| —| L0+L1 | —|
| `helpers/registries/validation-policy.ts` | L0 | 1.3.0 | active | —| —| L0+L1 | —|
| `helpers/registries/variant-type-registry.ts` | L0 | 1.2.0 | active | —| —| L0+L1 | —|
| `helpers/resolve-pm-stub.ts` | L0 | 1.2.0 | active | v1.2.0 (registry & platform-policy completeness batch, spec docs/designs/2026-09-25-registry-policy-completeness-design.md R2.1): pure, read-only `composeResolvedAgentContent(agentPath, commonAgentPath, variant, opts)` returns exactly the content `resolveAgentExtendsStub` would write, without touching the filesystem (validators must not mutate the tree they audit); the resolver consumes the compose path so one merge implementation exists (in-place writer stays for the new-project/adopt-project delivery paths). Prior: v1.1.0 (T-20260924-003, spec docs/designs/2026-09-25-inventory-decisions-batch-design.md R2.2): generic `resolveAgentExtendsStub(agentPath, commonAgentPath, variant, opts)` wrapper — the pm canonical-prose check (H12) moves behind an injected `opts.isCanonicalStubBody` (pm passes isCanonicalPmStubBody; the empty-body i18n-specialist stubs skip it); `resolvePmExtendsStub` stays as a thin back-compat wrapper. Prior: Shared agents/pm.md normalization — ADR-0033 extends-stub resolution against the L1 body (H12 non-canonical prose flag) + L1-B metadata strip with project-local lifecycle regeneration; extracted verbatim from new-project §2.3b/§2.5, shared with the adopt-project settling pass | —| L0+L1 | —|
| `helpers/skills-registry.ts` | L0 | 1.2.0 | active | v1.2.0 (registry-policy-completeness batch W5, spec docs/designs/2026-09-25-registry-policy-completeness-design.md R5.1): registry auto-sync machinery — collectRegistryDrift, listSkillDirs, splitRootRegistry, collectCatalogEntries, collectCatalogDrift, syncVariantExclusiveCatalog, syncGenericRegistry, collectWorkspaceRegistryFindings (pure compute shared by the sync CLI, validate-templates VA-08, and unit tests; the root Variant-Exclusive catalog reconciles via a dedicated path — its 7th column is the owner-variant list, not notes). Prior: v1.1.0 (T-20260924-008, spec docs/designs/2026-09-24-skills-registry-overlay-reconcile-design.md): adds collectDeliveredSkills + pruneSkillRegistryRows (fresh-scaffold reconcile half); extractFrontmatterVersionAndReviewed moved in verbatim from upgrade-project.ts. v1.0.0: parse/reconcile project skills/SKILLS.md (T-20260922-001) | —| L0+L1 | —|
| `lib/platforms.ts` | L0 | 1.2.0 | active | Platform-list SSOT constants (PLATFORM_SKILL_BASES, PLATFORM_MIRROR_DIRS); Step 1 of the platform-parity program (spec: docs/designs/2026-09-24-platform-ssot-constant-design.md) | —| L0+L1 | —|
| `co-abap/new-requirement.ts` | L2 | 1.2.0 | active | Variant-local requirement scaffolder — creates `deliverables/REQ-NNN-<slug>/` (01_srs.md, 05_unit_test_plan.md, 06_release_report.md) and inserts the RTM row in deliverables/index.md. v1.1.0 (spec docs/designs/2026-09-26-new-requirement-scaffolding-design.md): repo-root resolution fix (folders were landing under scripts/deliverables/), --help/-h handling, 05/06 pre-scaffolding per the standardized deliverable set | —| L2-only | —|
| `lib/ci-workflow-merge.ts` | L0 | 1.0.0 | active | v1.0.0 (T-20260930-026 PR-A, ADR-0094): fail-closed merge/validate of a project `.github/workflows/ci.yml` against the template — 12 error codes (MARKER_*, REGION_*, YAML_PARSE, DUPLICATE_KEY, RESERVED_JOB, FORBIDDEN_TRIGGER, TEMPLATE_JOB_DRIFT, MIGRATION_UNSAFE); PROJECT-JOBS region is untrusted input; legacy migration copies original text slices (never re-serializes); fs confined to applyCiWorkflowMerge (temp + re-validate + atomic rename) | —| L0+L1 | —|
| `validate-surface-registry.ts` | L0+L1 | 1.1.1 | active | v1.0.0 (2026-10-01, T-20261001-018, spec docs/designs/2026-10-01-surface-registry-validator-design.md): §11.0 supported-surface registry validator (ADR-0097 follow-up) — parses the 8-row CONSTITUTION table as the single source, checks instruction files/platform dirs per family/L2 skill mirroring (mirror:false honored, SCAFFOLD_COMPOSED excluded) at L0/L1/L2, compares templates/common/docs/context.md rows verbatim (one source), renders documented gaps (docs/surface-gaps.json) as WARN with ticket id and undocumented gaps as FAIL; audit.ts gate with --strict. | —| L0+L1 | —|
| `hooks/pm-role-bootstrap.ts` | L0 | 1.1.2 | active | SessionStart hook (all sources: startup, resume, clear, compact) injecting PM bootstrap reminder to read AGENTS.md and agents/pm.md before first response — design spec docs/designs/2026-10-02-pm-role-bootstrap-design.md | —| L0+L1 | —|
| `lib/self-managed-tools.ts` | L0+L1 | 1.1.0 | active | v1.0.0 (2026-10-02, T-20261002-001, spec docs/designs/2026-10-02-self-managed-tool-surfaces-design.md): shared loader for docs/self-managed-surfaces.json — the generic self-managed tool registry. Validators consult isSelfManagedPath to skip tool-owned surfaces (graft platform mirrors + helpers transferred to tool custody); selfManagedMirrorSkills seeds verify-platform-lifecycle's VERSION_EXEMPT_PLATFORM_SKILLS. | —| L0+L1 | —|
| `dependency-audit.ts` | L0 | 1.1.0 | active | v1.0.0 (T-20261003-011, spec docs/designs/2026-10-03-dependency-audit-waiver-design.md): waiver-aware `bun audit --json` gate for the CI dependency-audit job — fails on any high/critical finding, treats empty/unparseable output as an infrastructure failure, and adds a reviewed advisory-waiver channel (`.github/dependency-waivers.toml`; strict schema: advisory GHSA id, package, version pin, scope, reason, decided_by, revisit_by). Fail-closed on malformed file, expired revisit-by date, stale waiver (advisory no longer in audit output), installed-version drift, duplicate waivers, and dev-only scope contradiction | —| L0+L1 | —|
| `normalize-registry-provenance.ts` | L0 | 1.1.0 | active | v1.1.0 (2026-10-07, co-newbiz review follow-up): explicit nonstandard-vocabulary handling — shape-valid rows whose source/layer vocabulary is a per-repo convention (co-newbiz's `co-newbiz · L3-only prose` rows, 81 at review time) are skipped AND reported instead of falling out of the parse regex silently; duplicate script keys across registry rows are reported (report-only). Motivation: the co-newbiz format review found its vocabulary truthful (zero variant-delivered scripts) and only 6 hand-deduped duplicate rows. Prior: v1.0.0 (2026-10-07, spec docs/designs/2026-10-07-registry-provenance-normalization-design.md): initial release — relabels fossil provenance stamps in inherited project scripts/SCRIPTS.md registries: L1-delivered rows untouched, variant-overlay rows whose file exists in templates/<variant>/scripts become `L2 · L2-only`, project-local rows become `L3 · L3`, rows whose file exists nowhere are reported as ghosts (--strict fails on them, no auto-edit). Idempotent; --dry and --root for reuse across the fleet; wired into upgrade-project.ts v1.66.0 as a non-fatal post-upgrade pass. Motivation: fleet inspection found 113 fossil rows across 8 projects (co-deck 60, co-safety 33, co-consult 9, co-architect 6, co-game 3, co-price 2, co-design 1, co-abap 1) — stamps inherited from the 2026-07-02 L1 sync outlived the restructure that dropped those rows from the true L0/L1 registries | —| L0+L1 | —|
| `helpers/version-bump.ts` | L0 | 1.0.0 | active | v1.0.0 (2026-10-08, user directive): pure staged-version-bump detection (`detectVersionBumps`, `diffChangesVersion`, `hasTestUnitScript`) for dev-sync step 4.85 | —| L0+L1 | —|
| `lib/package-merge.ts` | L0 | 1.0.0 | active | v1.0.0 (2026-10-09, T-20261009-002, design 2026-10-09-scaffold-package-merge-and-baseline-surfacing): scaffold package.json merge primitives — mergePackageJson (scalar variant-wins, object keys per-key, non-object overlay preserves generated), hasTier2Scripts, evaluateScaffoldPackageContract (VA-08 decision core) | —| L0+L1 | —|
| `lib/skill-graph-compat.ts` | L0 | 1.1.0 | active | v1.1.0 (2026-10-09, T-20261008-009): normalizeForHash strips the ADR-0033 stub `variant:` token alongside `scope:` — stub agent families stop re-appearing as E2 drift findings. Prior: v1.0.0 (2026-10-08, skill-graph v2 design): v1 -> v2 skill-graph compat loader (`loadSkillGraph`, `upgradeSkillGraph`), `capabilityOf` (fleet-convergence grouping key), `contentHash`/`normalizeForHash`, `dedupeEdges`, `findCapabilityDivergence` (E2). Shared by generate/verify-skill-graph, skill-graph-fleet-report, graph-delta-log, validate-templates | —| L0+L1 | —|
| `lib/skills-used.ts` | L0 | 1.0.0 | active | v1.0.0 (2026-10-08, skill-graph v2 E3): `## Skills Used` evidence parser (`parseSkillsUsed`) extracted from skill-session-review.ts; shared with generate-skill-graph.ts | —| L0+L1 | —|
| `helpers/commit-message.ts` | L0 | 1.1.1 | active | v1.1.0 (T-20261012-011): the count is always present in fallback subjects — even the zero-classifiable case carries \"(N files)\". v1.0.0 (2026-10-11, U-20261008-001, spec docs/designs/2026-10-11-backlog-batch-2-design.md): pure commit-message composition for dev-sync step 1 (`isWeakCommitMessage`, `deriveCommitMessage`, `composeCommitMessage`) — weak caller shapes replaced by a task-staged-set summary, 72-char budget, spec-id citation | —| L0+L1 | —|
| `helpers/ignored-tooling.ts` | L0+L1 | 1.0.0 | active | v1.0.0 (2026-10-11, T-20261011-014): selectIgnoredToolingArtifacts — picks machine-local tooling artifacts (extensionless executables, binary extensions) out of a git ls-files --others --ignored listing, skipping dep/cache/build trees and OS junk; consumed by upgrade-project's pre-upgrade stash inventory warning. | —| L0+L1 | —|
| `helpers/local-patch-scan.ts` | L0+L1 | 1.1.0 | active | v1.0.1 (2026-10-13, U-20261012-001): dropped @l2-propagate:false — upgrade-project imports this helper, so scaffolds must deliver it; the header made the delivery derivation skip it while the scaffold copied it (Test 26 drift) and projects failed typecheck TS2307. v1.0.0 (2026-10-02, T-20261002-015): pure LOCAL-PATCH marker scanner for the upgrade report — finds LOCAL-PATCH(upstream-request: id or pending) across text files, skipping dependency and non-text trees; consumed by upgrade-project pre-delivery. | — | L0+L1 | — |
| `helpers/substitute-placeholders.ts` | L0+L1 | 1.3.0 | active | v1.3.0: exported pure `applySubstitutions`/`substituteFiles` (strict-UTF-8 guard, explicit file list) for adopt's scoped substitution; CLI flow guarded by import.meta.main, behavior unchanged | —| L0+L1 | —|
| `lib/env-sample.ts` | L0+L1 | 1.0.0 | active | —| —| L0+L1 | —|
| `lib/managed-block-merge.ts` | L0+L1 | 1.5.0 | active | v1.4.0 (2026-09-29): hyphenated WORKSPACE-MANAGED keys matched (tier-model-mapping now reaches projects); repeated keys pair by occurrence; missing later occurrence inserted after its predecessor. Prior: v1.3.0 (spec docs/designs/2026-09-27-hermes-merge-marker-design.md): COMMON-HERMES joins MANAGED_PATTERNS (after its COMMON-CODEX twin) — the HERMES.md MERGE delivery to existing L2 projects activates (ADR-0093 shipped the file L0/L1 but the pattern gap made the MERGE pass skip it); engine untouched (pattern-generic positional path). Previous: v1.2.0 (T-20260924-010) COMMON-CODEX joins MANAGED_PATTERNS — the CODEX.md MERGE pass union-merge activates | —| L0+L1 | —|
| `lib/model-literal-patterns.ts` | L0 | 1.0.0 | active | v1.0.0 (2026-10-11, T-20261011-015): shared model-ID literal detection for skill-lifecycle-audit Check MM and sync-model-registry.ts — versioned claude-/gemini-/gpt-5.* regex set + pure findModelLiterals; registry model IDs live only in docs/workspace-schema.json (models.*) and the CLAUDE.md §6 / AGENTS.md §3.6 managed prose, never in skills | —| L0+L1 | —|
| `co-abap/vsp-audit.ts` | L2 | 1.2.0 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001) | —| L2-only | —|
| `co-abap/scratch-cleanup.ts` | L2 | 1.1.0 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001) | —| L2-only | —|
| `co-abap/install-vsp.ts` | L2 | 1.2.0 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001); v1.2.0 post-install credential guidance uses .env (chmod 600) or OS keychain — never export SAP_PASSWORD (U-20261028-015, template-side fix) | —| L2-only | —|
| `validate-abap-platform-parity.ts` | L3 | 1.1.0 | active | Variant-delivered top-level script (auto-registered at upgrade, T-20261012-001): agent-shell protected-set parity checks (deny-rules SSOT; CI-checked). | —| L3 | —|
| `co-abap/setup.ts` | L2 | 1.1.0 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001) | —| L2-only | —|
| `co-abap/install-bun.ts` | L2 | 1.0.1 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001) | —| L2-only | —|
| `co-abap/vsp-publish.ts` | L2 | 1.1.0 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001) | —| L2-only | —|
| `co-abap/vsp-task.ts` | L2 | 1.0.1 | active | Variant-delivered script (auto-registered at upgrade, T-20261012-001) | —| L2-only | —|
| `helpers/gitleaks-merge.ts` | L0+L1 | 1.1.0 | active | v1.0.0 (2026-10-13, T-20261013-010): extracted mergeGitleaksToml + extractGitleaksArray from upgrade-project — unit-testable gitleaks.toml merge that preserves project-only allowlist entries; replacer-function merge keeps `$''`-anchored entries literal. | — | L0+L1 | — |
| `helpers/registry-append.ts` | L0+L1 | 1.2.0 | active | v1.0.0 (2026-10-13, T-20261013-001): shared ## Registry-table row-append mechanics (new-project §6.6 + upgrade-project VARIANT SCRIPTS SYNC dedupe). | — | L0+L1 | — |
| `hooks/codex-user-prompt-gate.ts` | L0 | 1.0.0 | active | UserPromptSubmit (Codex CLI/Desktop App/IDE extension) identity gate enforcing the PM Gateway single-point-of-entry rule (AGENTS.md §3.1): a slash-style prompt invoking a rostered specialist (agents/*.md minus pm.md) from a session without a fresh pm-role-bootstrap marker gets `{"decision":"block"}` with a PM Gateway reason (documented Codex UserPromptSubmit block shape); prose mentions are not gated; fail-open. Wired via .codex/hooks.json (SessionStart reuses pm-role-bootstrap unchanged + UserPromptSubmit gate), mirrored to templates/common/.codex/ via the codex-hooks propagation domain; variant (L2) wiring out of scope — variants carry no .codex config layer; Codex trust-gating (hash-pinned /hooks review, skipped-until-trusted) documented in CODEX.md §1. Spec: docs/designs/2026-10-18-codex-user-prompt-gate-design.md | —| L0+L1 | —|
| `hooks/pm-dispatch-gate.ts` | L0 | 1.1.1 | active | PreToolUse (Claude `Agent`) / BeforeTool (Gemini `invoke_subagent`) identity gate enforcing the PM Gateway single-point-of-entry rule (AGENTS.md §3.1): a rostered specialist dispatch (agents/*.md minus pm.md) from a session without a fresh pm-role-bootstrap marker gets `ask` (Claude) or `deny`-with-reason (Gemini); fail-open. Delivery surface (2026-10-17; gate script itself verbatim at v1.0.0 per design §2.2): gate mirrored into templates/common/scripts/hooks/ (startup wiring) and delivered to the 13 variant platform settings via the propagation chain — sync-variant-settings.ts v1.1.0 (MANAGED_SUBSTRINGS + `.claude` PreToolUse / `.gemini` BeforeTool rows + sameFamily stale-replace), new-project/upgrade-project/adopt-project/project-to-variant post-scaffold wiring (lib/upgrade-policy.ts SYNC claim), post-scaffold check A/Sync covered by verify. Spec: docs/designs/2026-10-17-pm-dispatch-gate-design.md; audit.ts ::1793-1802 wording generalized to managed-hook drift | —| L0+L1 | —|
| `helpers/variant-context.ts` | L0+L1 | 1.0.0 | active | v1.0.0 (2026-10-26, U-20261026-002): pure variant-context placement guard — variant.json name -> docs/<variant>.context.md convention-path check with skip/pass/fail finding (fail carries the return-or-register remediation); fs injected for fixtures; consumed by audit.ts v2.55.0 placement gate. | — | L0+L1 | — |
| `lib/platform-skeleton-merge.ts` | L0 | 1.2.0 | active | v1.0.0 (spec docs/designs/2026-10-25-managed-platform-skeleton-design.md, ADR-0101): canonical-section registry (MANAGED_SKELETON_SECTIONS v1: CLAUDE §2/§3/§4.5/§5/§6, GEMINI §5) + mergeSkeletonSections() — the upgrade MERGE pass (upgrade-project mergeWorkspaceManaged) runs it strictly AFTER mergeManagedBlocks for CLAUDE.md/GEMINI.md. Missing registered sections insert at template-relative anchors (before/afterZoneContaining); drifted bodies replace only under guards G1 (no project-only heading/comment in the span — keeps co-abap's LOCAL-PATCH GEMINI §5) and G2 (≤120-line cap), with the number-collision guard logging SKELETON DRIFT for occupied numbers. Pure, import-safe, never throws; replaces push snapshots[] for the caller's fail-closed <file>.pre-skeleton.bak (T-20260917-010 pattern); byte-equal present sections are a silent no-op (idempotent). validateSkeletonRegistry() backs the validate-templates skeleton-registry arm (SK-01); section content always read from templates/common/<rel> at merge time | —| L0+L1 | —|
| `helpers/design-lint-roots.ts` | L0+L1 | 1.1.0 | active | v1.0.0 (2026-10-26, U-20261026-006): pure design-lint scan-root resolver — configured designLint.scanRoots filtered by existence; when none exist, falls back to the design-lint.ts conventional uiSourceRoots default (./playground/src, ./src) so audit.ts and the standalone lint agree on the same schema; skip verdict names both the configured roots and the conventional candidates; fs injected for fixtures; consumed by audit.ts v2.56.0 design-lint gate. | — | L0+L1 | — |
| `helpers/pre-commit-script-gate.ts` | L0 | 1.1.0 | active | v1.1.0 (2026-10-27, T-20261027-010): parseCheckAErrorsDetailed — Check A extraction from AuditResult.errors that PRESERVES the fixData payload so pre-commit check 6c keeps its actionable "→ Fix:" output while finally reading the real wire shape; parseCheckAErrors delegates to it so the two extractions cannot drift. v1.0.0 (2026-10-27, T-20261027-009): import-safe merge-aware SCRIPTS.md gate for pre-commit check 6 — gate decision (pass / proxy-fail / merge-verify), Check A error parsing from `lifecycle-sync-audit.ts --json` (AuditResult.errors, level==error), exit-code content gate with an injectable audit-runner seam so unit tests target the module (pre-commit.ts itself runs main() at import) | —| L0+L1 | —|
| `helpers/theme-token-policy.ts` | L0 | 1.0.0 | active | v1.0.0 (2026-10-27, U-20261027-005): DESIGN-R2 theme-invariance key classification — theme presets in tokens.json may override only color/shadow tokens (typography/spacing/borderRadius/target-size are theme-invariant); shared by compile-tokens.ts v1.3.0 (hard compile error) and design-lint.ts v2.3.0 (themes sub-check) so the two enforcement points cannot drift; kebab-normalized membership test | —| L0+L1 | —|
| `sync-agent-mirrors.ts` | L0 | 1.3.0 | active | v1.2.0 (2026-10-28, T-20261029-008): CHECK-mode out-of-root degrade — a standalone CI checkout has no workspace ancestor, so extends-stub discovery hard-threw inside the SSOT parse and the audit gate blocked every real-CI project PR (co-abap #227, co-safety #220); when no templates root is discoverable AND generated mirrors exist, --check returns green with an explicit WARN (parity cannot be verified out-of-root — run inside a workspace checkout or pass --templates-root), write mode keeps the hard error (deliberate write, never auto-repair); discovery extracted to the exported pure discoverTemplatesRoot({root, searched}) reused by resolveTemplatesRoot (same bounded walk, same error text). Prior: v1.1.0 (2026-10-28, canary finding on Projects/co-newbiz — design §4.2 flagged ASSUMPTION verified with a real gap): extends-stub L1 bodies are sourced via templates-root DISCOVERY — the first ancestor of the target root carrying templates/common/agents (bounded 8-level walk), with an explicit `--templates-root <workspace>/templates` override (validated against the common/agents shape before any per-file work) taking precedence; not-found is a hard error naming every searched ancestor, never a silent fallback. In-project runs previously resolved the stub source against <project>/templates, which never exists in a delivered project. Mirror OUTPUT bytes unchanged — only where the stub body is sourced from; new-project/adopt-project wiring passes the workspace templates/ explicitly. Prior: v1.0.0 v1.0.0 (2026-10-28, spec docs/designs/2026-10-28-platform-agent-mirror-design.md, DEC-20261028-06, PR-1 root scope): initial — one template-managed generator projecting the platform-neutral agents/*.md SSOT (scalar `tier:` only, NO `model:` field) into the mirror directory of every registry-marked agents-capable platform (docs/workspace-schema.json platform_surfaces; v1 = Claude Code only). Idempotent compare-then-write with atomic writes, provenance manifest (.sync-agent-mirrors-managed.json) so user-added mirrors are never removed and no/corrupt manifest removes nothing, PID-stamped advisory lock with stale-lock recovery (sync-skills T-20260912-017 pattern), extends-stubs project as self-contained resolved personas via the scaffold-time composer (helpers/resolve-pm-stub.ts composeResolvedAgentContent — import-verified pure), exported resolvePlatformModel ports the agent-model-gate v1.2.0 claude-<alias>-<ver> → <alias> rule, and the B-PGW-pattern registry↔adapter coverage guard fails loud before any per-file work. Mirrors are project-scoped: a root without variant.json is a green no-op (design §12). `--check` is the blocking parity gate consumed by the audit arm (spawn-if-exists, the validate-model-registry precedent) and dev-sync step 4.61. CLI: `--check`, `--dir <path>`. | — | L0+L1 | — |
| `helpers/changelog-duplicates.ts` | L0+L1 | 1.0.0 | active | v1.0.0 (2026-10-29, U-20261028-013 — spec docs/designs/2026-10-29-delivery-bookkeeping-engine-design.md §3.A4): CHANGELOG structural-duplicate detection (`changelogGateFindings`) for dev-sync step 3b — duplicate `### <Category>` headings within one `## [...]` release section and duplicate `[Unreleased]` sections (`^## [Unreleased]` prefix match); pure, CRLF-safe, preamble ignored; each finding names the merge action. | —| L0+L1 | —|
| `helpers/spec-header-consistency.ts` | L0+L1 | 1.0.0 | active | v1.0.0 (2026-10-29, T-20261029-002 — spec docs/designs/2026-10-29-retro-records-registration-design.md §6): pure registry-vs-design-header status parsing — extractStatusHeaderValue finds the house-style `- **Status**:` list line; parseStatusHeaderValue returns the FIRST status-vocabulary word in the value (earliest position, word-bounded, case-insensitive — "implemented (registry SSOT; retro-marked from draft ...)" parses as implemented, not draft); classifySpecHeader yields match/mismatch/unparseable verdicts; consumed by audit.ts v2.59.0 spec-check Check 6 (mismatch FAIL, header-less docs aggregated WARN); unit-pinned by tests/unit/spec-header-consistency.test.ts | —| L0+L1 | —|
| `route-audit-scan.ts` | L0 | 1.0.1 | active | v1.0.0 (2026-10-29, T-20261029-005 — spec docs/designs/2026-10-29-route-audit-scan-fleet-design.md): fleet-general write-route audit tripwire generalized from Projects/co-newbiz/scripts/co-newbiz/route-audit-scan.ts (co-newbiz PR #742, FR-SEC-07 — swept 226 write routes to 0 unaudited). Every route.ts exporting POST/PUT/PATCH/DELETE must reach an auditTokenPatterns match within its local import graph (depth-3) or carry a reason-mandatory (>= 10 chars), wildcard-rejected, stale-checked allowlist entry; no-API-surface targets are a SKIP (exit 0, design-lint skip convention). ONE config mechanism: docs/workspace-schema.json `routeAudit` block (auditTokenPatterns + optional allowlist/sharedInfra; designLint/platform_surfaces block precedent) — script constants carry the co-newbiz defaults verbatim; a present-but-malformed block is a hard error. Unit-pinned by tests/unit/route-audit-scan.test.ts. NOT wired into audit.ts/dev-sync — wiring is a deliberate follow-up once a host project adopts the routeAudit block | —| L0+L1 | —|

---

## Layer Classification Framework

> **Two layer types are in use**: `L0` (workspace root only) and `L0+L1` (workspace + template snapshot). `L0+L1+L2` is reserved but unused.

| Layer | Description | Publish | Example |
|-------|-------------|---------|---------|
| L0 | Workspace infrastructure only | No | new-project.ts, remove-project.ts, propagate-to-templates.ts |
| L0+L1 | Workspace + Template snapshot | Yes, to templates/common/ | audit.ts, hooks/pre-commit.ts |
| L0+L1+L2 | Reserved for future use | Not used (Fork Model) | N/A |

**Note**: All scripts must have L0 as their source of truth (SSOT principle). L0+L1+L2 is reserved for future architectural needs but not currently implemented due to the Fork Model (L2 variants evolve independently after scaffolding).

---

## Ownership Layers

| Layer | Location | Owner | Update Policy |
|-------|----------|-------|---------------|
| **L0 —Workspace SSOT** | `scripts/` (workspace root) | workspace maintainer | Versioned via this file |
| **L1 —Template snapshot** | `templates/common/scripts/` | publish: `bun run propagate:apply` | Explicit publish from L0 via consolidated tool |
| **L2 —Variant template** | `templates/co-*/scripts/<variant>/` | variant maintainer | Variant-specific scripts, propagated from L0 |
| **L3 —Project** | `<project>/scripts/` | project team | Independent snapshot after creation, plus L1->L3 propagation via `propagate-to-templates.ts` |

**Propagation rule**: L0 is the development SSOT. Publish L0→L1 explicitly with `bun run propagate:apply`, which is a consolidated tool that also handles L1->L3 propagation. L3 projects snapshot L1 at creation time and receive subsequent updates via propagation. No automatic back-propagation from L3.

---

## Lifecycle States

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `active` | In production use | Changes require version bump in Registry |
| `deprecated` | Scheduled for removal | `removal-date` field required; L1/L2 warned on `dev-sync` |
| `experimental` | Not guaranteed stable | Not synced to L1/L2 automatically |

**Deprecation flow:**
1. Set `status: deprecated` and `removal-date: YYYY-MM-DD` (minimum 90 days notice)
2. `bun run dev-sync` warns L1/L2 consumers on every run
3. On `removal-date`, `verify-scripts.ts --verify` **hard blocks** pre-commit

**Security advisory flow:**
1. Set `security-advisory: CVE-XXXX` (status can remain `active` or become `deprecated`)
2. `bun run dev-sync` **hard blocks** in L1/L2 until the script is updated or removed
3. Unlike deprecation, security advisories take immediate effect with no grace period

---

## Guide

### Everyday Development Scripts (Tier 2 —`bun run <script>`)

#### `audit.ts`
**Purpose**: Documentation audit gate. Checks CHANGELOG.md, workspace standards, AGENTS.md,
agent frontmatter, skill health, template lifecycle validation, and variant context guidelines
section presence (VARIANT-INJECT: guidelines [REQUIRED] marker enforcement).
**Usage**: `bun run audit`
**Runs automatically**: pre-commit hook, pre-push hook, `bun run dev-sync`

#### `dev-sync.ts`
**Purpose**: Full sync pipeline — pre-flight markdown link validation gate (`bun scripts/validate-docs-links.ts`) — session log — MEMORY.md index — CHANGELOG auto-add — audit gate — sensitive file check — branch creation — commit — push — PR.
**Usage**: `bun run dev-sync "feat: description"`
**Claude Code / Gemini**: `/sync "feat: description"`
**v1.5.0**: Added pre-flight markdown link validation gate (`bun scripts/validate-docs-links.ts`) executed before git operations to ensure all documentation links resolve.

#### `test-runner.ts`
**Purpose**: Test suite execution framework supporting `unit`, `integration`, `scenarios`, and `scripts` suites. Features parallel test execution with worker pool concurrency, worker temp directory isolation (`TEST_TEMP_DIR`), automatic fallback to sequential execution on failure, and per-suite timeouts.
**Usage**:
- `bun scripts/test-runner.ts [suite] [flags]` (default suite: `integration`)
- Via `package.json` aliases: `bun run test`, `bun run test:unit`, `bun run test:e2e`, `bun run test:full`
**CLI Flags**:
- `--parallel`: Enable parallel execution across test files (default when > 1 test file)
- `--sequential`: Force sequential test file execution
- `--concurrency <n>`: Set worker pool concurrency level (default: CPU core count up to 4)
- `--timeout <ms>`: Set per-test execution timeout in milliseconds
**v1.1.0**: Documented parallel execution capabilities, worker pool temp directory isolation (`tests/.temp/worker-<id>`), automatic sequential fallback, and CLI flags (`--parallel`, `--sequential`, `--concurrency <n>`, `--timeout <ms>`).

#### `sync-md.ts`
**Purpose**: Updates `memory/MEMORY.md` index with today's session entry.
**Usage**: Called automatically by `bun run dev-sync`. Rarely invoked directly.

#### `gen-pr-body.ts`
**Purpose**: Generates a structured template PR body from commit message + file list — template fallback for `dev-sync.ts`. (AI-mode generation via `claude -p` was removed in 1.2.0; the agent writes the PR body itself per `skills/sync/SKILL.md`.)
**Usage**: Invoked automatically. Can be called standalone: `bun run gen-pr-body "msg"`

#### `generate-scripts-readme.ts`
**Purpose**: Auto-generates scripts/README.md from SCRIPTS.md registry.
**Usage**: `bun scripts/generate-scripts-readme.ts`
**Runs automatically**: `bun run dev-sync`

#### `compile-tokens.ts`
**Purpose**: Design token compiler for `co-design`. Reads `templates/co-design/tokens.json` and generates CSS custom properties (`:root { --color-primary: ... }`) and TypeScript constant types (`tokens.ts`) for design system consistency. v1.1.0: a reserved top-level `themes` object (e.g. `dark`, `high-contrast`) compiles to `[data-theme="<name>"]` CSS blocks after `:root` plus a `themes` export in the TS output; a tokens file without `themes` compiles unchanged.
**Usage**: `bun scripts/compile-tokens.ts [--input <path>] [--out-css <path>] [--out-ts <path>] [--watch] [--check]`

#### `generate-ide-rules.ts`
**Purpose**: IDE context rules generator for `.cursorrules` and `.clauderules`. Generates IDE-specific context rules dynamically based on workspace context and agent rosters.
**Usage**: `bun scripts/generate-ide-rules.ts [--check] [--force] [--dir <path>]`

#### `render-pdf-deck.ts`
**Purpose**: Playwright paged-media presentation PDF renderer. Converts HTML presentation decks into paginated PDF files respecting `@page` print rules using Playwright headless Chromium.
**Usage**: `bun scripts/render-pdf-deck.ts [--input <file>] [--output <file>] [--check]`

#### `md-to-ooxml.ts`
**Purpose**: Markdown to Microsoft Office OOXML (`.docx` / `.xlsx` / `.pptx`) compiler script for `co-work`. Compiles Markdown source files into native Microsoft Office Open XML structures. The `.pptx` writer maps each `# ` H1 heading to a slide (heading text → title placeholder) and the content up to the next H1 to the body placeholder: list items → bullet paragraphs (indentation depth → bullet level), `##`/`###` → bold lead-in bullets, paragraphs/tables/code blocks → plain-text lines (simplified).
**Usage**: `bun scripts/md-to-ooxml.ts --input <file.md> [--output <file>] [--type docx|xlsx|pptx] [--check]`

---

### Installation

> **Bun is a workspace prerequisite.** Install it once via the [official installer](https://bun.sh/docs/installation) before using any script. `install-bun.sh/ps1` have been deleted (ADR-0036).

---

### Agent Lifecycle Scripts (Bun / TypeScript)

#### `agent-create.ts`
**Purpose**: Creates a new agent file with proper frontmatter and required sections.
**Usage**: `bun scripts/agent-create.ts <name> --role "Display Name" --group <group>`

#### `agent-delete.ts`
**Purpose**: Removes an agent file and updates AGENTS.md.
**Usage**: `bun scripts/agent-delete.ts <name> [--force]`

#### `agent-list.ts`
**Purpose**: Lists all agents with their status, group, and tier.
**Usage**: `bun scripts/agent-list.ts [--group <group>] [--verbose]`

#### `agent-verify.ts`
**Purpose**: Verifies agent/AGENTS.md synchronization (files vs. registry).
**Usage**: `bun scripts/agent-verify.ts`

#### `agent-lifecycle-audit.ts`
**Purpose**: Full agent lifecycle audit —frontmatter validation, AGENTS.md consistency,
deprecated agent references, missing fields.
**Usage**: `bun scripts/agent-lifecycle-audit.ts`
**Runs automatically**: pre-commit hook when `agents/*.md` files are staged.
**L3 policy**: scans every frontmatter-bearing document in `agents/`, including
minimal `extends` stubs such as `pm.md`.

---

### Skill Lifecycle Scripts (Bun / TypeScript)

#### `skill-lifecycle-audit.ts`
**Purpose**: Full skill lifecycle audit —owner validation, orphaned skills, deprecated
skills still being modified, dependency graph, circular dependencies, `scope` field validity.
**Usage**: `bun scripts/skill-lifecycle-audit.ts`
**Runs automatically**: pre-commit hook when `skills/**` files are staged.
**v1.2.0**: `scope` validation now accepts `workspace | common | variant | <current project's own directory name>` (was previously only the literal string `variant`, which incorrectly flagged legitimate variant-name scope values like `scope: co-consult`); `docs/_examples/skills/**` excluded from scanning (illustrative documentation, not real skills). Run once per location (workspace root + each `templates/co-*/` variant + `templates/common/`) since agent/scope resolution is relative to `cwd`.
**L3 lifecycle policy**: a detached L3 project is identified by
root `template-version.txt` plus `docs/context.md` and no `templates/`. Its skill
copies inherit L0 SSOT review evidence and lifecycle records; the audit emits `[SKIP]`
for those L0-owned checks rather than treating local upgrade commits as unreviewed skill
changes. L0 authoring contexts continue to require lifecycle records.

#### `review-baseline.ts`
**Purpose**: Runs the deterministic detached-L3 project-review baseline. It runs only
delivered checks and reports `validate-templates` and propagation drift as N/A because
they depend on the absent L0 template source tree.
**Usage**: `bun scripts/review-baseline.ts [--quiet]`
**v1.4.0**: adds `validate-platform-parity`.
**v1.3.0**: adds `validate-docs-links --all`, `check-project-meta`, and `test:unit`; each check runs with a 300 s timeout (TIMEOUT reported as FAIL).

#### `check-project-meta.ts`
**Purpose**: Deterministic project metadata checks: CHANGELOG `[Unreleased]` heading uniqueness/position, entry format (subheading + `(#PR)` for entries dated on/after 2026-10-11), and version/`last_updated` bumps for agents/skills changed since the merge-base with `origin/main` (`[SKIP]` without origin/main), plus `vsp-version-pin` (PINNED_VERSION in `scripts/co-abap/install-vsp.ts` must equal every vsp version claim in co-abap.context.md, setup-guide.md and the write-safety-gate design).
**Usage**: `bun scripts/check-project-meta.ts`
**Provenance**: L3 | L3, active.

#### `readme-lifecycle-audit.ts`
**Purpose**: Validates README.md / README_ko.md pairing in `templates/` directories.
**Usage**: `bun scripts/readme-lifecycle-audit.ts`

#### `verify-skills.ts`
**Purpose**: Cross-validates skills referenced in `docs/context.md` against actual
skill files on disk. Detects missing or orphaned skill references.
**Usage**: `bun scripts/verify-skills.ts`

#### `sync-skill-status.ts`
**Purpose**: Synchronizes skill status between SKILL.md and registry tables.
**Usage**: `bun scripts/sync-skill-status.ts`

#### `new-project.ts`
**Purpose**: Scaffolds a new project under the workspace root. Copies `templates/common/`
and an optional variant, substitutes `[Project Name]` placeholders, strips L1-B metadata
from `agents/pm.md`, flattens `docs/_common/`, and runs the post-scaffold audit.
**Usage**: `bun scripts/new-project.ts <name> <variant>`
**Breaking change from**: `bash scripts/new-project.sh` / `.\scripts\new-project.ps1` (removed 2026-06-11, ADR-0036)
**Note**: L0 script (workspace infrastructure only). Changes must be versioned in SCRIPTS.md.

#### `remove-project.ts`
**Purpose**: Safely deletes a project directory without requiring administrator privileges.
Detects running Claude Code / Antigravity processes with user confirmation before removal.
**Usage**: `bun scripts/remove-project.ts <project-name>`
**Breaking change from**: `.\scripts\remove-project.ps1` / `bash scripts/remove-project.sh` (removed 2026-06-11, ADR-0036)
**Note**: L0 script.

#### `sync-skills.ts`
**Purpose**: Distributes skills from a project's SSOT (`skills/`) to its runtime locations
(`.claude/skills/`, `.gemini/skills/`, `.agents/skills/`). Run after any change to `skills/`
to ensure Claude Code, Antigravity, and Antigravity CLI pick up the update.
**Usage**:
- `bun run sync-skills` — workspace root only (default, unchanged from prior versions)
- `bun scripts/sync-skills.ts --dir templates/co-consult` — a single project root (variant or `templates/common`)
- `bun scripts/sync-skills.ts --all-variants` — every `templates/co-*/` variant plus `templates/common/`
**v1.4.0**: added `--dir`/`--all-variants` — the workspace-root-only default was silently leaving `.agents/skills/` (Antigravity CLI) far behind `.claude/skills/`/`.gemini/skills/` in every variant (discovered during a full skill-lifecycle audit, 2026-07-19). Run `--all-variants` after any variant-level skill change.

#### `sync-template-deps.ts`
**Purpose**: Automatic dependency version sync from root package.json to templates/common/package.json + bun.lock regeneration. Root package.json is the SSOT for shared dependency versions.
**Usage**: `bun scripts/sync-template-deps.ts [--check|--apply]`
**Runs automatically**: dev-sync step 4.52 (after propagate step 4.5, before audit step 4.9)
**Sync policy**:
- Shared deps (present in both root and template): aligned to root version
- Root-only deps: NOT auto-added to template (e.g., semver, @types/js-yaml)
- Template-only deps: NOT auto-removed (manual decision required)
- engines: aligned if shared fields differ

#### `sync-skills-to-l2.ts`
**Purpose**: Synchronizes explicitly requested skills or scripts from L1 (templates/common) to L2 variants.
**Usage**: `bun scripts/sync-skills-to-l2.ts`

#### `resolve-variants.ts`
**Purpose**: L1-B Phase script that pre-resolves `extends:` skeleton references in each `templates/co-*/` variant. Writes fully-merged files in-place so that audit can validate complete content before `new-project` runs. After resolution, `new-project.ts` only needs a simple file copy — no `merge-frontmatter` step required.
**Usage**: `bun scripts/resolve-variants.ts [--force] [--variant co-develop]`
**Idempotency**: files already marked `# @resolved-from:` are skipped unless `--force` is passed.
**Note**: L0 script (workspace infrastructure only). Not copied to `templates/common/scripts/`.

#### `verify-readme-sync.ts`
**Purpose**: Validates README.md / README_ko.md hash synchronization for workspace root and templates.
Audits user-guide.md / user-guide_ko.md translated_from_hash synchronization (FAIL stage per ADR-0055 playbook after WARN soak).
**Usage**: `bun scripts/verify-readme-sync.ts [--pre-commit] [--update-hashes]`
**v1.4.0**: Promoted user-guide translated_from_hash gate from WARN to FAIL (promoted 2026-08-24 after WARN soak through PR #647 with zero warnings observed); now returns failure count and affects exit code.
**v1.3.0**: Added user-guide translated_from_hash WARN-stage audit — detects missing/stale hashes in KO guides; --update-hashes now also seeds translated_from_hash in user-guide_ko.md frontmatter.

#### `verify-memory.ts`
**Purpose**: Validates `memory/*.md` session logs for mandatory 4-section format compliance
(`## Session Summary`, `## Changes`, `## Decisions`, `## Open Issues`) and detects
orphaned files not registered in `MEMORY.md` index.
**Usage**: `bun scripts/verify-memory.ts [--verify | --report]`
**Runs automatically**: pre-commit hook when `memory/*.md` files are staged.

#### `archive-memory.ts`
**Purpose**: Archives memory markdown files older than 7 days to keep the root memory directory clean and within context limits.
**Usage**: `bun scripts/archive-memory.ts`

---

### Multi-Agent Orchestration Scripts (Bun / TypeScript)

#### `dispatch.ts`
**Purpose**: Single-agent dispatch wrapper. Spawns one agent with a given prompt and
waits for completion.
**Usage**: `bun scripts/dispatch.ts --agent <name> --prompt "task"`

#### `render-commands.ts`
**Purpose**: Single command source `config/commands/*.md` rendered to `.claude/commands/*.md`, `.codex/prompts/*.md` and `.gemini/commands/*.toml` (`$ARGUMENTS` becomes `{{args}}`). `--check` fails on drift.
**Usage**: `bun scripts/render-commands.ts [--check]`

#### `validate-platform-parity.ts`
**Purpose**: Reports `[PASS]`/`[FAIL]` for rendered commands, MCP proxy routing on every platform config, instruction-file parity sections, skills mirrors and schema model mappings.
**Usage**: `bun scripts/validate-platform-parity.ts [--root <dir>]`

#### `dispatch-parallel.ts`
**Purpose**: Parallel multi-agent dispatch. Spawns multiple agents simultaneously and
collects results when all complete.
**Usage**: `bun scripts/dispatch-parallel.ts --platform codex|gemini|claude|hermes --plan plan.json [--max-parallel 4] [--timeout 600] [--out-dir memory/dispatch/<sub>] [--kill-grace 10] [--grant-window 60] [--run-id <id>] [--wait-grant <min>] [--allow-hermes-write] [--dry-run]`
**Hardening**: children get only an allowlisted env (PATH, HOME, USER, LANG, TERM, TMPDIR + per-platform auth vars; never SAP_*) with `SAP_PROXY_MAX_CLASS=R0`; plan text is fenced as untrusted data; children are spawned detached; on timeout or dispatcher SIGINT/SIGTERM/exit the process group gets SIGTERM, then SIGKILL after `--kill-grace` seconds (Windows: `taskkill /T`, then `/T /F`); each row file records `cleanup: graceful|forced`; `--out-dir` must resolve under `<root>/memory/dispatch`; hermes rows are refused without `--allow-hermes-write` (no verified read-only mode; prompt only via argv, unverified stdin).
**Plan rows**: role, task, tier (high|medium|low), `mode` read (default) | write. Write rows require `sapScope` {packages, objects["TYPE NAME"], actions, maxClass R2|R3} (objects disjoint across rows) and may set `worktree: true` (own git worktree under memory/dispatch/<runId>/wt/, removed after the run). Write runs need a human grant: the dispatcher writes a grant request and stops; run `bun scripts/sap-approve.ts --grant <runId>`, then re-run with `--run-id <runId>` (or `--wait-grant`). Children get `SAP_DISPATCH_GRANT`/`SAP_DISPATCH_ROW` and `SAP_PROXY_MAX_CLASS`=row maxClass; the grant is revoked when the run ends. **Proxy argv**: env vars may be dropped by CLIs before reaching the MCP proxy, so each child also gets the abap proxy started as `bun <root>/scripts/sap-mcp-proxy.ts --root <canonical repo root> --dispatch-child --dispatch-mode read|write --max-class <C> [--dispatch-grant <id> --dispatch-row <row>] -- --mode hyperfocused` (the main repo root even for worktree rows). Overrides: codex `-c mcp_servers.abap.command/args`; claude generated `<row>.mcp.json` via `--mcp-config` + `--strict-mcp-config` (other MCP servers are dropped for the child); gemini generated settings file via `GEMINI_CLI_SYSTEM_SETTINGS_PATH`; hermes has no known per-invocation override (documented gap: relies on env plus the proxy's `--dispatch-child` fail-closed default). **Grant expiry** = `--grant-window` minutes for the human to sign (default 60) + run timeout + kill grace, capped below 12h. All hermes rows (read and write) are refused without `--allow-hermes-write`. Results: `memory/dispatch/<runId>/<row>.md` + `summary.json`. Read-only flags by default (codex `-s read-only`, gemini `--approval-mode plan`, claude `--permission-mode plan`; hermes has no verified read-only flag). `antigravity-cli` errors: adapter pending verification.

#### `dispatch-serial.ts`
**Purpose**: Serial multi-agent dispatch. Chains agents sequentially, passing each
agent's output as input to the next.
**Usage**: `bun scripts/dispatch-serial.ts --agents agent1,agent2 --prompt "task"`

#### `retry-handler.ts`
**Purpose**: Wraps any dispatch call with retry logic (configurable attempts, backoff).
**Usage**: `import { withRetry } from './retry-handler.ts'` (library module)

---

### Platform Parity Scripts (Bun / TypeScript)

#### `test-platform-parity.ts`
**Purpose**: Validates platform parity between L0 workspace files and their L1/L2 counterparts per ADR-0033.
Compares CLAUDE.md, GEMINI.md, and agents/pm.md across workspace root, templates/common/, and all L2 variants.
**Usage**: `bun scripts/test-platform-parity.ts [--verbose]`
**Runs automatically**: As part of audit.ts (non-lifecycle-only mode)
**Exit codes**: 0 (pass), 1 (errors), 2 (warnings)
**See also**: `docs/platform-parity-rules.md` for detailed parity rules

#### `validate-pm-extends.ts`
**Purpose**: Validates pm.md extends chains for correctness and compliance per ADR-0033.
Checks 6 validation rules: syntax, circular references, depth limits, file existence, override validity, and platform parity.
**Usage**: `bun scripts/validate-pm-extends.ts [options] [files...]`
**Options**:
  - `--fix` - Auto-fix simple issues (optional)
  - `--verbose` - Detailed output
  - `--json` - JSON output format
  - `--max-depth N` - Set custom max depth (default: 3)
**Exit codes**: 0 (all valid), 1 (errors found)
**Examples**:
  - `bun scripts/validate-pm-extends.ts` (validate all pm.md files)
  - `bun scripts/validate-pm-extends.ts agents/pm.md` (validate specific file)
  - `bun scripts/validate-pm-extends.ts --json` (CI/CD friendly output)

---

### Propagation Scripts (Bun / TypeScript)

#### `propagate-to-templates.ts`
**Purpose**: Publishes L0 workspace scripts and governance docs to L1 (`templates/common/`) and propagates L1 changes to L2 variant templates. This is the consolidated propagation tool invoked via `bun run propagate:apply`.
**Usage**: `bun scripts/propagate-to-templates.ts [flags]`
**Layer**: L0 (workspace infrastructure only — not copied to templates/common/, templates/co-*/, or L3 projects)
**Aliases**: `bun run propagate:apply` (--apply), `bun run propagate:dry-run` (--dry-run)

**Flag → Layer/Phase Mapping**:

| Flag | Layer Operation | Phase Context |
|------|----------------|---------------|
| `--apply` | L0 → L1(common) sync | Phase A: install scripts into common template |
| `--dry-run` | Print planned output (agent/skill counts, files would-write) without writing |
| `--governance-l1` | L0 governance → L1(common) | Phase A: deploy CLAUDE.md/GEMINI.md/AGENTS.md to L1 |
| `--docs` | L1(common) → L1(variants) COMMON marker injection | Phase B: prepare variant-specific governance docs |
| `--prune` | L1(common) cleanup | Maintenance: remove L0-only orphan files from L1 |
| `--check-drift` | L1 vs L2 drift report | Any phase: verify L2 variants not diverged from L1 |
| `--include-disabled` | Opt-in override | Include domains marked `disabled: true` (e.g. `docs`) in the dry-run report only — combining with `--apply` is a hard error (exit 1), not a silent write |

**Typical workflow**:
```bash
bun scripts/propagate-to-templates.ts --dry-run          # preview L0→L1 changes
bun scripts/propagate-to-templates.ts --apply            # publish scripts L0→L1
bun scripts/propagate-to-templates.ts --governance-l1    # publish governance docs L0→L1
bun scripts/propagate-to-templates.ts --docs             # inject COMMON markers into variants (Phase B)
bun scripts/propagate-to-templates.ts --prune            # remove orphan files from L1
bun scripts/propagate-to-templates.ts --check-drift      # report L1 vs L2 drift
bun scripts/propagate-to-templates.ts --domain docs --include-disabled --dry-run  # inspect a disabled domain
```

**Disabled domains**: a domain entry may carry `"disabled": true` in `propagation-map.json` to declare it *intentionally* inactive (as opposed to silently never having worked — see the `docs` domain's `note` field for the concrete incident this guards against). Default runs skip it and print why; `--include-disabled` is a read/inspect escape hatch, not a way to reactivate it — flip the flag in `propagation-map.json` itself once the underlying policy question is resolved.

### L3 Variant Tooling (Bun / TypeScript)

#### `generate-l3-readme.ts`
**Purpose**: Regenerates `README.md`/`README_ko.md` for a Phase A L3 project (`Projects/<name>/`) from the workspace README Standard template (`templates/common/docs/README.template.md`), reading the live agent roster and skills via `scanL3Project()`. This is the Phase A self-service complement to `l3-to-variant-pipeline.ts`'s Phase B README generation — both call the same rendering engine (`helpers/generate-variant.ts`'s `generateReadme`/`generateReadmeKo`), so Phase A and Phase B READMEs can never drift structurally. Phase A is self-service only (no CI gate, consistent with the L3 Design Gate exemption); Phase B's `templates/co-*/` README standard stays hard-enforced by `WS-08` in `validate-templates.ts`. `create-l3-scaffold.ts` also calls this renderer directly at scaffold time, so even a same-day scaffold ships the real 7-section structure instead of a stub.
**Usage**: `bun scripts/generate-l3-readme.ts [--l3-path <path>] [--dry-run] [--locale en|ko|both]`
**Layer**: L0 (workspace infrastructure — not copied to templates/common/ or L3 projects)

**Flags**:

| Flag | Behavior |
|------|----------|
| `--l3-path <path>` | Target L3 project (defaults to `process.cwd()` — works bare from inside the project) |
| `--dry-run` | Print planned output (agent/skill counts, files would-write) without writing |
| `--locale en\|ko\|both` | Which README(s) to regenerate (default: `both`) |

**Typical workflow**:
```bash
bun scripts/generate-l3-readme.ts --l3-path Projects/co-journalist --dry-run  # preview
bun scripts/generate-l3-readme.ts --l3-path Projects/co-journalist            # write both
cd Projects/co-journalist && bun scripts/generate-l3-readme.ts                # bare form (cwd)
```

#### `harness-metrics.ts`
**Purpose**: Read-only harness KPI report (first-pass success, defect escape proxy, traceability, human intervention proxy, cost n/a, unsafe action rate) from `memory/audit/sap-actions-*.jsonl`, `memory/audit/sap-evidence.json` and git history; missing inputs report "no data". Reference-only counters are labelled non-KPI. Design: `docs/designs/2026-10-10-sap-write-safety-gate-design.md` section 8.
**Usage**: `bun scripts/harness-metrics.ts [--json] [--root <dir>] [--month YYYY-MM] [--minutes-per-event N] [--out <path>]` (alias: `bun run metrics`)
**Layer**: L3

---

## Version Bump Policy

When modifying a script:
1. Increment `version` in the Registry row (semver: patch for bugfix, minor for feature)
2. Update the Guide section if the interface or behavior changes
3. If the change is breaking, set `status: deprecated` on the old version entry and
   add a new row for the replacement

---

*SCRIPTS.md maintained by: workspace maintainer (L0 SSOT)*
*Last updated: 2026-08-24 — Version bump for md-to-ooxml v1.2.0 (PR15: .pptx presentation writer per backlog §8 co-work row 4 — new `compileToPresentationML()` completes the Office trio by emitting the full OOXML presentation package in the same single-file form as the docx/xlsx writers (Flat OPC `pkg:package` embedding `[Content_Types].xml`, `_rels/.rels`, `ppt/presentation.xml` + rels, slideMaster1 + rels, slideLayout1 + rels, theme1, and per-slide `slideN.xml` + rels); markdown mapping: each `# ` H1 starts a slide (heading text → title placeholder), list items → bullets (indent depth → `lvl`), `##`/`###` → bold lead-ins, paragraphs/tables/code blocks → plain-text body lines; `--type pptx`, `.pptx` extension inference, `--check` parity, plus unsupported-type guard; new `tests/md-to-ooxml-pptx.test.ts`); previous: 2026-08-24 — Version bump for verify-readme-sync v1.4.0 (PR10: user-guide translated_from_hash gate promoted WARN → FAIL per ADR-0055 playbook after soak — runUserGuideHashAudit() returns the failure count and increments totalErrors; missing/stale hashes now exit 1; soak evidence: zero warnings from PR #646 seeding through #647; tests assert FAIL behavior); previous: 2026-08-24 — Version bump for verify-readme-sync v1.3.0 (PR8: user-guide translated_from_hash WARN-stage audit per ADR-0055 playbook — detects missing/stale hashes in KO guides; --update-hashes now also seeds translated_from_hash in user-guide_ko.md frontmatter; preserves CRLF/LF line endings and UTF-8-no-BOM; WARN does not affect exit code); previous: 2026-08-24 — Version bumps for validate-templates v1.13.0 (country-profile lifecycle enforcement per docs/country-profiles.md "Profile Freshness & Ownership": profile frontmatter `status` must be one of active/draft/stale — hard FAIL on anything else; auto-stale WARN when an `active` profile's `last_verified` passes the 12-month line, recommending `status: stale`; new cross-variant Check B-05 WARN when the same `<CC>.md` carries divergent `last_verified` dates across variants; renumbered the duplicate per-variant skill-lifecycle check ID B-05 → B-09), validate-md-language v1.6.1 (L0+L1: removed the hardcoded 15-locale fallback — the locale list now comes solely from docs/workspace-schema.json `i18n.locale_codes`, degrading to ko-only with a warning when the schema is absent), and create-l3-scaffold v1.12.1 (writes `.claude/template-version.txt` at scaffold time — variant/version/platform/country/created, mirroring new-project.ts §5.6 — so L3 drafts carry country provenance from day one); previous: 2026-08-24 — Version bumps for upgrade-project v1.10.1 (country-profile awareness on the upgrade path: registry-driven prune of country-scoped skills after all skill-copy passes with an isLocallyModified conflict guard for legacy forks + dry-run parity; preserves `country=` in .claude/template-version.txt instead of erasing it) and l3-to-variant-pipeline v1.12.1 (new Phase 2.5: country-scoped skill exclusion — drops country_scoped_assets.skills entries from keepInVariant and the variant.json skill manifest so a --country KR draft cannot fork k-* skills into templates/<variant>/skills/); previous: 2026-08-23 — Version bump for validate-templates v1.10.0 (new Checks WS-11: bilingual user-guide pair per variant — hard FAIL, not common-satisfiable; WS-12: variant index coverage across the 6 README index files — EN/KO FAIL, es/ja WARN); previous: 2026-08-15 — Renamed the 4 scripts whose `l2`-prefixed names/flags predated the L3 layer terminology: `create-l2-scaffold.ts`→`create-l3-scaffold.ts` (v1.9.2), `generate-l2-readme.ts`→`generate-l3-readme.ts` (v1.0.3, `--l2-path`→`--l3-path`), `l2-to-variant-pipeline.ts`→`l3-to-variant-pipeline.ts` (v1.10.5, `executeL2ToVariantPipeline()`→`executeL3ToVariantPipeline()`, `PipelineConfig.l2ProjectPath`→`l3ProjectPath`), `test-l2-promotion.ts`→`test-l3-to-variant-promotion.ts` (v1.0.2); also renamed the `simulate-l2-promotion` skill to `simulate-l3-to-variant-promotion`. Historical ADRs, dated design docs, and memory archives were left unchanged (they document what was true at the time); previous: Version bumps for generate-l2-readme (new v1.0.0: self-service Phase A README regeneration sharing the generate-variant.ts renderer), create-l2-scaffold v1.9.0 (render README.md/README_ko.md from the standard template instead of hardcoded heredocs; _ORIGIN.md checklist + printSummary now point at generate-l2-readme.ts), generate-variant v1.10.0 (export generateReadme/generateReadmeKo/buildReadmeSubstitutions; relocate extractAgentRoster/extractSkills/normalizeRelPath here from l2-to-variant-pipeline.ts), l2-to-variant-pipeline v1.10.2 (import the three relocated functions from generate-variant.ts instead of defining them locally); previous: Version bumps for validate-templates v1.5.17 (new Check WS-08: README standard conformance, policy-driven WARN via variantValidationPolicy.warningOnly), generate-variant v1.9.0 (render README.md/README_ko.md from templates/common/docs/README.template.md via applyTemplate; readmeNarrative? override; deleted Generated/MVP footer), template-utils v1.1.0 (extracted generic applyTemplate(); applyContextTemplate delegates to it), readme-lifecycle-audit v1.0.3 (ownership comment: WS-08 is sole templates/ README standard enforcer); previous: Version bumps for validate-templates v1.5.16 (new Check WS-07: variants must not carry local docs/context.md), generate-variant v1.8.1 (fix Windows path-separator so SKIP_IN_COPY actually excludes docs/context.md during promotion), new-project v1.5.3 (defense-in-depth: variant overlay skips docs/context.md); previous: Version bump for l2-to-variant-pipeline v1.10.1 (Issue Set A fixes: consolidated SKIP_AGENT_FILES, fixed missingOptionalSections JSON field, removed process.exit(1) from executeL2ToVariantPipeline, registry-driven canonicalExtensionSource for lecture type, deleted dead VariantPlugin.goldenReference()); previous: Version bumps for l2-to-variant-pipeline v1.10.0, generate-variant v1.8.0, pm-md-parser v1.1.0, create-l2-scaffold v1.8.0, reconcile-with-l0-l1 v1.2.2, golden-reference-loader v1.1.0, capability-registry v1.0.2, consulting-plugin v1.1.0, agent-verify v1.0.2 (feature + bugfix changes: scan L1-match classification, lean variant templates, ADR-0048 pm.md).*
