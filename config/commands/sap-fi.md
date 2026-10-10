---
name: sap-fi
description: Load SAP FI (Financial Accounting) module analyst context ??journal entries, account determination, G/L, accounts payable/receivable, and financial reporting. Use when working on FI module tasks or activating the FI Analyst role.
argument-hint: ""
allowed-tools: ["mcp__abap__SAP"]
---

Load and apply the FI module skill from `skills/sap-fi/SKILL.md`.

Read the file at `skills/sap-fi/SKILL.md` now and hold all domain knowledge (process flows, table relationships, query patterns, BAPIs, quirks) as active session context.

After reading, confirm: "FI Analyst skill loaded ??FI module context active."

SAP access: vsp runs in hyperfocused mode, so use the single `mcp__abap__SAP` tool as `SAP(action, target, params)` (e.g. `read`, `query`, `search`, `analyze`). Legacy-name mapping: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).
