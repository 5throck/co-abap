# SAP Globalization Guidance — runtime I18N rules for the co-abap ABAP workflow

- **Spec ID**: 2026-10-12-sap-globalization-guidance
- **Date**: 2026-10-12
- **Status**: approved (user approval 2026-10-12)
- **Scope**: `docs/standards/sap-globalization-checklist.md`, `agents/code-writer.md`, `skills/abap-dev/SKILL.md` (+ 5 platform mirrors), `deliverables/templates/04_qa_report.md`, `docs/countries/KR.md`, `docs/countries/US.md`, `docs/countries/JP.md` (added 2026-10-12, same session), `docs/countries/ACTIVE.md`, `docs/README.md`, `docs/skill-graph.json`, `docs/skill-graph.md`, `docs/VERSION_MANIFEST.md`

## 1. Problem (verified)

| Gap | Evidence |
|-----|----------|
| No global-runtime I18N guidance anywhere in the ABAP development standards | Grep for `T006`, `TCURX`, `SET COUNTRY`, factory/holiday calendar, and `SY-UZEIT`-vs-timestamp handling across `docs/standards/`, `skills/`, `agents/`, and deliverable templates: zero hits |
| Workspace I18N assets target workspace documents, not SAP runtime semantics | `skills/i18n-locale-config/SKILL.md` (IANA/DST rules with JS `Intl` examples), `skills/i18n-formatting/SKILL.md` (A4/Letter, units — `Intl.NumberFormat`); `i18n-specialist` is scoped "outside the SAP delivery pipeline" (`docs/co-abap.context.md`) |
| Delivered requirements ship unmaintained texts, with the deferral recorded only by accident | REQ-001 records selection texts as a known limitation (`deliverables/REQ-001-flight-occupancy-revenue-report/03_implementation_report.md`); REQ-002 ships a hardcoded English literal (`scratch/zflight.prog.abap`) with zero i18n mentions in its document set |
| QA gate template has no locale/globalization check row | `deliverables/templates/04_qa_report.md` section 1 lists syntax/unit/ATC only |
| Country-profile framework has no profiles | `docs/country-profiles.md` defines the format and an "Operational Formats" section; `docs/countries/` does not exist in this project |

## 2. Design

### 2.1 New standard: `docs/standards/sap-globalization-checklist.md`

Pass/fail checklist with the same severity model as the clean-abap checklist (blocker / should / nice-to-have) and the same run points (code-writer self-check at implementation, test-runner review at QA). Seven families, each mapped to concrete ABAP constructs:

1. **Time & time zones** — store instants as UTC timestamps (`GET TIME STAMP`); display via `CONVERT TIME STAMP` in the user master zone (`sy-zonlo`); `SY-DATUM`/`SY-UZEIT` are application-server time, not user time; no hardcoded UTC offsets (DST zones shift twice a year); explicit time zone in batch/interface contexts.
2. **Numbers, dates, currency** — monetary output always `WRITE ... CURRENCY` (TCURX decimals: KRW/JPY 0, USD/EUR 2); no dates/numbers assembled as concatenated text; non-interactive output (batch, print, file interfaces) fixes the country explicitly (`SET COUNTRY`) instead of inheriting the job user's profile.
3. **Units of measure** — T006 internal codes with T006A language-dependent display texts; conversion via standard function units, never hardcoded factors; quantity and unit inseparable.
4. **Calendars** — working-day and deadline logic uses factory + holiday calendars parameterized by country/region, not weekday arithmetic.
5. **Language & texts** — user-visible literals in text symbols and message classes (blocker); translations maintained or the deferral recorded as a known limitation in the implementation and release reports; `SET LANGUAGE` before reading language-dependent texts in non-interactive contexts.
6. **Output, paper, forms** — spool device type / form page size chosen by where the document is printed, not by its language (A4 vs US Letter); global forms need country-specific variants.
7. **Addresses & country data** — country address formats (T005) and standard country tables instead of local code tables.

**Verification hooks**: code-writer self-check (this checklist) during implementation; a Quality Gate Summary row + release checklist item in the QA report template. The ATC rulepack (`scripts/co-abap/atc-rulepack.json`) is intentionally NOT extended in this change — adding an i18n check entry requires `atc_variant` values verified against a live system; recorded as an open follow-up for devops-admin.

### 2.2 Wiring into the delivery pipeline

- `agents/code-writer.md`: two new behavior rules (follow the globalization checklist; maintain texts or record the deferral), a **Globalization Check** line in the Code Writer Report output contract, version 1.1.1 → 1.1.2, `last_updated` 2026-10-12.
- `skills/abap-dev/SKILL.md` (+ 5 byte-identical platform mirrors under `.agents/`, `.claude/`, `.codex/`, `.gemini/`, `.hermes/`): new `sap:globalization` section pointing at the standard; version 1.2.2 → 1.3.0, `last_reviewed` 2026-10-12.
- `deliverables/templates/04_qa_report.md`: Quality Gate Summary row and a release checklist item (path referenced as plain code text, not a markdown link, because the template is instantiated one directory deeper than it is validated).
- `docs/README.md`: standards listing gains the new file; directory table gains `countries/`.

### 2.3 Country profiles

`docs/countries/KR.md` and `docs/countries/US.md` follow `docs/country-profiles.md` exactly: frontmatter (`code`, `name`, `status: draft`, `last_verified`), advisory disclaimer, and an **Operational Formats** table that maps each dimension to the SAP concept that carries it (TCURX decimals, IANA-style time zone IDs and DST behavior, T006/T006A, factory calendar, device type/form page size, T005 address format). Legal sections stay minimal and route jurisdictional questions out via the PM. `docs/countries/ACTIVE.md` records KR as the project's operating context (Korean development team), with US available for global-scope tasks. `docs/countries/JP.md` (2026-10-12, same session, user request) adds Japan with the JP-specific dimensions the generic format does not presuppose: era (和暦) dates as presentation only, full-width character handling, name-order semantics, and the April–March fiscal year.

## 3. Verification plan

| Level | Method |
|-------|--------|
| Derived docs | `bun scripts/generate-skill-graph.ts` and `bun scripts/generate-version-manifest.ts` regenerate `docs/skill-graph.*` and `docs/VERSION_MANIFEST.md` after the skill/agent edits |
| Spec registry | `bun scripts/spec-register.ts --file docs/designs/2026-10-12-sap-globalization-guidance-design.md --source manual --status implemented` |
| Gates | `bun run typecheck`, `bun run test`, `bun scripts/audit.ts`, `bun scripts/validate-docs-links.ts --all`, `git diff --check` |
| Mirror parity | md5 of the 6 `abap-dev/SKILL.md` copies identical after edit |
| Content | checklist families map 1:1 to the problem rows in section 1 |

## 4. Files and owners

| File | Change | Owner |
|------|--------|-------|
| `docs/standards/sap-globalization-checklist.md` | new | i18n-specialist (guidance), code-writer (adoption) |
| `agents/code-writer.md` | rules + report line + version bump | code-writer |
| `skills/abap-dev/SKILL.md` + 5 mirrors | new section + version bump | code-writer |
| `deliverables/templates/04_qa_report.md` | gate row + checklist item | test-runner |
| `docs/countries/KR.md`, `US.md`, `JP.md`, `ACTIVE.md` | new profiles | i18n-specialist |
| `docs/README.md`, `docs/skill-graph.*`, `docs/VERSION_MANIFEST.md` | index + regenerated | devops-admin |
| Open follow-up | ATC rulepack i18n checks — requires live-system `atc_variant` verification | devops-admin |
