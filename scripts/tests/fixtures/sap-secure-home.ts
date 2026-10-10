// @version 1.0.0
// Test helper: points HOME at a temp dir (never the real ~/.config), creates the approval key there and,
// optionally, signs the integrity manifest for a temp workspace root against this repo's code.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureKey, signManifest } from '../../lib/sap-action-lib.ts';

export const REPO = join(import.meta.dir, '..', '..', '..');

export function secureHome(root: string, opts: { sign?: boolean } = {}): { home: string; restore: () => void } {
  const prev = process.env.HOME;
  const prevKey = process.env.CO_ABAP_APPROVAL_KEY;
  const home = mkdtempSync(join(tmpdir(), 'sap-home-'));
  process.env.HOME = home;
  delete process.env.CO_ABAP_APPROVAL_KEY;
  ensureKey(root);
  if (opts.sign) signManifest(root, REPO, 'test', new Date());
  return {
    home,
    restore: () => {
      if (prev === undefined) delete process.env.HOME; else process.env.HOME = prev;
      if (prevKey !== undefined) process.env.CO_ABAP_APPROVAL_KEY = prevKey;
      rmSync(home, { recursive: true, force: true });
    },
  };
}
