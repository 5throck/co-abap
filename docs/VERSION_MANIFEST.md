# VERSION_MANIFEST.md

**Generated**: 2026-09-12T13:46:01.013Z
**Manifest Version**: 1.0
**Location**: docs/VERSION_MANIFEST.md

---

## Summary

- **Agents**: 21
- **Skills**: 49
- **Scripts**: 94 *(top-level CLI scripts; library/helper modules under `scripts/lib/`, `scripts/helpers/`, `scripts/hooks/`, and `scripts/validators/` are excluded here — `scripts/SCRIPTS.md` is the full registry)*
- **Commands**: 20

---

## Agents

| Name | File | Tier | Model | Last Modified |
|------|------|------|-------|---------------|
| architect | agents/architect.md | N/A | inherit | 2026-08-23 |
| co-analyst | agents/co-analyst.md | N/A | inherit | 2026-08-23 |
| code-writer | agents/code-writer.md | N/A | inherit | 2026-08-23 |
| dba | agents/dba.md | N/A | inherit | 2026-08-23 |
| devops-admin | agents/devops-admin.md | N/A | inherit | 2026-08-23 |
| fi-analyst | agents/fi-analyst.md | N/A | inherit | 2026-08-23 |
| fiori-developer | agents/fiori-developer.md | N/A | inherit | 2026-08-23 |
| form-expert | agents/form-expert.md | N/A | inherit | 2026-08-23 |
| gui-scripter | agents/gui-scripter.md | N/A | inherit | 2026-08-23 |
| i18n-specialist | agents/i18n-specialist.md | N/A | inherit | 2026-09-12 |
| interface-expert | agents/interface-expert.md | N/A | inherit | 2026-08-23 |
| le-analyst | agents/le-analyst.md | N/A | inherit | 2026-08-23 |
| mm-analyst | agents/mm-analyst.md | N/A | inherit | 2026-08-23 |
| pm | agents/pm.md | N/A | N/A | 2026-08-28 |
| pp-analyst | agents/pp-analyst.md | N/A | inherit | 2026-08-23 |
| read-only-analyst | agents/read-only-analyst.md | N/A | inherit | 2026-08-23 |
| sap-investigator | agents/sap-investigator.md | N/A | inherit | 2026-08-23 |
| schema-inspector | agents/schema-inspector.md | N/A | inherit | 2026-08-23 |
| sd-analyst | agents/sd-analyst.md | N/A | inherit | 2026-08-23 |
| security-monitor | agents/security-monitor.md | N/A | inherit | 2026-08-23 |
| test-runner | agents/test-runner.md | N/A | inherit | 2026-08-23 |

---

<!-- validate-md-language:allowlist-begin reason="Triggers column embeds verbatim Korean search keywords copied from k-* SKILL.md frontmatter (proper-noun data values, not prose). Generated region — a whole-file lang: ko exception would be dishonest and would un-validate the rest of the manifest, so scripts/validate-md-language.ts exempts only this marked section (T-20260912-015)." -->
## Skills

| Name | Version | Status | Location | Platform | Triggers | Owner |
|------|---------|--------|----------|----------|----------|-------|
| abap-code-review | 1.0.0 | active | skills/abap-code-review/SKILL.md | workspace | abap-code-review, code review, Clean ABAP, naming convention, pretty printer, anti-pattern | code-writer |
| abap-dev | 1.1.0 | active | skills/abap-dev/SKILL.md | workspace | abap-dev, BAPI, transport, ABAP Unit, performance analysis, impact analysis | code-writer |
| accessibility-audit | 1.1.0 | active | skills/accessibility-audit/SKILL.md | workspace | accessibility-audit, /accessibility-audit, axe-core audit, wcag accessibility check, wcag 2.1 aa | pm |
| agent-lifecycle-manager | 1.0.0 | active | skills/agent-lifecycle-manager/SKILL.md | workspace | create agent, new agent, validate agents, agent lifecycle, manage agents | pm |
| api-documentation | 1.0.0 | active | skills/api-documentation/SKILL.md | workspace | api documentation, document api, api reference, developer documentation, rest api docs, graphql docs, sdk documentation | pm |
| ci-triage | 0.1.0 | active | skills/ci-triage/SKILL.md | workspace | ci failure, triage failure, audit gate failed, scaffold failed, fix the pipeline | pm |
| decision-record | 1.1.0 | active | skills/decision-record/SKILL.md | workspace | decision record, gate ruling, go/no-go decision, escalation decision, record a decision | pm |
| desktop-app-fallback | 1.0.0 | active | skills/desktop-app-fallback/SKILL.md | workspace | desktop-app-fallback, manual QA, Desktop App | test-runner |
| documentation-writing | 1.0.0 | active | skills/documentation-writing/SKILL.md | workspace | write documentation, create guide, draft communication, write manual, create tutorial, documentation, technical writing | pm |
| dump-monitor | 1.0.0 | active | skills/dump-monitor/SKILL.md | workspace | dump-monitor, ListDumps, GetDump, short dump, system health | devops-admin |
| evidence-ledger | 1.1.0 | active | skills/evidence-ledger/SKILL.md | workspace | evidence ledger, citation ledger, claim verification, source verification, evidence tracking | pm |
| explain-me | 1.0.0 | experimental | skills/explain-me/SKILL.md | workspace | /explain-me, /reportme, make a report, create report, explain this topic | pm |
| finishing-a-development-branch | 1.0.0 | active | skills/finishing-a-development-branch/SKILL.md | workspace | finish branch, complete work, wrap up, finishing a development branch, merge branch, create PR, push and PR | pm |
| gateguard | 1.0.0 | active | skills/gateguard/SKILL.md | workspace | gateguard, /gateguard, investigate file, check before edit, pre-edit check | pm |
| graft | N/A | active | .claude/skills/graft/SKILL.md | claude | N/A | N/A |
| handbook | 0.4.0 | active | skills/handbook/SKILL.md | workspace | N/A | pm |
| handbook-sync-audit | 1.0.0 | active | skills/handbook-sync-audit/SKILL.md | workspace | N/A | handbook-reviewer |
| i18n-audit | 1.0.0 | active | skills/i18n-audit/SKILL.md | workspace | i18n audit, locale parity, translation parity, glossary audit, L10N parity | pm |
| i18n-formatting | 1.0.0 | active | skills/i18n-formatting/SKILL.md | workspace | date format, number format, currency format, unit conversion, paper size, korean numerals | pm |
| i18n-layout | 1.0.0 | active | skills/i18n-layout/SKILL.md | workspace | character encoding, RTL, bidi, font selection, CRLF, BOM | pm |
| i18n-locale-config | 1.0.0 | active | skills/i18n-locale-config/SKILL.md | workspace | locale config, locale code, BCP 47, collation, collation order, timezone | pm |
| meeting | 1.4.0 | active | .claude/skills/meeting/SKILL.md | both | meeting, agent discussion, collaborative decision, multi-agent coordination, facilitate meeting | pm |
| meeting-facilitation | 1.4.1 | active | skills/meeting-facilitation/SKILL.md | workspace | meeting, agent discussion, collaborative decision, multi-agent coordination, facilitate meeting | pm |
| performance-tuning | 1.0.0 | active | skills/performance-tuning/SKILL.md | workspace | N/A | pm |
| platform-command-lifecycle-manager | 1.0.0 | active | skills/platform-command-lifecycle-manager/SKILL.md | workspace | create platform command, new .claude command, new .gemini command, platform command lifecycle, command parity, propagate command | pm |
| platform-skill-lifecycle-manager | 1.0.0 | active | skills/platform-skill-lifecycle-manager/SKILL.md | workspace | create platform skill, new .claude skill, new .gemini skill, platform skill version, platform skill lifecycle, update platform skill | pm |
| post-write-chain | N/A | active | skills/post-write-chain/SKILL.md | workspace | N/A | N/A |
| project-review | 1.2.0 | active | skills/project-review/SKILL.md | workspace | project review, review project, audit project, quality review | pm |
| research-analysis | 1.0.0 | active | skills/research-analysis/SKILL.md | workspace | research, analyze, investigate, synthesize, evidence gathering, data analysis, literature review | pm |
| sap-co | 1.0.0 | active | skills/sap-co/SKILL.md | workspace | sap-co, cost center, internal order, CO-PA, cost allocation | co-analyst |
| sap-fi | 1.0.0 | active | skills/sap-fi/SKILL.md | workspace | sap-fi, journal entry, GL, accounts payable, accounts receivable, financial reporting | fi-analyst |
| sap-le | 1.0.0 | active | skills/sap-le/SKILL.md | workspace | sap-le, shipping, transport, warehouse, delivery, handling unit | le-analyst |
| sap-mm | 1.0.0 | active | skills/sap-mm/SKILL.md | workspace | sap-mm, purchasing, goods receipt, material master, inventory, P2P | mm-analyst |
| sap-pp | 1.0.0 | active | skills/sap-pp/SKILL.md | workspace | sap-pp, BOM, routing, production order, MRP, work center | pp-analyst |
| sap-sd | 1.0.0 | active | skills/sap-sd/SKILL.md | workspace | sap-sd, sales order, delivery, billing, pricing, O2C | sd-analyst |
| script-lifecycle-manager | 1.2.0 | active | skills/script-lifecycle-manager/SKILL.md | workspace | create script, update script, deprecate script, script lifecycle, manage scripts | pm |
| security-scan | 1.2.0 | active | skills/security-scan/SKILL.md | workspace | security scan, scan for vulnerabilities, security check, run security | pm |
| skill-lifecycle-manager | 1.3.0 | active | skills/skill-lifecycle-manager/SKILL.md | workspace | create skill, new skill, validate skills, skill lifecycle, manage skills | pm |
| source-command-celebrate | 1.0.0 | active | skills/source-command-celebrate/SKILL.md | workspace | source-command-celebrate, celebrate, task complete | pm |
| source-command-commit-push-pr | 1.0.1 | active | skills/source-command-commit-push-pr/SKILL.md | workspace | commit-push-pr, commit and push, create PR | pm |
| standup-synthesizer | 1.0.0 | active | skills/standup-synthesizer/SKILL.md | workspace | standup digest, daily standup, synthesize standup, work summary | pm |
| sync | 1.5.0 | active | skills/sync/SKILL.md | workspace | sync, /sync, commit and push, create PR | pm |
| team-builder | 1.1.0 | active | skills/team-builder/SKILL.md | workspace | build new agent team, create agent team, agent team setup, team builder | pm |
| token-usage-lint | 1.1.0 | active | skills/token-usage-lint/SKILL.md | workspace | token lint, hardcoded color, design token compliance, raw hex values, hardcoded spacing | pm |
| translate | 1.0.1 | active | skills/translate/SKILL.md | workspace | translate, translation, Korean translation | pm |
| ui-ux-design-intelligence | 1.0.1 | active | skills/ui-ux-design-intelligence/SKILL.md | workspace | design system, ui design, ux design, component design, visual design, design tokens, interface design | pm |
| update-bun-packages | 1.3.1 | active | skills/update-bun-packages/SKILL.md | workspace | update bun packages, upgrade bun packages, bun update, update dependencies, upgrade dependencies | pm |
| validate-docs-links | 1.0.0 | active | .claude/skills/validate-docs-links/SKILL.md | both | validate links, check links, broken links, docs validation | pm |
| zod-contract-gate | 1.0.0 | active | skills/zod-contract-gate/SKILL.md | workspace | zod-contract-gate, /zod-contract-gate, zod contract validation, schema contract gate, runtime schema validation | architect |

<!-- validate-md-language:allowlist-end -->

---

## Scripts

| Name | Version | Location | Dependencies |
|------|---------|----------|--------------|
| agent-create.ts | 1.0.1 | scripts/agent-create.ts | N/A |
| agent-delete.ts | 1.0.1 | scripts/agent-delete.ts | N/A |
| agent-lifecycle-audit.ts | 1.2.1 | scripts/agent-lifecycle-audit.ts | N/A |
| agent-list.ts | 1.1.0 | scripts/agent-list.ts | N/A |
| agent-verify.ts | 1.0.2 | scripts/agent-verify.ts | N/A |
| analyze-git-history.ts | 1.0.2 | scripts/analyze-git-history.ts | child_process |
| apply-handbook-theme.test.ts | 1.0.1 | scripts/tests/apply-handbook-theme.test.ts | bun:test |
| apply-handbook-theme.ts | 1.0.0 | scripts/handbook/apply-handbook-theme.ts | N/A |
| archive-memory.ts | 1.0.0 | scripts/archive-memory.ts | N/A |
| audit.ts | 2.37.1 | scripts/audit.ts | bun |
| build-search-index.ts | 1.0.0 | scripts/handbook/build-search-index.ts | N/A |
| check-a11y.ts | 1.0.0 | scripts/handbook/check-a11y.ts | N/A |
| check-authoring.ts | 1.2.0 | scripts/handbook/check-authoring.ts | N/A |
| check-external-links.ts | 1.2.0 | scripts/handbook/check-external-links.ts | N/A |
| check-i18n-parity.ts | 1.0.0 | scripts/handbook/check-i18n-parity.ts | N/A |
| check-labels.ts | 1.0.0 | scripts/handbook/check-labels.ts | N/A |
| check-links.ts | 1.0.0 | scripts/handbook/check-links.ts | N/A |
| check-lint.ts | 1.0.0 | scripts/handbook/check-lint.ts | N/A |
| check-search.ts | 2.0.0 | scripts/handbook/check-search.ts | N/A |
| check-spell.ts | 1.0.0 | scripts/handbook/check-spell.ts | N/A |
| check-structure.test.ts | 1.0.0 | scripts/tests/check-structure.test.ts | bun:test |
| check-structure.ts | 1.0.0 | scripts/handbook/check-structure.ts | N/A |
| check-symmetry.ts | 1.0.0 | scripts/handbook/check-symmetry.ts | N/A |
| check-tables.ts | 1.0.0 | scripts/handbook/check-tables.ts | N/A |
| cleanup-completed-md.ts | 1.1.0 | scripts/cleanup-completed-md.ts | N/A |
| clear-pm-approval.ts | 1.0.0 | scripts/clear-pm-approval.ts | N/A |
| compile-tokens.ts | 1.2.0 | scripts/compile-tokens.ts | N/A |
| deploy-handbook.ts | 1.1.0 | scripts/handbook/deploy-handbook.ts | N/A |
| deploy-readme-patch.test.ts | 1.0.0 | scripts/tests/deploy-readme-patch.test.ts | bun:test |
| design-lint.ts | 1.0.0 | scripts/design-lint.ts | N/A |
| dev-sync.ts | 1.14.0 | scripts/dev-sync.ts | bun |
| dispatch-parallel.ts | 1.1.0 | scripts/co-abap/dispatch-parallel.ts | N/A |
| dispatch-parallel.ts | 1.1.1 | scripts/dispatch-parallel.ts | N/A |
| dispatch-serial.ts | 1.1.0 | scripts/co-abap/dispatch-serial.ts | N/A |
| dispatch-serial.ts | 1.1.1 | scripts/dispatch-serial.ts | N/A |
| dispatch.ts | 1.1.0 | scripts/co-abap/dispatch.ts | N/A |
| dispatch.ts | 1.1.1 | scripts/dispatch.ts | N/A |
| extract-copycode.ts | 1.0.0 | scripts/handbook/extract-copycode.ts | N/A |
| gen-pr-body.ts | 1.2.0 | scripts/gen-pr-body.ts | bun |
| generate-ide-rules.ts | 1.0.0 | scripts/generate-ide-rules.ts | N/A |
| generate-skill-graph.ts | 1.10.0 | scripts/generate-skill-graph.ts | js-yaml |
| handbook-doctor.ts | 1.0.0 | scripts/handbook/handbook-doctor.ts | N/A |
| handbook-sync-audit.ts | 1.0.0 | scripts/handbook/handbook-sync-audit.ts | N/A |
| install-bun.ts | 1.0.1 | scripts/co-abap/install-bun.ts | bun |
| install-vsp.ts | 1.0.1 | scripts/co-abap/install-vsp.ts | bun |
| lifecycle-sync-audit.ts | 1.8.0 | scripts/lifecycle-sync-audit.ts | js-yaml |
| md-to-ooxml.ts | 1.2.0 | scripts/md-to-ooxml.ts | fs, path |
| nav-utils.ts | 1.0.0 | scripts/handbook/nav-utils.ts | N/A |
| new-requirement.ts | 1.0.1 | scripts/co-abap/new-requirement.ts | N/A |
| qa-gate.ts | 1.3.0 | scripts/qa-gate.ts | bun |
| readme-lifecycle-audit.ts | 1.0.4 | scripts/readme-lifecycle-audit.ts | N/A |
| render-pdf-deck.ts | 1.0.1 | scripts/render-pdf-deck.ts | N/A |
| resolve-variants.ts | 1.0.3 | scripts/resolve-variants.ts | fs, js-yaml, path |
| retry-handler.ts | 1.1.0 | scripts/co-abap/retry-handler.ts | N/A |
| retry-handler.ts | 1.1.0 | scripts/retry-handler.ts | N/A |
| scaffold-handbook.ts | 1.2.0 | scripts/handbook/scaffold-handbook.ts | N/A |
| scratch-cleanup.ts | 1.0.1 | scripts/co-abap/scratch-cleanup.ts | N/A |
| setup-github-branch-protection.ts | 1.0.1 | scripts/setup-github-branch-protection.ts | bun |
| setup.ts | 1.0.2 | scripts/co-abap/setup.ts | bun |
| skill-lifecycle-audit.ts | 1.4.1 | scripts/skill-lifecycle-audit.ts | N/A |
| skill-session-review.ts | 1.0.0 | scripts/skill-session-review.ts | bun |
| spec-register.ts | 1.2.0 | scripts/spec-register.ts | N/A |
| sync-agent-status.ts | 1.0.1 | scripts/sync-agent-status.ts | N/A |
| sync-md.ts | 1.3.1 | scripts/sync-md.ts | N/A |
| sync-skill-status.ts | 1.0.1 | scripts/sync-skill-status.ts | N/A |
| sync-skills.ts | 1.8.0 | scripts/sync-skills.ts | N/A |
| team-builder.ts | 1.4.0 | scripts/team-builder.ts | N/A |
| test-runner.ts | 1.1.1 | scripts/test-runner.ts | fs, os, path |
| translate-readme.ts | 1.0.0 | scripts/translate-readme.ts | bun, fs, path |
| typecheck.ts | 1.1.1 | scripts/typecheck.ts | N/A |
| update-footers.ts | 1.0.0 | scripts/handbook/update-footers.ts | N/A |
| validate-agents.ts | 1.2.1 | scripts/validate-agents.ts | N/A |
| validate-decisions.ts | 1.0.0 | scripts/validate-decisions.ts | js-yaml |
| validate-doc-folder.ts | 1.1.0 | scripts/validate-doc-folder.ts | fs, path |
| validate-docs-links.ts | 1.1.0 | scripts/validate-docs-links.ts | fs, path |
| validate-handbook.ts | 1.1.0 | scripts/handbook/validate-handbook.ts | N/A |
| validate-md-language.ts | 1.11.0 | scripts/validate-md-language.ts | fs |
| validate-model-registry.ts | 1.2.0 | scripts/validate-model-registry.ts | N/A |
| validate-nav.ts | 1.0.0 | scripts/handbook/validate-nav.ts | N/A |
| validate-pm-extends.ts | 0.3.1 | scripts/validate-pm-extends.ts | N/A |
| validate-procedures.ts | 1.1.0 | scripts/validate-procedures.ts | js-yaml |
| validate-skills.ts | 1.5.1 | scripts/validate-skills.ts | N/A |
| validate-templates.ts | 1.25.1 | scripts/validate-templates.ts | js-yaml |
| validate-variant-readiness.ts | 1.1.0 | scripts/validate-variant-readiness.ts | N/A |
| verify-agent-deliverables.ts | 1.0.1 | scripts/verify-agent-deliverables.ts | fs |
| verify-memory.ts | 1.2.0 | scripts/verify-memory.ts | fs, path |
| verify-platform-lifecycle.ts | 1.1.3 | scripts/verify-platform-lifecycle.ts | N/A |
| verify-readme-sync.ts | 1.4.0 | scripts/verify-readme-sync.ts | bun, fs, path |
| verify-scripts.ts | 1.6.1 | scripts/verify-scripts.ts | fs, path |
| verify-skill-graph.ts | 1.6.0 | scripts/verify-skill-graph.ts | N/A |
| verify-skills.ts | 1.3.0 | scripts/verify-skills.ts | N/A |
| vsp-audit.ts | 1.1.0 | scripts/co-abap/vsp-audit.ts | N/A |
| vsp-publish.ts | 1.0.0 | scripts/co-abap/vsp-publish.ts | bun |
| vsp-task.ts | 1.0.1 | scripts/co-abap/vsp-task.ts | N/A |

---

## Commands

| Name | File | Platform | Skill Integration |
|------|------|----------|-------------------|
| abap-dev | .claude/commands/abap-dev.md | claude | N/A |
| celebrate | .claude/commands/celebrate.md | claude | N/A |
| changelog | .claude/commands/changelog.md | both | N/A |
| commit-push-pr | .claude/commands/commit-push-pr.md | both | N/A |
| gateguard | .claude/commands/gateguard.md | both | N/A |
| meeting | .claude/commands/meeting.md | both | N/A |
| memlog | .claude/commands/memlog.md | both | N/A |
| new-task | .claude/commands/new-task.md | both | N/A |
| post-write | .claude/commands/post-write.md | claude | N/A |
| project-review | .claude/commands/project-review.md | both | N/A |
| sap-co | .claude/commands/sap-co.md | claude | N/A |
| sap-fi | .claude/commands/sap-fi.md | claude | N/A |
| sap-le | .claude/commands/sap-le.md | claude | N/A |
| sap-mm | .claude/commands/sap-mm.md | claude | N/A |
| sap-pp | .claude/commands/sap-pp.md | claude | N/A |
| sap-sd | .claude/commands/sap-sd.md | claude | N/A |
| security-check | .claude/commands/security-check.md | both | N/A |
| sync | .claude/commands/sync.md | both | N/A |
| transport | .claude/commands/transport.md | claude | N/A |
| triage | .claude/commands/triage.md | claude | N/A |

---

## Platform Parity Status

**Checked**: Claude (.claude/) vs Gemini (.gemini/)

- **Commands with parity**: 9 / 20
- **Skills with parity**: 2 / 49 (common-template skills are parity-exempt)

---

## Drift Detection

⚠️ **Drift detected**:

- [WARNING] Agent architect missing tier or model metadata
- [WARNING] Agent co-analyst missing tier or model metadata
- [WARNING] Agent code-writer missing tier or model metadata
- [WARNING] Agent dba missing tier or model metadata
- [WARNING] Agent devops-admin missing tier or model metadata
- [WARNING] Agent fi-analyst missing tier or model metadata
- [WARNING] Agent fiori-developer missing tier or model metadata
- [WARNING] Agent form-expert missing tier or model metadata
- [WARNING] Agent gui-scripter missing tier or model metadata
- [WARNING] Agent i18n-specialist missing tier or model metadata
- [WARNING] Agent interface-expert missing tier or model metadata
- [WARNING] Agent le-analyst missing tier or model metadata
- [WARNING] Agent mm-analyst missing tier or model metadata
- [WARNING] Agent pm missing tier or model metadata
- [WARNING] Agent pp-analyst missing tier or model metadata
- [WARNING] Agent read-only-analyst missing tier or model metadata
- [WARNING] Agent sap-investigator missing tier or model metadata
- [WARNING] Agent schema-inspector missing tier or model metadata
- [WARNING] Agent sd-analyst missing tier or model metadata
- [WARNING] Agent security-monitor missing tier or model metadata
- [WARNING] Agent test-runner missing tier or model metadata
- [WARNING] Skill handbook has no triggers defined
- [WARNING] Skill handbook-sync-audit has no triggers defined
- [WARNING] Skill performance-tuning has no triggers defined
- [ERROR] Skill post-write-chain frontmatter YAML parse error: bad indentation of a mapping entry (2:131)

 1 |  ... 
 2 |  ... rces the mandatory quality gate: SyntaxCheck → RunUnitTests → G ...
-----------------------------------------^
 3 |  ... 
 4 |  ... 
- [WARNING] Command post-write has no matching skill of the same name
- [WARNING] Command security-check has no matching skill of the same name
- [WARNING] Command transport has no matching skill of the same name
- [WARNING] Command triage has no matching skill of the same name
