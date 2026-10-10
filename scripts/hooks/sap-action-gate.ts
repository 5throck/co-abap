#!/usr/bin/env bun
/**
 * sap-action-gate.ts — PreToolUse gate for vsp MCP tools (matcher `mcp__abap__.*`).
 * Classifies each call R0-R3 per config/sap-action-policy.json and emits a
 * permissionDecision (allow | ask | deny). Fails safe: any internal error,
 * malformed stdin or invalid policy yields `ask`, never a silent allow.
 * Denied calls are logged here because PostToolUse does not fire for them.
 * Design: docs/designs/2026-10-10-sap-write-safety-gate-design.md
 *
 * @version 1.2.0
 */

import {
  TOOL_PREFIX, actorOf, appendAudit, classify, derivePackage, effectiveInput, findApproval, firstString,
  globMatch, inputHash, inspectQuery, isHyperfocused, loadPolicy, objectKey, profileOf, readEvidence, resolveHyperfocused,
  resolveToolName,
  targetOf, type Cls, type Decision, type HfResolved, type HookInput, type Evidence, type Policy,
} from '../lib/sap-action-lib.ts';

export interface GateResult { decision: Decision; reason: string; cls: string; tool: string }

export function evaluate(input: HookInput, root: string, now: Date = new Date()): GateResult {
  const toolName = input.tool_name ?? '';
  if (!toolName.startsWith(TOOL_PREFIX)) {
    return { decision: 'ask', cls: '?', tool: toolName, reason: 'unexpected tool name for SAP gate' };
  }
  const ti = effectiveInput(input.tool_input);
  const tool = resolveToolName(toolName, ti);
  let policy: Policy;
  try { policy = loadPolicy(root); } catch (e) {
    return { decision: 'ask', cls: '?', tool, reason: `policy unavailable (${(e as Error).message})` };
  }
  if (isHyperfocused(toolName)) return evaluateHyperfocused(input, root, policy, now);
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

function evaluateHyperfocused(input: HookInput, root: string, policy: Policy, now: Date): GateResult {
  const h: HfResolved = resolveHyperfocused(input.tool_input, policy);
  const cls = h.cls ?? '?';
  const r = (decision: Decision, reason: string): GateResult => ({ decision, reason, cls, tool: h.tool });
  if (h.deny) return r('deny', h.deny);
  if (h.ask || !h.cls) return r('ask', h.ask ?? 'unclassified tool');
  const evidence = readEvidence(root);
  switch (h.cls) {
    case 'R0': return r('allow', 'read-only');
    case 'R1': return r('allow', 'QA execution (evidence recorded by audit hook)');
    case 'R2': {
      let pkgs = h.packages;
      if (!pkgs.length) {
        const ev = h.keys.map((k) => evidence[k]?.package).filter((x): x is string => !!x);
        pkgs = ev;
      }
      if (!pkgs.length) return r('ask', 'source write; target package not determinable');
      const bad = pkgs.find((p) => !policy.allowedPackages.some((a) => globMatch(a, p)));
      if (bad) return r('deny', `package ${bad} is outside the allowlist`);
      return r('ask', `source write to package ${pkgs.join(', ')} requires confirmation`);
    }
    case 'R3': {
      if (h.tool === 'ReleaseTransport') {
        if (policy.release.blockInManualProfile && profileOf() === 'manual') {
          return r('deny', 'transport release is blocked in the manual profile');
        }
        if (policy.release.requireEvidence) {
          if (!h.transport) return r('deny', 'release requires params.transport');
          const objs = releaseObjects(h, evidence);
          if (!objs.length) return r('deny', 'release requires tracked transport objects (none recorded for this transport)');
          const missing = objs.filter((k) => evidence[k]?.status !== 'passed');
          if (missing.length) return r('deny', `${missing.length} object(s) lack passed QA evidence`);
        }
      }
      const found = findApproval(root, policy, input.session_id, h.tool, h.approvalTarget, now);
      if (!found) return r('deny', 'privileged action without approval');
      return r('allow', `approved${found.approval.approver ? ' by ' + found.approval.approver : ''} (single use)`);
    }
  }
}

/** Objects that must carry passed evidence: those named in the call plus every object recorded against the transport. */
function releaseObjects(h: HfResolved, evidence: Record<string, Evidence>): string[] {
  const set = new Set<string>(h.objects);
  const t = h.transport?.toLowerCase();
  for (const [k, e] of Object.entries(evidence)) if (t && e.transport?.toLowerCase() === t) set.add(k);
  return [...set];
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
        const hf = isHyperfocused(input.tool_name ?? '') ? resolveHyperfocused(input.tool_input, loadPolicy(root)) : undefined;
        appendAudit(root, {
          ts: new Date().toISOString(), sessionId: input.session_id ?? 'unknown', actor: actorOf(input),
          tool: res.tool, class: res.cls, decision: 'deny', object: hf?.keys[0] ?? objectKey(ti),
          package: hf?.packages[0] ?? derivePackage(ti, readEvidence(root)), inputHash: inputHash(ti),
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
