// @version 2.0.0
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evaluate } from "../hooks/sap-action-gate.ts";
import { record } from "../hooks/sap-action-audit.ts";
import { NEEDS_APPROVAL, inspectQuery, normalizeObjectKey, readEvidence } from "../lib/sap-action-lib.ts";
import { secureHome } from "./fixtures/sap-secure-home.ts";

const REPO = join(import.meta.dir, "..", "..");
const FIX = join(REPO, "scripts", "hooks", "__fixtures__");
const fx = (n: string) => JSON.parse(readFileSync(join(FIX, `${n}.json`), "utf-8"));
const OBJ = "/sap/bc/adt/oo/classes/zcl_foo";
const ENV_KEYS = ["SAP_APPROVAL_TOKEN", "HARNESS_TASK_ID", "HARNESS_SPEC_ID"];

let root: string;
let home: ReturnType<typeof secureHome>;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sap-gate-"));
  mkdirSync(join(root, "config"), { recursive: true });
  cpSync(join(REPO, "config", "sap-action-policy.json"), join(root, "config", "sap-action-policy.json"));
  for (const k of ENV_KEYS) delete process.env[k];
  home = secureHome(root);
});
afterEach(() => { home.restore(); rmSync(root, { recursive: true, force: true }); for (const k of ENV_KEYS) delete process.env[k]; });

const call = (tool: string, ti: object, extra: object = {}) =>
  ({ session_id: "s1", tool_name: `mcp__abap__${tool}`, tool_input: ti, ...extra });
const logLines = () => {
  const d = join(root, "memory", "audit");
  return readdirSync(d).filter((f) => f.endsWith(".jsonl")).flatMap((f) =>
    readFileSync(join(d, f), "utf-8").trim().split("\n").map((l) => JSON.parse(l)));
};
/** Legacy per-session approval file in the workspace: must be ignored (approvals are signed and owned by the proxy). */
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
    expect(evaluate(call("SAP", { action: "delete", target: "PROG ZR" }), root).decision).toBe("deny"));
  test("legacy tool name as SAP action is unclassified and asks", () =>
    expect(evaluate(call("SAP", { action: "RunReport", params: { name: "ZR" } }), root).decision).toBe("ask"));
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
  test("legacy workspace approval files are ignored", () => {
    approve("RunReport", "ZR");
    const c = call("RunReport", { name: "ZR" });
    expect(evaluate(c, root).reason).toBe(NEEDS_APPROVAL);
    record({ ...c, tool_response: "ok" }, root);
    expect(logLines().at(-1).decision).toBe("allow");
    expect(logLines().at(-1).approver).toBeUndefined();
  });
  test("expired approval denied", () => {
    approve("RunReport", "ZR", {}, new Date(Date.now() - 1000).toISOString());
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny");
  });
  test("approval for another target denied", () => {
    approve("RunReport", "OTHER");
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny");
  });
  test("SAP_APPROVAL_TOKEN no longer unlocks anything", () => {
    approve("RunReport", "ZR", { token: "t0k" });
    process.env.SAP_APPROVAL_TOKEN = "t0k";
    expect(evaluate(call("RunReport", { name: "ZR" }), root).decision).toBe("deny");
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
  test("release with passed evidence still needs a proxy approval", () => {
    passChain(); approve("ReleaseTransport", "A4HK900001");
    expect(evaluate(fx("r3-release"), root).reason).toBe(NEEDS_APPROVAL);
  });
  test("hand-edited evidence without a valid MAC is not passed", () => {
    mkdirSync(join(root, "memory", "audit"), { recursive: true });
    writeFileSync(join(root, "memory", "audit", "sap-evidence.json"), JSON.stringify({ [OBJ]: { chain: {}, status: "passed", transport: "A4HK900001" } }));
    expect(readEvidence(root)[OBJ].status).toBe("pending");
    expect(evaluate(fx("r3-release"), root).reason).toContain("lack passed QA evidence");
    passChain();
    const f = join(root, "memory", "audit", "sap-evidence.json");
    const ev = JSON.parse(readFileSync(f, "utf-8")); ev[OBJ].package = "SAPBC";
    writeFileSync(f, JSON.stringify(ev));
    expect(readEvidence(root)[OBJ].status).toBe("pending");
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

describe("hyperfocused SAP tool", () => {
  const sap = (ti: object, extra: object = {}) => call("SAP", ti, extra);
  const d = (ti: object) => evaluate(sap(ti), root).decision;
  test("fixtures", () => {
    expect(evaluate(fx("hf-read"), root).decision).toBe("allow");
    expect(evaluate(fx("hf-edit-tmp"), root).decision).toBe("ask");
    expect(evaluate(fx("hf-query-delete"), root).decision).toBe("deny");
    expect(evaluate(fx("hf-rfc-call"), root).decision).toBe("deny");
    expect(evaluate(fx("hf-release"), root).decision).toBe("deny");
  });
  test("R0 actions allow", () => {
    for (const a of ["read", "search", "grep", "revisions", "info", "help", "lint"]) expect(d({ action: a, target: "X" })).toBe("allow");
    expect(d({})).toBe("allow");
    expect(d({ action: "READ", target: "CLAS ZCL_A" })).toBe("allow");
  });
  test("query: SELECT allowed, DML/chained/empty denied, param wins", () => {
    expect(d({ action: "query", params: { sql: "SELECT * FROM t000" } })).toBe("allow");
    expect(d({ action: "query", target: "SELECT * FROM T000" })).toBe("allow");
    expect(d({ action: "query", target: "TABL_CONTENTS ZT" })).toBe("allow");
    expect(d({ action: "query", target: "SQL", params: { sql_query: "SELECT 1 FROM t000" } })).toBe("allow");
    expect(d({ action: "query", target: "SQL", params: { sql_query: "UPDATE t000 SET x = 1" } })).toBe("deny");
    expect(d({ action: "query", target: "SELECT 1 FROM t000", params: { sql: "DELETE FROM t000" } })).toBe("deny");
    expect(d({ action: "query", target: "SQL" })).toBe("deny");
    expect(d({ action: "query", params: { sql: "SELECT 1 FROM t; DELETE FROM t" } })).toBe("deny");
    expect(d({ action: "query" })).toBe("ask");
  });
  test("edit/create are R2: package allowlist", () => {
    expect(d({ action: "edit", target: "CLAS ZCL_A", params: { source: "x", package: "$TMP" } })).toBe("ask");
    expect(d({ action: "edit", target: "CLAS ZCL_A", params: { source: "x", package_name: "SAPBC" } })).toBe("deny");
    expect(d({ action: "create", target: "OBJECT", params: { object_type: "CLAS/OC", name: "ZCL_A", dev_class: "SAPBC" } })).toBe("deny");
    expect(evaluate(sap({ action: "edit", target: "CLAS ZCL_A", params: { source: "x" } }), root).reason).toContain("not determinable");
    expect(d({ action: "edit", target: "COMPARE_SOURCE", params: { type1: "CLAS" } })).toBe("allow");
  });
  test("edit package derived from evidence of the same TYPE NAME", () => {
    record(sap({ action: "edit", target: "CLAS ZCL_A", params: { source: "x", package: "$TMP" } }), root);
    expect(evaluate(sap({ action: "edit", target: "clas zcl_a", params: { source: "y" } }), root).reason).toContain("$TMP");
  });
  test("delete, debug denied; legacy approval file does not allow", () => {
    expect(d({ action: "delete", target: "CLAS ZCL_A" })).toBe("deny");
    expect(d({ action: "debug", target: "RUN_REPORT", params: { report: "ZR" } })).toBe("deny");
    approve("delete", "CLAS ZCL_A");
    expect(d({ action: "delete", target: "CLAS ZCL_A" })).toBe("deny");
  });
  test("rfc ops", () => {
    for (const op of ["info", "ping", "probe", "search"]) expect(d({ action: "rfc", params: { op } })).toBe("allow");
    expect(d({ action: "rfc", target: "STFC_CONNECTION" })).toBe("allow");
    expect(d({ action: "rfc", target: "STFC_CONNECTION", params: { op: "describe" } })).toBe("allow");
    for (const op of ["call", "run", "read_table"]) expect(d({ action: "rfc", target: "Z_X", params: { op } })).toBe("deny");
    expect(d({ action: "rfc", params: { op: "mystery" } })).toBe("ask");
    expect(d({ action: "rfc" })).toBe("ask");
  });
  test("system sub-types", () => {
    for (const type of ["list_transports", "get_transport", "get_user_transports", "get_transport_info", "transport_status", "transport_buffer", "import_status"])
      expect(d({ action: "system", params: { type } })).toBe("allow");
    expect(d({ action: "system", target: "INFO" })).toBe("allow");
    for (const type of ["delete_transport", "merge_transports", "copy_to_toc", "upload_transport", "install_zadt_vsp", "deploy_zip", "git_delete_objects"])
      expect(d({ action: "system", params: { type, target: "QAS" } })).toBe("deny");
    expect(d({ action: "system", params: { type: "install_something_new" } })).toBe("deny");
    expect(d({ action: "system", params: { type: "frobnicate" } })).toBe("ask");
    expect(d({ action: "system" })).toBe("ask");
    expect(d({ action: "system", params: { type: "create_transport", package: "$TMP", description: "x" } })).toBe("ask");
    expect(d({ action: "system", params: { type: "create_transport", package: "SAPBC" } })).toBe("deny");
    expect(d({ action: "system", params: { type: "git_import_zip", package: "ZDEMO" } })).toBe("ask");
    expect(d({ action: "system", params: { type: "git_export", packages: "$TMP,SAPBC" } })).toBe("deny");
    expect(d({ action: "system", params: { type: "deploy_from_file", file_path: "/x/zfoo.prog.abap", package_name: "$TMP" } })).toBe("ask");
    expect(d({ action: "system", params: { type: "save_to_file", object_type: "CLAS" } })).toBe("ask");
  });
  test("unknown action or sub-type asks", () => {
    expect(d({ action: "frobnicate" })).toBe("ask");
    expect(d({ action: "analyze", params: { type: "frobnicate" } })).toBe("ask");
    expect(d({ action: "analyze" })).toBe("ask");
    expect(d({ action: "test", params: { type: "frobnicate" } })).toBe("ask");
    expect(d({ action: "i18n", params: { op: "frobnicate" } })).toBe("ask");
    expect(d({ action: 5 })).toBe("ask");
  });
  test("analyze/test/i18n classes", () => {
    expect(d({ action: "analyze", params: { type: "call_graph" } })).toBe("allow");
    expect(d({ action: "analyze", params: { type: "syntax_check", object_url: OBJ } })).toBe("allow");
    expect(d({ action: "analyze", params: { type: "execute_abap", source: "x" } })).toBe("deny");
    expect(d({ action: "analyze", params: { type: "cluster_read", table: "INDX" } })).toBe("deny");
    expect(d({ action: "test", params: { object_url: OBJ } })).toBe("allow");
    expect(d({ action: "test", target: "ATC", params: { object_uri: OBJ } })).toBe("allow");
    expect(d({ action: "i18n", params: { op: "texts_get", program_name: "ZR" } })).toBe("allow");
    expect(d({ action: "i18n", params: { op: "texts_set", program_name: "ZR" } })).toBe("ask");
  });
  test("params given as JSON string are parsed", () =>
    expect(d({ action: "query", params: JSON.stringify({ sql: "DELETE FROM t" }) })).toBe("deny"));

  describe("evidence and release", () => {
    const T = "A4HK900001";
    const chain = (obj = "CLAS ZCL_A", t0 = Date.now() - 60000) => {
      record(sap({ action: "edit", target: obj, params: { source: "x", package: "$TMP", transport: T } }), root, new Date(t0));
      record({ ...sap({ action: "analyze", params: { type: "syntax_check", object_url: "/sap/bc/adt/oo/classes/" + obj.split(" ")[1].toLowerCase() } }), tool_response: "ok" }, root, new Date(t0 + 1000));
      record({ ...sap({ action: "test", target: obj, params: { coverage: true } }), tool_response: "ok" }, root, new Date(t0 + 2000));
      record({ ...sap({ action: "test", target: "ATC", params: { object_url: "/sap/bc/adt/oo/classes/" + obj.split(" ")[1].toLowerCase() } }), tool_response: "ok" }, root, new Date(t0 + 3000));
    };
    const rel = { action: "system", params: { type: "release_transport", transport: T } };
    test("TYPE NAME and URL identities share one evidence key; chain gives passed", () => {
      chain();
      expect(Object.keys(readEvidence(root))).toEqual(["CLAS ZCL_A"]);
      expect(readEvidence(root)["CLAS ZCL_A"].status).toBe("passed");
      expect(readEvidence(root)["CLAS ZCL_A"].transport).toBe(T);
    });
    test("test without coverage leaves chain pending", () => {
      record(sap({ action: "edit", target: "CLAS ZCL_B", params: { source: "x", package: "$TMP", transport: T } }), root, new Date(1000));
      record({ ...sap({ action: "test", target: "CLAS ZCL_B" }), tool_response: "ok" }, root, new Date(2000));
      expect(readEvidence(root)["CLAS ZCL_B"].chain.RunUnitTests.result).toBe("pass");
      expect(readEvidence(root)["CLAS ZCL_B"].status).toBe("pending");
    });
    test("release denied with no tracked objects", () => {
      approve("ReleaseTransport", T);
      expect(evaluate(sap(rel), root).reason).toContain("tracked transport objects");
    });
    test("release denied with pending evidence; with passed evidence it needs a proxy approval", () => {
      approve("ReleaseTransport", T);
      record(sap({ action: "edit", target: "CLAS ZCL_B", params: { source: "x", package: "$TMP", transport: T } }), root);
      expect(evaluate(sap(rel), root).reason).toContain("lack passed QA evidence");
      rmSync(join(root, "memory", "audit", "sap-evidence.json"));
      chain();
      expect(evaluate(sap(rel), root).reason).toBe(NEEDS_APPROVAL);
    });
    test("release denied without approval / without transport", () => {
      chain();
      expect(evaluate(sap(rel), root).reason).toContain("without approval");
      expect(evaluate(sap({ action: "system", params: { type: "release_transport" } }), root).decision).toBe("deny");
    });
    test("add_transport_object registers pending object that blocks release", () => {
      chain();
      approve("ReleaseTransport", T);
      record(sap({ action: "system", params: { type: "add_transport_object", transport: T, objects: ["R3TR PROG ZNEW", "LIMU REPT ZOLD"] } }), root);
      expect(readEvidence(root)["PROG ZNEW"].transport).toBe(T);
      expect(readEvidence(root)["PROG ZOLD"].status).toBe("pending");
      expect(evaluate(sap(rel), root).reason).toContain("2 object(s) lack");
    });
    test("audit log stores hashes only and the hyperfocused tool name", () => {
      record(sap({ action: "edit", target: "CLAS ZCL_A", params: { source: "CLASS zcl_secret_body.", package: "$TMP" } }), root);
      const rec = logLines().at(-1);
      expect(JSON.stringify(rec)).not.toContain("zcl_secret_body");
      expect(rec.tool).toBe("edit"); expect(rec.class).toBe("R2"); expect(rec.object).toBe("CLAS ZCL_A");
    });
  });
});

describe("RAP / UI5 targets", () => {
  const sap = (ti: object) => call("SAP", ti);
  const ev = (ti: object) => evaluate(sap(ti), root);
  test("fixtures", () => {
    expect(evaluate(fx("hf-srvb-publish"), root).decision).toBe("deny");
    expect(evaluate(fx("hf-srvd-create-tmp"), root).decision).toBe("ask");
    expect(evaluate(fx("hf-ui5-deploy-zip"), root).decision).toBe("deny");
    expect(evaluate(fx("hf-read-bdef"), root).decision).toBe("allow");
  });
  test("SRVB publish/unpublish sub-types are R3", () => {
    for (const t of ["PUBLISH_SERVICE", "UNPUBLISH_SERVICE"]) {
      const r = ev({ action: "edit", target: t, params: { service_name: "ZSB_T" } });
      expect(r.decision).toBe("deny"); expect(r.cls).toBe("R3"); expect(r.reason).toContain("without approval");
    }
  });
  test("publish is never allowed by a legacy approval file", () => {
    approve("edit.publish_service", "ZSB_T");
    expect(ev({ action: "edit", target: "PUBLISH_SERVICE", params: { service_name: "ZSB_T" } }).reason).toBe(NEEDS_APPROVAL);
  });
  test("SRVB edit with publish params is R3, plain SRVB create is R2", () => {
    expect(ev({ action: "edit", target: "SRVB ZSB_T", params: { publish: true, package: "$TMP" } }).cls).toBe("R3");
    expect(ev({ action: "edit", target: "SRVB ZSB_T", params: { op: "publish", package: "$TMP" } }).decision).toBe("deny");
    expect(ev({ action: "create", target: "SRVB ZSB_T", params: { publish: "false", package: "$TMP" } }).cls).toBe("R2");
    const plain = ev({ action: "create", target: "SRVB ZSB_T", params: { package: "$TMP" } });
    expect(plain.cls).toBe("R2"); expect(plain.decision).toBe("ask");
    expect(ev({ action: "create", target: "SRVB ZSB_T", params: { package: "SAPBC" } }).decision).toBe("deny");
  });
  test("RAP types: SRVD/BDEF/DDLX/DCLS create is R2 with package check; reads allow", () => {
    for (const t of ["SRVD", "BDEF", "DDLX", "DCLS"]) {
      expect(ev({ action: "create", target: `${t} ZX`, params: { package: "$TMP" } }).decision).toBe("ask");
      expect(ev({ action: "create", target: `${t} ZX`, params: { package: "SAPBC" } }).decision).toBe("deny");
      expect(ev({ action: "read", target: `${t} ZX` }).decision).toBe("allow");
    }
  });
  test("ADT URLs for RAP/UI5 types resolve to evidence keys and packages", () => {
    const urls: Record<string, string> = {
      "/sap/bc/adt/bo/behaviordefinitions/zi_x": "BDEF ZI_X",
      "/sap/bc/adt/ddic/srvd/sources/zsd_x": "SRVD ZSD_X",
      "/sap/bc/adt/businessservices/bindings/zsb_x": "SRVB ZSB_X",
      "/sap/bc/adt/ddic/ddlx/sources/zx": "DDLX ZX",
      "/sap/bc/adt/acm/dcl/sources/zx": "DCLS ZX",
    };
    const hf = JSON.parse(readFileSync(join(root, "config", "sap-action-policy.json"), "utf-8")).hyperfocused;
    expect(normalizeObjectKey("/sap/bc/adt/filestore/ui5-bsp/objects/zapp/content", hf)).toBe("WAPA ZAPP");
    for (const [u, k] of Object.entries(urls)) {
      record(sap({ action: "edit", params: { object_url: u, package: "$TMP", source: "x" } }), root);
      expect(readEvidence(root)[k]?.package).toBe("$TMP");
    }
    // package resolved from evidence for an edit without package
    expect(ev({ action: "edit", params: { object_url: "/sap/bc/adt/bo/behaviordefinitions/zi_x", source: "y" } }).reason).toContain("$TMP");
  });
  test("UI5 / WAPA deploys are R3", () => {
    expect(ev({ action: "create", target: "WAPA ZAPP", params: { package: "$TMP" } }).cls).toBe("R3");
    expect(ev({ action: "edit", target: "OBJECT", params: { object_type: "WAPA/WB", name: "ZAPP", package: "$TMP" } }).cls).toBe("R3");
    for (const fp of ["/w/app.zip", "/w/webapp/manifest.json", "C:\\w\\webapp\\Component.js", "/w/zapp.wapa.xml"]) {
      const r = ev({ action: "system", params: { type: "deploy_from_file", file_path: fp, package_name: "$TMP" } });
      expect(r.decision).toBe("deny"); expect(r.cls).toBe("R3"); expect(r.tool).toBe("system.deploy_from_file.ui5");
    }
    expect(ev({ action: "system", params: { type: "deploy_from_file", object_type: "WAPA", file_path: "/w/x", package_name: "$TMP" } }).cls).toBe("R3");
  });
  test("ordinary deploy_from_file stays R2; git_import_zip stays R2", () => {
    expect(ev({ action: "system", params: { type: "deploy_from_file", file_path: "/w/zcl_a.clas.abap", package_name: "$TMP" } }).decision).toBe("ask");
    expect(ev({ action: "system", params: { type: "git_import_zip", package_name: "$TMP", file_path: "/w/a.zip" } }).cls).toBe("R2");
  });
  test("UI5 deploy needs a proxy approval", () => {
    const ti = { action: "system", params: { type: "deploy_from_file", file_path: "/w/app.zip", package_name: "$TMP" } };
    approve("system.deploy_from_file.ui5", "/w/app.zip");
    expect(ev(ti).reason).toBe(NEEDS_APPROVAL);
  });
  test("legacy named UI5/RAP tools are R3", () => {
    for (const n of ["UI5Deploy", "UI5UploadApp", "UI5ListApps", "PublishServiceBinding", "UnpublishServiceBinding", "UploadBSP"]) {
      const r = evaluate(call(n, {}), root);
      expect(r.decision).toBe("deny"); expect(r.cls).toBe("R3");
    }
  });
  test("escalation config is validated", () => {
    const f = join(root, "config", "sap-action-policy.json");
    const p = JSON.parse(readFileSync(f, "utf-8"));
    p.hyperfocused.escalations = [{ label: "x", actions: ["edit"], valuePatterns: ["("] }];
    writeFileSync(f, JSON.stringify(p));
    const r = ev({ action: "read", target: "X" });
    expect(r.decision).toBe("ask"); expect(r.reason).toContain("policy unavailable");
  });
});

describe("process-level (stdin/stdout): advisory only", () => {
  const run = async (stdin: string, cwd = root) => {
    const p = Bun.spawn([process.execPath, join(REPO, "scripts/hooks/sap-action-gate.ts")], {
      stdin: new Blob([stdin]), stdout: "pipe", stderr: "pipe", cwd, env: { ...process.env },
    });
    const out = await new Response(p.stdout).text(); await p.exited;
    return { code: p.exitCode, out: JSON.parse(out).hookSpecificOutput };
  };
  test("malformed stdin never asks or denies", async () => {
    const r = await run("not json{"); expect(r.code).toBe(0); expect(r.out.permissionDecision).toBe("allow");
  });
  test("invalid or missing policy still allows (proxy enforces)", async () => {
    writeFileSync(join(root, "config", "sap-action-policy.json"), '{"version":1}');
    expect((await run(JSON.stringify({ ...fx("r0-getsource"), cwd: root }))).out.permissionDecision).toBe("allow");
    rmSync(join(root, "config"), { recursive: true });
    expect((await run(JSON.stringify({ ...fx("r0-getsource"), cwd: root }))).out.permissionDecision).toBe("allow");
  });
  test("would-be deny is reported as advisory allow and is not logged", async () => {
    const r = await run(JSON.stringify({ ...fx("runquery-update"), cwd: root }));
    expect(r.out.hookEventName).toBe("PreToolUse");
    expect(r.out.permissionDecision).toBe("allow");
    expect(r.out.permissionDecisionReason).toContain("policy would deny");
    expect(r.out.permissionDecisionReason).toContain("R0:");
    expect(existsSync(join(root, "memory", "audit"))).toBe(false);
  });
});
