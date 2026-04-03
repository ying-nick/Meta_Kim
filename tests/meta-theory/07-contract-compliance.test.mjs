import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  readFile,
  SCAR_TYPES,
  SCAR_IMPACT_LEVELS,
  EIGHT_STAGES,
} from "./_helpers.mjs";

describe("workflow-contract.json — schema compliance", async () => {
  const contract = await readJson("contracts/workflow-contract.json");

  test("schemaVersion exists", () => {
    assert.notEqual(contract.schemaVersion, undefined);
  });

  test('owner is "Meta_Kim"', () => {
    assert.equal(contract.owner, "Meta_Kim");
  });

  test('businessWorkflow has id "business"', () => {
    assert.equal(contract.businessWorkflow?.id, "business");
  });

  test("canonicalExecutionSpineStages has all 8 stages", () => {
    const stages = contract.businessWorkflow?.canonicalExecutionSpineStages;
    assert.ok(Array.isArray(stages), "canonicalExecutionSpineStages should be an array");
    const expected = [
      "critical",
      "fetch",
      "thinking",
      "execution",
      "review",
      "meta_review",
      "verification",
      "evolution",
    ];
    for (const stage of expected) {
      assert.ok(stages.includes(stage), `missing stage: ${stage}`);
    }
    assert.equal(stages.length, 8);
  });

  test("businessWorkflow.phases has 10 entries", () => {
    const phases = contract.businessWorkflow?.phases;
    assert.ok(Array.isArray(phases), "phases should be an array");
    assert.equal(phases.length, 10);
  });

  test("all 10 phase names present", () => {
    const phases = contract.businessWorkflow?.phases;
    const expected = [
      "direction",
      "planning",
      "execution",
      "review",
      "meta_review",
      "revision",
      "verify",
      "summary",
      "feedback",
      "evolve",
    ];
    for (const name of expected) {
      assert.ok(phases.includes(name), `missing phase: ${name}`);
    }
  });

  test('gates.planning.owner includes "meta-conductor"', () => {
    const owner = contract.gates?.planning?.owner;
    assert.ok(
      typeof owner === "string" && owner.includes("meta-conductor"),
      `planning gate owner should include "meta-conductor", got: ${owner}`
    );
  });

  test('gates.metaReview.owners includes both "meta-warden" and "meta-prism"', () => {
    const owners = contract.gates?.metaReview?.owners;
    assert.ok(Array.isArray(owners), "metaReview owners should be an array");
    assert.ok(owners.includes("meta-warden"), 'missing "meta-warden"');
    assert.ok(owners.includes("meta-prism"), 'missing "meta-prism"');
  });

  test('gates.verify.owners includes both "meta-warden" and "meta-prism"', () => {
    const owners = contract.gates?.verify?.owners;
    assert.ok(Array.isArray(owners), "verify owners should be an array");
    assert.ok(owners.includes("meta-warden"), 'missing "meta-warden"');
    assert.ok(owners.includes("meta-prism"), 'missing "meta-prism"');
  });

  test("runDiscipline.singleDepartmentPerRun is true", () => {
    assert.equal(contract.runDiscipline?.singleDepartmentPerRun, true);
  });

  test("runDiscipline.singlePrimaryDeliverable is true", () => {
    assert.equal(contract.runDiscipline?.singlePrimaryDeliverable, true);
  });

  test("runDiscipline.rejectMultiTopicRuns is true", () => {
    assert.equal(contract.runDiscipline?.rejectMultiTopicRuns, true);
  });

  test("runDiscipline.requireClosedDeliverableChain is true", () => {
    assert.equal(contract.runDiscipline?.requireClosedDeliverableChain, true);
  });

  test("runDiscipline.executionOwnership.anonymousExecutionForbidden is true", () => {
    assert.equal(
      contract.runDiscipline?.executionOwnership?.anonymousExecutionForbidden,
      true
    );
  });

  test("protocols has runHeader key", () => {
    assert.ok(
      contract.protocols?.runHeader !== undefined,
      "protocols should have runHeader"
    );
  });

  test("protocols has workerTaskPacket key", () => {
    assert.ok(
      contract.protocols?.workerTaskPacket !== undefined,
      "protocols should have workerTaskPacket"
    );
  });

  test("protocols has all 7 packet types", () => {
    const expected = [
      "runHeader",
      "dispatchBoard",
      "workerTaskPacket",
      "workerResultPacket",
      "reviewPacket",
      "verificationPacket",
      "evolutionWritebackPacket",
    ];
    const keys = Object.keys(contract.protocols ?? {});
    for (const packet of expected) {
      assert.ok(keys.includes(packet), `missing protocol packet: ${packet}`);
    }
  });

  test("publicDisplayRequires has all 5 conditions", () => {
    const conditions = contract.runDiscipline?.publicDisplayRequires;
    assert.ok(Array.isArray(conditions), "publicDisplayRequires should be an array");
    const expected = [
      "verifyPassed",
      "summaryClosed",
      "singleDeliverableMaintained",
      "deliverableChainClosed",
      "consolidatedDeliverablePresent",
    ];
    for (const cond of expected) {
      assert.ok(conditions.includes(cond), `missing condition: ${cond}`);
    }
  });
});

describe("evolution-contract.json — schema compliance", async () => {
  const evo = await readJson("contracts/evolution-contract.json");

  test("schemaVersion exists", () => {
    assert.notEqual(evo.schemaVersion, undefined);
  });

  test("has all 6 evolution dimensions as keys", () => {
    const loop = evo.evolutionFeedbackLoop ?? {};
    const expected = [
      "patternReuse",
      "boundaryDrift",
      "rhythmBottleneck",
      "capabilityGap",
      "processBottleneck",
      "scarDetected",
    ];
    const keys = Object.keys(loop);
    for (const dim of expected) {
      assert.ok(keys.includes(dim), `missing evolution dimension: ${dim}`);
    }
  });

  test("each dimension has required fields (target, storage, trigger, evidence)", () => {
    const loop = evo.evolutionFeedbackLoop ?? {};
    const requiredFields = ["target", "storage", "trigger", "evidence"];
    for (const [dim, value] of Object.entries(loop)) {
      for (const field of requiredFields) {
        assert.ok(
          value?.[field] !== undefined,
          `dimension "${dim}" missing field "${field}"`
        );
      }
    }
  });

  test("patternReuse references skills storage", () => {
    const storage = evo.evolutionFeedbackLoop?.patternReuse?.storage ?? "";
    assert.ok(
      storage.includes("skills"),
      `patternReuse storage should reference skills, got: ${storage}`
    );
  });

  test("boundaryDrift references agents storage", () => {
    const storage = evo.evolutionFeedbackLoop?.boundaryDrift?.storage ?? "";
    assert.ok(
      storage.includes("agents"),
      `boundaryDrift storage should reference agents, got: ${storage}`
    );
  });

  test("scarDetected references scar protocol", () => {
    const entry = evo.evolutionFeedbackLoop?.scarDetected ?? {};
    const combined = `${entry.target ?? ""} ${entry.storage ?? ""} ${entry.trigger ?? ""}`;
    assert.ok(
      combined.includes("scar"),
      `scarDetected should reference scar protocol, got: ${combined}`
    );
  });

  test("all dimensions have amplification operations", () => {
    const ops = evo.amplificationOperations ?? {};
    const expected = [
      "patternReuse",
      "boundaryDrift",
      "rhythmBottleneck",
      "capabilityGap",
      "processBottleneck",
      "scarDetected",
    ];
    const keys = Object.keys(ops);
    for (const dim of expected) {
      assert.ok(
        keys.includes(dim),
        `missing amplification operation for: ${dim}`
      );
    }
  });
});

describe("scar-protocol.md — schema compliance", async () => {
  const content = await readFile("contracts/scar-protocol.md");

  test("all 4 scar types documented", () => {
    for (const scarType of SCAR_TYPES) {
      assert.ok(
        content.includes(scarType),
        `scar type "${scarType}" not found in scar-protocol.md`
      );
    }
  });

  test("all 4 impact levels documented", () => {
    for (const level of SCAR_IMPACT_LEVELS) {
      assert.ok(
        content.includes(level),
        `impact level "${level}" not found in scar-protocol.md`
      );
    }
  });

  test("scar record schema fields present", () => {
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
        content.includes(field),
        `schema field "${field}" not found in scar-protocol.md`
      );
    }
  });
});
