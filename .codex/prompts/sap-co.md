---
name: sap-co
description: Load SAP CO (Controlling) module analyst context ??cost center accounting, internal orders, CO-PA profitability analysis, and cost allocation. Use when working on CO module tasks or activating the CO Analyst role.
argument-hint: ""
allowed-tools: ["mcp__abap__SAP"]
gemini-parity: skip # intentional Claude-only command
---

Load and apply the CO module skill from `skills/sap-co/SKILL.md`.

Read the file at `skills/sap-co/SKILL.md` now and hold all domain knowledge (process flows, table relationships, query patterns, BAPIs, quirks) as active session context.

After reading, confirm: "CO Analyst skill loaded ??CO module context active."

SAP access: vsp runs in hyperfocused mode, so use the single `mcp__abap__SAP` tool as `SAP(action, target, params)` (e.g. `read`, `query`, `search`, `analyze`). Legacy-name mapping: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).
