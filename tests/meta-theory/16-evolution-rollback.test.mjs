/**
 * 16-evolution-rollback.test.mjs
 *
 * Tests the evolution (5+1 model) and rollback (4-level) mechanisms.
 *
 * Evolution (5+1):
 * - patternReuse → extract as skill
 * - boundaryDrift → trigger Type B split/merge
 * - rhythmBottleneck → update card costs
 * - capabilityGap → queue for Scout
 * - processBottleneck → reorder stages
 * - scarDetected → record prevention rule
 *
 * Rollback (4-level):
 * - File-level (1 file) → git checkout
 * - Sub-task level (2-3 related files)
 * - Partial rollback (mixed success/failure)
 * - Full rollback (>3 files or cross-module) → git stash + Stage 1 re-entry
 *
 * Validates:
 * - evolution-contract.json completeness
 * - scar-protocol.md completeness
 * - evolution writeback packet structure
 * - rollback protocol documentation
 * - "Rollback is not failure" rule
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  readFile,
  SCAR_TYPES,
  SCAR_IMPACT_LEVELS,
} from "./_helpers.mjs";
import path from "node:path";

const SCENARIOS_PATH = path.join(
  import.meta.dirname,
  "scenarios",
  "evolution-scenarios.json",
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part A: Evolution Contract — 5+1 Dimensions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part A: evolution-contract.json 5+1 dimensions", async () => {
  const evo = await readJson("config/contracts/evolution-contract.json");
  const loop = evo.evolutionFeedbackLoop ?? {};

  test("schemaVersion exists", () => {
    assert.ok(evo.schemaVersion !== undefined, "schemaVersion must exist");
  });

  test("all 6 evolution dimensions exist", () => {
    const expected = [
      "patternReuse",
      "boundaryDrift",
      "rhythmBottleneck",
      "capabilityGap",
      "processBottleneck",
      "scarDetected",
    ];
    for (const dim of expected) {
      assert.ok(
        loop[dim] !== undefined,
        `evolutionFeedbackLoop must have dimension "${dim}"`,
      );
    }
    assert.equal(
      Object.keys(loop).length,
      6,
      "Must have exactly 6 evolution dimensions",
    );
  });

  test("each dimension has target, storage, trigger, evidence", () => {
    const requiredFields = ["target", "storage", "trigger", "evidence"];
    for (const [dim, value] of Object.entries(loop)) {
      for (const field of requiredFields) {
        assert.ok(
          value?.[field] !== undefined,
          `dimension "${dim}" must have "${field}"`,
        );
      }
    }
  });

  test("patternReuse target is artisan-candidate-pool", () => {
    assert.equal(loop.patternReuse?.target, "artisan-candidate-pool");
  });

  test("boundaryDrift target references agent boundaries", () => {
    const target = loop.boundaryDrift?.target ?? "";
    assert.ok(
      target.includes("warden") ||
        target.includes("type-b") ||
        target.includes("agent"),
      "boundaryDrift target must reference agent/type-b pipeline",
    );
  });

  test("rhythmBottleneck target references card deck", () => {
    const target = loop.rhythmBottleneck?.target ?? "";
    assert.ok(
      target.includes("card") ||
        target.includes("conductor") ||
        target.includes("deck"),
      "rhythmBottleneck target must reference card/deck/conduct",
    );
  });

  test("capabilityGap target references scout queue", () => {
    const target = loop.capabilityGap?.target ?? "";
    assert.ok(
      target.includes("scout") ||
        target.includes("gap") ||
        target.includes("discovery"),
      "capabilityGap target must reference scout",
    );
  });

  test("processBottleneck target references conductor orchestration", () => {
    const target = loop.processBottleneck?.target ?? "";
    assert.ok(
      target.includes("conductor") ||
        target.includes("orchestration") ||
        target.includes("workflow"),
      "processBottleneck target must reference conductor/orchestration",
    );
  });

  test("scarDetected target references critical checklist", () => {
    const target = loop.scarDetected?.target ?? "";
    assert.ok(
      target.includes("critical") ||
        target.includes("checklist") ||
        target.includes("scar"),
      "scarDetected target must reference critical/checklist",
    );
  });
});

describe("Part B: amplification operations", async () => {
  const evo = await readJson("config/contracts/evolution-contract.json");
  const ops = evo.amplificationOperations ?? {};

  test("all 6 amplification operations exist", () => {
    const expected = [
      "patternReuse",
      "boundaryDrift",
      "rhythmBottleneck",
      "capabilityGap",
      "processBottleneck",
      "scarDetected",
    ];
    for (const op of expected) {
      assert.ok(
        ops[op] !== undefined,
        `amplificationOperations must have "${op}"`,
      );
    }
  });

  test("patternReuse amplification is extract-and-persist", () => {
    assert.ok(
      ops.patternReuse?.includes("extract") ||
        ops.patternReuse?.includes("skill"),
      "patternReuse amplification should relate to skill extraction",
    );
  });

  test("boundaryDrift amplification triggers Type B split", () => {
    const op = ops.boundaryDrift ?? "";
    assert.ok(
      op.includes("type-b") ||
        op.includes("split") ||
        op.includes("merge") ||
        op.includes("boundary"),
      "boundaryDrift amplification should reference type-b/split/merge",
    );
  });

  test("rhythmBottleneck amplification updates card costs", () => {
    const op = ops.rhythmBottleneck ?? "";
    assert.ok(
      op.includes("card") ||
        op.includes("cost") ||
        op.includes("priority") ||
        op.includes("rhythm"),
      "rhythmBottleneck amplification should reference card/cost/priority",
    );
  });

  test("capabilityGap amplification queues for scout", () => {
    const op = ops.capabilityGap ?? "";
    assert.ok(
      op.includes("scout") || op.includes("queue") || op.includes("gap"),
      "capabilityGap amplification should reference scout/queue",
    );
  });

  test("processBottleneck amplification reorders stages", () => {
    const op = ops.processBottleneck ?? "";
    assert.ok(
      op.includes("stage") ||
        op.includes("order") ||
        op.includes("process") ||
        op.includes("reorder"),
      "processBottleneck amplification should reference stage/order",
    );
  });

  test("scarDetected amplification appends to protocol", () => {
    const op = ops.scarDetected ?? "";
    assert.ok(
      op.includes("append") || op.includes("scar") || op.includes("protocol"),
      "scarDetected amplification should reference append/protocol",
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part C: Evolution Writeback Packet
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part C: evolution writeback packet", async () => {
  const contract = await readJson("config/contracts/workflow-contract.json");
  const fields =
    contract.protocols?.evolutionWritebackPacket?.requiredFields ?? [];

  test("evolutionWritebackPacket required fields are complete", () => {
    const required = [
      "ownerAssessment",
      "writebackDecision",
      "decisionReason",
      "writebacks",
      "retain",
      "upgrade",
      "retire",
      "scarIds",
      "syncRequired",
    ];
    for (const field of required) {
      assert.ok(
        fields.includes(field),
        `evolutionWritebackPacket must have required field "${field}"`,
      );
    }
    assert.equal(fields.length, 9);
  });

  test("writebackDecision is required (writeback or none)", () => {
    const decision = contract.runDiscipline?.evolutionDecision ?? {};
    assert.equal(decision.required, true);
    assert.ok(decision.allowedDecisions?.includes("writeback"));
    assert.ok(decision.allowedDecisions?.includes("none"));
    assert.equal(decision.noneRequiresReason, true);
    assert.equal(decision.writebackRequiresTargets, true);
  });

  test("writeback targets are defined", () => {
    const targets = contract.runDiscipline?.evolutionWritebackTargets ?? [];
    assert.ok(targets.length >= 5);
    assert.ok(targets.some((t) => t.includes("canonical/agents/")));
    assert.ok(targets.some((t) => t.includes("canonical/skills/")));
    assert.ok(targets.some((t) => t.includes("workflow-contract")));
    assert.ok(targets.some((t) => t.includes("memory/scars/")));
    assert.ok(targets.some((t) => t.includes("memory/capability-gaps")));
  });

  test("evolutionDecision.requiresReasonWhen=none is enforced", () => {
    const decision = contract.runDiscipline?.evolutionDecision ?? {};
    assert.equal(decision.noneRequiresReason, true);
  });

  test("syncRequired field triggers npm run sync:runtimes", () => {
    // syncRequired is in the evolutionWritebackPacket, indicating sync is needed
    assert.ok(
      fields.includes("syncRequired"),
      "evolutionWritebackPacket must include syncRequired field",
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part D: Scar Protocol
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part D: scar-protocol.md completeness", async () => {
  const scarContent = await readFile("config/contracts/scar-protocol.md");

  test("all 4 scar types are documented", () => {
    for (const scarType of SCAR_TYPES) {
      assert.ok(
        scarContent.includes(scarType),
        `scar type "${scarType}" must be in scar-protocol.md`,
      );
    }
  });

  test("all 4 impact levels are documented", () => {
    for (const level of SCAR_IMPACT_LEVELS) {
      assert.ok(
        scarContent.includes(level),
        `impact level "${level}" must be in scar-protocol.md`,
      );
    }
  });

  test("scar record schema fields are present", () => {
    const requiredFields = [
      "id",
      "type",
      "date",
      "triggered_by",
      "what_happened",
      "root_cause",
      "impact",
      "prevention_rule",
    ];
    for (const field of requiredFields) {
      assert.ok(
        scarContent.includes(field),
        `scar schema field "${field}" must be in scar-protocol.md`,
      );
    }
  });

  test("scar id format is documented (date-type-short-desc)", () => {
    const patterns = [
      /id.*date.*type.*desc/i,
      /\{date\}.*\{type\}/i,
      /YYYY.*MM.*type/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(scarContent)) || scarContent.includes("id:"),
      "scar-protocol.md must document scar id format",
    );
  });

  test("overstep scar type is documented", () => {
    assert.ok(
      scarContent.includes("overstep"),
      "scar-protocol.md must document overstep scar type",
    );
  });

  test("boundary-violation scar type is documented", () => {
    assert.ok(
      scarContent.includes("boundary-violation") ||
        scarContent.includes("boundary violation"),
      "scar-protocol.md must document boundary-violation scar type",
    );
  });

  test("process-gap scar type is documented", () => {
    assert.ok(
      scarContent.includes("process-gap") ||
        scarContent.includes("process gap"),
      "scar-protocol.md must document process-gap scar type",
    );
  });

  test("false-positive scar type is documented", () => {
    assert.ok(
      scarContent.includes("false-positive") ||
        scarContent.includes("false positive"),
      "scar-protocol.md must document false-positive scar type",
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part E: Rollback Protocol
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part E: rollback protocol in dev-governance.md", async () => {
  const devGov = await readFile(
    "canonical/skills/meta-theory/references/dev-governance.md",
  );

  test("4-level rollback protocol is documented", () => {
    const levels = ["file-level", "sub-task", "partial", "full"];
    let found = 0;
    for (const level of levels) {
      if (devGov.toLowerCase().includes(level.toLowerCase())) found++;
    }
    assert.ok(
      found >= 4,
      `All 4 rollback levels must be documented (found ${found}/4)`,
    );
  });

  test("file-level rollback documented (1 file)", () => {
    const patterns = [
      /file.*level.*rollback/i,
      /1.*file.*rollback/i,
      /git.*checkout/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(devGov)),
      "File-level rollback must be documented",
    );
  });

  test("sub-task level rollback documented (2-3 files)", () => {
    const patterns = [
      /sub.task.*rollback/i,
      /2.*3.*files.*rollback/i,
      /sub.task.*revert/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(devGov)),
      "Sub-task level rollback must be documented",
    );
  });

  test("partial rollback documented (mixed success/failure)", () => {
    const patterns = [
      /partial.*rollback/i,
      /mixed.*success.*failure/i,
      /keep.*success.*rollback.*fail/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(devGov)),
      "Partial rollback must be documented",
    );
  });

  test("full rollback documented (>3 files or cross-module)", () => {
    const patterns = [
      /full.*rollback/i,
      />3.*file.*rollback/i,
      /cross.module.*rollback/i,
      /git.*stash.*full/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(devGov)),
      "Full rollback must be documented (>3 files or cross-module)",
    );
  });

  test("full rollback re-enters Stage 1 (Critical)", () => {
    const patterns = [
      /full.*rollback.*Stage.*1/i,
      /full.*rollback.*Critical/i,
      /re.enter.*Stage.*1.*full/i,
      /re-enter.*Critical.*rollback/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(devGov)),
      "Full rollback must re-enter Stage 1 (Critical)",
    );
  });

  test("'Rollback is not failure' iron rule is documented", () => {
    assert.ok(
      devGov.toLowerCase().includes("rollback is not failure"),
      "dev-governance.md must contain 'Rollback is not failure' iron rule",
    );
  });

  test("rollback decision flow is documented", () => {
    // Verification FAIL → count affected files → decide rollback level
    const patterns = [
      /Verification.*FAIL.*file.*count/i,
      /rollback.*decision.*flow/i,
      /count.*affected.*file.*rollback/i,
    ];
    assert.ok(
      patterns.some((p) => p.test(devGov)),
      "Rollback decision flow must be documented",
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part F: Evolution Scenarios
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part F: evolution scenarios", async () => {
  test("evolution-scenarios.json exists and is valid", async () => {
    const { promises: fs } = await import("node:fs");
    try {
      const raw = await fs.readFile(SCENARIOS_PATH, "utf8");
      const scenarios = JSON.parse(raw);
      assert.ok(Array.isArray(scenarios), "Scenarios must be an array");
      assert.ok(
        scenarios.length >= 5,
        `Expected at least 5 scenarios, got ${scenarios.length}`,
      );
    } catch (err) {
      if (err.code === "ENOENT") {
        assert.fail(`Missing scenario file: ${SCENARIOS_PATH}`);
      }
      throw err;
    }
  });

  let scenarios;
  try {
    const { promises: fs } = await import("node:fs");
    const raw = await fs.readFile(SCENARIOS_PATH, "utf8");
    scenarios = JSON.parse(raw);
  } catch {
    scenarios = [];
  }

  if (scenarios.length > 0) {
    for (const scenario of scenarios) {
      test(`Evolution scenario ${scenario.id}: ${scenario.input}`, () => {
        assert.ok(scenario.id, "Scenario must have an id");
        assert.ok(scenario.input, "Scenario must have an input");
        assert.ok(
          scenario.detectedDimension || scenario.rollbackLevel,
          "Scenario must have detectedDimension or rollbackLevel",
        );
        assert.ok(
          scenario.passFailCriteria?.PASS,
          `Scenario ${scenario.id} must have passFailCriteria.PASS`,
        );
      });
    }
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part G: Evolution Detection Evidence Thresholds
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part G: evolution detection evidence thresholds", async () => {
  const evo = await readJson("config/contracts/evolution-contract.json");

  test("patternReuse evidence threshold is ≥3 occurrences", () => {
    const evidence = evo.evolutionFeedbackLoop?.patternReuse?.evidence ?? "";
    assert.ok(
      evidence.includes("3") || evidence.includes("≥3"),
      "patternReuse evidence must reference ≥3 occurrences",
    );
  });

  test("boundaryDrift evidence references Stew-All/Shattered", () => {
    const evidence = evo.evolutionFeedbackLoop?.boundaryDrift?.evidence ?? "";
    assert.ok(
      evidence.includes("Stew-All") ||
        evidence.includes("Shattered") ||
        evidence.includes("death"),
      "boundaryDrift evidence must reference death patterns",
    );
  });

  test("rhythmBottleneck evidence references ≥3 consecutive high-cost cards", () => {
    const evidence =
      evo.evolutionFeedbackLoop?.rhythmBottleneck?.evidence ?? "";
    assert.ok(
      evidence.includes("3") ||
        evidence.includes("≥3") ||
        evidence.includes("consecutive"),
      "rhythmBottleneck evidence must reference ≥3 consecutive",
    );
  });

  test("capabilityGap evidence references 0 matches", () => {
    const evidence = evo.evolutionFeedbackLoop?.capabilityGap?.evidence ?? "";
    assert.ok(
      evidence.includes("0") ||
        evidence.includes("zero") ||
        evidence.includes("no match"),
      "capabilityGap evidence must reference 0 matches",
    );
  });

  test("processBottleneck evidence references Review gate failure", () => {
    const evidence =
      evo.evolutionFeedbackLoop?.processBottleneck?.evidence ?? "";
    assert.ok(
      evidence.includes("Review") ||
        evidence.includes("gate") ||
        evidence.includes("fail"),
      "processBottleneck evidence must reference gate failure",
    );
  });

  test("scarDetected evidence references impact recovered or critical", () => {
    const evidence = evo.evolutionFeedbackLoop?.scarDetected?.evidence ?? "";
    assert.ok(
      evidence.includes("recovered") ||
        evidence.includes("critical") ||
        evidence.includes("impact"),
      "scarDetected evidence must reference impact level",
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Part H: Owner Assessment and Decision
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Part H: owner assessment decisions", async () => {
  const contract = await readJson("config/contracts/workflow-contract.json");
  const fields =
    contract.protocols?.evolutionWritebackPacket?.requiredFields ?? [];

  test("ownerAssessment is a required field", () => {
    assert.ok(
      fields.includes("ownerAssessment"),
      "evolutionWritebackPacket must have ownerAssessment field",
    );
  });

  test("retain, upgrade, retire fields are required", () => {
    assert.ok(fields.includes("retain"), "must have retain field");
    assert.ok(fields.includes("upgrade"), "must have upgrade field");
    assert.ok(fields.includes("retire"), "must have retire field");
  });

  test("evolution writeback required by run discipline", () => {
    assert.equal(
      contract.runDiscipline?.evolutionWritebackRequired,
      true,
      "evolutionWritebackRequired must be true",
    );
  });
});
