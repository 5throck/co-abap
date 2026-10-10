# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| >= 2.38 | ✅       |
| < 2.38  | ❌       |

> Versions refer to the `vsp` MCP server binary. The harness configuration (agents, skills, scripts) is version-controlled via git.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **do not open a public GitHub issue**.

Instead, please report it privately via one of the following channels:
- **GitHub Security Advisory**: [Report a vulnerability](../../security/advisories/new) *(preferred)*
- **Email**: Contact [@5throck](https://github.com/5throck) directly via GitHub

### What to include
- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any suggested fixes or mitigations

### Response timeline
- **Acknowledgement**: within 48 hours
- **Initial assessment**: within 7 days
- **Patch release**: within 30 days for critical issues

We appreciate responsible disclosure and will credit reporters (unless anonymity is requested).

---

## Threat Model — MCP-Driven SAP Access

This harness gives AI agents live access to a real SAP system through the `vsp` MCP server.
Unlike a typical coding assistant, a mistaken or manipulated tool call here can mutate business
data, release code to production-bound systems, or expose credentials. This section documents
the threat model and the controls already in place.

### Control Tiers

Controls are listed from the strongest (enforced outside the AI agent) to the weakest. Only
Tiers 1-3 are controls. Documentation, prompt rules, and skills are **guidance, not controls**:
an agent can ignore them, and a prompt can be manipulated into ignoring them.

| Tier | Control | Enforced by | What it does |
|------|---------|-------------|--------------|
| 1 | SAP server authorizations | SAP kernel (authorization objects) | A dedicated, least-privilege AI dev user. `S_DEVELOP` restricted by `DEVCLASS` and `ACTVT`; `S_TRANSPRT` without release (`ACTVT 43`); `S_TABU_DIS` display only. No `SAP_ALL` or `SAP_NEW` outside local trial systems. Design: [SAP Write Safety Gate](docs/designs/2026-10-10-sap-write-safety-gate-design.md) section 6 |
| 2 | vsp allowlist and feature flags | vsp MCP server process | `SAP_ALLOWED_PACKAGES` restricts write scope to packages; `SAP_FEATURE_*` hides whole tool categories (see [Package & Feature Whitelist Policy](#package--feature-whitelist-policy)) |
| 3 | SAP MCP proxy | `scripts/sap-mcp-proxy.ts`, the launch command of the `abap` MCP server on every platform (`.mcp.json`, `.codex/config.toml`, `.gemini/settings.json`, `.agents/mcp.json`, Hermes `~/.hermes/config.yaml`) | Classifies every `abap` tool call and allows, asks, or denies it before it reaches vsp. Records each action and its evidence. Transport release requires passed QA evidence and a human approval |

#### Tier 3 — SAP MCP proxy in detail

The proxy reuses the policy in `scripts/sap-action-lib.ts`, so the decision for a call is the same on every client. Claude Code SAP hooks are no longer registered; any client-side hook is optional UX, not a control.

- **Tool risk classes** (defined in the design doc, section 2):
  - **R0** read or metadata: allowed.
  - **R1** QA or read-only execution (`SyntaxCheck`, `RunUnitTests`, `GetCodeCoverage`, `RunATCCheck`, `TraceExecution`): allowed, and the result is recorded as evidence.
  - **R2** source write or activate (`WriteSource`, `EditSource`, `Activate`, `CreateTransport`, `AddToTransport`): asks for confirmation. The target package must match the allowlist, or the call is denied. The object is marked `pending` until the QA chain passes.
  - **R3** data change, release, or privileged action (`ReleaseTransport`, `RunReport`, `RunOptions`, `InstallZADTVSP`, `InstallAbapGit`, any delete or data-modifying tool): denied by default. Allowed only with a human approval.
  - **Unknown** `abap` tools: asked, with the reason "unclassified tool".
  - **Hyperfocused mode** (`SAP` tool, vsp v2.60.0): the proxy classifies `action` plus `params.type`/`op` (for example `query` with non-SELECT SQL, `rfc` `call`, `delete`, `debug`, and `system` `release_transport` are denied unless approved; `edit`/`create` ask). Unknown actions or sub-types ask. Map: design doc section 2.0.
- **Approval mechanism**: an `ask` call, or an R3 call without approval, is not sent to SAP; the proxy answers `APPROVAL_REQUIRED id=<id>`. The human runs `bun scripts/sap-approve.ts <id>` (or `--deny`) in their own terminal. The approval is single use, bound to the hash of the exact tool input, and expires after a short TTL; the proxy consumes it on the identical retry. Agents must never run `sap-approve.ts` or create approval files; the Claude settings deny writes to `memory/audit/approvals/**`.
- **Known limitation (pending security review, design Phase 3)**: Codex, Gemini CLI, and Hermes do not have an equivalent per-path write deny for `memory/audit/approvals/**` or a block on running `sap-approve.ts` from the agent shell. On those platforms the rule that only a human approves, from their own terminal, is procedural until the Phase 3 review lands a stronger binding.
- **Evidence-gated transport release**: `ReleaseTransport` is denied unless every object in the transport has passed evidence (`SyntaxCheck`, `RunUnitTests`, `GetCodeCoverage`, `RunATCCheck`, each run after the last write).
- **Failure behavior**: if the proxy cannot read its policy or hits an internal error, it asks instead of allowing.

#### Manual profile (retired)

The former `HARNESS_PROFILE=manual` profile is retired. Every platform reaches SAP only through the proxy, so there is no hook-less SAP path and no separate release rule per client.

#### Audit log

- Location: `memory/audit/sap-actions-YYYY-MM.jsonl` (one JSON object per line, append-only) and the evidence store `memory/audit/sap-evidence.json`. Both stay local (`memory/audit/` is git-ignored) unless the user opts in.
- Content: hashes only. Each record holds a timestamp, session, actor, tool, risk class, decision, object, package, transport, a SHA-256 hash of the tool input, and before and after source hashes. Source text, SQL result rows, passwords, tokens, and connection strings are never logged.

#### Outside the MCP gate

The SAP MCP proxy covers `abap` MCP calls only. The paths below run outside it and
need their own rules. Where a Bash-level gate is installed (`scripts/hooks/gui-script-gate.ts`, wired in
`.claude/settings.json`), it enforces the GUI rule in item 1. Where it is not installed, that rule is
procedural: the agent must follow it, and nothing in the harness blocks a violation. As of this
revision, `scripts/hooks/gui-script-gate.ts` does not exist, so item 1 is procedural.

1. **SAP GUI scripting and BDC** (the `gui-scripter` agent, and any BDC or recorded-session script):
   - These run outside the SAP MCP proxy.
   - Any script that writes data or changes a transaction requires a recorded human approval before it
     runs. Use the same single-use approval mechanism as R3 (see [Approval mechanism](#tier-3--sap-mcp-proxy-in-detail)).
     Agents must not create approval files under `memory/audit/approvals/`.
   - Read-only scripts (navigation, display, and export without saving) are allowed without approval.
   - Every run, read-only or not, is logged to `memory/audit/` with the script name, target system, and
     decision. Script text and result data are not logged, per the audit log content rule.
2. **Form layouts** (SAPscript, Smart Forms, Adobe Forms): humans change these in SAP GUI. The harness
   does not change form layouts, and no agent may script a layout change.
3. **Enabling UI5, RAP, TRANSPORT, or ABAPGIT features** (`SAP_FEATURE_UI5`, `SAP_FEATURE_RAP`,
   `SAP_FEATURE_TRANSPORT`, `SAP_FEATURE_ABAPGIT`): turning one on is a deliberate configuration change
   that requires PM approval. The deploy and publish tools these features unlock are R3 (denied by
   default, human approval per run). Tool mapping: see the
   [vsp Tool Reference](docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).

#### Guidance that is not enforced

The approval rules in the sections below (for example, "wait for explicit user confirmation") are
written as agent guidance. The Tier 3 proxy enforces the matching
classes for `abap` MCP calls. For paths outside the proxy (see above), the rules rely on
the agent following them and on the Tier 1 and Tier 2 controls to limit the damage.

### Assets at Risk

| Asset | Exposure |
|-------|----------|
| SAP system state (tables, master/transactional data) | `RunQuery`, `WriteSource`/`EditSource` on data-handling objects |
| ABAP source code in `Z*` / `$TMP` packages | `WriteSource`, `EditSource`, `Activate` |
| Transport Requests (CTS) | `CreateTransport`, `AddToTransport`, `ReleaseTransport` |
| SAP credentials (`.env`) | Local filesystem; never sent to git (see Secrets Handling below) |
| Package/feature scope | `SAP_ALLOWED_PACKAGES`, `SAP_FEATURE_*` env vars in `.mcp.json` |

### Destructive-Operation Approval Gates

The following operations are **irreversible or high-blast-radius** and require an explicit human
go-ahead in the conversation before an agent executes them — an agent must not chain them
automatically as part of a larger task without pausing for confirmation:

| Operation | Tool(s) | Why it needs a human gate |
|-----------|---------|----------------------------|
| Transport release to a downstream system | `ReleaseTransport` | Irreversible; affects QAS/PRD-bound code |
| Activation of an object with failing QA gates | `Activate` (bypassing [Post-Write Mandatory Chain](skills/post-write-chain/SKILL.md)) | Can ship broken/untested logic |
| Table structure changes on non-`$TMP`/`Z*` objects | `WriteSource`/`EditSource` outside `SAP_ALLOWED_PACKAGES` | Out of scope by design — should be blocked by package whitelist, not just convention |
| Bulk data-mutating `RunQuery` (UPDATE/DELETE-style reports) | `RunQuery`, `RunReport` | No built-in dry-run; verify scope before executing |
| Installing SAP-side infrastructure (`ZADT_VSP`, abapGit) | `InstallZADTVSP`, `InstallAbapGit` | Changes the target system's installed components |

**Rule (guidance, Tier 0)**: If a task requires any of the above, the agent must state the intended action and its
consequences, then wait for explicit user confirmation — the same standing rule that applies to
destructive local git operations (`git push --force`, `git reset --hard`) applies here, scaled to
a live SAP system. This rule is guidance. The enforced versions are the Tier 1 SAP authorizations
and the Tier 3 proxy classes (R2 ask, R3 deny-by-default, evidence-gated release) described in
[Control Tiers](#control-tiers).

### Package & Feature Whitelist Policy

`SAP_ALLOWED_PACKAGES` in `.mcp.json` (currently `Z*,$TMP,$ZADT_VSP,$VSP_ADT`) is the primary
technical control limiting write scope — it restricts `WriteSource`/`EditSource`/`Activate` to
custom namespaces, so agents cannot modify SAP standard objects even if instructed to. Do not
widen this whitelist without a documented reason recorded in `docs/co-abap.context.md`.

`SAP_FEATURE_*` flags (`ABAPGIT`, `TRANSPORT`, `UI5`, `RAP`) gate entire tool categories.
The tracked `.mcp.json` safe-default profile sets all four flags to `off`. To enable an
approved capability locally, copy `.mcp.json.sample` to the ignored `.mcp.local.json`,
change only the required feature flag to `on`, and configure the local MCP client to use
that override. This follows least privilege: an agent cannot call a tool category the
server does not expose, regardless of what the conversation asks for.

### Secrets Handling

- SAP credentials live only in `.env` in the project root (gitignored, `chmod 600`) or in the OS
  keychain. Never store `SAP_PASSWORD` in shell profiles, Windows user environment variables, or
  any tracked config file. `.env.sample` documents required keys with placeholder values — never
  realistic-looking examples.
- `.mcp.json` is tracked in git as a config template and must **never** contain credentials —
  enforced by the pre-commit hook's secret scan (gitleaks + regex fallback) and by CI's
  dedicated secret-scan job.
- Tracked `memory/` content is scanned by gitleaks. The gitleaks configuration must not
  broadly exclude it.
- CI uses Bun `1.4.x` and a digest-pinned gitleaks container image for reproducible
  secret scanning.
- `scripts/dev-sync.ts` scans both untracked and **staged** files/diffs for sensitive filenames
  and inline credential patterns before every commit.
- Session artifacts that may echo live SAP data — `scratch/stable/`, `scratch/qa-reports/`,
  `memory/*.md` — are git-tracked by design (for audit history) but must never contain real
  credentials, hostnames tied to production systems, or PII. Reviewers should treat these
  directories as in-scope for the same secret-scan coverage as source code.

### RFC Call Governance

`CallRFC` invokes arbitrary remote-enabled function modules — broader than the harness's own
BAPI-based workflows. Restrict RFC calls to read-only or well-documented BAPIs listed in the
`skills/sap-*/SKILL.md` files; calling an unlisted or write-capable RFC requires the same
destructive-operation approval gate described above.
