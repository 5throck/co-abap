---
name: sap-le
description: Load SAP LE (Logistics Execution) module analyst context ??shipping, transport, warehouse management, delivery processing, and handling units. Use when working on LE module tasks or activating the LE Analyst role.
argument-hint: ""
allowed-tools: ["mcp__abap__SAP"]
gemini-parity: skip # intentional Claude-only command
---

Load and apply the LE module skill from `skills/sap-le/SKILL.md`.

Read the file at `skills/sap-le/SKILL.md` now and hold all domain knowledge (process flows, table relationships, query patterns, BAPIs, quirks) as active session context.

After reading, confirm: "LE Analyst skill loaded ??LE module context active."

SAP access: vsp runs in hyperfocused mode, so use the single `mcp__abap__SAP` tool as `SAP(action, target, params)` (e.g. `read`, `query`, `search`, `analyze`). Legacy-name mapping: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).
