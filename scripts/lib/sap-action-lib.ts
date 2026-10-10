/**
 * sap-action-lib.ts — Shared logic for the SAP write safety gate and audit hooks.
 * Design: docs/designs/2026-10-10-sap-write-safety-gate-design.md
 * Used by hooks/sap-action-gate.ts (PreToolUse) and hooks/sap-action-audit.ts (PostToolUse).
 * Audit records store hashes only: never source text, SQL rows, tokens or credentials.
 *
 * @version 1.0.0
 */

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const TOOL_PREFIX = 'mcp__abap__';
export type Cls = 'R0' | 'R1' | 'R2' | 'R3';
export type Decision = 'allow' | 'ask' | 'deny';

export interface Policy {
  version: number;
  classes: Record<Cls, string[]>;
  r3Patterns: string[];
  defaultUnknown: 'ask';
  allowedPackages: string[];
  runQuery: { selectOnly: boolean };
  approval: { envVar: string; dir: string };
  release: { requireEvidence: boolean; blockInManualProfile: boolean };
}

export interface HookInput {
  session_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  cwd?: string;
  agent_type?: string;
  agent_name?: string;
}

export interface Evidence {
  lastWriteTs?: string;
  package?: string;
  transport?: string;
  chain: Record<string, { ts: string; result: 'pass' | 'fail' }>;
  status: 'pending' | 'passed' | 'failed';
}

export const CHAIN = ['SyntaxCheck', 'RunUnitTests', 'GetCodeCoverage', 'RunATCCheck'] as const;

// ---------------------------------------------------------------------------
// Policy (hand-validated; no external schema dependency)
// ---------------------------------------------------------------------------

const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

export function validatePolicy(raw: unknown): Policy {
  const p = raw as any;
  const fail = (m: string): never => { throw new Error(`invalid policy: ${m}`); };
  if (!p || typeof p !== 'object') fail('not an object');
  if (typeof p.version !== 'number') fail('version');
  for (const c of ['R0', 'R1', 'R2', 'R3']) if (!isStrArr(p.classes?.[c])) fail(`classes.${c}`);
  if (p.r3Patterns !== undefined && !isStrArr(p.r3Patterns)) fail('r3Patterns');
  for (const s of p.r3Patterns ?? []) new RegExp(s);
  if (p.defaultUnknown !== 'ask') fail('defaultUnknown');
  if (!isStrArr(p.allowedPackages) || p.allowedPackages.length === 0) fail('allowedPackages');
  if (typeof p.runQuery?.selectOnly !== 'boolean') fail('runQuery.selectOnly');
  if (typeof p.approval?.envVar !== 'string' || typeof p.approval?.dir !== 'string') fail('approval');
  if (p.approval.dir.startsWith('/') || p.approval.dir.split(/[\\/]/).includes('..')) fail('approval.dir');
  if (typeof p.release?.requireEvidence !== 'boolean' || typeof p.release?.blockInManualProfile !== 'boolean') fail('release');
  return { ...p, r3Patterns: p.r3Patterns ?? [] } as Policy;
}

export function loadPolicy(root: string): Policy {
  return validatePolicy(JSON.parse(readFileSync(join(root, 'config', 'sap-action-policy.json'), 'utf-8')));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, canonical((v as any)[k])]));
  }
  return v;
}
export const inputHash = (input: unknown): string => sha256(JSON.stringify(canonical(input ?? {})));

export function firstString(input: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = input[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/** Tool input, with hyperfocused-mode `params` merged in when present. */
export function effectiveInput(input: unknown): Record<string, unknown> {
  const base = input && typeof input === 'object' ? { ...(input as Record<string, unknown>) } : {};
  const params = base.params;
  if (params && typeof params === 'object') Object.assign(base, params);
  return base;
}

/** Short tool name; hyperfocused-mode `SAP` tool resolves to its `action`. */
export function resolveToolName(toolName: string, input: Record<string, unknown>): string {
  const short = toolName.slice(TOOL_PREFIX.length);
  if (short.toLowerCase() === 'sap' && typeof input.action === 'string' && input.action.trim()) {
    return input.action.trim();
  }
  return short;
}

export function classify(name: string, policy: Policy): Cls | null {
  const lower = name.toLowerCase();
  for (const c of ['R3', 'R2', 'R1', 'R0'] as Cls[]) {
    if (policy.classes[c].some((t) => t.toLowerCase() === lower)) return c;
  }
  if (policy.r3Patterns.some((p) => new RegExp(p, 'i').test(name))) return 'R3';
  return null;
}

export const objectKey = (input: Record<string, unknown>): string | undefined => {
  const v = firstString(input, ['object_url', 'objectUrl', 'url', 'uri', 'object', 'object_name', 'objectName', 'name']);
  if (!v) return undefined;
  try { return decodeURIComponent(v).toLowerCase(); } catch { return v.toLowerCase(); }
};

export const targetOf = (input: Record<string, unknown>): string | undefined =>
  firstString(input, ['transport', 'transport_number', 'transportNumber', 'request', 'number']) ?? objectKey(input);

export function globMatch(pattern: string, value: string): boolean {
  const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
  return re.test(value);
}

export function derivePackage(input: Record<string, unknown>, evidence: Record<string, Evidence>): string | undefined {
  const direct = firstString(input, ['package', 'devclass', 'package_name', 'packageName']);
  if (direct) return direct;
  const key = objectKey(input);
  if (key) {
    const m = key.match(/\/packages\/([^/?#]+)/);
    if (m) return m[1].toUpperCase();
    if (evidence[key]?.package) return evidence[key].package;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// RunQuery inspection
// ---------------------------------------------------------------------------

const FORBIDDEN_SQL = /\b(INSERT|UPDATE|DELETE|MODIFY|COMMIT|CALL|DROP|CREATE|ALTER|TRUNCATE|MERGE|UPSERT|GRANT|REVOKE|EXEC|EXECUTE)\b/i;

/** Returns null when the query is a single read-only SELECT, else a deny reason. */
export function inspectQuery(sql: unknown): string | null {
  if (typeof sql !== 'string') return 'RunQuery without a SQL string';
  let out = '';
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === '-' && sql[i + 1] === '-') { while (i < sql.length && sql[i] !== '\n') i++; out += ' '; continue; }
    if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      if (end < 0) return 'unterminated comment';
      i = end + 1; out += ' '; continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const end = sql.indexOf(c, i + 1);
      if (end < 0) return 'unterminated quote';
      out += c + c; i = end; continue;
    }
    out += c;
  }
  // ABAP full-line comments (`*` in column 1)
  out = out.split('\n').filter((l) => !l.startsWith('*')).join('\n').trim().replace(/;+\s*$/, '').trim();
  if (!out) return 'empty query';
  if (out.includes(';')) return 'multiple statements';
  if (!/^SELECT\b/i.test(out)) return 'only SELECT is allowed';
  const bad = out.match(FORBIDDEN_SQL);
  if (bad) return `forbidden keyword ${bad[1].toUpperCase()}`;
  return null;
}

// ---------------------------------------------------------------------------
// Evidence store, audit log, approvals
// ---------------------------------------------------------------------------

export const auditDir = (root: string) => join(root, 'memory', 'audit');

export function readEvidence(root: string): Record<string, Evidence> {
  try {
    const raw = JSON.parse(readFileSync(join(auditDir(root), 'sap-evidence.json'), 'utf-8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}

export function writeEvidence(root: string, ev: Record<string, Evidence>): void {
  mkdirSync(auditDir(root), { recursive: true });
  const f = join(auditDir(root), 'sap-evidence.json');
  writeFileSync(f + '.tmp', JSON.stringify(ev, null, 2));
  renameSync(f + '.tmp', f);
}

export function recomputeStatus(e: Evidence): Evidence['status'] {
  if (Object.values(e.chain).some((c) => c.result === 'fail' && (!e.lastWriteTs || c.ts > e.lastWriteTs))) return 'failed';
  const ok = CHAIN.every((t) => e.chain[t]?.result === 'pass' && (!e.lastWriteTs || e.chain[t].ts > e.lastWriteTs));
  return ok ? 'passed' : 'pending';
}

export interface AuditRecord {
  ts: string; sessionId: string; actor: string; tool: string; class: string; decision: string;
  object?: string; package?: string; inputHash: string; beforeHash?: string; afterHash?: string;
  qaResult?: string; approver?: string; transport?: string; profile: string; reason?: string;
  taskId?: string; specId?: string;
}

export function appendAudit(root: string, rec: AuditRecord): void {
  mkdirSync(auditDir(root), { recursive: true });
  const taskId = process.env.HARNESS_TASK_ID?.trim();
  const specId = process.env.HARNESS_SPEC_ID?.trim();
  const full = { ...rec, ...(taskId ? { taskId } : {}), ...(specId ? { specId } : {}) };
  appendFileSync(join(auditDir(root), `sap-actions-${rec.ts.slice(0, 7)}.jsonl`), JSON.stringify(full) + '\n');
}

export const profileOf = (): string => (process.env.HARNESS_PROFILE === 'manual' ? 'manual' : 'hooked');
export const actorOf = (i: HookInput): string => i.agent_name || i.agent_type || 'main';

export interface Approval { tool: string; target: string; approver?: string; expires: string; token?: string }

const safeSession = (s: string | undefined): string => (s ?? 'unknown').replace(/[^A-Za-z0-9_-]/g, '_');
export const approvalFile = (root: string, policy: Policy, sessionId?: string) =>
  join(root, policy.approval.dir, `${safeSession(sessionId)}.json`);

export function readApprovals(root: string, policy: Policy, sessionId?: string): Approval[] {
  try {
    const raw = JSON.parse(readFileSync(approvalFile(root, policy, sessionId), 'utf-8'));
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.approvals) ? raw.approvals : [raw];
    return list.filter((a: any) => a && typeof a.tool === 'string' && typeof a.target === 'string' && typeof a.expires === 'string');
  } catch { return []; }
}

export function findApproval(
  root: string, policy: Policy, sessionId: string | undefined, tool: string, target: string | undefined, now: Date,
): { approval: Approval; index: number } | null {
  if (!target) return null;
  const list = readApprovals(root, policy, sessionId);
  const envTok = process.env[policy.approval.envVar];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    const exp = Date.parse(a.expires);
    if (a.tool.toLowerCase() !== tool.toLowerCase() || a.target.toLowerCase() !== target.toLowerCase()) continue;
    if (!Number.isFinite(exp) || exp <= now.getTime()) continue;
    if (a.token && a.token !== envTok) continue;
    return { approval: a, index: i };
  }
  return null;
}

export function consumeApproval(root: string, policy: Policy, sessionId: string | undefined, index: number): void {
  const f = approvalFile(root, policy, sessionId);
  if (!existsSync(f)) return;
  const list = readApprovals(root, policy, sessionId);
  list.splice(index, 1);
  writeFileSync(f, JSON.stringify({ approvals: list }, null, 2));
}
