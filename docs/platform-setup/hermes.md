# Hermes Agent Onboarding

Set up NousResearch Hermes Agent to run this workspace with the same SAP safety enforcement as every other platform. Behavior rules live in [`HERMES.md`](../../HERMES.md); this page covers installation and wiring only.

## 1. Install

1. Install Hermes Agent per its upstream instructions and confirm `hermes --version` works.
2. Install Bun (`bun --version`); the SAP MCP proxy and all harness scripts run on Bun.
3. Clone this repository and run `bun install`.
4. Create `<repo>/.env` with `SAP_URL`, `SAP_USER`, `SAP_PASSWORD`, `SAP_CLIENT` (never commit it) and place the `vsp` binary at `<repo>/vsp` (`vsp.exe` on Windows).

## 2. Trust the project for skills

Project-local skills in `.hermes/skills/` load only when the project root is trusted. In `~/.hermes/cli-config.yaml` add the absolute repository path:

```yaml
skills:
  trusted_project_dirs:
    - /abs/path/to/co-abap
```

Do not bypass this gate; it is Hermes' prompt-injection defense.

## 3. Register the SAP MCP server (via the proxy)

Hermes reads MCP servers only from the user-level `~/.hermes/config.yaml` (key `mcp_servers.<name>`: `command`, `args`, `env`, `timeout`, `tools.include/exclude`) and has no `cwd` option, so the proxy path must be absolute.

1. Copy the `mcp_servers.abap` block from [`config/platforms/hermes-mcp.example.yaml`](../../config/platforms/hermes-mcp.example.yaml) into `~/.hermes/config.yaml`.
2. Replace `<ABS_PATH_TO_REPO>` with the absolute path of your clone.
3. Leave `env` empty. The proxy finds the repo root from its own location, reads `<repo>/.env`, applies safe `SAP_*` defaults and enforces the policy in `config/sap-action-policy.json`.
4. Never register `./vsp` directly: that bypasses the policy gate, approvals and audit.

## 4. Shell-hooks consent

If Hermes asks to consent to project shell hooks (for example `bun scripts/...` helpers), review the command and approve it once per project. SAP enforcement does not depend on hooks: it lives in the proxy and applies even if hooks are declined.

## 5. Approvals

An R3 action (for example `ReleaseTransport`) returns `APPROVAL_REQUIRED`. A human, not the agent, runs `bun scripts/sap-approve.ts` in a separate terminal (approvals expire after 15 minutes and are single use), then the agent retries. Hermes has no deny-rule equivalent for the approve command, so do not grant the agent permission to run `sap-approve.ts`.

## 6. Verify

1. `hermes mcp list` (or the equivalent in your version) shows `abap` connected.
2. Read call: ask the agent to read a class source; it succeeds.
3. Write outside `Z*`/`$TMP`: denied with the policy message.
4. Transport release: returns `APPROVAL_REQUIRED`; after `sap-approve.ts` and a retry it succeeds once.
5. `memory/audit/sap-actions-YYYY-MM.jsonl` contains a line per call.
6. Manual proxy check from any directory (dummy SAP env is enough to reach vsp):
   `printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}\n' | bun /abs/path/to/co-abap/scripts/sap-mcp-proxy.ts -- --mode hyperfocused`
