#!/usr/bin/env bun
/**
 * sap-action-gate.ts — PreToolUse gate for vsp MCP tools (matcher `mcp__abap__.*`).
 * Classifies each call R0-R3 per config/sap-action-policy.json and emits a
 * permissionDecision (allow | ask | deny). Fails safe: any internal error,
 * malformed stdin or invalid policy yields `ask`, never a silent allow.
 * Denied calls are logged here because PostToolUse does not fire for them.
 * Design: docs/designs/2026-10-10-sap-write-safety-gate-design.md
 *
 * @version 1.0.0
 */

import {
  TOOL_PREFIX, actorOf, appendAudit, classify, derivePackage, effectiveInput, findApproval, firstString,
  globMatch, inputHash, inspectQuery, loadPolicy, objectKey, profileOf, readEvidence, resolveToolName,
  targetOf, type Cls, type Decision, type HookInput,
} from '../lib/sap-action-lib.ts';

export interface GateResult { decision: Decision; reason: string; cls: string; tool: string }

export function evaluate(input: HookInput, root: string, now: Date = new Date()): GateResult {
  const toolName = input.tool_name ?? '';
  if (!toolName.startsWith(TOOL_PREFIX)) {
    return { decision: 'ask', cls: '?', tool: toolName, reason: 'unexpected tool name for SAP gate' };
  }
  const ti = effectiveInput(input.tool_input);
  const tool = resolveToolName(toolName, ti);
  let policy;
  try { policy = loadPolicy(root); } catch (e) {
    return { decision: 'ask', cls: '?', tool, reason: `policy unavailable (${(e as Error).message})` };
  }
  const cls = classify(tool, policy);
  if (!cls) return { decision: 'ask', cls: '?', tool, reason: 'unclassified tool' };
  const r = (decision: Decision, reason: string): GateResult => ({ decision, reason, cls, tool });
  const evidence = readEvidence(root);

  switch (cls as Cls) {
    case 'R0': {
      if (tool.toLowerCase() === 'runquery' && policy.runQuery.selectOnly) {
        const sql = firstString(ti, ['query', 'sql', 'sql_query', 'sqlQuery', 'statement']);
        const bad = inspectQuery(sql);
        if (bad) return r('deny', `RunQuery rejected: ${bad}`);
      }
      return r('allow', 'read-only');
    }
    case 'R1':
      return r('allow', 'QA execution (evidence recorded by audit hook)');
    case 'R2': {
      const pkg = derivePackage(ti, evidence);
      if (!pkg) return r('ask', 'source write; target package not determinable');
      if (!policy.allowedPackages.some((p) => globMatch(p, pkg))) {
        return r('deny', `package ${pkg} is outside the allowlist`);
      }
      return r('ask', `source write to package ${pkg} requires confirmation`);
    }
    case 'R3': {
      if (tool.toLowerCase() === 'releasetransport') {
        if (policy.release.blockInManualProfile && profileOf() === 'manual') {
          return r('deny', 'transport release is blocked in the manual profile');
        }
        if (policy.release.requireEvidence) {
          const objs = ti.objects;
          if (!Array.isArray(objs) || objs.length === 0 || !objs.every((o) => typeof o === 'string' && o.trim())) {
            return r('deny', 'release requires the full list of transport objects');
          }
          const missing = (objs as string[]).filter((o) => {
            let k = o.trim().toLowerCase();
            try { k = decodeURIComponent(k); } catch { /* keep raw */ }
            return evidence[k]?.status !== 'passed';
          });
          if (missing.length) return r('deny', `${missing.length} object(s) lack passed QA evidence`);
        }
      }
      const found = findApproval(root, policy, input.session_id, tool, targetOf(ti), now);
      if (!found) return r('deny', 'privileged action without approval');
      return r('allow', `approved${found.approval.approver ? ' by ' + found.approval.approver : ''} (single use)`);
    }
  }
}

function emit(decision: Decision, reason: string): void {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason },
  }) + '\n');
}

async function main(): Promise<void> {
  let input: HookInput = {};
  let root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  try {
    const raw = await Bun.stdin.text();
    input = JSON.parse(raw);
    if (!input || typeof input !== 'object') throw new Error('stdin is not an object');
    root = input.cwd || root;
    const res = evaluate(input, root);
    if (res.decision === 'deny') {
      try {
        const ti = effectiveInput(input.tool_input);
        appendAudit(root, {
          ts: new Date().toISOString(), sessionId: input.session_id ?? 'unknown', actor: actorOf(input),
          tool: res.tool, class: res.cls, decision: 'deny', object: objectKey(ti),
          package: derivePackage(ti, readEvidence(root)), inputHash: inputHash(ti),
          profile: profileOf(), reason: res.reason,
        });
      } catch { /* logging must not change the decision */ }
    }
    emit(res.decision, `${res.cls}: ${res.reason}`);
  } catch (e) {
    emit('ask', `gate error, failing safe: ${(e as Error).message}`);
  }
}

if (import.meta.main) await main();
