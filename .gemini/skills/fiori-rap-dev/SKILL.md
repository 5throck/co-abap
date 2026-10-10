---
name: fiori-rap-dev
description: 'Use when designing or implementing SAP Fiori / UI5 apps and their RAP backend: CDS root/projection views, behavior definitions (managed/unmanaged, draft), metadata extensions, service definitions/bindings, Fiori Elements floorplans, launchpad tile mapping, OData V2 vs V4, Clean Core released-API checks, and UI5 QA. Trigger on Fiori, UI5, RAP, BDEF, SRVD, SRVB, DDLX, Fiori Elements, OData V4.'
version: 1.0.0
last_reviewed: 2026-10-10
status: active
scope: co-abap
owner: fiori-developer
prerequisites: vsp MCP server (SAP tool, hyperfocused mode)
relates_to:
  - skill: abap-dev
    type: composes_with
  - skill: post-write-chain
    type: follows
  - skill: accessibility-audit
    type: composes_with
metadata:
  type: core
  triggers:
    - fiori-rap-dev
    - Fiori
    - UI5
    - RAP
    - BDEF
    - SRVD
    - SRVB
    - Fiori Elements
    - OData V4
---

# Fiori and RAP Development (vsp)

Workflow for Fiori / UI5 front ends and the RAP backend that feeds them. Owner: `fiori-developer`. Legacy vsp tool names map to hyperfocused `SAP(...)` calls per the SSOT: [vsp Tool Reference](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode). Data-access and naming rules are cited, not restated: DA-3, DA-5, DA-8 in [Data Access Rules](../../docs/co-abap.context.md#da-3-priority-order-when-in-scope).

## 0. Feature preflight

Run `SAP(action="system", target="FEATURES")` first. `SAP_FEATURE_UI5` and `SAP_FEATURE_RAP` are off by default.

- Flags off: design plus RAP backend source only. Read the app from the BSP repo (`search`/`read`), or from its Git / Business Application Studio export. There is no `UI5GetApp` equivalent.
- Flags on: deploy and publish remain R3 and need explicit approval (gate section 2.2).

## 1. RAP stack

| Layer | Artifact | Name (DA-8) | Notes |
|-------|----------|-------------|-------|
| Root view | CDS `define root view entity` | `ZR_<Entity>` | over `ZI_` view or table; released APIs preferred (Clean Core C1) |
| Projection | CDS `as projection on` | `ZC_<Entity>` | one per consumption scenario |
| Behavior (base) | BDEF | `ZR_<Entity>` | `managed` (default) or `unmanaged`; add `with draft` for Fiori Elements editing |
| Behavior (projection) | BDEF | `ZC_<Entity>` | `projection;` exposes only needed operations |
| Behavior pool | class | `ZBP_R_<Entity>` | validations, determinations, actions |
| UI annotations | DDLX | same as view | `@Metadata.layer: #CUSTOMER`; `@UI.headerInfo`, `@UI.lineItem`, `@UI.selectionField`, `@UI.facet`, `@UI.identification` |
| Authorization | DCLS | same as view | DA-5; no `#NOT_REQUIRED` without justification |
| Service definition | SRVD | `ZUI_<Entity>` / `ZAPI_<Entity>` | expose `ZC_` entities only |
| Service binding | SRVB | `ZUI_<Entity>_O4` / `_O2` | publish is R3 |

Managed vs unmanaged: choose managed for greenfield tables; unmanaged only to wrap legacy function modules or BAPIs, and then wrap the BAPI in a behavior pool method rather than copying logic.

## 2. vsp recipes (see SSOT for gates)

| Goal | Call |
|------|------|
| Read CDS / BDEF / DDLX / SRVD | `SAP(action="read", target="DDLS ZC_X")`, `BDEF ZR_X`, `DDLX ZC_X`, `SRVD ZUI_X` |
| Read service binding | `SAP(action="read", target="SRVB ZUI_X_O4")` |
| Search artifacts | `SAP(action="search", target="ZC_*")` |
| Dependencies / impact | `SAP(action="analyze", params={"type":"analyze_deps", ...})`, `cds_impact`, `references` |
| Write (R2, allowlisted package) | `SAP(action="edit", target="BDEF ZR_X", params={"source":...})`; surgical `target="EDITSOURCE"` |
| Create new object (R2) | `SAP(action="create", ...)` |
| Syntax check (R1) | `SAP(action="analyze", params={"type":"syntax_check", ...})` |
| Activate (R2) | `SAP(action="edit", target="ACTIVATE")` / `ACTIVATE_MULTI` |
| Unit tests / ATC (R1) | `SAP(action="test", ...)` / `params={"type":"atc"}` |
| Publish SRVB (R3) | approval required; never self-approve |
| Released-API check | no tool in v2.60.0: verify in ADT, record `C1 not verified` if unavailable |

Edit SRVD (not "modify the OData service") to change what is exposed: `SAP(action="edit", target="SRVD ZUI_X", ...)`.

## 3. Fiori Elements floorplans

| Floorplan | Use |
|-----------|-----|
| List Report + Object Page | default for master/detail with draft editing |
| Worklist | simple task lists |
| Analytical List Page | KPI plus table, needs analytical CDS |
| Overview Page | cards for role dashboards |
| Freestyle UI5 | only when no floorplan fits; justify in design |

Prefer annotations (DDLX) over custom controller code; extend with manifest-declared controller extensions or fragments.

## 4. Launchpad mapping

Per technical design section 5 (`deliverables/templates/fiori_technical_design.md`): semantic object + action -> target mapping -> tile (static or dynamic) -> catalog / space / page -> role. Record the intent (`#SemObj-action`) in the design; launchpad content is a transport-bound customizing step, not created by vsp.

## 5. OData V2 vs V4

| Aspect | V4 (`_O4`) | V2 (`_O2`) |
|--------|-----------|-----------|
| Default for | new apps, draft, Fiori Elements V4 | legacy apps, freestyle on older UI5 |
| Model | `sap.ui.model.odata.v4.ODataModel` | `sap.ui.model.odata.v2.ODataModel` |
| Rule | choose V4 unless a consumer requires V2 | document the reason when V2 |

## 6. Clean Core

- Consume released APIs (C1 contract) as sources for `ZR_` views; follow DA-3 priority order.
- No modifications of SAP objects; extend via released extension points.
- Every CDS has an access control per DA-5; `ZAPI_` services expose only released-style, stable structures.

## 7. UI5 quality assurance

- `ui5-linter` clean (no deprecated API / global usage).
- Unit tests: QUnit; integration: OPA5 journeys for key flows.
- `manifest.json` checks: `sap.app.id` matches namespace, data sources point to `_O4`/`_O2` URIs, `minUI5Version` set, `sap.ui5.models` and routing consistent, `i18n` bundle declared, no hard-coded host URLs.
- Accessibility gate: run [accessibility-audit](../accessibility-audit/SKILL.md) (WCAG 2.1 AA, axe-core) on rendered pages; Critical/Serious violations block handoff.
- Backend artifacts go through the [post-write-chain](../post-write-chain/SKILL.md), including its UI5 / Fiori branch and RAP artifacts note.

## 8. Rules

1. Local drafts go under `scratch/` only.
2. Writes are strictly serial; each write resets the QA chain.
3. Deploy (UI5/RAP) and SRVB publish are R3: request PM approval, never bypass the gate.
4. Visual proposals: deliver HTML/SVG mockups in the response.
