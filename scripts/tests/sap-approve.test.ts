// @version 1.0.0
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { approvalId, consumeProxyApproval, grantApproval, inputHash, loadPolicy, writePending } from "../lib/sap-action-lib.ts";
import { run } from "../sap-approve.ts";

const REPO = join(import.meta.dir, "..", "..");
let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sap-approve-"));
  mkdirSync(join(root, "config"), { recursive: true });
  cpSync(join(REPO, "config", "sap-action-policy.json"), join(root, "config", "sap-action-policy.json"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const mk = (now: Date, input: object = { a: 1 }) => {
  const policy = loadPolicy(root);
  const hash = inputHash(input);
  const id = approvalId("edit", "CLAS ZCL_A", hash);
  writePending(root, policy, { id, tool: "edit", target: "CLAS ZCL_A", class: "R2", inputHash: hash, reason: "r", actor: "t" }, now);
  return { policy, hash, id };
};

describe("approval store", () => {
  test("grant then consume exactly once; target compare is case-insensitive", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    grantApproval(root, policy, id, "bob", now);
    expect(consumeProxyApproval(root, policy, "EDIT", "clas zcl_a", hash, now)?.approver).toBe("bob");
    expect(consumeProxyApproval(root, policy, "edit", "CLAS ZCL_A", hash, now)).toBeNull();
    expect(existsSync(join(root, "memory/audit/approvals/used"))).toBe(true);
  });
  test("different hash / tool / target do not match", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    grantApproval(root, policy, id, "bob", now);
    expect(consumeProxyApproval(root, policy, "edit", "CLAS ZCL_A", inputHash({ a: 2 }), now)).toBeNull();
    expect(consumeProxyApproval(root, policy, "delete", "CLAS ZCL_A", hash, now)).toBeNull();
    expect(consumeProxyApproval(root, policy, "edit", "CLAS ZCL_B", hash, now)).toBeNull();
    expect(consumeProxyApproval(root, policy, "edit", "CLAS ZCL_A", hash, now)).not.toBeNull();
  });
  test("expiry honours policy.approval.ttlMinutes (default 15)", () => {
    const now = new Date();
    const { policy, hash, id } = mk(now);
    const a = grantApproval(root, policy, id, "bob", now);
    expect(Date.parse(a.expires) - now.getTime()).toBe(15 * 60_000);
    expect(consumeProxyApproval(root, policy, "edit", "CLAS ZCL_A", hash, new Date(now.getTime() + 16 * 60_000))).toBeNull();
    const p2 = { ...policy, approval: { ...policy.approval, ttlMinutes: 1 } };
    const { id: id2 } = mk(now, { a: 3 });
    expect(Date.parse(grantApproval(root, p2, id2, "bob", now).expires) - now.getTime()).toBe(60_000);
  });
});

describe("CLI run()", () => {
  test("prints what is approved and writes the audit trail", () => {
    const { id } = mk(new Date());
    const r = run([id, "--approver", "carol"], root);
    expect(r.code).toBe(0);
    expect(r.out).toContain("CLAS ZCL_A"); expect(r.out).toContain("carol");
    const d = join(root, "memory/audit");
    const f = readdirSync(d).find((x) => x.endsWith(".jsonl"))!;
    expect(readFileSync(join(d, f), "utf-8")).toContain("approval_granted");
  });
  test("usage and bad options", () => {
    expect(run([], root).code).toBe(2);
    expect(run(["--bogus"], root).code).toBe(2);
  });
});
