/**
 * sap-action-lib.ts — Shared logic for the SAP write safety gate and audit hooks.
 * Design: docs/designs/2026-10-10-sap-write-safety-gate-design.md
 * Used by hooks/sap-action-gate.ts (PreToolUse) and hooks/sap-action-audit.ts (PostToolUse).
 * Audit records store hashes only: never source text, SQL rows, tokens or credentials.
 *
 * @version 1.1.0
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
  hyperfocused?: HfPolicy;
}

/** Hyperfocused-mode (single `SAP` tool) action map; data lives in config/sap-action-policy.json. */
export interface HfSub {
  class: Cls; canonical?: string; evidence?: string[];
  evidenceIfParam?: Record<string, string[]>; write?: boolean;
}
export interface HfAction {
  class: Cls; sql?: boolean; subFrom?: string[]; subDefault?: string; defaultNeedsTarget?: boolean;
  unknown?: 'default' | 'ask' | 'r3pattern'; sub?: Record<string, Cls | HfSub>;
}
export interface HfPolicy {
  actions: Record<string, Cls | HfAction>;
  packageKeys: string[]; urlTypes: Record<string, string>; limuTypes: Record<string, string>;
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
  if (p.hyperfocused !== undefined) {
    const h = p.hyperfocused;
    const isCls = (c: unknown) => c === 'R0' || c === 'R1' || c === 'R2' || c === 'R3';
    if (!h || typeof h.actions !== 'object' || !isStrArr(h.packageKeys)) fail('hyperfocused');
    if (typeof h.urlTypes !== 'object' || typeof h.limuTypes !== 'object') fail('hyperfocused maps');
    for (const [a, v] of Object.entries<any>(h.actions)) {
      if (!(isCls(v) || isCls(v?.class))) fail(`hyperfocused.actions.${a}`);
      for (const [n, sv] of Object.entries<any>(v?.sub ?? {})) {
        if (!(isCls(sv) || isCls(sv?.class))) fail(`hyperfocused.actions.${a}.sub.${n}`);
      }
    }
  }
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
// Hyperfocused mode: SAP { action, target, params }
// ---------------------------------------------------------------------------

export const isHyperfocused = (toolName: string): boolean =>
  toolName.startsWith(TOOL_PREFIX) && toolName.slice(TOOL_PREFIX.length).toLowerCase() === 'sap';

export interface HfResolved {
  cls: Cls | null;
  /** Name used for approvals and the audit log, e.g. `edit`, `system.delete_transport`, `ReleaseTransport`. */
  tool: string;
  action: string;
  sub?: string;
  deny?: string;
  ask?: string;
  evidence: string[];
  write: boolean;
  /** Normalized object identities ("TYPE NAME"), used as evidence-store keys. */
  keys: string[];
  packages: string[];
  transport?: string;
  /** Target for single-use approvals. */
  approvalTarget?: string;
  /** Transport objects named in the call (add/remove/move). */
  objects: string[];
  rawSql?: string[];
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

function hfParams(raw: Record<string, unknown>): Record<string, unknown> {
  let p = raw.params;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = undefined; } }
  return p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : {};
}

/** "CLAS ZCL_A", "CLAS/OC ZCL_A", an ADT URL or "R3TR PROG ZX" to a normalized "TYPE NAME" key. */
export function normalizeObjectKey(v: string, hf?: HfPolicy): string | undefined {
  const t = v.trim();
  if (!t) return undefined;
  if (t.startsWith('/')) {
    let u = t.toLowerCase();
    try { u = decodeURIComponent(u); } catch { /* keep raw */ }
    const m = u.match(/^\/sap\/bc\/adt\/(.+?)(?:[?#].*)?$/);
    if (m) {
      for (const [prefix, type] of Object.entries(hf?.urlTypes ?? {})) {
        const mm = m[1].match(new RegExp('^' + prefix.replace(/[.+?^${}()|[\]\\]/g, '\\$&') + '/([^/]+)'));
        if (mm) return `${type} ${mm[1].toUpperCase()}`;
      }
    }
    return u;
  }
  const parts = t.split(/\s+/);
  if (parts.length === 3 && /^(R3TR|LIMU)$/i.test(parts[0])) {
    const type = parts[1].toUpperCase();
    return `${hf?.limuTypes?.[type] ?? type} ${parts[2].toUpperCase()}`;
  }
  const m = t.match(/^([A-Za-z]{3,4})(?:\/[A-Za-z]+)?\s+(\S+)$/);
  return m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : undefined;
}

function hfKeys(target: string | undefined, p: Record<string, unknown>, hf?: HfPolicy): string[] {
  const out: string[] = [];
  const add = (v: unknown) => { const s = str(v); const k = s ? normalizeObjectKey(s, hf) : undefined; if (k && !out.includes(k)) out.push(k); };
  if (target && /\s/.test(target)) add(target);
  for (const k of ['object_url', 'object_uri', 'class_url', 'source_url', 'url', 'object']) add(p[k]);
  const ot = str(p.object_type), on = str(p.name) ?? str(p.object_name);
  if (ot && on) add(`${ot} ${on}`);
  if (str(p.class_name)) add(`CLAS ${str(p.class_name)}`);
  if (str(p.program_name)) add(`PROG ${str(p.program_name)}`);
  const fp = str(p.file_path)?.match(/([^/\\]+)\.([a-z]{3,4})\.[^/\\]*$/i);
  if (fp) add(`${fp[2]} ${fp[1]}`);
  return out;
}

function listOf(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim());
  const s = str(v);
  return s ? [s] : [];
}

/** Resolve a hyperfocused `SAP` call to a risk class using policy.hyperfocused. */
export function resolveHyperfocused(raw: unknown, policy: Policy): HfResolved {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const p = hfParams(input);
  const target = str(input.target);
  const base: HfResolved = { cls: null, tool: 'SAP', action: '', evidence: [], write: true, keys: [], packages: [], objects: [] };
  const hf = policy.hyperfocused;
  if (!hf) return { ...base, ask: 'policy has no hyperfocused map' };
  // SAP() with no arguments is documented as "info".
  const rawAction = input.action === undefined && !target && Object.keys(p).length === 0 ? 'info' : input.action;
  if (typeof rawAction !== 'string' || !rawAction.trim()) return { ...base, ask: 'SAP action missing or not a string' };
  const action = rawAction.trim().toLowerCase();
  const out: HfResolved = { ...base, action, tool: action };
  const entry = Object.prototype.hasOwnProperty.call(hf.actions, action) ? hf.actions[action] : undefined;
  if (!entry) return { ...out, ask: `unclassified SAP action "${action}"` };
  const cfg: HfAction = typeof entry === 'string' ? { class: entry } : entry;

  out.keys = hfKeys(target, p, hf);
  out.transport = firstString(p, ['transport', 'transport_number', 'transportNumber', 'request']);
  for (const k of hf.packageKeys) {
    for (const v of listOf(p[k])) for (const piece of v.split(',')) if (piece.trim()) out.packages.push(piece.trim());
  }
  const tparts = target?.split(/\s+/) ?? [];
  if (!out.packages.length && tparts[0]?.toUpperCase() === 'DEVC' && tparts[1]) out.packages.push(tparts[1]);
  if (!out.packages.length && target?.toUpperCase() === 'DEVC' && str(p.name)) out.packages.push(str(p.name)!);
  for (const k of ['objects', 'object']) for (const o of listOf(p[k])) {
    const nk = normalizeObjectKey(o, hf); if (nk) out.objects.push(nk);
  }

  let cls: Cls = cfg.class;
  let sub: HfSub | undefined;
  if (cfg.sql) {
    // query: a single SELECT is R0, anything else is denied. A statement in params wins over target.
    const stmts = ['sql_query', 'sql', 'query', 'statement'].map((k) => str(p[k])).filter((x): x is string => !!x);
    const tw = target?.toUpperCase();
    if (stmts.length === 0 && target && tw !== 'SQL' && !/^TABL_CONTENTS\b/.test(tw!)) stmts.push(target);
    if (stmts.length === 0 && tw === 'SQL') return { ...out, cls: 'R0', deny: 'query rejected: SQL target without a SQL string' };
    for (const sql of stmts) {
      const bad = inspectQuery(sql);
      if (bad) return { ...out, cls: 'R0', deny: `query rejected: ${bad}` };
    }
    if (stmts.length === 0 && !/^TABL_CONTENTS\b/.test(tw ?? '')) return { ...out, ask: 'query without a table or SQL statement' };
    out.cls = 'R0';
    return out;
  }
  if (cfg.subFrom) {
    let name: string | undefined;
    for (const k of cfg.subFrom) {
      const v = k === 'target' ? (target && !/\s/.test(target) ? target : undefined) : str(p[k]);
      if (v) { name = v.toLowerCase(); break; }
    }
    if (!name && cfg.subDefault && (!cfg.defaultNeedsTarget || target)) name = cfg.subDefault;
    const known = name && cfg.sub && Object.prototype.hasOwnProperty.call(cfg.sub, name) ? cfg.sub[name] : undefined;
    if (known) {
      sub = typeof known === 'string' ? { class: known } : known;
      cls = sub.class;
      out.sub = name;
      out.tool = `${action}.${name}`;
      if (sub.canonical) out.tool = sub.canonical;
    } else if (cfg.unknown === 'ask' || (cfg.unknown === 'r3pattern' && !(name && policy.r3Patterns.some((r) => new RegExp(r, 'i').test(name!))))) {
      return { ...out, ask: `unclassified SAP ${action} sub-type${name ? ` "${name}"` : ''}` };
    } else if (cfg.unknown === 'r3pattern') {
      cls = 'R3'; out.sub = name; out.tool = `${action}.${name}`;
    }
  }
  out.cls = cls;
  out.write = sub?.write ?? true;
  if (sub) {
    out.evidence = [...(sub.evidence ?? [])];
    for (const [param, steps] of Object.entries(sub.evidenceIfParam ?? {})) {
      if (p[param] === true || p[param] === 'true') for (const st of steps) if (!out.evidence.includes(st)) out.evidence.push(st);
    }
  }
  out.approvalTarget = out.transport ?? out.keys[0] ?? str(p.function) ?? str(p.report) ?? target ?? str(p.job);
  return out;
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
