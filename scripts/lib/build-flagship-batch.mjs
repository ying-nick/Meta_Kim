import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  departmentOrchestration,
  departmentTemplates,
  industries,
  specialistTemplatesByDepartment,
} from "../../factory/catalog/foundry-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const generatedDir = path.join(repoRoot, "factory", "generated");

function dedupe(items) {
  return [...new Set(items)];
}

function normalize(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function escapeTomlMultiline(input) {
  return input.replace(/"""/g, '\\"\\"\\"');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readFileIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeFile(filePath, content, changedFiles, checkOnly) {
  const current = await readFileIfExists(filePath);
  if (current === content) return;
  if (checkOnly) {
    changedFiles.push(normalize(filePath));
    return;
  }
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
  changedFiles.push(normalize(filePath));
}

async function listFilesRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function getIndustry(industryId) {
  const industry = industries.find((item) => item.id === industryId);
  if (!industry) throw new Error(`Unknown industry ${industryId}`);
  return industry;
}

function getDepartment(departmentId) {
  const department = departmentTemplates.find((item) => item.id === departmentId);
  if (!department) throw new Error(`Unknown department ${departmentId}`);
  return department;
}

function getSpecialists(departmentId) {
  const specialists = specialistTemplatesByDepartment[departmentId];
  if (!specialists) throw new Error(`Unknown specialist template group ${departmentId}`);
  return specialists;
}

function pickSpecialists(profile) {
  const pool = getSpecialists(profile.departmentId);
  return profile.prioritySpecialists.map((specialistId) => {
    const specialist = pool.find((item) => item.id === specialistId);
    if (!specialist) {
      throw new Error(`Unknown specialist ${specialistId} for ${profile.departmentId}`);
    }
    return specialist;
  });
}

function renderBulletList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderToolStack(toolStack) {
  return Object.entries(toolStack)
    .map(([category, tools]) => `- **${category}**: ${tools.join(", ")}`)
    .join("\n");
}

function renderProfile(profile, outDirName, profileBadge) {
  const industry = getIndustry(profile.industryId);
  const department = getDepartment(profile.departmentId);
  const specialists = pickSpecialists(profile);
  const downstream = departmentOrchestration[profile.departmentId] ?? [];

  return `# ${profile.title}

> ${profileBadge}

## Core Position

- **Runtime Agent ID:** \`${profile.runtimeId}\`
- **Base Department Seed:** \`${profile.sourceAgentId}\`
- **Industry:** ${industry.name}
- **Department:** ${department.title}
- **Why this one goes first:** ${profile.whyNow}
- **Sharpened mandate:** ${profile.sharpenedMandate}

## Owns

${renderBulletList(profile.onlyOwns)}

## Refuses

${renderBulletList(profile.refuses)}

## Activate When

${renderBulletList(profile.activationSignals)}

## Decision Rules

${renderBulletList(profile.decisionRules)}

## Expert Thinking Modes

${renderBulletList(profile.expertModes)}

## Tool Stack

${renderToolStack(profile.toolStack)}

## Priority Specialist Ladder

${renderBulletList(
    specialists.map(
      (specialist) => `${specialist.title} (\`${specialist.id}\`) -> ${specialist.mandate}`
    )
  )}

## Primary Outputs

${renderBulletList(profile.outputs)}

## Quality Bar

${renderBulletList(profile.evalRubric)}

## Anti-Slop Checks

${renderBulletList(profile.antiSlop)}

## Handoff Discipline

${renderBulletList(profile.handoffRules)}

## Downstream Department Routes

${renderBulletList(downstream.map((item) => `\`${item}\``))}

## Runtime Pack Targets

- Claude Code: \`factory/${outDirName}/runtime-packs/claude/agents/${profile.runtimeId}.md\`
- Codex: \`factory/${outDirName}/runtime-packs/codex/agents/${profile.runtimeId}.toml\`
- OpenClaw: \`factory/${outDirName}/runtime-packs/openclaw/workspaces/${profile.runtimeId}/\`
`;
}

function buildClaudeAgent(profile, content, batchName) {
  return `---
name: ${profile.runtimeId}
description: "Hand-polished Meta_Kim flagship agent for ${profile.title}."
---

# ${profile.title}

> Claude Code runtime pack for ${batchName}.

## Runtime Contract

- This is a **flagship refinement**, not the raw department seed.
- Base department seed: \`${profile.sourceAgentId}\`
- Keep the sharper ownership and refusal rules from this file.
- When the task widens beyond this flagship boundary, route through \`meta-conductor\` and escalate conflicts to \`meta-warden\`.

## Flagship Profile

${content}
`;
}

function buildCodexAgent(profile, content) {
  const instructions = `You are the Codex runtime projection of the hand-polished Meta_Kim flagship agent \`${profile.runtimeId}\`.
Your base department seed is \`${profile.sourceAgentId}\`.
Keep the sharpened ownership and refusal boundaries from this flagship profile.
Use \`meta-conductor\` for sequencing and \`meta-warden\` for cross-boundary arbitration.

${content}`;

  return `name = "${profile.runtimeId}"
description = "Hand-polished Meta_Kim flagship agent for ${profile.title}."
developer_instructions = """
${escapeTomlMultiline(instructions)}
"""
`;
}

function buildOpenClawSoul(profile, content, batchName) {
  return `# SOUL.md - ${profile.runtimeId}

Generated from ${batchName}.

## Runtime Notes

- This workspace is a hand-polished flagship agent.
- Base department seed: \`${profile.sourceAgentId}\`
- Use \`meta-conductor\` for sequencing and \`meta-warden\` for arbitration.
- Do not silently expand into sibling departments.

## Flagship Profile

${content}
`;
}

function buildOpenClawAgents(profile, batchName) {
  return `# AGENTS.md - ${profile.runtimeId}

This workspace is generated from ${batchName}.

- Base department seed: \`${profile.sourceAgentId}\`
- Sequencing owner: \`meta-conductor\`
- Arbitration owner: \`meta-warden\`
- Keep this flagship sharp. Do not let it become a generic catch-all agent.
`;
}

function buildOpenClawTools(batchName) {
  return `# TOOLS.md - runtime

Generated from ${batchName}.

- Read \`SOUL.md\` first.
- Keep the sharpened ownership boundaries intact.
- Escalate cross-department conflicts instead of improvising wider governance.
- Use the flagship profile as the execution brief, not the older generic seed alone.
`;
}

function buildOpenClawBootstrap(batchName) {
  return `# BOOTSTRAP.md - runtime

This workspace is preloaded from ${batchName}.

1. Read \`SOUL.md\`.
2. Restate the narrow flagship ownership before acting.
3. If the task widens, route through \`meta-conductor\` or \`meta-warden\`.
4. Keep outputs sharp enough for real operator use, not generic advice.
`;
}

function buildOpenClawMemory() {
  return `# MEMORY.md - runtime

Store only durable facts that keep this flagship sharper over time.

## Record

- stable boundary clarifications
- recurring failure modes in this flagship domain
- useful repeated handoff patterns

## Do Not Record

- transient task state
- raw logs
- facts that belong to a broader department seed instead of this flagship
`;
}

function buildRuntimeTemplate(profiles, outDirName) {
  return {
    agents: {
      defaults: {
        model: "claude-sonnet-4-5",
      },
      list: profiles.map((profile) => ({
        id: profile.runtimeId,
        default: false,
        name: profile.title,
        workspace: `__REPO_ROOT__\\factory\\${outDirName}\\runtime-packs\\openclaw\\workspaces\\${profile.runtimeId}`,
      })),
    },
    bindings: [],
    hooks: {
      internal: {
        enabled: true,
        entries: {
          "session-memory": { enabled: true },
          "boot-md": { enabled: true },
        },
      },
    },
    tools: {
      agentToAgent: {
        enabled: true,
        allow: profiles.map((profile) => profile.runtimeId),
      },
    },
  };
}

function renderReadme(profiles, config) {
  const rows = profiles
    .map(
      (profile) =>
        `| ${getIndustry(profile.industryId).name} | ${getDepartment(profile.departmentId).title} | \`${profile.runtimeId}\` | \`${profile.sourceAgentId}\` |`
    )
    .join("\n");

  const introLines = config.intro.map((item) => `- ${item}`).join("\n");

  return `# ${config.batchName}

${config.description}

${introLines}

## Included Flagships

| Industry | Department | Runtime Agent ID | Based On |
| --- | --- | --- | --- |
${rows}

## Layout

\`\`\`text
factory/${config.outDirName}/
├─ README.md
├─ index.json
├─ agents/*.md
└─ runtime-packs/
   ├─ claude/agents/*.md
   ├─ codex/agents/*.toml
   └─ openclaw/
      ├─ openclaw.template.json
      └─ workspaces/<agent-id>/*
\`\`\`
`;
}

export async function buildFlagshipBatch(config) {
  const changedFiles = [];
  const checkOnly = process.argv.includes("--check");
  const outDir = path.join(repoRoot, "factory", config.outDirName);

  await readJson(path.join(generatedDir, "organization-map.json"));

  const profiles = config.profiles.map((profile) => ({
    ...profile,
    industry: getIndustry(profile.industryId),
    department: getDepartment(profile.departmentId),
    prioritySpecialistObjects: pickSpecialists(profile),
  }));

  if (!checkOnly) {
    await fs.rm(outDir, { recursive: true, force: true });
  }

  await ensureDir(outDir);
  await writeFile(
    path.join(outDir, "README.md"),
    renderReadme(profiles, config),
    changedFiles,
    checkOnly
  );
  await writeFile(
    path.join(outDir, "index.json"),
    `${JSON.stringify(
      profiles.map((profile) => ({
        runtimeId: profile.runtimeId,
        sourceAgentId: profile.sourceAgentId,
        industry: profile.industryId,
        department: profile.departmentId,
        prioritySpecialists: profile.prioritySpecialists,
      })),
      null,
      2
    )}\n`,
    changedFiles,
    checkOnly
  );

  for (const profile of profiles) {
    const content = renderProfile(profile, config.outDirName, config.profileBadge);
    await writeFile(path.join(outDir, "agents", `${profile.runtimeId}.md`), content, changedFiles, checkOnly);
    await writeFile(
      path.join(outDir, "runtime-packs", "claude", "agents", `${profile.runtimeId}.md`),
      buildClaudeAgent(profile, content, config.batchName),
      changedFiles,
      checkOnly
    );
    await writeFile(
      path.join(outDir, "runtime-packs", "codex", "agents", `${profile.runtimeId}.toml`),
      buildCodexAgent(profile, content),
      changedFiles,
      checkOnly
    );

    const workspaceDir = path.join(outDir, "runtime-packs", "openclaw", "workspaces", profile.runtimeId);
    await writeFile(
      path.join(workspaceDir, "SOUL.md"),
      buildOpenClawSoul(profile, content, config.batchName),
      changedFiles,
      checkOnly
    );
    await writeFile(
      path.join(workspaceDir, "AGENTS.md"),
      buildOpenClawAgents(profile, config.batchName),
      changedFiles,
      checkOnly
    );
    await writeFile(
      path.join(workspaceDir, "TOOLS.md"),
      buildOpenClawTools(config.batchName),
      changedFiles,
      checkOnly
    );
    await writeFile(
      path.join(workspaceDir, "BOOTSTRAP.md"),
      buildOpenClawBootstrap(config.batchName),
      changedFiles,
      checkOnly
    );
    await writeFile(
      path.join(workspaceDir, "MEMORY.md"),
      buildOpenClawMemory(),
      changedFiles,
      checkOnly
    );
  }

  await writeFile(
    path.join(outDir, "runtime-packs", "openclaw", "openclaw.template.json"),
    `${JSON.stringify(buildRuntimeTemplate(profiles, config.outDirName), null, 2)}\n`,
    changedFiles,
    checkOnly
  );

  if (checkOnly) {
    const expected = new Set(
      dedupe([
        path.join(outDir, "README.md"),
        path.join(outDir, "index.json"),
        path.join(outDir, "runtime-packs", "openclaw", "openclaw.template.json"),
        ...profiles.flatMap((profile) => [
          path.join(outDir, "agents", `${profile.runtimeId}.md`),
          path.join(outDir, "runtime-packs", "claude", "agents", `${profile.runtimeId}.md`),
          path.join(outDir, "runtime-packs", "codex", "agents", `${profile.runtimeId}.toml`),
          path.join(outDir, "runtime-packs", "openclaw", "workspaces", profile.runtimeId, "SOUL.md"),
          path.join(outDir, "runtime-packs", "openclaw", "workspaces", profile.runtimeId, "AGENTS.md"),
          path.join(outDir, "runtime-packs", "openclaw", "workspaces", profile.runtimeId, "TOOLS.md"),
          path.join(outDir, "runtime-packs", "openclaw", "workspaces", profile.runtimeId, "BOOTSTRAP.md"),
          path.join(outDir, "runtime-packs", "openclaw", "workspaces", profile.runtimeId, "MEMORY.md"),
        ]),
      ]).map((item) => path.normalize(item))
    );
    const existing = new Set((await listFilesRecursive(outDir)).map((item) => path.normalize(item)));

    for (const filePath of existing) {
      if (!expected.has(filePath)) {
        changedFiles.push(normalize(filePath));
      }
    }

    if (changedFiles.length > 0) {
      console.error(`${config.batchName} assets are out of sync:`);
      for (const file of changedFiles.sort()) {
        console.error(` - ${file}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`${config.batchName} assets are in sync.`);
    return;
  }

  console.log(`Built ${profiles.length} hand-polished flagship agents.`);
  console.log(`Artifacts written to ${normalize(outDir)}`);
}
