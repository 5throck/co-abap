# 2026-09-25 Project Review Remediation — Design

**Spec ID**: 2026-09-25-project-review-remediation
**Date**: 2026-09-25
**Status**: implemented
**Source**: project-review (full scope) — `docs/reports/2026-09-25-project-review-full.md`
**Accessibility**: N/A — tooling, governance docs, and CI plumbing only; no user-facing UI (ADR-0065 exempt by scope).
**Preview Verification**: N/A — non-UI change (ADR-0070 exempt by scope).

## Context

The 2026-09-25 full project review (4 parallel domain agents + machine battery) found 4 Critical / 19 High / 13 Moderate / 6 Low issues. The quick-fix queue (13 findings) was applied and verified in-session; this design covers the remaining Critical/High remediation batch plus the follow-through items that require cross-tier changes:

1. **Critical #1 — duplicate `lifecycle:` YAML key in 20/21 agent frontmatters.** Root cause: `preserveLifecycleFrontmatter()` (L0 `scripts/helpers/upgrade-versions.ts` + template copy) appends the project's lifecycle block without checking whether the template content already carries one; YAML last-key-wins silently discards the project's newer data. Introduced by the 2026-09-20 upgrade run.
2. **Critical #4 — AGENTS.md is a pre-marker-expansion generation.** Missing §1–§10 skeleton, 5 VARIANT-\* marker families, and §6 Skills section (cause of the permanent `audit.ts` WARN). Sibling docs (CLAUDE.md, GEMINI.md, CODEX.md, docs/context.md) link `AGENTS.md#5.1…`, `#5.1.1…`, `§8` anchors that do not exist locally.
3. **High #10 — graft rebake churn.** `.claude/helpers/graft-{hooks,statusline}.cjs` carried a machine-specific baked absolute path; the fallback chain cannot see bun-global installs, guaranteeing per-machine rebakes and silent hook no-ops elsewhere. The 4 uncommitted graft files could not be committed safely.
4. **Follow-on regenerations** — skill-graph and VERSION_MANIFEST drift after the frontmatter/AGENTS.md changes.

## Changes

### Tooling (L0 workspace root)

- `scripts/helpers/upgrade-versions.ts` + `templates/common/scripts/helpers/upgrade-versions.ts`: `preserveLifecycleFrontmatter()` now replaces an existing template-side `lifecycle:` block in place (project block wins) instead of appending a duplicate key. Verified with an inline merge test (merged output has exactly 1 block, project data preserved).
- `scripts/regenerate-agents-md.ts`: frontmatter parser strips inline YAML comments (`tier: medium # model-id`) so tier cells render cleanly.
- `templates/common/AGENTS.md`: ADR-0079 citation gains the `workspace root` qualifier; Korean plain-language section gains the linguistic-example carve-out sentence (keeps regenerated variant files compliant).

### Project data (this repo)

- `agents/*.md` (20 files, all except `pm.md`): duplicate `lifecycle:` block removed; surviving block's `last_updated` stamped `2026-09-25`.
- `agents/i18n-specialist.md`: `role: specialist` → proper description string (frontmatter schema conformance with the other 19 agents).

### AGENTS.md regeneration (Critical #4)

- Regenerated via `bun scripts/regenerate-agents-md.ts --source Projects/co-abap` onto the current §-numbered skeleton (all 5 VARIANT marker families restored), then re-seated the ABAP-specific registry content:
  - §2: module-analyst activation (trigger keywords, handoffs) + technical-group dispatch notes.
  - §4.1: ABAP parallel dispatch rules + typical dispatch sequences.
  - §4.2: 6-step ABAP harness lifecycle + requirements-driven deliverables workflow (stages 1–5).
  - §4.3: ABAP role-boundary selection tables + escalation rules.
  - §4.4–§4.6 (new): cross-module integration orchestration, error recovery protocol, dispatch automation & skill auto-discovery.
  - §6: L0-only curated skill rows swapped for local skills (`abap-dev`, `post-write-chain`, `handbook`) so every referenced path resolves.
  - Variant header comment, scope note, and `Last Updated` footer restored/updated.
- `templates/co-abap/AGENTS.md` (L1) synced to the same content so future template syncs seed from the corrected generation.

### Graft portability (High #10)

- `.claude/helpers/graft-{hooks,statusline}.cjs`: `BAKED` machine path removed; resolution order is now `GRAFT_DIST_DIR` env override → `~/.bun/install/global/node_modules` probe → project node_modules → node global lib → `npm root -g` → last-ditch. Behavior on this machine is unchanged (bun-global probe resolves the same path).
- With this, the previously uncommittable 4-file graft rebake set (helpers ×2, `.claude/settings.json` hook reorder, `opencode.json` graft command) becomes safe to commit.

### Regenerations

- `docs/skill-graph.json` / `docs/skill-graph.md`, `docs/VERSION_MANIFEST.md`, `skills/SKILLS.md`: regenerated after the frontmatter/AGENTS.md/skill changes.

## Acceptance criteria

- [x] `grep -c '^lifecycle:'` returns 1 for every `agents/*.md`.
- [x] `bun scripts/agent-lifecycle-audit.ts` reports 0 warnings (was 22).
- [x] `AGENTS.md` carries `## §1:` … `## §10:`, the 5 VARIANT-\* marker families, and `## §6: Skills` with all referenced `skills/…` paths resolving.
- [x] `bun scripts/audit.ts` passes with zero FAILs and no §6 WARN (VERSION_MANIFEST + skill-graph regenerated).
- [x] No machine-specific absolute path remains in `.claude/helpers/*.cjs`; `node --check` passes; hooks run green on this machine.
- [x] L0 merge helper verified by inline test: merged output contains exactly one lifecycle block.
