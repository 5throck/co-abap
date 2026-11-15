## Upgrade delivery

Auto-composed from `.claude/last-upgrade-delivery.json` at delivery time — this body describes exactly the merged content.

- Variant: co-abap
- Template: 0.30.0 → 0.30.0
- Delivered: 264 file(s) at 2026-11-12T22:23:11.906Z

### Delivery footprint

- scripts/ — 183 file(s)
- docs/ — 17 file(s)
- .claude/ — 10 file(s)
- .agents/ — 9 file(s)
- .codex/ — 9 file(s)
- .gemini/ — 9 file(s)
- .hermes/ — 9 file(s)
- skills/ — 9 file(s)
- agents/ — 5 file(s)
- (root) — 4 file(s)

### Decisions

- INFO: 365 / WARN: 159 / ERROR: 2

**Unresolved ERROR dispositions** (CONFLICT/TOMBSTONED: delivery skipped, project copy preserved; BEHAVIOR_REGRESSION: delivered, new sibling-test failure):
- `scripts/co-abap/vsp-publish.ts` (SYNC_IF_NEWER: scripts/) — equal-version drift with no provenance (no delivery baseline and no template-vintage match) — CONFLICT disposition: restore SKIPPED, project copy preserved (a content change must bump the version template-side; re-run with --disposition adopt-template[=glob] to take the template copy)
- `scripts/co-abap/vsp-publish.ts` (VARIANT SCRIPTS) — equal-version drift with no provenance (no delivery baseline and no template-vintage match) — CONFLICT disposition: restore SKIPPED, project copy preserved (a content change must bump the version template-side; re-run with --disposition adopt-template[=glob] to take the template copy)

_Full inventory: `.claude/last-upgrade-delivery.json` (dev-sync Step 3.9 auto-E5 diff attribution; ERROR dispositions block auto-E5 until resolved)._
