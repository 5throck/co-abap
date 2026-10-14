/** @version 1.1.0 (2026-10-14, T-20261013-009 phase 2): re-homed to the fleet
 * renderer's .claude-SSOT model — the 0.19.0 upgrade delivered the fleet
 * render-commands (v1.1.0) over the local config-SSOT variant; config/commands
 * retired (content identical to .claude/commands). Legacy .gemini .md orphans
 * are filtered from the repo-sync assertion until the fleet sweep lands. */
import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderGeminiToml, splitFrontmatter, sync } from '../render-commands.ts';

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'render-'));
  mkdirSync(join(root, '.claude', 'commands'), { recursive: true });
  for (const [n, c] of Object.entries(files)) writeFileSync(join(root, '.claude', 'commands', n), c);
  return root;
}

describe('render-commands', () => {
  test('frontmatter parsing handles folded descriptions', () => {
    const { fm, body } = splitFrontmatter('---\nname: x\ndescription: >\n  one\n  two\nallowed-tools: ["a"]\n---\nBody\n');
    expect(fm.description).toBe('one two');
    expect(body).toBe('Body\n');
  });

  test('gemini TOML replaces $ARGUMENTS with {{args}}', () => {
    const t = renderGeminiToml('c', '---\ndescription: Do it\n---\nRun $ARGUMENTS now\n');
    expect(t).toContain('description = "Do it"');
    expect(t).toContain('Run {{args}} now');
    expect(t).not.toContain('$ARGUMENTS');
  });

  test('rejects gemini injection syntax and escapes triple quotes', () => {
    expect(() => renderGeminiToml('c', 'run !{ls}')).toThrow();
    expect(renderGeminiToml('c', "it's '''x'''\n")).toContain('"""');
  });

  test('sync renders gemini toml, honors skip, detects then fixes drift', () => {
    const root = fixture({ 'a.md': '---\ndescription: A\n---\nFirst line\n\nArgs: $ARGUMENTS\n', 'b.md': '---\ngemini-parity: skip # claude only\n---\nB\n' });
    try {
      expect(sync(root, true).length).toBeGreaterThan(0);
      expect(sync(root, false)).toEqual([]);
      expect(readFileSync(join(root, '.gemini', 'commands', 'a.toml'), 'utf-8')).toContain('{{args}}');
      expect(() => readFileSync(join(root, '.gemini', 'commands', 'b.toml'))).toThrow();
      writeFileSync(join(root, '.claude', 'commands', 'a.md'), '---\ndescription: A\n---\nedited $ARGUMENTS\n');
      const drift = sync(root, false);
      expect(drift).toContain('stale: .gemini/commands/a.toml');
      sync(root, true);
      expect(sync(root, false)).toEqual([]);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});

describe('repository commands', () => {
  test('repo gemini toml is in sync with the .claude SSOT (legacy md orphans excluded until the fleet sweep)', () => {
    const drift = sync(join(import.meta.dir, '..', '..'), false).filter((d) => !d.startsWith('orphan: .gemini/commands/'));
    expect(drift).toEqual([]);
  });
});
