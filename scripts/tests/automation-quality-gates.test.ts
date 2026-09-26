/**
 * @version 1.0.0
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as yaml from "js-yaml";
import { waitForDocumentFonts } from "../render-pdf-deck.ts";
import { loadOptionalAgentSchemaValidator } from "../validate-agents.ts";
import { loadOptionalSkillSchemaValidator } from "../validate-skills.ts";
import { isRelevantTestFile } from "../hooks/pre-push.ts";

const ROOT = join(import.meta.dir, "..", "..");

describe("automation quality gates", () => {
  test("PDF font wait works without DOM declarations and waits when fonts exist", async () => {
    let resolved = false;
    await waitForDocumentFonts({
      document: {
        fonts: {
          ready: Promise.resolve().then(() => {
            resolved = true;
          }),
        },
      },
    });
    expect(resolved).toBe(true);
    await expect(waitForDocumentFonts({})).resolves.toBeUndefined();
  });

  test("optional schema validators skip missing files and load an available runtime module", async () => {
    const temporaryValidator = join(tmpdir(), `schema-validator-${Date.now()}.ts`);
    writeFileSync(
      temporaryValidator,
      `export const parseFrontmatter = () => ({});\nexport const validateAgentFrontmatter = () => [];\nexport const validateSkillFrontmatter = () => [];\n`,
    );
    try {
      await expect(loadOptionalAgentSchemaValidator(`${temporaryValidator}.missing`)).resolves.toBeNull();
      await expect(loadOptionalSkillSchemaValidator(`${temporaryValidator}.missing`)).resolves.toBeNull();

      const agentValidator = await loadOptionalAgentSchemaValidator(temporaryValidator);
      const skillValidator = await loadOptionalSkillSchemaValidator(temporaryValidator);
      expect(agentValidator?.validateAgentFrontmatter({}, "agent.md")).toEqual([]);
      expect(skillValidator?.validateSkillFrontmatter({}, "skill")).toEqual([]);
    } finally {
      if (existsSync(temporaryValidator)) rmSync(temporaryValidator);
    }
  });

  test("pre-push test discovery includes scripts/tests regression tests", () => {
    expect(isRelevantTestFile("tests/unit/example.test.ts")).toBe(true);
    expect(isRelevantTestFile("scripts/tests/automation-quality-gates.test.ts")).toBe(true);
    expect(isRelevantTestFile("scripts\\tests\\automation-quality-gates.test.ts")).toBe(true);
    expect(isRelevantTestFile("scripts/test-runner.ts")).toBe(false);
    expect(isRelevantTestFile("docs/example.test.ts")).toBe(false);
  });

  test("CI uses the validated Bun version and canonical quality-gate commands", () => {
    const ci = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    const parsed = yaml.load(ci) as { jobs: Record<string, { name: string; steps: Array<{ run?: string; with?: { "bun-version"?: string } }> }> };
    expect(parsed.jobs.typecheck.name).toBe("Typecheck");
    expect(parsed.jobs["script-tests"].name).toBe("Script Tests");
    expect(parsed.jobs.typecheck.steps.some(step => step.run === "bun run typecheck")).toBe(true);
    expect(parsed.jobs["script-tests"].steps.some(step => step.run === "bun run test")).toBe(true);
    for (const job of Object.values(parsed.jobs)) {
      for (const step of job.steps) {
        if (step.with?.["bun-version"]) expect(step.with["bun-version"]).toBe("1.4.2");
      }
    }
  });

  test("auto-merge re-evaluates only completed CI and rejects every non-success check state", () => {
    const workflow = readFileSync(join(ROOT, ".github", "workflows", "auto-merge.yml"), "utf8");
    const parsed = yaml.load(workflow, { schema: yaml.JSON_SCHEMA }) as {
      on: { workflow_run: { workflows: string[]; types: string[] } };
    };
    expect(parsed.on.workflow_run.workflows).toEqual(["CI"]);
    expect(parsed.on.workflow_run.types).toEqual(["completed"]);
    expect(workflow).toContain("checkRuns.length === 0");
    expect(workflow).toContain("check.status !== 'completed' || check.conclusion !== 'success'");
    expect(workflow).toContain("Required checks missing from the head SHA");
    expect(workflow).not.toContain("check_suite:");
  });
});
