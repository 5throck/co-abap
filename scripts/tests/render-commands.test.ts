/** @version 1.0.0 */
import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderGeminiToml, splitFrontmatter, sync } from '../render-commands.ts';

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'render-'));
  mkdirSync(join(root, 'config', 'commands'), { recursive: true });
  for (const [n, c] of Object.entries(files)) writeFileSync(join(root, 'config', 'commands', n), c);
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
    expect(renderGeminiToml('c', "it's '''x'''\\n")).toContain('"""');
  });

  test('sync writes three surfaces, check detects drift, orphans removed', () => {
    const root = fixture({ 'a.md': 'First line\n\nArgs: $ARGUMENTS\n', 'b.md': '---\ngemini-parity: skip # claude only\n---\nB\n' });
    try {
      expect(sync(root, true).length).toBeGreaterThan(0);
      expect(sync(root, false)).toEqual([]);
      expect(readFileSync(join(root, '.gemini', 'commands', 'a.toml'), 'utf-8')).toContain('{{args}}');
      expect(readFileSync(join(root, '.codex', 'prompts', 'a.md'), 'utf-8')).toContain('$ARGUMENTS');
      expect(() => readFileSync(join(root, '.gemini', 'commands', 'b.toml'))).toThrow();
      writeFileSync(join(root, '.claude', 'commands', 'a.md'), 'edited');
      writeFileSync(join(root, '.gemini', 'commands', 'old.md'), 'legacy');
      const drift = sync(root, false);
      expect(drift).toContain('stale: .claude/commands/a.md');
      expect(drift).toContain('orphan: .gemini/commands/old.md');
      sync(root, true);
      expect(sync(root, false)).toEqual([]);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});

describe('repository commands', () => {
  test('repo is in sync with config/commands', () => {
    expect(sync(join(import.meta.dir, '..', '..'), false)).toEqual([]);
  });
});
