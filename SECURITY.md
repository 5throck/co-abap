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

**Rule**: If a task requires any of the above, the agent must state the intended action and its
consequences, then wait for explicit user confirmation — the same standing rule that applies to
destructive local git operations (`git push --force`, `git reset --hard`) applies here, scaled to
a live SAP system.

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

- SAP credentials live only in `.env` (gitignored); `.env.sample` documents required keys with
  placeholder values — never realistic-looking examples.
- `.mcp.json` is tracked in git as a config template and must **never** contain credentials —
  enforced by the pre-commit hook's secret scan (gitleaks + regex fallback) and by CI's
  dedicated secret-scan job.
- Tracked `memory/` content is scanned by gitleaks. The gitleaks configuration must not
  broadly exclude it.
- CI uses Bun `1.4.2` and a digest-pinned gitleaks container image for reproducible
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
