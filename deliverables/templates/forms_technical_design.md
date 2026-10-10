# Technical Design Document - SAP Forms (Smart / Adobe Forms)
## [REQ-NNN] [Requirement Title]

> [!NOTE]
> This document defines print programs, form layouts, master/body pages, and data mapping.
> **Stage 2 Owner**: Form Expert (form-expert) & Architect

### Document Metadata
- **Form Design Lead**: [Form Expert]
- **Associated SRS**: [REQ-NNN: 01_srs.md](../01_srs.md)
- **Status**: DRAFT | REVIEW | APPROVED
- **Last Updated**: YYYY-MM-DD

---

## 1. Form Overview

- **Form Name/ID**: `ZADT_NNN_FORM`
- **Form Technology**: Smart Forms / Adobe Forms (PDF-based print forms)
- **Description**: [e.g., Customer Invoice PDF generated upon billing release]
- **Related Transaction**: [e.g., VF03 / VF01]
- **Standard Driver Program**: [e.g., RLVSDRHP / RVADRVAL]
- **Custom Driver Program**: `ZADT_NNN_PRINT`

---

## 2. Form Interface & Data Retrieval

### 2.1 Interface Parameters (Form Signature)
[Document the key import/export parameters of the form interface.]
- **Importing**:
  - `IS_HEADER` TYPE `ZADT_S_FORM_HEADER` (Invoice header data)
- **Tables / Collections**:
  - `IT_ITEMS` TYPE `ZADT_T_FORM_ITEMS` (Invoice item rows)

### 2.2 Data Mapping Flow
```mermaid
flowchart TD
    Driver["Driver Program (ZADT_NNN_PRINT)"] -->|"Reads Database (VBRK/VBRP)"| Fetch["Fetch & Format Data"]
    Fetch -->|"Calls Form FM"| FormFM["Form Interface (Importing IS_HEADER, Tables IT_ITEMS)"]
    FormFM -->|"Maps to"| Context["Form Context (Variables & Nodes)"]
    Context -->|"Renders Layout"| PDF["PDF Print Output (Master / Body Pages)"]
```

---

## 3. Layout & Page Design

### 3.1 Page Hierarchy (Adobe Forms / Smart Forms tree)
- **Master Page (`MASTER_PAGE`)**: Contains static header (Logo, Company Address) and static footer (Page Numbering, legal text).
- **Body Page (`BODY_PAGE`)**:
  - **Subform `HeaderInfo`**: Positioned (fixed width) containing billing address, invoice ID, and date.
  - **Subform `ItemsTable`**: Flowed (dynamic height) containing table header, data rows, and totals.
  - **Subform `PaymentTerms`**: Positioned containing bank detail text blocks.

### 3.2 Calculations & Conditions within Form Layout
- **Subtotal/Total Net Value**: Computed in the context/layout script (JavaScript/FormCalc) or passed pre-calculated from the driver program (Preferred).
- **Tax percentage block**: Condition node in Smart Form (Node `TAX_BLOCK` active only if `IS_HEADER-TAX_VAL > 0`).

---

## 4. Implementation Plan & Handoff

### 4.1 Form Objects List

| Object Name | Object Type | Action | Description |
| :--- | :--- | :--- | :--- |
| `ZADT_NNN_FORM` | SFPF (Adobe Form) / SSFO (Smart Form) | Create | Invoice Form layout and context mapping. |
| `ZADT_NNN_PRINT` | PROG | Create | Print program driver for fetching data and calling the form. |

### 4.2 Developer Handoff Checklist
- [ ] Printer layout mockup (PDF/A compatible) is attached and approved.
- [ ] Form interface fields match driver program structures field-by-field.
- [ ] Output device (Spool printer configuration) is verified on SAP NetWeaver.
- [ ] Standard fonts (e.g., Arial, Courier) are confirmed to exist on the ADS (Adobe Document Services) server.

---

## 5. Capability, Output Management & Localization

> Tool names follow [vsp Tool Reference (Hyperfocused Mode)](../../docs/co-abap.context.md#vsp-tool-reference-hyperfocused-mode).

### 5.1 Tooling Capability Note
- Form **layouts** (SAPscript SE71, Smart Forms, Adobe Forms SFP/LiveCycle Designer) are **not editable via ADT/vsp**; they are a human GUI step. Owner: [...]
- Print/driver programs, classes, and interface-feeding code are editable via `SAP(action="edit")` (R2) and follow the post-write chain.
- SAP GUI scripting is outside the MCP gate and must not be used to automate layout changes.

### 5.2 Output Management
- **Framework in use** (check on target): NACE / NAST condition-based output | BRF+-based Output Management (OPD, S/4HANA) | both
- **How verified**: [e.g. `SAP(action="query", target="TABL_CONTENTS TNAPR")` for NACE form/program assignments; OPD output type config for BRF+]
- **Output type / application**: [...]; **processing routine / callback**: [...]

### 5.3 Interface Definition Source
- Generated FM resolved at runtime: `FP_FUNCTION_MODULE_NAME` (Adobe) / `SSF_FUNCTION_MODULE_NAME` (Smart Forms) - never hardcode `/1BCDWB/...`.
- Capture the signature with `SAP(action="rfc", target="<generated FM>")` (`op=describe`, R0) and attach it here: [...]

### 5.4 Korean (and multi-language) Output
- [ ] SAPscript/Smart Forms: TrueType font uploaded via SE73 (e.g. Korean font), Unicode-capable device type (e.g. `SWINCF` / Unicode PDF) assigned to the output device.
- [ ] Adobe Forms: font installed and **embedded** on the ADS; PDF shows embedded fonts.
- [ ] Texts maintained per language (logon/output language); no mojibake in spool and PDF.

### 5.5 Test & Sign-off

| Test case | Data / document | Expected | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Print preview | [...] | [...] | | |
| Spool / PDF / e-mail output | [...] | [...] | | |
| Korean characters & page breaks | [...] | [...] | | |

- **Business sign-off**: [Name / date]
