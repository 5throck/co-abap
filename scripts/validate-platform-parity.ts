#!/usr/bin/env bun
/**
 * Platform Parity Validator
 * @version 1.0.0
 *
 * Checks cross-platform parity (docs/designs/2026-10-10-cross-platform-parity-design.md):
 *   (a) rendered commands are in sync with config/commands (render-commands --check)
 *   (b) every platform MCP config routes `abap` through sap-mcp-proxy.ts, no direct vsp server entry
 *   (c) instruction files contain the required parity sections (data-driven, SECTIONS below)
 *   (d) skills mirrors are identical to skills/
 *   (e) docs/workspace-schema.json has high/medium/low model mappings for all platforms
 *
 * Usage: bun scripts/validate-platform-parity.ts [--root <dir>]
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { sync as syncCommands } from './render-commands.ts';

export interface CheckResult { id: string; ok: boolean; problems: string[] }

/** MCP configs that must route `abap` through the proxy. */
export const MCP_CONFIGS: Array<{ file: string; kind: 'json' | 'toml' | 'yaml' }> = [
  { file: '.mcp.json', kind: 'json' },
  { file: '.codex/config.toml', kind: 'toml' },
  { file: '.gemini/settings.json', kind: 'json' },
  { file: '.agents/mcp.json', kind: 'json' },
  { file: 'config/platforms/hermes-mcp.example.yaml', kind: 'yaml' },
];

/** Required sections for every instruction file; extend this table, not the code. */
export const INSTRUCTION_FILES = ['CLAUDE.md', 'CODEX.md', 'GEMINI.md', 'HERMES.md'];
export const SECTIONS: Array<{ id: string; description: string; pattern: RegExp }> = [
  { id: 'sap-safety-proxy', description: 'SAP safety via sap-mcp-proxy', pattern: /sap-mcp-proxy/ },
  { id: 'parallel-dispatch', description: 'parallel dispatch mechanism', pattern: /parallel[^\n]{0,80}dispatch|dispatch[^\n]{0,80}parallel|dispatch-parallel/i },
  { id: 'approval-cli', description: 'approval CLI (sap-approve)', pattern: /sap-approve/ },
];

export const SKILL_MIRRORS = ['.claude/skills', '.codex/skills', '.gemini/skills', '.agents/skills', '.hermes/skills'];
export const SCHEMA_PLATFORMS = ['claude', 'codex', 'gemini', 'gemini-cli', 'antigravity', 'hermes'];
const TIERS = ['high', 'medium', 'low'];

const isProxy = (s: string) => /sap-mcp-proxy/.test(s);
const isVspToken = (s: string) => /^vsp(\.exe)?$/.test(basename(s.trim().replace(/^["']|["']$/g, '')));

function checkServerArgv(name: string, argv: string[], problems: string[], file: string): void {
  const viaProxy = argv.some(isProxy);
  if (name === 'abap' && !viaProxy) problems.push(`${file}: abap server does not route through sap-mcp-proxy.ts`);
  if (!viaProxy && argv.some(isVspToken)) problems.push(`${file}: server "${name}" launches vsp directly`);
}

export function checkMcp(root: string): CheckResult {
  const problems: string[] = [];
  for (const { file, kind } of MCP_CONFIGS) {
    const abs = join(root, file);
    if (!existsSync(abs)) { problems.push(`${file}: missing`); continue; }
    const text = readFileSync(abs, 'utf-8');
    try {
      if (kind === 'json') {
        const servers = JSON.parse(text).mcpServers ?? {};
        if (!servers.abap) problems.push(`${file}: no abap server entry`);
        for (const [n, v] of Object.entries<any>(servers)) checkServerArgv(n, [String(v.command ?? ''), ...(v.args ?? []).map(String)], problems, file);
      } else if (kind === 'toml') {
        const blocks = text.split(/^\[(?:\[)?/m).slice(1).map(b => ({ header: b.split('\n')[0], body: b }));
        const abap = blocks.find(b => /^mcp_servers\.abap\]/.test(b.header));
        if (!abap) problems.push(`${file}: no [mcp_servers.abap] entry`);
        for (const b of blocks) {
          const m = b.header.match(/^mcp_servers\.([A-Za-z0-9_-]+)\]/);
          if (m) checkServerArgv(m[1], b.body.split(/[\s,\[\]"']+/).filter(Boolean), problems, file);
        }
      } else {
        const lines = text.split('\n');
        const idx = lines.findIndex(l => /^\s*abap:\s*$/.test(l));
        if (idx < 0) { problems.push(`${file}: no abap server entry`); continue; }
        const indent = lines[idx].match(/^\s*/)![0].length;
        const body: string[] = [];
        for (let i = idx + 1; i < lines.length && (lines[i].trim() === '' || lines[i].match(/^\s*/)![0].length > indent); i++) body.push(lines[i]);
        const toks = body.join(' ').split(/[\s,\[\]"']+/).filter(Boolean);
        checkServerArgv('abap', toks, problems, file);
        // Any other server block launching vsp directly
        const rest = [...lines.slice(0, idx), ...lines.slice(idx + 1 + body.length)].filter(l => !l.trim().startsWith('#')).join(' ');
        const others = rest.split(/[\s,\[\]"']+/).filter(Boolean);
        if (!others.some(isProxy) && others.some(isVspToken)) problems.push(`${file}: a server launches vsp directly`);
      }
    } catch (e) {
      problems.push(`${file}: cannot parse (${e instanceof Error ? e.message : e})`);
    }
  }
  return { id: 'mcp-proxy-routing', ok: problems.length === 0, problems };
}

export function checkInstructions(root: string): CheckResult {
  const problems: string[] = [];
  for (const f of INSTRUCTION_FILES) {
    const abs = join(root, f);
    if (!existsSync(abs)) { problems.push(`${f}: missing`); continue; }
    const text = readFileSync(abs, 'utf-8');
    for (const s of SECTIONS) if (!s.pattern.test(text)) problems.push(`${f}: missing section "${s.description}" (${s.id})`);
  }
  return { id: 'instruction-sections', ok: problems.length === 0, problems };
}

/** Hashes files inside skill directories only (root-level index/manifest files are mirror-specific). */
function treeHashes(dir: string, base = dir, out: Record<string, string> = {}): Record<string, string> {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) treeHashes(p, base, out);
    else if (dir !== base) out[p.slice(base.length + 1)] = createHash('sha1').update(readFileSync(p)).digest('hex');
  }
  return out;
}

export function checkSkills(root: string): CheckResult {
  const problems: string[] = [];
  const src = join(root, 'skills');
  if (!existsSync(src)) return { id: 'skills-mirrors', ok: false, problems: ['skills/: missing'] };
  const want = treeHashes(src);
  for (const m of SKILL_MIRRORS) {
    const abs = join(root, m);
    if (!existsSync(abs)) { problems.push(`${m}: missing`); continue; }
    const got = treeHashes(abs);
    const missing = Object.keys(want).filter(k => !(k in got));
    const extra = Object.keys(got).filter(k => !(k in want));
    const differ = Object.keys(want).filter(k => k in got && got[k] !== want[k]);
    const fmt = (l: string[]) => l.slice(0, 3).join(', ') + (l.length > 3 ? ` (+${l.length - 3})` : '');
    if (missing.length) problems.push(`${m}: ${missing.length} file(s) missing vs skills/: ${fmt(missing)}`);
    if (extra.length) problems.push(`${m}: ${extra.length} extra file(s): ${fmt(extra)}`);
    if (differ.length) problems.push(`${m}: ${differ.length} file(s) differ: ${fmt(differ)}`);
  }
  return { id: 'skills-mirrors', ok: problems.length === 0, problems };
}

export function checkSchema(root: string): CheckResult {
  const problems: string[] = [];
  const f = join(root, 'docs', 'workspace-schema.json');
  if (!existsSync(f)) return { id: 'schema-models', ok: false, problems: ['docs/workspace-schema.json: missing'] };
  const models = JSON.parse(readFileSync(f, 'utf-8')).models ?? {};
  for (const p of SCHEMA_PLATFORMS) {
    for (const t of TIERS) if (!models[p] || typeof models[p][t] !== 'string' || !models[p][t]) problems.push(`models.${p}.${t} missing`);
  }
  return { id: 'schema-models', ok: problems.length === 0, problems };
}

export function checkCommands(root: string): CheckResult {
  try {
    const drift = syncCommands(root, false);
    return { id: 'commands-rendered', ok: drift.length === 0, problems: drift };
  } catch (e) {
    return { id: 'commands-rendered', ok: false, problems: [e instanceof Error ? e.message : String(e)] };
  }
}

export function runAll(root: string): CheckResult[] {
  return [checkCommands(root), checkMcp(root), checkInstructions(root), checkSkills(root), checkSchema(root)];
}

if (import.meta.main) {
  const i = process.argv.indexOf('--root');
  const root = resolve(i >= 0 ? process.argv[i + 1] : join(import.meta.dir, '..'));
  const results = runAll(root);
  for (const r of results) {
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.id}`);
    for (const p of r.problems) console.log(`    - ${p}`);
  }
  const failed = results.filter(r => !r.ok).length;
  console.log(`Platform parity: ${failed === 0 ? 'PASS' : 'FAIL'} (${failed} failing check(s))`);
  process.exit(failed === 0 ? 0 : 1);
}
