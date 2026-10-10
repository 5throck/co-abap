/**
 * @version 1.0.0
 */
import { describe, expect, test } from 'bun:test';
import { checkChangelogEntries, checkChangelogStructure, checkFileMeta, parseFrontmatter, stripDateLines } from '../check-project-meta.ts';

describe('changelog structure', () => {
  test('passes with one first Unreleased', () => {
    expect(checkChangelogStructure('# C\n\n## [Unreleased]\n- x\n\n## [1.0.0]\n').status).toBe('PASS');
  });
  test('fails on duplicate Unreleased', () => {
    expect(checkChangelogStructure('## [Unreleased]\n## [Unreleased]\n').status).toBe('FAIL');
  });
  test('fails when a release precedes Unreleased', () => {
    expect(checkChangelogStructure('## [1.0.0]\n## [Unreleased]\n').status).toBe('FAIL');
  });
  test('fails when missing', () => {
    expect(checkChangelogStructure('# C\n').status).toBe('FAIL');
  });
});

describe('changelog entries', () => {
  test('grandfathers old flat entries', () => {
    expect(checkChangelogEntries('## [Unreleased]\n- **[2026-10-10]**: old\n').status).toBe('PASS');
  });
  test('new entry needs subheading and PR ref', () => {
    const r = checkChangelogEntries('## [Unreleased]\n- **[2026-10-11]**: new\n');
    expect(r.status).toBe('FAIL');
    expect(r.details.length).toBe(2);
  });
  test('compliant new entry passes', () => {
    expect(checkChangelogEntries('## [Unreleased]\n### Added\n- **[2026-10-11]**: new (#12)\n## [1.0.0]\n').status).toBe('PASS');
  });
  test('unknown subheading fails', () => {
    expect(checkChangelogEntries('## [Unreleased]\n### Misc\n').status).toBe('FAIL');
  });
  test('ignores entries after Unreleased section', () => {
    expect(checkChangelogEntries('## [Unreleased]\n## [1.0.0]\n- **[2026-10-12]**: x\n').status).toBe('PASS');
  });
});

const fm = (v: string, d: string) => `---\nname: a\nversion: "${v}"\nlast_updated: "${d}"\nlifecycle:\n  phase: x\n  last_updated: "${d}"\n---\nbody\n`;

describe('frontmatter metadata', () => {
  test('parses version and dates', () => {
    expect(parseFrontmatter(fm('1.0.1', '2026-10-10'))).toEqual({
      version: '1.0.1', last_updated: '2026-10-10', 'lifecycle.last_updated': '2026-10-10',
    });
  });
  test('flags unchanged version', () => {
    expect(checkFileMeta('agents/a.md', fm('1.0.0', '2026-10-10') + 'more\n', fm('1.0.0', '2026-10-01'), '2026-10-10')).toHaveLength(1);
  });
  test('date-only diff needs no version bump', () => {
    expect(checkFileMeta('agents/a.md', fm('1.0.0', '2026-10-10'), fm('1.0.0', '2026-10-01'), '2026-10-10')).toEqual([]);
    expect(stripDateLines('last_reviewed: x\nkeep')).toBe('keep');
  });
  test('flags stale last_updated', () => {
    expect(checkFileMeta('agents/a.md', fm('1.1.0', '2026-10-01'), fm('1.0.0', '2026-09-01'), '2026-10-10')).toHaveLength(2);
  });
  test('passes bumped and fresh; skips files without fields', () => {
    expect(checkFileMeta('agents/a.md', fm('1.1.0', '2026-10-10'), fm('1.0.0', '2026-09-01'), '2026-10-10')).toEqual([]);
    expect(checkFileMeta('agents/b.md', 'no frontmatter', 'x', '2026-10-10')).toEqual([]);
  });
});
