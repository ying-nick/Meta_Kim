#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const contractPath = path.join(repoRoot, "contracts", "workflow-contract.json");
const artifactArg = process.argv[2];

const PACKET_LOCATIONS = {
  runHeader: "runHeader",
  taskClassification: "taskClassification",
  intentPacket: "intentPacket",
  intentGatePacket: "intentGatePacket",
  cardPlanPacket: "cardPlanPacket",
  dispatchBoard: "dispatchBoard",
  workerTaskPacket: "workerTaskPackets",
  workerResultPacket: "workerResultPackets",
  reviewPacket: "reviewPacket",
  verificationPacket: "verificationPacket",
  summaryPacket: "summaryPacket",
  evolutionWritebackPacket: "evolutionWritebackPacket",
};

function fail(message) {
  throw new Error(message);
}

function ensure(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function ensureFields(target, fields, context) {
  ensure(target && typeof target === "object", `${context} must be an object.`);
  for (const field of fields) {
    ensure(field in target, `${context} is missing required field "${field}".`);
  }
}

function ensureArray(value, context) {
  ensure(Array.isArray(value), `${context} must be an array.`);
}

function ensureEnum(value, allowed, context) {
  ensure(
    allowed.includes(value),
    `${context} must be one of [${allowed.join(", ")}], got: ${value}`
  );
}

function normalizePathRef(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function readJson(targetPath) {
  const raw = await fs.readFile(targetPath, "utf8");
  return JSON.parse(raw);
}

function getPacket(artifact, packetName) {
  return artifact[PACKET_LOCATIONS[packetName] ?? packetName];
}

function validateTaskClassification(contract, taskClassification) {
  ensureFields(
    taskClassification,
    contract.protocols.taskClassification.requiredFields,
    "taskClassification"
  );

  const classificationPolicy = contract.runDiscipline.taskClassification;
  ensureEnum(taskClassification.taskClass, classificationPolicy.taskClassEnum, "taskClassification.taskClass");
  ensureEnum(taskClassification.requestClass, classificationPolicy.requestClassEnum, "taskClassification.requestClass");
  ensureEnum(taskClassification.governanceFlow, classificationPolicy.governanceFlowEnum, "taskClassification.governanceFlow");
  ensureArray(taskClassification.triggerReasons, "taskClassification.triggerReasons");
  ensureArray(taskClassification.upgradeReasons, "taskClassification.upgradeReasons");
  ensureArray(taskClassification.bypassReasons, "taskClassification.bypassReasons");

  for (const item of taskClassification.triggerReasons) {
    ensureEnum(item, classificationPolicy.triggerReasonEnum, "taskClassification.triggerReasons[]");
  }
  for (const item of taskClassification.upgradeReasons) {
    ensureEnum(item, classificationPolicy.upgradeReasonEnum, "taskClassification.upgradeReasons[]");
  }
  for (const item of taskClassification.bypassReasons) {
    ensureEnum(item, classificationPolicy.bypassReasonEnum, "taskClassification.bypassReasons[]");
  }

  if (taskClassification.ownerRequired === false) {
    ensure(
      taskClassification.taskClass === "Q" &&
        taskClassification.requestClass === "query" &&
        taskClassification.governanceFlow === "query" &&
        taskClassification.bypassReasons.includes("pure_query"),
      "ownerRequired=false is only legal for pure-query runs."
    );
  }
}

function validateIntentPacketWhenRequired(contract, artifact) {
  const when = contract.runDiscipline.protocolFirst.intentPacketRequiredWhenGovernanceFlows;
  if (!Array.isArray(when) || when.length === 0) {
    return;
  }
  const flow = artifact.taskClassification?.governanceFlow;
  if (!when.includes(flow)) {
    return;
  }
  const intent = artifact.intentPacket;
  ensure(intent && typeof intent === "object", `intentPacket is required when governanceFlow is ${flow}.`);
  ensureFields(intent, contract.protocols.intentPacket.requiredFields, "intentPacket");
  for (const field of ["trueUserIntent", "successCriteria", "nonGoals"]) {
    ensure(
      typeof intent[field] === "string" && intent[field].trim().length >= 1,
      `intentPacket.${field} must be a non-empty string.`
    );
  }
  ensure(
    intent.intentPacketVersion === "v1",
    'intentPacket.intentPacketVersion must be "v1" for this contract revision.'
  );
}

function validateIntentGatePacketWhenRequired(contract, artifact) {
  const when = contract.runDiscipline.protocolFirst.intentGatePacketRequiredWhenGovernanceFlows;
  if (!Array.isArray(when) || when.length === 0) {
    return;
  }
  const flow = artifact.taskClassification?.governanceFlow;
  if (!when.includes(flow)) {
    return;
  }
  const gate = artifact.intentGatePacket;
  ensure(gate && typeof gate === "object", `intentGatePacket is required when governanceFlow is ${flow}.`);
  ensureFields(gate, contract.protocols.intentGatePacket.requiredFields, "intentGatePacket");
  ensure(
    typeof gate.ambiguitiesResolved === "boolean",
    "intentGatePacket.ambiguitiesResolved must be a boolean."
  );
  ensure(
    typeof gate.requiresUserChoice === "boolean",
    "intentGatePacket.requiresUserChoice must be a boolean."
  );
  ensure(Array.isArray(gate.defaultAssumptions), "intentGatePacket.defaultAssumptions must be an array.");
  for (const [i, item] of gate.defaultAssumptions.entries()) {
    ensure(
      typeof item === "string" && item.trim().length >= 1,
      `intentGatePacket.defaultAssumptions[${i}] must be a non-empty string.`
    );
  }
  ensure(
    gate.intentGatePacketVersion === "v1",
    'intentGatePacket.intentGatePacketVersion must be "v1" for this contract revision.'
  );
  if (gate.requiresUserChoice === true) {
    ensure(
      Array.isArray(gate.pendingUserChoices) && gate.pendingUserChoices.length >= 1,
      "intentGatePacket.requiresUserChoice=true requires non-empty pendingUserChoices array."
    );
    for (const [i, c] of gate.pendingUserChoices.entries()) {
      ensure(
        typeof c === "string" && c.trim().length >= 1,
        `intentGatePacket.pendingUserChoices[${i}] must be a non-empty string.`
      );
    }
  }
}

function validateSoftPublicReadyGates(contract, artifact) {
  const soft = contract.runDiscipline?.runArtifactValidation?.softPublicReadyTodoGate;
  const envKey = soft?.environmentVariable ?? "META_KIM_SOFT_PUBLIC_READY_GATES";
  const envVal = soft?.environmentValue ?? "1";
  if (process.env[envKey] !== envVal) {
    return;
  }
  const sp = artifact.summaryPacket;
  if (!sp || sp.publicReady !== true) {
    return;
  }
  const packets = artifact.workerTaskPackets;
  ensureArray(packets, "workerTaskPackets");
  for (const [index, packet] of packets.entries()) {
    if (packet?.taskTodoState === "open") {
      fail(
        `Soft gate (${envKey}=${envVal}): workerTaskPackets[${index}] has taskTodoState=open while summaryPacket.publicReady=true.`
      );
    }
  }
}

function validateSoftCommentReviewGate(contract, artifact) {
  const gate = contract.runDiscipline?.runArtifactValidation?.softCommentReviewGate;
  const envKey = gate?.environmentVariable ?? "META_KIM_SOFT_COMMENT_REVIEW";
  const envVal = gate?.environmentValue ?? "1";
  if (process.env[envKey] !== envVal) {
    return;
  }
  const sp = artifact.summaryPacket;
  if (!sp || sp.publicReady !== true) {
    return;
  }
  const field = gate?.summaryBooleanField ?? "commentReviewAcknowledged";
  if (sp[field] !== true) {
    fail(
      `Soft gate (${envKey}=${envVal}): summaryPacket.publicReady=true requires summaryPacket.${field}=true.`
    );
  }
}

function validateCardPlan(contract, artifact) {
  const cardPlan = artifact.cardPlanPacket;
  ensureFields(cardPlan, contract.protocols.cardPlanPacket.requiredFields, "cardPlanPacket");
  ensureArray(cardPlan.cards, "cardPlanPacket.cards");
  ensureArray(cardPlan.deliveryShells, "cardPlanPacket.deliveryShells");
  ensureArray(cardPlan.controlDecisions, "cardPlanPacket.controlDecisions");

  const dealerGate = contract.gates.dealer;
  ensure(
    [dealerGate.primaryOwner, dealerGate.escalationOwner].includes(cardPlan.dealerOwner),
    `cardPlanPacket.dealerOwner must be ${dealerGate.primaryOwner} or ${dealerGate.escalationOwner}.`
  );

  const cardPolicy = contract.runDiscipline.cardGovernance;
  const shellPolicy = contract.runDiscipline.deliveryShell;
  const silencePolicy = contract.runDiscipline.silencePolicy;
  const controlPolicy = contract.runDiscipline.controlIntervention;

  const cardIds = new Set();
  for (const [index, card] of cardPlan.cards.entries()) {
    ensureFields(card, contract.protocols.cardDecision.requiredFields, `cardPlanPacket.cards[${index}]`);
    ensure(!cardIds.has(card.cardId), `Duplicate cardId: ${card.cardId}`);
    cardIds.add(card.cardId);
    ensureEnum(card.cardType, cardPolicy.cardTypeEnum, `card ${card.cardId} cardType`);
    ensureEnum(card.cardIntent, cardPolicy.cardIntentEnum, `card ${card.cardId} cardIntent`);
    ensureEnum(card.cardDecision, cardPolicy.cardDecisionEnum, `card ${card.cardId} cardDecision`);
    ensureEnum(card.cardAudience, cardPolicy.cardAudienceEnum, `card ${card.cardId} cardAudience`);
    ensureEnum(card.cardTiming, cardPolicy.cardTimingEnum, `card ${card.cardId} cardTiming`);
    ensureEnum(card.cardShell, cardPolicy.cardShellEnum, `card ${card.cardId} cardShell`);
    ensureEnum(card.cardSource, cardPolicy.cardSourceEnum, `card ${card.cardId} cardSource`);
    ensure(Number.isInteger(card.cardPriority) && card.cardPriority >= 1, `card ${card.cardId} cardPriority must be a positive integer.`);
    if (card.cardSuppressed === true) {
      ensure(
        typeof card.suppressionReason === "string" && card.suppressionReason.trim().length >= 1,
        `suppressed card ${card.cardId} must record suppressionReason.`
      );
    }
    if (card.suppressionReason) {
      ensure(
        cardPolicy.suppressionReasonEnum.includes(card.suppressionReason) || String(card.suppressionReason).trim().length >= 1,
        `card ${card.cardId} suppressionReason must be documented.`
      );
    }
  }

  const shellIds = new Set();
  for (const [index, shell] of cardPlan.deliveryShells.entries()) {
    ensureFields(shell, contract.protocols.deliveryShell.requiredFields, `cardPlanPacket.deliveryShells[${index}]`);
    ensure(!shellIds.has(shell.deliveryShellId), `Duplicate deliveryShellId: ${shell.deliveryShellId}`);
    shellIds.add(shell.deliveryShellId);
    ensureEnum(shell.shellType, shellPolicy.shellTypeEnum, `deliveryShell ${shell.deliveryShellId} shellType`);
    ensureEnum(shell.presentationMode, shellPolicy.presentationModeEnum, `deliveryShell ${shell.deliveryShellId} presentationMode`);
    ensureEnum(shell.exposureLevel, shellPolicy.exposureLevelEnum, `deliveryShell ${shell.deliveryShellId} exposureLevel`);
    ensureEnum(shell.interventionForm, shellPolicy.interventionFormEnum, `deliveryShell ${shell.deliveryShellId} interventionForm`);
  }

  ensure(shellIds.has(cardPlan.defaultShellId), `cardPlanPacket.defaultShellId ${cardPlan.defaultShellId} must reference an existing delivery shell.`);
  for (const card of cardPlan.cards) {
    ensure(shellIds.has(card.deliveryShellId), `card ${card.cardId} references missing deliveryShellId ${card.deliveryShellId}.`);
  }

  ensureFields(cardPlan.silenceDecision, contract.protocols.silenceDecision.requiredFields, "cardPlanPacket.silenceDecision");
  ensureEnum(
    cardPlan.silenceDecision.silenceDecision,
    silencePolicy.silenceDecisionEnum,
    "cardPlanPacket.silenceDecision.silenceDecision"
  );
  if (cardPlan.silenceDecision.silenceDecision === "defer") {
    ensure(
      typeof cardPlan.silenceDecision.deferUntil === "string" &&
        cardPlan.silenceDecision.deferUntil.trim().length >= 1,
      "defer silenceDecision must include deferUntil."
    );
  }
  if (cardPlan.silenceDecision.silenceDecision !== "none") {
    ensure(
      typeof cardPlan.silenceDecision.reasonForSilence === "string" &&
        cardPlan.silenceDecision.reasonForSilence.trim().length >= 1,
      "non-none silenceDecision must include reasonForSilence."
    );
  }

  const controlIds = new Set();
  for (const [index, decision] of cardPlan.controlDecisions.entries()) {
    ensureFields(decision, contract.protocols.controlDecision.requiredFields, `cardPlanPacket.controlDecisions[${index}]`);
    ensure(!controlIds.has(decision.decisionId), `Duplicate control decision id: ${decision.decisionId}`);
    controlIds.add(decision.decisionId);
    ensureEnum(decision.decisionType, controlPolicy.decisionTypeEnum, `controlDecision ${decision.decisionId} decisionType`);

    if (decision.decisionType === "skip") {
      ensureEnum(decision.skipReason, controlPolicy.skipReasonEnum, `controlDecision ${decision.decisionId} skipReason`);
    }
    if (decision.decisionType === "interrupt") {
      ensureEnum(decision.interruptReason, controlPolicy.interruptReasonEnum, `controlDecision ${decision.decisionId} interruptReason`);
      ensure(
        controlPolicy.insertedGovernanceOwners.includes(decision.insertedGovernanceOwner),
        `interrupt decision ${decision.decisionId} must declare an insertedGovernanceOwner.`
      );
    }
    if (decision.decisionType === "override" || decision.decisionType === "escalation_insert") {
      ensureEnum(decision.overrideReason, controlPolicy.overrideReasonEnum, `controlDecision ${decision.decisionId} overrideReason`);
      ensure(
        controlPolicy.insertedGovernanceOwners.includes(decision.insertedGovernanceOwner),
        `${decision.decisionType} decision ${decision.decisionId} must declare an insertedGovernanceOwner.`
      );
    }
    if (controlPolicy.requiresReturnToMainChain === true) {
      ensure(
        typeof decision.returnsToStage === "string" && decision.returnsToStage.trim().length >= 1,
        `controlDecision ${decision.decisionId} must declare returnsToStage.`
      );
      ensure(
        typeof decision.rejoinCondition === "string" && decision.rejoinCondition.trim().length >= 1,
        `controlDecision ${decision.decisionId} must declare rejoinCondition.`
      );
    }
  }
}

function validateWorkerPackets(contract, artifact) {
  const primaryDeliverable = artifact.runHeader.primaryDeliverable;
  ensure(
    artifact.dispatchBoard.primaryDeliverable === primaryDeliverable,
    "dispatchBoard.primaryDeliverable must match runHeader.primaryDeliverable."
  );

  const taskPackets = artifact.workerTaskPackets;
  const resultPackets = artifact.workerResultPackets;
  ensureArray(taskPackets, "workerTaskPackets");
  ensureArray(resultPackets, "workerResultPackets");

  const taskById = new Map();
  for (const [index, packet] of taskPackets.entries()) {
    ensureFields(packet, contract.protocols.workerTaskPacket.requiredFields, `workerTaskPackets[${index}]`);
    ensure(!taskById.has(packet.taskPacketId), `Duplicate workerTaskPacket taskPacketId: ${packet.taskPacketId}`);
    taskById.set(packet.taskPacketId, packet);
    if (contract.runDiscipline.runArtifactValidation.deliverableLinkMustReferencePrimaryDeliverable) {
      ensure(
        normalizePathRef(packet.deliverableLink).includes(normalizePathRef(primaryDeliverable)),
        `workerTaskPacket ${packet.taskPacketId} deliverableLink must reference primaryDeliverable ${primaryDeliverable}.`
      );
    }
  }

  const resultById = new Map();
  for (const [index, packet] of resultPackets.entries()) {
    ensureFields(packet, contract.protocols.workerResultPacket.requiredFields, `workerResultPackets[${index}]`);
    ensure(taskById.has(packet.taskPacketId), `workerResultPacket ${packet.taskPacketId} has no matching workerTaskPacket.`);
    const taskPacket = taskById.get(packet.taskPacketId);
    ensure(
      packet.owner === taskPacket.owner,
      `workerResultPacket ${packet.taskPacketId} owner must match workerTaskPacket owner.`
    );
    resultById.set(packet.taskPacketId, packet);
  }

  for (const taskId of taskById.keys()) {
    ensure(resultById.has(taskId), `workerTaskPacket ${taskId} has no matching workerResultPacket.`);
  }
}

function validateFindingChain(contract, artifact) {
  const reviewPacket = artifact.reviewPacket;
  const verificationPacket = artifact.verificationPacket;
  ensureFields(reviewPacket, contract.protocols.reviewPacket.requiredFields, "reviewPacket");
  ensureFields(verificationPacket, contract.protocols.verificationPacket.requiredFields, "verificationPacket");

  ensureArray(reviewPacket.findings, "reviewPacket.findings");
  ensureArray(verificationPacket.revisionResponses, "verificationPacket.revisionResponses");
  ensureArray(verificationPacket.verificationResults, "verificationPacket.verificationResults");
  ensureArray(verificationPacket.closeFindings, "verificationPacket.closeFindings");

  const findingClosure = contract.runDiscipline.findingClosure;
  const findings = new Map();
  for (const [index, finding] of reviewPacket.findings.entries()) {
    ensureFields(finding, contract.protocols.reviewFinding.requiredFields, `reviewPacket.findings[${index}]`);
    ensure(!findings.has(finding.findingId), `Duplicate review findingId: ${finding.findingId}`);
    ensureEnum(finding.closeState, findingClosure.closeStateEnum, `review finding ${finding.findingId} closeState`);
    ensure(
      ["open", "fixed_pending_verify"].includes(finding.closeState),
      `review finding ${finding.findingId} cannot start in a terminal closeState.`
    );
    findings.set(finding.findingId, finding);
  }

  const revisionsByFinding = new Map();
  for (const [index, response] of verificationPacket.revisionResponses.entries()) {
    ensureFields(response, contract.protocols.revisionResponse.requiredFields, `verificationPacket.revisionResponses[${index}]`);
    ensure(findings.has(response.findingId), `revisionResponse ${response.actionId} references unknown findingId ${response.findingId}.`);
    revisionsByFinding.set(response.findingId, response);
  }

  const verificationByFinding = new Map();
  for (const [index, result] of verificationPacket.verificationResults.entries()) {
    ensureFields(result, contract.protocols.verificationResult.requiredFields, `verificationPacket.verificationResults[${index}]`);
    ensure(findings.has(result.findingId), `verificationResult references unknown findingId ${result.findingId}.`);
    ensureEnum(result.closeState, findingClosure.closeStateEnum, `verificationResult ${result.findingId} closeState`);
    ensure(
      ["verified_closed", "accepted_risk"].includes(result.closeState),
      `verificationResult ${result.findingId} must finish in a terminal closeState.`
    );
    verificationByFinding.set(result.findingId, result);
  }

  for (const findingId of findings.keys()) {
    ensure(revisionsByFinding.has(findingId), `Finding ${findingId} is missing a revisionResponse.`);
    ensure(verificationByFinding.has(findingId), `Finding ${findingId} is missing a verificationResult.`);
  }

  const closedIds = new Set(verificationPacket.closeFindings);
  for (const closedId of closedIds) {
    ensure(findings.has(closedId), `closeFindings contains unknown findingId ${closedId}.`);
    const verificationResult = verificationByFinding.get(closedId);
    ensure(
      verificationResult &&
        ["verified_closed", "accepted_risk"].includes(verificationResult.closeState),
      `closeFindings may only contain findings with a terminal verification closeState (${closedId}).`
    );
  }

  if (verificationPacket.verified === true) {
    ensure(
      verificationPacket.remainingIssues.length === 0,
      "verificationPacket.verified=true requires remainingIssues to be empty."
    );
    ensure(
      closedIds.size === findings.size,
      "verificationPacket.verified=true requires every review finding to be closed."
    );
  }
}

function validateSummaryAndEvolution(contract, artifact) {
  const summaryPacket = artifact.summaryPacket;
  const verificationPacket = artifact.verificationPacket;
  const evolutionPacket = artifact.evolutionWritebackPacket;
  ensureFields(summaryPacket, contract.protocols.summaryPacket.requiredFields, "summaryPacket");
  ensureArray(summaryPacket.deliveryShellsUsed, "summaryPacket.deliveryShellsUsed");
  ensureArray(summaryPacket.blockedBy, "summaryPacket.blockedBy");

  const shellIds = new Set(artifact.cardPlanPacket.deliveryShells.map((shell) => shell.deliveryShellId));
  for (const shellId of summaryPacket.deliveryShellsUsed) {
    ensure(shellIds.has(shellId), `summaryPacket references unknown delivery shell ${shellId}.`);
  }

  ensure(
    summaryPacket.verifyPassed === verificationPacket.verified,
    "summaryPacket.verifyPassed must match verificationPacket.verified."
  );

  const publicConditions = contract.runDiscipline.publicDisplayRequires;
  const missingConditions = publicConditions.filter((field) => summaryPacket[field] !== true);
  if (summaryPacket.publicReady === true) {
    ensure(
      missingConditions.length === 0,
      `summaryPacket.publicReady=true but these public-display conditions are false: ${missingConditions.join(", ")}`
    );
    ensure(
      summaryPacket.blockedBy.length === 0,
      "summaryPacket.publicReady=true requires blockedBy to be empty."
    );
  } else if (missingConditions.length > 0) {
    ensure(
      summaryPacket.blockedBy.length >= 1,
      "summaryPacket must record blockedBy reasons when publicReady=false due to gate failure."
    );
  }

  ensureFields(evolutionPacket, contract.protocols.evolutionWritebackPacket.requiredFields, "evolutionWritebackPacket");
  ensureArray(evolutionPacket.writebacks, "evolutionWritebackPacket.writebacks");
  ensureArray(evolutionPacket.scarIds, "evolutionWritebackPacket.scarIds");
  ensureEnum(
    evolutionPacket.writebackDecision,
    contract.runDiscipline.evolutionDecision.allowedDecisions,
    "evolutionWritebackPacket.writebackDecision"
  );
  ensure(
    typeof evolutionPacket.decisionReason === "string" && evolutionPacket.decisionReason.trim().length >= 1,
    "evolutionWritebackPacket.decisionReason must be non-empty."
  );
  if (evolutionPacket.writebackDecision === "writeback") {
    ensure(
      evolutionPacket.writebacks.length >= 1,
      "writebackDecision=writeback requires at least one writeback target."
    );
  }
}

function validateRequiredPackets(contract, artifact) {
  for (const packetName of contract.runDiscipline.protocolFirst.requiredPackets) {
    const packet = getPacket(artifact, packetName);
    ensure(packet !== undefined, `run artifact is missing required packet ${packetName}.`);
  }
}

async function main() {
  if (!artifactArg) {
    fail("Usage: node scripts/validate-run-artifact.mjs <artifact.json>");
  }

  const artifactPath = path.resolve(process.cwd(), artifactArg);
  const artifact = await readJson(artifactPath);
  const contract = await readJson(contractPath);

  validateRequiredPackets(contract, artifact);
  ensureFields(artifact.runHeader, contract.protocols.runHeader.requiredFields, "runHeader");
  validateTaskClassification(contract, artifact.taskClassification);
  validateIntentPacketWhenRequired(contract, artifact);
  validateIntentGatePacketWhenRequired(contract, artifact);
  validateCardPlan(contract, artifact);
  ensureFields(artifact.dispatchBoard, contract.protocols.dispatchBoard.requiredFields, "dispatchBoard");
  validateWorkerPackets(contract, artifact);
  validateFindingChain(contract, artifact);
  validateSummaryAndEvolution(contract, artifact);
  validateSoftPublicReadyGates(contract, artifact);
  validateSoftCommentReviewGate(contract, artifact);

  console.log(
    JSON.stringify(
      {
        ok: true,
        artifact: path.relative(repoRoot, artifactPath).replace(/\\/g, "/"),
        validatedPackets: contract.runDiscipline.protocolFirst.requiredPackets,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
