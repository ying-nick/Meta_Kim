import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  SKILL_PATH,
  FIVE_CRITERIA,
  FOUR_DEATH_PATTERNS,
  ALL_AGENTS,
  readFile,
} from "./_helpers.mjs";
import { readFile as readJsonFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIOS_PATH = path.join(
  __dirname,
  "scenarios",
  "decomposition-scenarios.json"
);

let skillContent;
let decompositionScenarios;

async function ensureLoaded() {
  if (!skillContent) {
    skillContent = await readFile(".claude/skills/meta-theory/SKILL.md");
  }
  if (!decompositionScenarios) {
    const raw = await readJsonFile(SCENARIOS_PATH, "utf-8");
    decompositionScenarios = JSON.parse(raw);
  }
}

// ---------------------------------------------------------------------------
// Part A: Rule Verification (14 tests)
// ---------------------------------------------------------------------------

describe("Decomposition — Part A: Rule Verification", async () => {
  await ensureLoaded();

  test("Five Criteria: all 5 items present in SKILL.md", async () => {
    await ensureLoaded();
    for (const criterion of FIVE_CRITERIA) {
      assert.ok(
        skillContent.includes(criterion),
        `Five Criteria item "${criterion}" must be present in SKILL.md`
      );
    }
  });

  test("Five Criteria: evidence table format present", async () => {
    await ensureLoaded();
    const hasEvidenceTable =
      /\|\s*Criterion\s*\|.*Evidence\s*\|.*Pass/i.test(skillContent);
    assert.ok(
      hasEvidenceTable,
      "SKILL.md must contain a Five Criteria evidence table with Criterion, Evidence, and Pass columns"
    );
  });

  test("Four Death Patterns: all 4 present in SKILL.md", async () => {
    await ensureLoaded();
    for (const pattern of FOUR_DEATH_PATTERNS) {
      assert.ok(
        skillContent.includes(pattern),
        `Death Pattern "${pattern}" must be present in SKILL.md`
      );
    }
  });

  test("Four Death Patterns: symptoms and diagnostic questions documented", async () => {
    await ensureLoaded();
    const hasSymptomsTable =
      /\|\s*Death Pattern\s*\|.*Symptoms\s*\|.*Diagnostic Questions/i.test(
        skillContent
      );
    assert.ok(
      hasSymptomsTable,
      "SKILL.md must contain a Death Pattern table with Symptoms and Diagnostic Questions columns"
    );
  });

  test("Meta-Verification Four Questions: all 4 diagnostic questions present", async () => {
    await ensureLoaded();
    const fourQuestions = [
      "Does it have clear boundaries",
      "Can it be replaced without collapsing",
      "Cross-contamination",
      "Can this meta combine with other metas",
    ];
    for (const question of fourQuestions) {
      assert.ok(
        skillContent.includes(question),
        `Four Questions must include "${question}"`
      );
    }
  });

  test("Omnipotent Executor Meta Anti-Pattern defined", async () => {
    await ensureLoaded();
    assert.ok(
      skillContent.includes("Omnipotent Executor Meta"),
      'SKILL.md must define the "Omnipotent Executor Meta" Anti-Pattern'
    );
    assert.ok(
      /compression disease/i.test(skillContent),
      "Omnipotent Executor Meta must mention compression disease"
    );
    assert.ok(
      /trigger Type B splitting/i.test(skillContent),
      "Omnipotent Executor Meta must recommend triggering Type B splitting pipeline"
    );
  });

  test("Git commands for coupling analysis present", async () => {
    await ensureLoaded();
    const hasGitLog = skillContent.includes("git log --since");
    const hasNameOnly = skillContent.includes("--name-only");
    const hasCoChange = /co-change/i.test(skillContent);
    assert.ok(
      hasGitLog,
      'SKILL.md must include "git log --since" command for data collection'
    );
    assert.ok(
      hasNameOnly,
      'SKILL.md must include "--name-only" flag for file change tracking'
    );
    assert.ok(
      hasCoChange,
      "SKILL.md must reference co-change analysis for coupling detection"
    );
  });

  test('Coupling criterion documented ("if A changes, does B frequently need to change?")', async () => {
    await ensureLoaded();
    const hasCouplingCriterion =
      /if A changes.*does B frequently need to change/i.test(skillContent);
    assert.ok(
      hasCouplingCriterion,
      "SKILL.md must document the coupling criterion: if A changes, does B frequently need to change?"
    );
  });

  test("Iron Rule: user override on splitting decisions", async () => {
    await ensureLoaded();
    assert.ok(
      /Iron Rule/i.test(skillContent),
      "SKILL.md must document the Iron Rule"
    );
    const hasUserOverride =
      /user says.*different.*split apart/i.test(skillContent) ||
      /user says.*these two.*different/i.test(skillContent);
    assert.ok(
      hasUserOverride,
      "Iron Rule must state that user can override data-driven coupling decisions to force a split"
    );
  });

  test(">5% change frequency threshold for candidate domains", async () => {
    await ensureLoaded();
    assert.ok(
      skillContent.includes(">5%"),
      "SKILL.md must document the >5% change frequency threshold for candidate independent domains"
    );
  });

  test("Co-change frequency for merge decisions", async () => {
    await ensureLoaded();
    const hasHighCoChange =
      /high co-change frequency.*merge/i.test(skillContent) ||
      /co-change frequency.*should be merged/i.test(skillContent);
    const hasLowCoChange =
      /low co-change frequency.*separate/i.test(skillContent) ||
      /co-change frequency.*can be separated/i.test(skillContent);
    assert.ok(
      hasHighCoChange,
      "SKILL.md must document that high co-change frequency leads to merge"
    );
    assert.ok(
      hasLowCoChange,
      "SKILL.md must document that low co-change frequency leads to separation"
    );
  });

  test("Type B splitting pipeline referenced from Omnipotent Executor detection", async () => {
    await ensureLoaded();
    const marker = "Omnipotent Executor Meta Anti-Pattern";
    const omnipotentSection = skillContent.indexOf(marker);
    assert.ok(
      omnipotentSection !== -1,
      "SKILL.md must contain Omnipotent Executor Meta Anti-Pattern definition"
    );
    const afterOmnipotent = skillContent.slice(
      omnipotentSection,
      omnipotentSection + 800
    );
    assert.ok(
      /Type B/i.test(afterOmnipotent),
      "Omnipotent Executor detection must reference Type B splitting pipeline as remediation"
    );
  });

  test("Three symptoms of Omnipotent Executor documented", async () => {
    await ensureLoaded();
    const symptoms = [
      "execution before thorough understanding",
      "decisions before complete information gathering",
      "modifying shared logic before exposing risks",
    ];
    for (const symptom of symptoms) {
      assert.ok(
        skillContent.includes(symptom),
        `Omnipotent Executor must document symptom: "${symptom}"`
      );
    }
  });

  test("Stew-All diagnostic thresholds documented (>2 domains, >300 lines)", async () => {
    await ensureLoaded();
    assert.ok(
      skillContent.includes(">2 unrelated domains"),
      "Stew-All diagnostic must include >2 unrelated domains threshold"
    );
    assert.ok(
      skillContent.includes(">300 lines"),
      "Stew-All diagnostic must include SOUL.md >300 lines threshold"
    );
  });
});

// ---------------------------------------------------------------------------
// Part B: Scenario Verification (10 tests loading from JSON)
// ---------------------------------------------------------------------------

describe("Decomposition — Part B: Scenario Verification", async () => {
  await ensureLoaded();

  test("Decomposition scenarios file contains exactly 10 scenarios", async () => {
    await ensureLoaded();
    assert.equal(
      decompositionScenarios.length,
      10,
      "decomposition-scenarios.json must contain exactly 10 scenarios"
    );
  });

  test("Scenario IDs are DC-01 through DC-10 in order", async () => {
    await ensureLoaded();
    const expectedIds = Array.from({ length: 10 }, (_, i) =>
      `DC-${String(i + 1).padStart(2, "0")}`
    );
    const actualIds = decompositionScenarios.map((s) => s.id);
    assert.deepStrictEqual(
      actualIds,
      expectedIds,
      "Scenario IDs must be DC-01 through DC-10 in order"
    );
  });

  test("Every scenario has required top-level fields", async () => {
    await ensureLoaded();
    const requiredFields = [
      "id",
      "input",
      "expectedDiagnosis",
      "expectedBehavior",
      "diagnosticQuestions",
      "recommendation",
      "passFailCriteria",
    ];
    for (const scenario of decompositionScenarios) {
      for (const field of requiredFields) {
        assert.ok(
          scenario[field] !== undefined && scenario[field] !== null,
          `Scenario ${scenario.id} must have field "${field}"`
        );
      }
    }
  });

  test("Every scenario has expectedBehavior with detection, evaluation, output", async () => {
    await ensureLoaded();
    const behaviorKeys = ["detection", "evaluation", "output"];
    for (const scenario of decompositionScenarios) {
      assert.ok(
        typeof scenario.expectedBehavior === "object",
        `Scenario ${scenario.id}: expectedBehavior must be an object`
      );
      for (const key of behaviorKeys) {
        assert.ok(
          scenario.expectedBehavior[key],
          `Scenario ${scenario.id}: expectedBehavior must have "${key}"`
        );
      }
    }
  });

  test("Every scenario has diagnosticQuestions as non-empty array", async () => {
    await ensureLoaded();
    for (const scenario of decompositionScenarios) {
      assert.ok(
        Array.isArray(scenario.diagnosticQuestions),
        `Scenario ${scenario.id}: diagnosticQuestions must be an array`
      );
      assert.ok(
        scenario.diagnosticQuestions.length > 0,
        `Scenario ${scenario.id}: diagnosticQuestions must not be empty`
      );
    }
  });

  test("Every scenario has passFailCriteria with PASS and FAIL", async () => {
    await ensureLoaded();
    for (const scenario of decompositionScenarios) {
      assert.ok(
        scenario.passFailCriteria,
        `Scenario ${scenario.id} must have passFailCriteria`
      );
      assert.ok(
        scenario.passFailCriteria.PASS,
        `Scenario ${scenario.id} must have passFailCriteria.PASS`
      );
      assert.ok(
        scenario.passFailCriteria.FAIL,
        `Scenario ${scenario.id} must have passFailCriteria.FAIL`
      );
    }
  });

  test("DC-01 covers Five Criteria evaluation", async () => {
    await ensureLoaded();
    const dc01 = decompositionScenarios.find((s) => s.id === "DC-01");
    assert.ok(dc01, "DC-01 scenario must exist");
    assert.ok(
      /Five Criteria/i.test(dc01.expectedDiagnosis),
      "DC-01 must reference Five Criteria in expectedDiagnosis"
    );
    assert.ok(
      dc01.diagnosticQuestions.length >= 4,
      "DC-01 must include the Four Questions as diagnosticQuestions"
    );
  });

  test("DC-02 covers Omnipotent Executor / Stew-All detection", async () => {
    await ensureLoaded();
    const dc02 = decompositionScenarios.find((s) => s.id === "DC-02");
    assert.ok(dc02, "DC-02 scenario must exist");
    const diagnosisText = dc02.expectedDiagnosis.toLowerCase();
    assert.ok(
      diagnosisText.includes("stew-all") ||
        diagnosisText.includes("omnipotent executor"),
      "DC-02 must diagnose Stew-All or Omnipotent Executor pattern"
    );
    assert.ok(
      /Type B/i.test(dc02.recommendation) || /split/i.test(dc02.recommendation),
      "DC-02 recommendation must mention Type B splitting"
    );
  });

  test("DC-09 covers compound death patterns", async () => {
    await ensureLoaded();
    const dc09 = decompositionScenarios.find((s) => s.id === "DC-09");
    assert.ok(dc09, "DC-09 scenario must exist");
    const diagnosisLower = dc09.expectedDiagnosis.toLowerCase();
    let patternCount = 0;
    if (diagnosisLower.includes("stew-all")) patternCount++;
    if (diagnosisLower.includes("governance-free")) patternCount++;
    if (diagnosisLower.includes("result-chasing")) patternCount++;
    if (diagnosisLower.includes("shattered")) patternCount++;
    assert.ok(
      patternCount >= 2,
      `DC-09 must reference at least 2 death patterns in diagnosis (found ${patternCount})`
    );
  });

  test("DC-10 covers post-split Five Criteria verification", async () => {
    await ensureLoaded();
    const dc10 = decompositionScenarios.find((s) => s.id === "DC-10");
    assert.ok(dc10, "DC-10 scenario must exist");
    assert.ok(
      /post-split/i.test(dc10.expectedDiagnosis) ||
        /Five Criteria/i.test(dc10.expectedDiagnosis),
      "DC-10 must reference post-split Five Criteria verification"
    );
    const questionsText = dc10.diagnosticQuestions.join(" ").toLowerCase();
    assert.ok(
      questionsText.includes("shattered") || questionsText.includes("fragmented"),
      "DC-10 diagnosticQuestions must check for Shattered pattern after splitting"
    );
  });
});
