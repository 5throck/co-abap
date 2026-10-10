/**
 * Shared secret-pattern list (single source of truth, review finding M-6).
 *
 * Consumers: scripts/hooks/pre-commit.ts, scripts/hooks/pre-push.ts.
 * .githooks/pre-rebase keeps a shell ERE copy built from SECRET_ERE below —
 * keep it in sync when editing this file.
 */

/** Token-shaped patterns (no assignment heuristics). */
export const TOKEN_PATTERNS: RegExp[] = [
  /AKIA[0-9A-Z]{16}/,
  /ghp_[0-9a-zA-Z]{36}/,
  /gho_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /sk-ant-[a-zA-Z0-9\-_]{20,}/,
  /sk-proj-[a-zA-Z0-9\-_]{20,}/,
  /sk-[0-9a-zA-Z]{48}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/,
];

/** Credential-assignment heuristic (diff-added lines only). */
export const ASSIGNMENT_PATTERN =
  /(password|passwd|secret|api_key|apikey|access_token|auth_token)\s*=\s*['"][^'"]{8,}['"]/i;

export const SECRET_PATTERNS: RegExp[] = [ASSIGNMENT_PATTERN, ...TOKEN_PATTERNS];

/** POSIX ERE alternation of TOKEN_PATTERNS for `git grep -E` (pre-push, pre-rebase). */
export const SECRET_ERE =
  'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|' +
  'sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[0-9A-Za-z]{48}|' +
  'xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN ([A-Z]+ )?PRIVATE KEY-----';
