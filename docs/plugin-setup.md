# Claude Code Plugin Setup Guide

This guide describes how to install and use the **ABAP Vibe Coding Plugin** in a consumer repository. 

> [!NOTE]
> This plugin extends Claude Code CLI with dedicated SAP ABAP workflows, automated triage, post-write quality gates, and dev-sync audit and commit automation.

---

## 1. Prerequisites

- **Claude Code CLI** installed (`npm install -g @anthropic-ai/claude-code`)
- **vsp (MCP Server)** binary placed at `C:\Users\<your-username>\abap\vsp.exe` (Windows) or `~/abap/vsp` (macOS/Linux)
- **SAP Connection Details** configured in a `.env` file at the root of your consumer repository (see `.env.sample` in the plugin root)

---

## 2. Install and Register the Plugin

Depending on whether you are actively developing and testing the harness plugin or setting it up permanently in a consumer repository, choose one of the following installation methods:

### Method A. Local Development and Testing (Ad-hoc)
If you want to test the plugin locally without copying files under your user home profile, invoke Claude Code directly pointing to the cloned plugin directory:
```bash
# Windows / macOS / Linux
claude --plugin-dir /path/to/abap-harness-engineering
```

### Method B. Permanent Consumer Repository Installation (Recommended)
Copy the plugin repository folder directly into your user home's plugin folder to make it globally discoverable by Claude Code:
- **Windows**: Copy the folder to `%USERPROFILE%\.claude\plugins\co-abap`
- **macOS/Linux**: Copy the folder to `~/.claude/plugins/co-abap`

*(Note: Once published, this can also be installed directly from the Claude Code Extension Marketplace)*

### 2-B. Configure permissions in `.claude/settings.json`
Create a `.claude/settings.json` file in the root of your consumer repository to approve the tools and set up automated hooks:

```json
{
  "permissions": {
    "allow": [
      "mcp__abap__SAP",
      "mcp__abap-docs__*",
      "mcp__sap-docs__*"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bun \"$CLAUDE_PLUGIN_ROOT/scripts/sync-md.ts\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

> [!NOTE]
> `CLAUDE_PLUGIN_ROOT` is an environment variable automatically populated by the Claude Code plugin runtime pointing to the active plugin folder. 
> If you are performing manual testing or executing the scripts directly outside of the automatic hook lifecycle, please run the script (e.g. `bun scripts/sync-md.ts`) directly from your workspace root.

---

## 3. Environment Variables (`.env`)

Create a `.env` file at the root of your consumer repository to define SAP connection credentials:

```bash
SAP_URL=http://vhcalnplci:50000
SAP_USER=DEVELOPER
SAP_PASSWORD=your-sap-password
SAP_CLIENT=001
SAP_LANGUAGE=EN
SAP_MODE=hyperfocused
SAP_ALLOWED_PACKAGES=Z*,$TMP
```

---

## 4. Custom Commands Reference

Once successfully registered, you can use these premium slash-commands inside your Claude Code session:

| Command | Usage | Description |
|---------|-------|-------------|
| `/triage "<request>"` | `/triage "Create a new flight flight agency report"` | Automatically scans keywords, creates a task file at `scratch/tasks/`, and outputs a parallel Phase 1 dispatch block. |
| `/post-write <ObjectName>` | `/post-write ZCL_FLIGHT_REPORT` | Runs the mandatory ABAP quality gate chain: syntax check (`SAP(action=analyze, type=syntax_check)`) -> unit tests (`SAP(action=test)`) -> ATC (`SAP(action=test, type=atc)`). |
| `/sync "<commit message>"` | `/sync "feat: add flight validation"` | Runs documentation audit, synchronizes memory indexes, and commits staged files cleanly. |

---

## 5. Main Reference Documentation

For detailed guidelines regarding the complete Harness Governance, Agent role responsibilities, Fiori/BSP tool sets, and troubleshooting:

- **Harness Engineering Core**: [co-abap GitHub Repository](https://github.com/5throck/co-abap)
- **Governance & Roles**: [AGENTS.md](https://github.com/5throck/co-abap/blob/main/AGENTS.md)
- **Tool Boundaries**: [docs/tooling-matrix.md](https://github.com/5throck/co-abap/blob/main/docs/tooling-matrix.md)
- **MCP Server Details**: [docs/mcp_usage.md](https://github.com/5throck/co-abap/blob/main/docs/mcp_usage.md)

---
*Last Updated: 2026-10-10*
