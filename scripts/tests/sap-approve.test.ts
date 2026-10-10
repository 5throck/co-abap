// @version 2.1.0
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  appendAudit, approvalId, approvalsDir, canonicalRoot, consumeProxyApproval, repoHash, createGrantRequest, findGrantByRun, grantApproval,
  grantsDir, inputHash, keyPath, loadPolicy, pendingDir, readPending, revokeGrant, secureDir, signGrant,
  verifyAuditFile, verifyGrant, verifyIntegrity, writePending, loadKey, signManifest,
} from "../lib/sap-action-lib.ts";
import { osUser, run } from "../sap-approve.ts";
import { run as integrityRun } from "../sap-integrity.ts";
import { REPO, secureHome } from "./fixtures/sap-secure-home.ts";

let root: string;
let home: ReturnType<typeof secureHome>;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sap-approve-"));
  mkdirSync(join(root, "config"), { recursive: true });
  cpSync(join(REPO, "config", "sap-action-policy.json"), join(root, "config", "sap-action-policy.json"));
  home = secureHome(root);
});
afterEach(() => { home.restore(); rmSync(root, { recursive: true, force: true }); });

const mk = (now: Date, input: object = { a: 1 }, client = "claude-code") => {
  const policy = loadPolicy(root);
  const hash = inputHash(input);
  const id = approvalId("edit", "CLAS ZCL_A", hash, client);
  writePending(root, policy, { id, tool: "edit", target: "CLAS ZCL_A", class: "R2", inputHash: hash, reason: "r", actor: "t", clientId: client }, now);
  return { policy, hash, id };
};
const typed = (s: string | null) => () => s;

describe("secure store", () => {
  test("lives under HOME, outside the workspace; key is 0600", () => {
    expect(secureDir().startsWith(home.home)).toBe(true);
    expect(approvalsDir(root).startsWith(home.home)).toBe(true);
    expect(pendingDir(root).startsWith(home.home)).toBe(true);
    if (process.platform !== "win32") expect(statSync(keyPath(root)).mode & 0o777).toBe(0o600);
    expect(existsSync(join(root, "memory/audit/approvals"))).toBe(false);
  });
  test("key override must be under HOME", () => {
    process.env.CO_ABAP_APPROVAL_KEY = "/etc/evil.key";
    try { expect(loadKey(root)).toBeNull(); } finally { delete process.env.CO_ABAP_APPROVAL_KEY; }
  });
  test("HOME inside the workspace is refused", () => {
    const prev = process.env.HOME;
    process.env.HOME = join(root, "h");
    try { expect(loadKey(root)).toBeNull(); } finally { process.env.HOME = prev; }
  });
});

describe("canonical repo root (worktrees)", () => {
  test("a git worktree maps to the main checkout's stores", () => {
    const main = join(root, "main");
    mkdirSync(main);
    const git = (args: string[], cwd: string) => Bun.spawnSync(["git", ...args], { cwd, env: { PATH: process.env.PATH ?? "", HOME: home.home } });
    expect(git(["init", "-q"], main).exitCode).toBe(0);
    const wt = join(root, "wt");
    if (git(["worktree", "add", "-q", "--orphan", "-b", "w", wt], main).exitCode !== 0) return; // git too old: skip
    expect(canonicalRoot(wt)).toBe(canonicalRoot(main));
    expect(repoHash(wt)).toBe(repoHash(main));
    expect(grantsDir(wt)).toBe(grantsDir(main));
    expect(canonicalRoot(join(main, "sub-not-top"))).not.toBe(canonicalRoot(main));
  });
});

describe("approval store", () => {
  test("grant then consume exactly once; target compare is case-insensitive", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    grantApproval(root, policy, id, "bob", now);
    expect(consumeProxyApproval(root, "EDIT", "clas zcl_a", hash, "claude-code", now)?.approver).toBe("bob");
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", hash, "claude-code", now)).toBeNull();
    expect(existsSync(join(approvalsDir(root), "used"))).toBe(true);
  });
  test("different hash / tool / target / client do not match", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    grantApproval(root, policy, id, "bob", now);
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", inputHash({ a: 2 }), "claude-code", now)).toBeNull();
    expect(consumeProxyApproval(root, "delete", "CLAS ZCL_A", hash, "claude-code", now)).toBeNull();
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_B", hash, "claude-code", now)).toBeNull();
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", hash, "gemini-cli", now)).toBeNull();
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", hash, "claude-code", now)).not.toBeNull();
  });
  test("forged or tampered approval files are refused (MAC)", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    // forged from scratch without the key
    mkdirSync(approvalsDir(root), { recursive: true });
    const forged = { id, tool: "edit", target: "CLAS ZCL_A", class: "R2", inputHash: hash, clientId: "claude-code", approver: "x", approvedAt: now.toISOString(), expires: new Date(now.getTime() + 6e5).toISOString(), mac: "0".repeat(64) };
    writeFileSync(join(approvalsDir(root), `${id}.json`), JSON.stringify(forged));
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", hash, "claude-code", now)).toBeNull();
    // genuine, then expiry extended
    grantApproval(root, policy, id, "bob", now);
    const f = join(approvalsDir(root), `${id}.json`);
    const a = JSON.parse(readFileSync(f, "utf-8")); a.expires = new Date(now.getTime() + 864e5).toISOString();
    writeFileSync(f, JSON.stringify(a));
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", hash, "claude-code", now)).toBeNull();
  });
  test("tampered pending request is not readable", () => {
    const { id } = mk(new Date());
    const f = join(pendingDir(root), `${id}.json`);
    const p = JSON.parse(readFileSync(f, "utf-8")); p.object = "harmless"; writeFileSync(f, JSON.stringify(p));
    expect(readPending(root, id)).toBeNull();
  });
  test("expiry honours policy.approval.ttlMinutes (default 15)", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    const a = grantApproval(root, policy, id, "bob", now);
    expect(Date.parse(a.expires) - now.getTime()).toBe(15 * 60_000);
    expect(consumeProxyApproval(root, "edit", "CLAS ZCL_A", hash, "claude-code", new Date(now.getTime() + 16 * 60_000))).toBeNull();
    const p2 = { ...policy, approval: { ttlMinutes: 1 } };
    const { id: id2 } = mk(now, { a: 3 });
    expect(Date.parse(grantApproval(root, p2, id2, "bob", now).expires) - now.getTime()).toBe(60_000);
  });
});

describe("CLI run()", () => {
  test("requires typing the id prefix; approver is the OS user", () => {
    const { id } = mk(new Date());
    expect(run([id], root, new Date(), typed(null)).code).toBe(3);
    expect(run([id], root, new Date(), typed("nope")).code).toBe(3);
    expect(run([id], root, new Date(), typed(id)).code).toBe(3); // full id is not the 6-char prefix
    const r = run([id], root, new Date(), typed(id.slice(0, 6)));
    expect(r.code).toBe(0);
    expect(r.out).toContain("CLAS ZCL_A"); expect(r.out).toContain(osUser());
    const d = join(root, "memory/audit");
    const f = readdirSync(d).find((x) => x.endsWith(".jsonl"))!;
    expect(readFileSync(join(d, f), "utf-8")).toContain("approval_granted");
  });
  test("--approver is no longer accepted", () => {
    const { id } = mk(new Date());
    expect(run([id, "--approver", "mallory"], root, new Date(), typed(id.slice(0, 6))).code).toBe(2);
  });
  test("usage and bad options", () => {
    expect(run([], root).code).toBe(2);
    expect(run(["--bogus"], root).code).toBe(2);
  });
  test("source has no non-TTY override", () => {
    expect(readFileSync(join(REPO, "scripts", "sap-approve.ts"), "utf-8")).not.toContain("ALLOW_NON_TTY");
  });
});

describe("audit chain", () => {
  test("HMAC chain detects edits and deletions", () => {
    const ts = "2026-10-10T00:00:00.000Z";
    for (let i = 0; i < 3; i++) appendAudit(root, { ts, sessionId: "s", actor: "a", tool: "t" + i, class: "R0", decision: "allow", inputHash: "h", profile: "proxy" });
    const f = join(root, "memory/audit/sap-actions-2026-10.jsonl");
    const key = loadKey(root)!;
    expect(verifyAuditFile(f, key).ok).toBe(true);
    const lines = readFileSync(f, "utf-8").trim().split("\n");
    writeFileSync(f, [lines[0], lines[2]].join("\n") + "\n");
    expect(verifyAuditFile(f, key).badLine).toBe(2);
    const e = JSON.parse(lines[1]); e.decision = "deny";
    writeFileSync(f, [lines[0], JSON.stringify(e), lines[2]].join("\n") + "\n");
    expect(verifyAuditFile(f, key).ok).toBe(false);
  });
});

describe("integrity manifest", () => {
  test("sign / verify / detect a policy edit; CLI needs typed confirmation", () => {
    expect(verifyIntegrity(root, REPO).ok).toBe(false);
    expect(integrityRun(["sign", "--root", root], REPO, new Date(), typed(null)).code).toBe(3);
    expect(integrityRun(["sign", "--root", root], REPO, new Date(), typed("sign")).code).toBe(0);
    expect(verifyIntegrity(root, REPO).ok).toBe(true);
    expect(integrityRun(["verify", "--root", root], REPO).code).toBe(0);
    const f = join(root, "config", "sap-action-policy.json");
    writeFileSync(f, readFileSync(f, "utf-8").replace('"ReleaseTransport",', '"ReleaseTransportX",'));
    const r = verifyIntegrity(root, REPO);
    expect(r.ok).toBe(false); expect(r.reason).toContain("sap-action-policy.json");
  });
  test("forged manifest signature is rejected", () => {
    const m = signManifest(root, REPO, "t", new Date());
    const p = join(home.home, ".config/co-abap/manifests");
    const file = join(p, readdirSync(p)[0]);
    writeFileSync(file, JSON.stringify({ ...m, signer: "mallory" }));
    expect(verifyIntegrity(root, REPO).reason).toContain("signature");
  });
});

describe("dispatch grants", () => {
  const rows = [
    { row: "1", packages: ["$TMP"], objects: [], actions: ["read", "search"], maxClass: "R0" as const },
    { row: "2", packages: ["Z*"], objects: ["CLAS ZCL_A"], actions: ["edit", "test*", "ReleaseTransport"], maxClass: "R3" as const },
  ];
  const exp = () => new Date(Date.now() + 3600e3).toISOString();
  test("request -> human signs with prefix -> verify in scope; revoke", () => {
    const req = createGrantRequest({ runId: "run-1", rows, expiresAt: exp() }, root);
    expect(findGrantByRun(root, "run-1")).toBeNull(); // unsigned
    expect(verifyGrant(req.grantId, "1", { tool: "read", cls: "R0", packages: [], objects: [] }, root).allow).toBe(false);
    expect(run(["--grant", "run-1"], root, new Date(), typed("xxxxxx")).code).toBe(3);
    const r = run(["--grant", "run-1"], root, new Date(), typed(req.grantId.slice(0, 6)));
    expect(r.code).toBe(0); expect(r.out).toContain("row 2"); expect(r.out).toContain("ReleaseTransport");
    expect(r.out).toContain('WARNING: wildcard action "test*"'); expect(r.out).toContain('WARNING: wildcard package "Z*"');
    expect(findGrantByRun(root, "run-1")?.grantId).toBe(req.grantId);
    expect(findGrantByRun(root, "run-1", new Date(Date.now() + 2 * 3600e3))).toBeNull();
    const v = (row: string, c: any) => verifyGrant(req.grantId, row, c, root);
    expect(v("1", { tool: "read", cls: "R0", packages: [], objects: [] }).allow).toBe(true);
    expect(v("1", { tool: "edit", cls: "R2", packages: ["$TMP"], objects: [] }).allow).toBe(false);
    expect(v("2", { tool: "edit", cls: "R2", packages: ["ZDEMO"], objects: ["CLAS ZCL_A"] }).allow).toBe(true);
    expect(v("2", { tool: "edit", cls: "R2", packages: ["SAPBC"], objects: ["CLAS ZCL_A"] }).allow).toBe(false);
    expect(v("2", { tool: "edit", cls: "R2", packages: [], objects: ["PROG ZR"] }).allow).toBe(false);
    // H1: a caller-supplied in-scope package never authorises another object
    expect(v("2", { tool: "edit", cls: "R2", packages: ["ZALLOWED"], objects: ["CLAS ZCL_OTHER_ROW"] }).allow).toBe(false);
    expect(v("2", { tool: "test", cls: "R1", packages: ["ZALLOWED"], objects: ["CLAS ZCL_OTHER_ROW"] }).allow).toBe(false);
    expect(v("2", { tool: "edit", cls: "R2", packages: [], objects: [] }).allow).toBe(false);
    expect(v("2", { tool: "ReleaseTransport", cls: "R3", packages: ["ZDEMO"], objects: [] }).allow).toBe(true);
    expect(v("2", { tool: "delete", cls: "R3", packages: ["ZDEMO"], objects: [] }).allow).toBe(false);
    expect(v("3", { tool: "read", cls: "R0", packages: [], objects: [] }).allow).toBe(false);
    revokeGrant(req.grantId, root);
    expect(v("1", { tool: "read", cls: "R0", packages: [], objects: [] }).reason).toContain("revoked");
    expect(findGrantByRun(root, "run-1")).toBeNull();
  });
  test("create-type actions may be authorised by package only", () => {
    const req = createGrantRequest({ runId: "run-c", rows: [{ row: "1", packages: ["ZNEW"], objects: [], actions: ["create", "edit"], maxClass: "R2" }], expiresAt: exp() }, root);
    signGrant(root, "run-c", "h", new Date());
    expect(verifyGrant(req.grantId, "1", { tool: "create", cls: "R2", packages: ["ZNEW"], objects: ["CLAS ZCL_NEW"] }, root).allow).toBe(true);
    expect(verifyGrant(req.grantId, "1", { tool: "edit", cls: "R2", packages: ["ZNEW"], objects: ["CLAS ZCL_NEW"] }, root).allow).toBe(false);
  });
  test("R3 must be listed explicitly (globs do not cover R3)", () => {
    const req = createGrantRequest({ runId: "run-2", rows: [{ row: "1", packages: ["Z*"], objects: [], actions: ["e*", "d*"], maxClass: "R3" }], expiresAt: exp() }, root);
    signGrant(root, "run-2", "h", new Date());
    expect(verifyGrant(req.grantId, "1", { tool: "edit", cls: "R2", packages: ["ZA"], objects: [] }, root).allow).toBe(true);
    expect(verifyGrant(req.grantId, "1", { tool: "delete", cls: "R3", packages: ["ZA"], objects: [] }, root).allow).toBe(false);
  });
  test("tampered grant (scope widened) is refused; children cannot self-grant without the key", () => {
    const req = createGrantRequest({ runId: "run-3", rows, expiresAt: exp() }, root);
    signGrant(root, "run-3", "h", new Date());
    const f = join(grantsDir(root), `${req.grantId}.json`);
    const g = JSON.parse(readFileSync(f, "utf-8")); g.rows[0].maxClass = "R3"; g.rows[0].actions.push("delete");
    writeFileSync(f, JSON.stringify(g));
    expect(verifyGrant(req.grantId, "1", { tool: "read", cls: "R0", packages: [], objects: [] }, root).reason).toContain("signature");
    expect(findGrantByRun(root, "run-3")).toBeNull();
  });
  test("request validation", () => {
    expect(() => createGrantRequest({ runId: "../x", rows, expiresAt: exp() }, root)).toThrow();
    expect(() => createGrantRequest({ runId: "r", rows, expiresAt: new Date(Date.now() - 1).toISOString() }, root)).toThrow();
    expect(() => createGrantRequest({ runId: "r", rows, expiresAt: new Date(Date.now() + 48 * 3600e3).toISOString() }, root)).toThrow();
    expect(() => createGrantRequest({ runId: "r", rows: [{ row: "1", actions: [] }], expiresAt: exp() } as any, root)).toThrow();
    const one = (r: object) => () => createGrantRequest({ runId: "r", rows: [{ row: "1", packages: [], objects: [], actions: ["read"], maxClass: "R0", ...r }] as any, expiresAt: exp() }, root);
    expect(one({ actions: ["*"] })).toThrow();
    expect(one({ packages: ["*"] })).toThrow();
    expect(one({ objects: ["*"] })).toThrow();
    expect(one({ objects: ["CLAS ZCL_*"], maxClass: "R2", actions: ["edit"] })).toThrow();
    expect(one({ objects: ["CLAS ZCL_*"], maxClass: "R1" })).not.toThrow();
  });
});
