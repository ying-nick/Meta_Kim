import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SKILL_PATH,
  REFERENCE_DIR,
  CLARITY_DIMENSIONS,
  parseFrontmatter,
  readFile,
  fileExists,
} from "./_helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIOS_PATH = path.join(__dirname, "scenarios", "clarity-gate-scenarios.json");

/**
 * Determine whether the Clarity Gate should trigger based on the
 * number of ambiguous dimensions.
 *
 * Rule from SKILL.md:
 *   >= 2 ambiguous  => MUST ASK
 *   exactly 1       => proceed with stated assumption
 *   0               => proceed directly
 */
function clarityGateShouldTrigger(dims) {
  const ambiguousCount = dims.filter((d) => d.ambiguous).length;
  return {
    shouldAsk: ambiguousCount >= 2,
    canAssume: ambiguousCount === 1,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part A: Gate Logic — exhaustive 2^4 = 16 combinations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part A: Clarity Gate logic (16 combinations)", () => {
  const dimNames = ["Scope", "Goal", "Constraints", "Architecture type"];

  for (let mask = 0; mask < 16; mask++) {
    const dims = dimNames.map((name, i) => ({
      name,
      ambiguous: Boolean(mask & (1 << i)),
    }));

    const ambiguousNames = dims.filter((d) => d.ambiguous).map((d) => d.name);
    const clearNames = dims.filter((d) => !d.ambiguous).map((d) => d.name);
    const ambiguousCount = ambiguousNames.length;

    const label =
      ambiguousCount === 0
        ? "all clear"
        : ambiguousCount === 4
          ? "all ambiguous"
          : `ambiguous=[${ambiguousNames.join(", ")}]`;

    test(`mask ${mask.toString(2).padStart(4, "0")} (${label})`, () => {
      const result = clarityGateShouldTrigger(dims);

      if (ambiguousCount >= 2) {
        assert.equal(result.shouldAsk, true, ">=2 ambiguous dims must trigger MUST ASK");
        assert.equal(result.canAssume, false, ">=2 ambiguous dims cannot use assume path");
      } else if (ambiguousCount === 1) {
        assert.equal(result.shouldAsk, false, "exactly 1 ambiguous dim should not force ask");
        assert.equal(result.canAssume, true, "exactly 1 ambiguous dim should allow assumption");
      } else {
        assert.equal(result.shouldAsk, false, "0 ambiguous dims should proceed directly");
        assert.equal(result.canAssume, false, "0 ambiguous dims has nothing to assume");
      }
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part B: SKILL.md Rule Verification (12 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part B: SKILL.md Clarity Gate rule verification", async () => {
  const skillContent = await fs.readFile(SKILL_PATH, "utf-8");

  // ── B.1  Four clarity dimensions are listed ────────────────────────

  describe("Four clarity dimensions are listed", () => {
    for (const dim of CLARITY_DIMENSIONS) {
      test(`dimension "${dim}" appears in SKILL.md`, () => {
        assert.ok(
          skillContent.includes(dim),
          `SKILL.md must reference the clarity dimension "${dim}"`
        );
      });
    }
  });

  // ── B.2  Threshold rule documented ─────────────────────────────────

  test("'>=2 dimensions' threshold is documented", () => {
    const hasThreshold =
      skillContent.includes("≥2 dimensions") || skillContent.includes(">=2 dimensions");
    assert.ok(hasThreshold, "SKILL.md must document the >=2 ambiguous dimensions threshold");
  });

  // ── B.3  Follow-up probe strategy documented ───────────────────────

  test("follow-up probe strategy documented (Round 1: scope, Round 2: priorities)", async () => {
    const devGov = await readFile(
      ".claude/skills/meta-theory/references/dev-governance.md"
    );
    const combinedText = skillContent + "\n" + devGov;
    const hasRound1 = /Round\s*1.*scope/i.test(combinedText);
    const hasRound2 = /Round\s*2.*priorit/i.test(combinedText);
    assert.ok(hasRound1, "Probe strategy must document Round 1 for scope");
    assert.ok(hasRound2, "Probe strategy must document Round 2 for priorities");
  });

  // ── B.4  Max 2 rounds rule ─────────────────────────────────────────

  test("max 2 rounds rule is documented", async () => {
    const devGov = await readFile(
      ".claude/skills/meta-theory/references/dev-governance.md"
    );
    const combinedText = skillContent + "\n" + devGov;
    const hasMaxRounds =
      combinedText.includes("max 2 rounds") ||
      combinedText.includes("Maximum 2 rounds") ||
      combinedText.includes("最多 2 轮");
    assert.ok(hasMaxRounds, "Must document max 2 rounds for clarity probing");
  });

  // ── B.5  Early exit condition ──────────────────────────────────────

  test("early exit condition is documented", async () => {
    const devGov = await readFile(
      ".claude/skills/meta-theory/references/dev-governance.md"
    );
    const combinedText = skillContent + "\n" + devGov;
    const hasEarlyExit =
      /[Ee]arly\s*[Ee]xit/.test(combinedText) ||
      combinedText.includes("skip Round 2");
    assert.ok(hasEarlyExit, "Must document early exit condition for clarity probing");
  });

  // ── B.6  Architecture type pre-judgment ────────────────────────────

  test("architecture type pre-judgment is documented (Meta vs Technical)", () => {
    const hasMeta = skillContent.includes("Meta Architecture");
    const hasTechnical =
      skillContent.includes("Project Technical Architecture") ||
      skillContent.includes("Technical Architecture");
    assert.ok(
      hasMeta && hasTechnical,
      "SKILL.md must document the Meta vs Technical architecture pre-judgment"
    );
  });

  // ── B.7  Stated assumption for single-ambiguous ────────────────────

  test("'stated assumption' for single-ambiguous is documented", () => {
    const hasAssumeRule =
      skillContent.includes("state your assumption") ||
      skillContent.includes("stated assumption") ||
      skillContent.includes("assuming you mean");
    assert.ok(
      hasAssumeRule,
      "SKILL.md must document the stated-assumption rule for single-ambiguous dimensions"
    );
  });

  // ── B.8  Clarity Gate states from dev-governance.md ────────────────

  test("Clarity Gate states (Confirmed / Probed / Assumed) exist in dev-governance.md", async () => {
    const devGov = await readFile(
      ".claude/skills/meta-theory/references/dev-governance.md"
    );
    const states = ["Confirmed", "Probed", "Assumed"];
    const missing = states.filter((s) => !devGov.includes(s));
    assert.deepEqual(
      missing,
      [],
      `dev-governance.md must define Clarity Gate states: ${missing.join(", ")}`
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part C: Scenario JSON validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Clarity Gate scenario JSON validation", async () => {
  const rawJson = await fs.readFile(SCENARIOS_PATH, "utf-8");
  const scenarios = JSON.parse(rawJson);

  test("scenarios file contains exactly 12 entries", () => {
    assert.equal(scenarios.length, 12, "Must have exactly 12 clarity gate scenarios");
  });

  test("scenario IDs are CG-01 through CG-12", () => {
    const expectedIds = Array.from({ length: 12 }, (_, i) =>
      `CG-${String(i + 1).padStart(2, "0")}`
    );
    const actualIds = scenarios.map((s) => s.id);
    assert.deepEqual(actualIds, expectedIds);
  });

  for (const scenario of scenarios) {
    describe(`scenario ${scenario.id}`, () => {
      test("has required field: id (string)", () => {
        assert.equal(typeof scenario.id, "string");
        assert.ok(scenario.id.length > 0);
      });

      test("has required field: input (non-empty string)", () => {
        assert.equal(typeof scenario.input, "string");
        assert.ok(scenario.input.length > 0);
      });

      test("has required field: ambiguousDims (array of valid dimensions)", () => {
        assert.ok(Array.isArray(scenario.ambiguousDims));
        for (const dim of scenario.ambiguousDims) {
          assert.ok(
            CLARITY_DIMENSIONS.includes(dim),
            `"${dim}" is not a valid clarity dimension`
          );
        }
      });

      test("has required field: expectedBehavior (non-empty string)", () => {
        assert.equal(typeof scenario.expectedBehavior, "string");
        assert.ok(scenario.expectedBehavior.length > 0);
      });

      test("has required field: expectedQuestions (array of strings)", () => {
        assert.ok(Array.isArray(scenario.expectedQuestions));
        for (const q of scenario.expectedQuestions) {
          assert.equal(typeof q, "string");
        }
      });

      test("has required field: passFailCriteria with PASS and FAIL keys", () => {
        assert.equal(typeof scenario.passFailCriteria, "object");
        assert.ok(scenario.passFailCriteria !== null);
        assert.equal(typeof scenario.passFailCriteria.PASS, "string");
        assert.equal(typeof scenario.passFailCriteria.FAIL, "string");
        assert.ok(scenario.passFailCriteria.PASS.length > 0);
        assert.ok(scenario.passFailCriteria.FAIL.length > 0);
      });

      test("ambiguous dimension count aligns with gate logic", () => {
        const count = scenario.ambiguousDims.length;
        if (count >= 2) {
          assert.ok(
            scenario.expectedBehavior.includes("MUST ASK"),
            `${scenario.id}: >=2 ambiguous dims should have MUST ASK behavior`
          );
        } else if (count === 1) {
          assert.ok(
            scenario.expectedBehavior.includes("assumption") ||
              scenario.expectedBehavior.includes("Single ambiguous"),
            `${scenario.id}: 1 ambiguous dim should mention assumption or Single ambiguous`
          );
        } else {
          assert.ok(
            scenario.expectedBehavior.includes("proceed directly") ||
              scenario.expectedBehavior.includes("All clear"),
            `${scenario.id}: 0 ambiguous dims should say proceed directly or All clear`
          );
        }
      });
    });
  }
});
