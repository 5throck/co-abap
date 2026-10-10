/** @version 1.0.0 */
import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkInstructions, checkMcp, checkSchema, checkSkills, INSTRUCTION_FILES, SECTIONS } from '../validate-platform-parity.ts';

function fx(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'parity-'));
  for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); }
  return root;
}
const proxied = JSON.stringify({ mcpServers: { abap: { command: 'bun', args: ['scripts/sap-mcp-proxy.ts', '--', '--mode', 'hyperfocused'] } } });
const direct = JSON.stringify({ mcpServers: { abap: { command: './vsp', args: ['--mode', 'hyperfocused'] } } });
const toml = '[mcp_servers.abap]\ncommand = "bun"\nargs = ["scripts/sap-mcp-proxy.ts", "--"]\n';
const yaml = 'mcp_servers:\n  abap:\n    command: bun\n    args: ["scripts/sap-mcp-proxy.ts", "--"]\n';
const allMcp = { '.mcp.json': proxied, '.gemini/settings.json': proxied, '.agents/mcp.json': proxied, '.codex/config.toml': toml, 'config/platforms/hermes-mcp.example.yaml': yaml };

describe('checkMcp', () => {
  test('passes when all route through proxy', () => {
    const r = fx(allMcp); try { expect(checkMcp(r).problems).toEqual([]); } finally { rmSync(r, { recursive: true, force: true }); }
  });
  test('fails on direct vsp, missing file, and missing abap', () => {
    const r = fx({ ...allMcp, '.mcp.json': direct, '.codex/config.toml': '[mcp_servers.abap]\ncommand = "./vsp"\n', '.agents/mcp.json': '{"mcpServers":{}}' });
    try {
      const p = checkMcp(r).problems.join('\n');
      expect(p).toContain('.mcp.json: abap server does not route');
      expect(p).toContain('.mcp.json: server "abap" launches vsp directly');
      expect(p).toContain('.codex/config.toml: abap server does not route');
      expect(p).toContain('.agents/mcp.json: no abap server entry');
    } finally { rmSync(r, { recursive: true, force: true }); }
    const empty = fx({}); try { expect(checkMcp(empty).problems.some(x => x.includes('missing'))).toBe(true); } finally { rmSync(empty, { recursive: true, force: true }); }
  });
});

describe('checkInstructions', () => {
  test('data-driven sections', () => {
    const full = SECTIONS.map(s => `${s.id}: sap-mcp-proxy sap-approve parallel dispatch`).join('\n');
    const files = Object.fromEntries(INSTRUCTION_FILES.map(f => [f, full]));
    const r = fx({ ...files, 'GEMINI.md': 'nothing' });
    try {
      const res = checkInstructions(r);
      expect(res.ok).toBe(false);
      expect(res.problems.every(p => p.startsWith('GEMINI.md'))).toBe(true);
      expect(res.problems).toHaveLength(SECTIONS.length);
    } finally { rmSync(r, { recursive: true, force: true }); }
  });
});

describe('checkSkills / checkSchema', () => {
  test('detects differing and missing mirror files', () => {
    const r = fx({ 'skills/a/SKILL.md': 'x', 'skills/SKILLS.md': 'idx', '.claude/skills/a/SKILL.md': 'x', '.codex/skills/a/SKILL.md': 'CHANGED' });
    try {
      const p = checkSkills(r).problems.join('\n');
      expect(p).toContain('.codex/skills: 1 file(s) differ');
      expect(p).toContain('.gemini/skills: missing');
      expect(p).not.toContain('.claude/skills');
    } finally { rmSync(r, { recursive: true, force: true }); }
  });
  test('schema requires hermes', () => {
    const t = { high: 'a', medium: 'b', low: 'c' };
    const r = fx({ 'docs/workspace-schema.json': JSON.stringify({ models: { claude: t, codex: t, gemini: t, 'gemini-cli': t, antigravity: t } }) });
    try { expect(checkSchema(r).problems).toContain('models.hermes.high missing'); } finally { rmSync(r, { recursive: true, force: true }); }
  });
});
