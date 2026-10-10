# SAP Write Safety Gate — enforced controls for vsp MCP actions

- **Spec ID**: 2026-10-10-sap-write-safety-gate
- **Date**: 2026-10-10
- **Status**: approved (user approval 2026-10-10)
- **Scope**: `.claude/settings.json` hooks, `scripts/hooks/sap-action-gate.ts`, `scripts/hooks/sap-action-audit.ts`, `config/sap-action-policy.json`, `memory/audit/`, `scripts/harness-metrics.ts`, `SECURITY.md`, `docs/setup-guide.md`, `skills/post-write-chain/SKILL.md`

## 1. Problem (verified)

| Gap | Evidence |
|-----|----------|
| No harness hook on SAP tools | `.claude/settings.json` has no matcher for `mcp__abap__*` |
| Only vsp-level controls | `.mcp.json`: `SAP_ALLOWED_PACKAGES=Z*,$TMP,$ZADT_VSP,$VSP_ADT`, `SAP_FEATURE_*` flags |
| Post-write chain not enforced | `skills/post-write-chain/SKILL.md` is guidance only |
| No audit trail | no log of SAP actions, approvals, or QA results |
| Over-privileged guidance | `docs/setup-guide.md:63` mentions `SAP_ALL` (trial systems) |
| No KPIs measured | no metrics script or data source |

## 2. Tool risk classification

Tool names derived from `agents/*.md`, `skills/*/SKILL.md`, `docs/co-abap.context.md`. Hook tool name = `mcp__abap__<Tool>`.

| Class | Meaning | Decision | Tools |
|-------|---------|----------|-------|
| R0 | Read / metadata | allow | GetSource, GetRevisionSource, SearchObject, GetTable, GetTableContents, GetCDSDependencies, GetCDSImpactAnalysis, GetCDSExposure, GetODataMetadata, GetFunctionGroup, GetContext, GetArguments, GetAPIReleaseState, GetConnectionInfo, GetSystemInfo, ListDumps, GetDump, ListTransports, GetTransport, ListTraces, GetTrace, ListSQLTraces, GetSQLTraceState, GetCallGraph, RunQuery (single SELECT only, see 2.1) |
| R1 | QA / read-only execution | allow + record evidence | SyntaxCheck, RunUnitTests, GetCodeCoverage, RunATCCheck, TraceExecution |
| R2 | Source write / activate | ask; target package must match allowlist (else deny); mark object `pending` | WriteSource, EditSource, Activate, CreateTransport, AddToTransport |
| R3 | Data change / release / privileged | deny by default; allow only with approval (2.2); ReleaseTransport additionally requires `passed` evidence for every object in the transport | ReleaseTransport, RunReport, RunOptions, InstallZADTVSP, InstallAbapGit, any abapGit/UI5/RAP deploy tool, any delete/data-modifying tool |
| — | Unknown `mcp__abap__*` | ask (fail safe), reason "unclassified tool" | — |

### 2.0 Hyperfocused mode (vsp v2.60.0)

`.mcp.json` runs vsp with `SAP_MODE=hyperfocused`: one tool `SAP` (hook name `mcp__abap__SAP`) with input `{action, target, params}`. The gate classifies the `action`, then sub-classifies by `params.type`, `params.op` or a single-word `target` (for example `INFO`, `ATC`, `ACTIVATE`). The map is data in `config/sap-action-policy.json` under `hyperfocused`; the legacy table above still applies to non-hyperfocused tool names. `SAP()` with no arguments is `info`. An unknown action or an unknown sub-type is `ask` (fail safe). Parameters may be a JSON string.

| Action (sub-type) | Class | Decision and notes |
|-------------------|-------|--------------------|
| read, search, grep, revisions, info, help, lint | R0 | allow (lint is offline static analysis) |
| query (single SELECT in `params.sql_query`/`sql`/`query`/`statement` or in `target`; `TABL_CONTENTS <t>`) | R0 | allow. Any statement that is not exactly one SELECT, or `target=SQL` without a statement, is deny. A statement in params and one in target are both inspected. No table and no statement is ask |
| analyze: call_graph, callers, callees, dumps, traces, application_log, check_boundaries, usage_examples and the other read types listed in the policy | R0 | allow |
| analyze: syntax_check | R1 | allow; evidence step `SyntaxCheck` |
| analyze: trace_execution | R1 | allow; no evidence step |
| analyze: execute_abap, cluster_read | R3 | deny unless approved (arbitrary ABAP execution; cluster_read takes a free `where` and bypasses the SQL guard) |
| analyze: set_pretty_printer_settings | R2 | ask (no package, so "not determinable") |
| test (default or `type=unit`) | R1 | allow; evidence `RunUnitTests`, plus `GetCodeCoverage` only when `params.coverage` or `with_coverage` is true |
| test (`type=atc` or `target=ATC`) | R1 | allow; evidence `RunATCCheck` |
| test: atc_customizing | R0 | allow |
| edit, create | R2 | ask when the package is allowlisted, deny when outside; package from `package`, `package_name`, `dev_class`, else the evidence store for the same "TYPE NAME", else ask. `edit` COMPARE_SOURCE is R0; ACTIVATE, ACTIVATE_MULTI, ACTIVATE_PACKAGE, LOCK, UNLOCK are R2 but do not reset the QA chain |
| i18n: compare_languages, data_element_labels, message_class_texts, texts, texts_get | R0 | allow |
| i18n: texts_set, write_message_texts | R2 | ask (no package, so "not determinable") |
| system: INFO, COMPONENTS, CONNECTION, FEATURES, system_info, list_transports, get_transport, get_user_transports, get_transport_info, transport_status, transport_buffer, import_status, git_types, git_import_status, git_object_versions, list_dependencies | R0 | allow |
| system: create_transport, add_transport_object, remove_transport_object, move_transport_object, deploy_from_file, git_import_zip, rename | R2 | ask with the package check |
| system: save_to_file, git_export | R2 (no QA reset) | ask: writes a local file / exports SAP content; `git_export` checks every package of `packages` |
| system: release_transport | R3 | deny unless evidence + approval (see below); approval tool name is `ReleaseTransport`, target is `params.transport` |
| system: delete_transport, merge_transports, copy_to_toc, upload_transport, install_zadt_vsp, deploy_zip, git_delete_objects | R3 | deny unless approved |
| system: any other type matching `r3Patterns` (delete, install, deploy, drop, insert, modify, import prefixes) | R3 | deny unless approved; other unknown types are ask |
| delete | R3 | deny unless approved (target "TYPE NAME") |
| debug (all targets) | R3 | deny unless approved: can execute reports, call RFCs, move objects, set text elements |
| rfc: info, ping, probe, describe (default with a target), search, job | R0 | allow |
| rfc: call, run | R3 | deny unless approved (target is the function or report name) |
| rfc: read_table | R3 | deny unless approved: a read, but it bypasses the SELECT-only SQL guard |

Object identity for the evidence store is the normalized "TYPE NAME" (uppercase, subtype such as `/OC` dropped). ADT URLs (`/sap/bc/adt/oo/classes/zcl_a`) and `R3TR`/`LIMU` transport entries map to the same key, so `edit` by target, `analyze`/`test` by `object_url` and `add_transport_object` meet in one record. Mapping to the post-write chain: `syntax_check` is `SyntaxCheck`, `test` is `RunUnitTests`, `test` with `coverage:true` is `GetCodeCoverage`, `test type=atc` is `RunATCCheck`. The help texts do not say that `test` returns coverage, so until a live system confirms a coverage parameter, `GetCodeCoverage` stays missing and release stays denied (fail safe).

`release_transport` has no `objects` parameter in vsp, so the gate collects the objects from the call (if given) and from every evidence record whose `transport` equals `params.transport` (set by `edit`/`create` with `params.transport` and by `add_transport_object`). It denies when none are tracked or any lacks passed evidence. The manual-profile block and the single-use approval apply unchanged.

### 2.1 RunQuery rule
Strip comments/whitespace; allow only if exactly one statement and it starts with `SELECT` (case-insensitive) and contains no `;`-separated second statement or `INSERT|UPDATE|DELETE|MODIFY|COMMIT|CALL` keywords. Otherwise deny.

### 2.2 R3 approval mechanism
Either: env `SAP_APPROVAL_TOKEN` equal to a value in session approval file `memory/audit/approvals/<session_id>.json` (`{tool, target, approver, expires}`), created by the human outside the agent; or the approval file alone matching tool+target and unexpired. Approvals are single-use (consumed by audit hook). Agents must not create approval files (GateGuard/permissions deny Write to `memory/audit/approvals/**`).

## 3. Hook mechanics

| Component | Spec |
|-----------|------|
| PreToolUse | matcher `mcp__abap__.*` → `bun scripts/hooks/sap-action-gate.ts` (sync) |
| Gate input | hook JSON on stdin: `session_id`, `tool_name`, `tool_input`, `cwd` |
| Gate output | stdout JSON `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow|ask|deny","permissionDecisionReason":"<class>: <reason>"}}`, exit 0. On internal error → `ask` (never silent allow) |
| Package check | resolve package from `tool_input` (package field, or object URL lookup via evidence cache); unknown package → ask |
| PostToolUse | matcher `mcp__abap__.*` → `bun scripts/hooks/sap-action-audit.ts`; appends audit record, updates evidence store, consumes approval |
| Policy file | `config/sap-action-policy.json`: `{version, classes:{R0:[..],R1:[..],R2:[..],R3:[..]}, defaultUnknown:"ask", allowedPackages:["Z*","$TMP",...], runQuery:{selectOnly:true}, approval:{envVar:"SAP_APPROVAL_TOKEN", dir:"memory/audit/approvals"}, release:{requireEvidence:true, blockInManualProfile:true}}`. Zod-validated; invalid policy → ask for all |

Denied calls are logged by the gate itself (PostToolUse does not fire for denied calls).

## 4. Evidence store and audit log

`memory/audit/sap-evidence.json` (keyed by object URI):

| Field | Content |
|-------|---------|
| `lastWriteTs` | ISO ts of last R2 write |
| `package`, `transport` | when known |
| `chain` | `{SyntaxCheck,RunUnitTests,GetCodeCoverage,RunATCCheck}` → `{ts, result: pass/fail}` |
| `status` | `pending` (write after last chain) / `passed` (all 4 pass, each ts > lastWriteTs) / `failed` |

`memory/audit/sap-actions-YYYY-MM.jsonl` — append-only, one JSON per line:
`ts, sessionId, actor (agent name if in prompt context, else "main"), tool, class, decision (allow/ask/deny/approved), object, package, inputHash (sha256 of canonical tool_input), beforeHash/afterHash (sha256 of source if present in input/response), qaResult, approver, transport, profile`.

Never log source text, SQL result rows, passwords, tokens, or connection strings — hashes only (gitleaks-safe). `.gitignore` decision: audit files stay local (`memory/audit/` ignored) unless the user opts in.

## 5. Manual-check profile

| Item | Rule |
|------|------|
| Applies to | Desktop App (if hooks don't fire), Antigravity, Gemini CLI |
| Declaration | env `HARNESS_PROFILE=manual`; default when absent = `hooked` on Claude Code CLI |
| Detection | `/transport` and `/post-write` commands check `HARNESS_PROFILE`; gate script also refuses release when profile=manual |
| Behavior | Post-write chain run manually via `/post-write`; **transport release blocked** (user default 2026-10-10) — release only from the hooked CLI profile |
| Docs | CLAUDE.md/GEMINI.md and `docs/tooling-matrix.md` label these environments "manual profile" |

## 6. SAP-side least privilege (primary control)

| Item | Requirement |
|------|-------------|
| User | dedicated dialog/system dev user per environment for AI (no shared personal user) |
| S_DEVELOP | DEVCLASS = allowlisted packages (`Z*`, `$TMP`, ...); OBJTYPE as needed; ACTVT 01,02,03,06*,07,16 (*06 delete only if required) |
| S_TRANSPRT | ACTVT 01,02,03 (create/change/display); **no 43 (release)** |
| S_TABU_DIS / S_TABU_NAM | ACTVT 03 (display) only |
| S_PROGRAM / S_DEVELOP debug | no debug-change (ACTVT 02 on DEBUG) |
| Forbidden | SAP_ALL, SAP_NEW outside local trial (A4H/NPL) |
| setup-guide | `SAP_ALL` text at `docs/setup-guide.md:63` relabelled "local trial only; production-like systems use the role above" |

## 7. Control tiers (for SECURITY.md)

| Tier | Control | Enforced by |
|------|---------|-------------|
| 1 | SAP server authorizations | SAP kernel |
| 2 | vsp allowlist / feature flags (`.mcp.json`) | vsp process |
| 3 | Harness hooks (gate + audit) | Claude Code CLI |
| — | Docs, prompts, skills | guidance only, **not controls** |

## 8. KPIs (`scripts/harness-metrics.ts`, output `docs/reports/harness-metrics-YYYY-MM.md` + `.json`)

| KPI | Definition | Source | Computable now? |
|-----|-----------|--------|-----------------|
| First-pass success rate | objects reaching `passed` with no intermediate `failed` / objects written | evidence + audit log | after gate ships |
| Defect escape rate | defects found after release / released transports | `ListDumps` triage tasks linked to transport; proxy: post-release fix commits | proxy |
| Traceability coverage | R2 writes with task/spec ID + transport in audit / all R2 writes | audit log, memory/tasks | after gate ships |
| Human intervention time | time spent in ask/approval | proxy: count of ask+approval events × fixed estimate; needs session timestamps for real value | proxy |
| Cost per accepted change | usage cost / transports released | needs usage export (not available); report "n/a" | no |
| Unsafe action rate | (deny + ask-rejected) / all R2+R3 attempts | audit log | after gate ships |

Code volume and agent call counts are reported as reference-only, not KPIs.

## 9. Verification plan

| Level | Method |
|-------|--------|
| Unit | `bun test` with fixture hook payloads in `scripts/hooks/__fixtures__/`: each class, unknown tool, package outside allowlist, RunQuery multi-statement/UPDATE, release with pending evidence, release with approval, manual profile release, malformed stdin, invalid policy |
| Audit | assert no source text in log lines; hash fields present |
| Live | local CLI only (vsp binary not available in cloud): write to `$TMP` object → ask; run chain → `passed`; release without approval → deny |

## 10. Files and owners

| File | Change | Owner |
|------|--------|-------|
| `config/sap-action-policy.json` | new | devops-admin |
| `scripts/hooks/sap-action-gate.ts` | new | devops-admin |
| `scripts/hooks/sap-action-audit.ts` | new | devops-admin |
| `scripts/hooks/__fixtures__/*`, tests | new | devops-admin |
| `.claude/settings.json` | add PreToolUse/PostToolUse `mcp__abap__.*`; deny Write `memory/audit/approvals/**` | devops-admin |
| `memory/audit/` + `.gitignore` | new dir / ignore rule | devops-admin |
| `scripts/harness-metrics.ts` | new | devops-admin #2 |
| `SECURITY.md` | control tiers section | security-monitor |
| `docs/setup-guide.md` | SAP_ALL trial-only; least-privilege role | security-monitor |
| `skills/post-write-chain/SKILL.md` | note: enforced via evidence store; manual profile | security-monitor |
