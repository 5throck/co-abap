// @version 1.0.0
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evaluate } from "../hooks/sap-action-gate.ts";
import { record } from "../hooks/sap-action-audit.ts";
import { inspectQuery, readEvidence } from "../lib/sap-action-lib.ts";

const REPO = join(import.meta.dir, "..", "..");
const FIX = join(REPO, "scripts", "hooks", "__fixtures__");
const fx = (n: string) => JSON.parse(readFileSync(join(FIX, `${n}.json`), "utf-8"));
const OBJ = "/sap/bc/adt/oo/classes/zcl_foo";
const ENV_KEYS = ["HARNESS_PROFILE", "SAP_APPROVAL_TOKEN", "HARNESS_TASK_ID", "HARNESS_SPEC_ID"];

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sap-gate-"));
  mkdirSync(join(root, "config"), { recursive: true });
  cpSync(join(REPO, "config", "sap-action-policy.json"), join(root, "config", "sap-action-policy.json"));
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => { rmSync(root, { recursive: true, force: true }); for (const k of ENV_KEYS) delete process.env[k]; });

const call = (tool: string, ti: object, extra: object = {}) =>
  ({ session_id: "s1", tool_name: `mcp__abap__${tool}`, tool_input: ti, ...extra });
const logLines = () => {
  const d = join(root, "memory", "audit");
  return readdirSync(d).filter((f) => f.endsWith(".jsonl")).flatMap((f) =>
    readFileSync(join(d, f), "utf-8").trim().split("\n").map((l) => JSON.parse(l)));
};
function approve(tool: string, target: string, extra: object = {}, expires = new Date(Date.now() + 3600e3).toISOString()) {
  const dir = join(root, "memory", "audit", "approvals");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "s1.json"), JSON.stringify({ approvals: [{ tool, target, approver: "alice", expires, ...extra }] }));
}
function passChain(obj = OBJ, t0 = Date.now()) {
  record(call("WriteSource", { object_url: obj, package: "$TMP", source: "x" }), root, new Date(t0));
  ["SyntaxCheck", "RunUnitTests", "GetCodeCoverage", "RunATCCheck"].forEach((t, i) =>
    record({ ...call(t, { object_url: obj }), tool_response: "ok" }, root, new Date(t0 + 1000 * (i + 1))));
}

describe("gate classification", () => {
  test("R0 allow", () => expect(evaluate(fx("r0-getsource"), root).decision).toBe("allow"));
  test("R1 allow", () => expect(evaluate(fx("r1-syntaxcheck"), root).decision).toBe("allow"));
  test("R2 allowlisted package asks", () => expect(evaluate(fx("r2-write-tmp"), root).decision).toBe("ask"));
  test("R2 package outside allowlist denied", () => expect(evaluate(fx("r2-write-bad-package"), root).decision).toBe("deny"));
  test("R2 package not determinable asks", () => {
    const r = evaluate(fx("r2-write-no-package"), root);
    expect(r.decision).toBe("ask"); expect(r.reason).toContain("not determinable");
  });
  test("R2 package derived from ADT packages URL", () =>
    expect(evaluate(call("CreateTransport", { object_url: "/sap/bc/adt/packages/%24tmp" }) , root).reason).toContain("$TMP"));
  test("R2 package derived from evidence", () => {
    passChain();
    expect(evaluate(call("EditSource", { object_url: OBJ }), root).reason).toContain("$TMP");
  });
  test("unknown tool asks", () => {
    const r = evaluate(fx("unknown-tool"), root);
    expect(r.decision).toBe("ask"); expect(r.reason).toBe("unclassified tool");
  });
  test("R3 pattern tool denied", () => expect(evaluate(call("DeleteObject", { name: "zfoo" }), root).decision).toBe("deny"));
  test("hyperfocused SAP action resolves", () =>
    expect(evaluate(call("SAP", { action: "RunReport", params: { name: "ZR" } }), root).decision).toBe("deny"));
  test("non-abap tool asks", () => expect(evaluate({ tool_name: "Bash", tool_input: {} }, root).decision).toBe("ask"));
});

describe("RunQuery", () => {
  test("SELECT allowed", () => expect(evaluate(fx("runquery-select"), root).decision).toBe("allow"));
  test("UPDATE denied", () => expect(evaluate(fx("runquery-update"), root).decision).toBe("deny"));
  test("chained denied", () => expect(evaluate(fx("runquery-chained"), root).decision).toBe("deny"));
  test("inspectQuery edge cases", () => {
    expect(inspectQuery("select 1 from t000;")).toBeNull();
    expect(inspectQuery("/* hi */ SELECT 1 FROM t000 -- note")).toBeNull();
    expect(inspectQuery("SELECT 'a;b' FROM t000")).toBeNull();
    expect(inspectQuery("/* x */ DELETE FROM t000")).not.toBeNull();
    expect(inspectQuery("SELECT 1 /* ; */ ; DELETE FROM t")).not.toBeNull();
    expect(inspectQuery("SELECT 1 FROM t FOR UPDATE")).not.toBeNull();
    expect(inspectQuery("")).not.toBeNull();
    expect(inspectQuery("SELECT 'oops")).not.toBeNull();
    expect(inspectQuery(undefined)).not.toBeNull();
    expect(inspectQuery("WITH x AS (SELECT 1) DELETE FROM t")).not.toBeNull();
    expect(evaluate(call("RunQuery", {}), root).decision).toBe("deny");
  });
});

describe("R3 approval and release", () => {
  test("no approval denied", () => expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny"));
  test("approval file allows, audit consumes it (single use)", () => {
    approve("RunReport", "ZR");
    const c = call("RunReport", { name: "ZR" });
    expect(evaluate(c, root).decision).toBe("allow");
    record({ ...c, tool_response: "ok" }, root);
    expect(logLines().at(-1).decision).toBe("approved");
    expect(logLines().at(-1).approver).toBe("alice");
    expect(evaluate(c, root).decision).toBe("deny");
  });
  test("expired approval denied", () => {
    approve("RunReport", "ZR", {}, new Date(Date.now() - 1000).toISOString());
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny");
  });
  test("approval for another target denied", () => {
    approve("RunReport", "OTHER");
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny");
  });
  test("token-bound approval needs matching env", () => {
    approve("RunReport", "ZR", { token: "t0k" });
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny");
    process.env.SAP_APPROVAL_TOKEN = "t0k";
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("allow");
  });
  test("session id cannot traverse paths", () => {
    approve("RunReport", "ZR");
    expect(evaluate({ ...call("RunReport", { name: "ZR" }), session_id: "../s1" }, root).decision).toBe("deny");
  });
  test("release denied without objects list", () => {
    approve("ReleaseTransport", "A4HK900001");
    expect(evaluate(call("ReleaseTransport", { transport: "A4HK900001" }), root).decision).toBe("deny");
  });
  test("release denied with pending evidence", () => {
    approve("ReleaseTransport", "A4HK900001");
    record(call("WriteSource", { object_url: OBJ, package: "$TMP", source: "x" }), root);
    expect(evaluate(fx("r3-release"), root).reason).toContain("lack passed QA evidence");
  });
  test("release denied without approval even with passed evidence", () => {
    passChain();
    expect(evaluate(fx("r3-release"), root).reason).toContain("without approval");
  });
  test("release allowed with passed evidence and approval", () => {
    passChain(); approve("ReleaseTransport", "A4HK900001");
    expect(evaluate(fx("r3-release"), root).decision).toBe("allow");
  });
  test("release denied in manual profile even if approved", () => {
    passChain(); approve("ReleaseTransport", "A4HK900001");
    process.env.HARNESS_PROFILE = "manual";
    expect(evaluate(fx("r3-release"), root).reason).toContain("manual profile");
  });
});

describe("evidence store", () => {
  test("chain after write gives passed; later write resets to pending", () => {
    passChain(OBJ, Date.now() - 60000);
    expect(readEvidence(root)[OBJ].status).toBe("passed");
    record(call("EditSource", { object_url: OBJ, new_string: "y" }), root, new Date());
    expect(readEvidence(root)[OBJ].status).toBe("pending");
  });
  test("failing check gives failed", () => {
    record(call("WriteSource", { object_url: OBJ, package: "$TMP", source: "x" }), root, new Date(1000));
    record({ ...call("SyntaxCheck", { object_url: OBJ }), tool_response: { isError: true } }, root, new Date(2000));
    expect(readEvidence(root)[OBJ].status).toBe("failed");
  });
  test("stale chain (before write) is not passed", () => {
    passChain(OBJ, 1000);
    record(call("EditSource", { object_url: OBJ, new_string: "y" }), root, new Date(99999));
    expect(readEvidence(root)[OBJ].status).toBe("pending");
  });
});

describe("audit log", () => {
  test("hashes only, no source text", () => {
    const src = "CLASS zcl_secret_body DEFINITION.";
    record({ ...call("WriteSource", { object_url: OBJ, package: "$TMP", source: src, old_string: "OLDBODY" }), tool_response: { source: "RESP_BODY" } }, root);
    const raw = readdirSync(join(root, "memory", "audit")).filter((f) => f.endsWith(".jsonl"))
      .map((f) => readFileSync(join(root, "memory", "audit", f), "utf-8")).join("");
    expect(raw).not.toContain("zcl_secret_body"); expect(raw).not.toContain("OLDBODY");
    const rec = logLines()[0];
    expect(rec.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.afterHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.beforeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.class).toBe("R2"); expect(rec.actor).toBe("main");
  });
  test("taskId/specId included when env set, omitted otherwise", () => {
    record(call("GetSource", { name: "zfoo" }), root);
    expect("taskId" in logLines()[0]).toBe(false);
    expect("specId" in logLines()[0]).toBe(false);
    process.env.HARNESS_TASK_ID = "T-1"; process.env.HARNESS_SPEC_ID = "SPEC-9";
    record(call("GetSource", { name: "zfoo" }), root);
    expect(logLines()[1].taskId).toBe("T-1"); expect(logLines()[1].specId).toBe("SPEC-9");
  });
});

describe("process-level (stdin/stdout)", () => {
  const run = async (stdin: string, cwd = root) => {
    const p = Bun.spawn(["bun", join(REPO, "scripts/hooks/sap-action-gate.ts")], {
      stdin: new Blob([stdin]), stdout: "pipe", stderr: "pipe", cwd, env: { ...process.env, HARNESS_TASK_ID: "T-2" },
    });
    const out = await new Response(p.stdout).text(); await p.exited;
    return { code: p.exitCode, out: JSON.parse(out).hookSpecificOutput };
  };
  test("malformed stdin asks", async () => {
    const r = await run("not json{"); expect(r.code).toBe(0); expect(r.out.permissionDecision).toBe("ask");
  });
  test("invalid policy asks for everything", async () => {
    writeFileSync(join(root, "config", "sap-action-policy.json"), '{"version":1}');
    expect((await run(JSON.stringify({ ...fx("r0-getsource"), cwd: root }))).out.permissionDecision).toBe("ask");
  });
  test("missing policy asks", async () => {
    rmSync(join(root, "config"), { recursive: true });
    expect((await run(JSON.stringify({ ...fx("r0-getsource"), cwd: root }))).out.permissionDecision).toBe("ask");
  });
  test("deny output shape, and deny is logged with taskId", async () => {
    const r = await run(JSON.stringify({ ...fx("runquery-update"), cwd: root }));
    expect(r.out.hookEventName).toBe("PreToolUse");
    expect(r.out.permissionDecision).toBe("deny");
    expect(r.out.permissionDecisionReason).toStartWith("R0:");
    const l = logLines().at(-1);
    expect(l.decision).toBe("deny"); expect(l.taskId).toBe("T-2");
  });
});
