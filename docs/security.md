# security.md

Security policy and data sanitization rules for this project.

> For dev context, architecture, and agent instructions, see [context.md](context.md).

---

## Committed Files — Never Include

Never commit `.env`, `cookies.txt`, `.mcp.local.json`, or other local agent/MCP
configuration files. The tracked `.mcp.json` file is the reviewed safe-default MCP
profile and must contain no credentials. `.mcp.local.json` is the ignored local
override for deliberate feature opt-in.

---

## Sanitize Policy for Tracked Docs, Tests, and Examples

The public repo must not contain concrete identifiers that tie code or docs to a live production system, a real user, or private infrastructure. 

**Never in tracked files:**
- Real usernames -use TESTUSER, dmin
- Real hostnames or IPs -use dev.example.local, 127.0.0.1, prod.example.com
- Real passwords, API keys, bearer tokens, or secrets
- Proprietary customer names or internal namespaces

**Operational scratch goes under gitignored paths (like `scratch/`)** — session notes,
live database dumps, repros with real identifiers, and debugging transcripts. If you
need to reference it from a tracked document, redact it first.

---

## Pre-Commit Scan

Before every commit, always review staged files to ensure no sensitive data is leaking.
The workspace .githooks/pre-commit hook automatically scans for .env files and runs gitleaks if installed.

Rule of thumb: "would a stranger reading this file be able to identify our private servers, customer identities, or bypass our authentication?" If yes, redact and move under gitignored paths.

## Shipped Secret-Scanning and MCP Defaults

- Tracked `memory/` files are in gitleaks scope. Do not place credentials, production
  identifiers, or personal data in memory logs.
- CI installs Bun `1.4.2` and runs gitleaks from a digest-pinned container image.
- `SAP_FEATURE_ABAPGIT`, `SAP_FEATURE_TRANSPORT`, `SAP_FEATURE_UI5`, and
  `SAP_FEATURE_RAP` are off in the tracked MCP profile. Create the ignored
  `.mcp.local.json` from `.mcp.json.sample` only when an approved local capability
  requires opt-in.
