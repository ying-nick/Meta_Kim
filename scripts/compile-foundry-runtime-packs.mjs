import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(repoRoot, "factory", "generated");
const outDir = path.join(repoRoot, "factory", "runtime-packs");
const checkOnly = process.argv.includes("--check");

function dedupe(items) {
  return [...new Set(items)];
}

function normalize(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function escapeTomlMultiline(input) {
  return input.replace(/"""/g, '\\"\\"\\"');
}

function escapeYamlDoubleQuoted(input) {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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

async function writeFile(filePath, content, changedFiles) {
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

function buildClaudeAgent(agent, sourceContent, protocol) {
  const description =
    agent.tier === "department"
      ? `Meta_Kim foundry department agent for ${agent.title}.`
      : `Meta_Kim foundry specialist agent for ${agent.title}.`;
  const runtimeRules =
    agent.tier === "department"
      ? [
          `- Tier: \`${agent.tier}\``,
          `- Industry: \`${agent.industry}\``,
          `- Department: \`${agent.department}\``,
          "- Department seeds are the first routing stop. Use this agent before selecting specialists.",
          "- Default orchestrator: `meta-conductor`",
          "- Cross-department arbitration: `meta-warden`",
          "- Consult `factory/generated/department-call-protocol.json` before launching multi-department collaboration.",
          `- Preferred downstream departments: ${protocol.departmentHandoffs[agent.department]
            .map((item) => `\`${item}\``)
            .join(", ")}`,
        ]
      : [
          `- Tier: \`${agent.tier}\``,
          `- Industry: \`${agent.industry}\``,
          `- Department: \`${agent.department}\``,
          `- Parent department seed: \`${agent.parentDepartmentAgent}\``,
          "- Specialists should not arbitrate cross-department conflicts on their own.",
          "- Return decisions and findings to the parent department seed unless the user explicitly redirects otherwise.",
          "- Escalate cross-department conflicts to `meta-warden` through the parent department seed.",
        ];

  return `---
name: ${agent.id}
description: "${escapeYamlDoubleQuoted(description)}"
---

# ${agent.title}

> Generated runtime projection from Meta_Kim Agent Foundry.

## Runtime Contract

${runtimeRules.map((line) => line).join("\n")}

## Source Brief

${sourceContent}
`;
}

function buildCodexAgent(agent, sourceContent, protocol) {
  const description =
    agent.tier === "department"
      ? `Meta_Kim foundry department agent for ${agent.title}.`
      : `Meta_Kim foundry specialist agent for ${agent.title}.`;
  const header =
    agent.tier === "department"
      ? `You are the Codex runtime projection of the Meta_Kim foundry department agent \`${agent.id}\`.
Stay inside the ${agent.department} boundary for the ${agent.industry} industry.
Use this department seed before selecting narrower specialists.
Multi-department routing is owned by \`${protocol.orchestrator}\`; arbitration is owned by \`${protocol.arbiter}\`.
Consult \`factory/generated/department-call-protocol.json\` and \`factory/generated/orchestration-playbooks.md\` when a task spans departments.`
      : `You are the Codex runtime projection of the Meta_Kim foundry specialist agent \`${agent.id}\`.
Stay inside this specialist slice of the ${agent.department} department for the ${agent.industry} industry.
Your parent department seed is \`${agent.parentDepartmentAgent}\`.
Return decisions and findings to the parent department seed; do not silently coordinate cross-department routing yourself.
Escalate conflicts to \`${protocol.arbiter}\` through \`${protocol.orchestrator}\` when needed.`;

  const instructions = `${header}

${sourceContent}`;

  return `name = "${agent.id}"
description = "${description}"
developer_instructions = """
${escapeTomlMultiline(instructions)}
"""
`;
}

function buildOpenClawSoul(agent, sourceContent, protocol) {
  const runtimeNotes =
    agent.tier === "department"
      ? [
          "- This workspace is a department seed from Meta_Kim Agent Foundry.",
          `- Industry: \`${agent.industry}\``,
          `- Department: \`${agent.department}\``,
          `- Cross-department orchestration owner: \`${protocol.orchestrator}\``,
          `- Cross-department arbitration owner: \`${protocol.arbiter}\``,
          "- Use this department before handing work to specialists.",
        ]
      : [
          "- This workspace is a specialist projection from Meta_Kim Agent Foundry.",
          `- Industry: \`${agent.industry}\``,
          `- Department: \`${agent.department}\``,
          `- Parent department seed: \`${agent.parentDepartmentAgent}\``,
          `- Cross-department arbitration owner: \`${protocol.arbiter}\``,
          "- Return outputs to the parent department seed instead of widening scope silently.",
        ];

  return `# SOUL.md - ${agent.id}

Generated from Meta_Kim Agent Foundry runtime packs.

## Runtime Notes

${runtimeNotes.join("\n")}

## Source Brief

${sourceContent}
`;
}

function buildOpenClawAgents(agent, protocol) {
  const lines =
    agent.tier === "department"
      ? [
          `- Primary routing owner: \`${agent.id}\``,
          `- Default orchestrator: \`${protocol.orchestrator}\``,
          `- Arbitration owner: \`${protocol.arbiter}\``,
          `- Downstream departments: ${(protocol.departmentHandoffs[agent.department] ?? [])
            .map((item) => `\`${item}\``)
            .join(", ")}`,
          `- Specialist slots live under \`factory/generated/specialists/${agent.industry}/${agent.department}/\`.`,
        ]
      : [
          `- Parent department seed: \`${agent.parentDepartmentAgent}\``,
          `- Default orchestrator: \`${protocol.orchestrator}\``,
          `- Arbitration owner: \`${protocol.arbiter}\``,
          "- Do not expand into other departments without an explicit handoff.",
        ];

  return `# AGENTS.md - ${agent.id}

This workspace is generated from Meta_Kim Agent Foundry.

${lines.join("\n")}
`;
}

function buildOpenClawTools(agent) {
  const lines =
    agent.tier === "department"
      ? [
          "- Read `SOUL.md` first, then align with `factory/generated/department-call-protocol.json` before delegating.",
          "- Prefer routing work through this department seed before spawning narrower specialists.",
          "- Use `meta-conductor` for sequencing and `meta-warden` for cross-department conflicts.",
        ]
      : [
          "- Read `SOUL.md` first, then confirm the task still belongs to this specialist slice.",
          `- Hand results back to \`${agent.parentDepartmentAgent}\` unless the user explicitly changes the chain.`,
          "- Escalate cross-department conflicts to `meta-warden` through the parent department seed.",
        ];

  return `# TOOLS.md - ${agent.id}

Generated by Meta_Kim Agent Foundry.

${lines.join("\n")}
`;
}

function buildOpenClawBootstrap(agent) {
  return `# BOOTSTRAP.md - ${agent.id}

This workspace is preloaded from Meta_Kim Agent Foundry.

## Cold Start

1. Read \`SOUL.md\` to confirm the exact boundary.
2. Read \`AGENTS.md\` to understand upstream and downstream routing.
3. Read \`TOOLS.md\` before delegating or escalating.
4. Do not widen scope just because adjacent work exists.

## First Reply Rule

- Restate the narrow ownership you actually hold.
- Name the parent department seed if you are a specialist.
- Escalate cross-department collisions instead of improvising governance.
`;
}

function buildOpenClawMemory(agent) {
  return `# MEMORY.md - ${agent.id}

Store only stable, cross-session facts that remain valid for this ${agent.tier} agent.

## Record

- durable industry assumptions
- stable department or specialist boundary clarifications
- recurring handoff rules that keep orchestration cleaner

## Do Not Record

- transient task state
- raw command output
- unverified assumptions
- cross-department decisions that belong to meta-warden
`;
}

function buildOpenClawTemplate(agents) {
  return {
    agents: {
      defaults: {
        model: "claude-sonnet-4-5",
      },
      list: agents.map((agent) => ({
        id: agent.id,
        default: false,
        name: agent.title,
        workspace: `__REPO_ROOT__\\factory\\runtime-packs\\openclaw\\workspaces\\${agent.id}`,
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
        allow: agents.map((agent) => agent.id),
      },
    },
  };
}

function buildRuntimeReadme(summary, departments, specialists) {
  return `# Meta_Kim Foundry Runtime Packs

Generated runtime-pack summary:

- **${summary.departmentSeeds} department runtime agents**
- **${summary.specialistAgents} specialist runtime agents**
- **${summary.totalAgents} total runtime agents**

This layer compiles the foundry briefs into runtime-specific import packs for:

- Claude Code
- Codex
- OpenClaw

## Layout

\`\`\`text
factory/runtime-packs/
├─ README.md
├─ summary.json
├─ claude/agents/*.md
├─ codex/agents/*.toml
└─ openclaw/
   ├─ openclaw.template.json
   └─ workspaces/<agent-id>/
      ├─ SOUL.md
      ├─ AGENTS.md
      ├─ TOOLS.md
      ├─ BOOTSTRAP.md
      └─ MEMORY.md
\`\`\`

## Counts

- Department packs: ${departments.length}
- Specialist packs: ${specialists.length}
- Total packs: ${departments.length + specialists.length}

## Source of Truth

The canonical logic remains:

- \`factory/catalog/foundry-config.mjs\`
- \`factory/generated/*.json\`
- \`factory/generated/departments/**\`
- \`factory/generated/specialists/**\`

These runtime packs are generated projections, not hand-maintained source files.
`;
}

async function main() {
  const changedFiles = [];
  const organizationMap = await readJson(path.join(generatedDir, "organization-map.json"));
  const protocol = await readJson(path.join(generatedDir, "department-call-protocol.json"));

  const departments = await Promise.all(
    organizationMap.departments.map(async (department) => ({
      ...department,
      tier: "department",
      sourcePath: path.join(generatedDir, "departments", department.industry, `${department.department}.md`),
      sourceContent: await fs.readFile(
        path.join(generatedDir, "departments", department.industry, `${department.department}.md`),
        "utf8"
      ),
    }))
  );

  const specialists = await Promise.all(
    organizationMap.specialists.map(async (specialist) => ({
      ...specialist,
      tier: "specialist",
      sourcePath: path.join(
        generatedDir,
        "specialists",
        specialist.industry,
        specialist.department,
        `${specialist.specialist}.md`
      ),
      sourceContent: await fs.readFile(
        path.join(
          generatedDir,
          "specialists",
          specialist.industry,
          specialist.department,
          `${specialist.specialist}.md`
        ),
        "utf8"
      ),
    }))
  );

  const allAgents = [...departments, ...specialists];

  if (!checkOnly) {
    await fs.rm(outDir, { recursive: true, force: true });
  }

  await ensureDir(outDir);
  await writeFile(
    path.join(outDir, "README.md"),
    buildRuntimeReadme(organizationMap.summary, departments, specialists),
    changedFiles
  );
  await writeFile(
    path.join(outDir, "summary.json"),
    `${JSON.stringify(
      {
        summary: organizationMap.summary,
        runtimes: {
          claude: { agents: allAgents.length },
          codex: { agents: allAgents.length },
          openclaw: { agents: allAgents.length, workspaceFilesPerAgent: 5 },
        },
      },
      null,
      2
    )}\n`,
    changedFiles
  );
  await writeFile(
    path.join(outDir, "claude", "manifest.json"),
    `${JSON.stringify(
      allAgents.map((agent) => ({
        id: agent.id,
        tier: agent.tier,
        industry: agent.industry,
        department: agent.department,
      })),
      null,
      2
    )}\n`,
    changedFiles
  );
  await writeFile(
    path.join(outDir, "codex", "manifest.json"),
    `${JSON.stringify(
      allAgents.map((agent) => ({
        id: agent.id,
        tier: agent.tier,
        industry: agent.industry,
        department: agent.department,
      })),
      null,
      2
    )}\n`,
    changedFiles
  );
  await writeFile(
    path.join(outDir, "openclaw", "manifest.json"),
    `${JSON.stringify(
      allAgents.map((agent) => ({
        id: agent.id,
        tier: agent.tier,
        industry: agent.industry,
        department: agent.department,
        workspace: `workspaces/${agent.id}`,
      })),
      null,
      2
    )}\n`,
    changedFiles
  );
  await writeFile(
    path.join(outDir, "openclaw", "openclaw.template.json"),
    `${JSON.stringify(buildOpenClawTemplate(allAgents), null, 2)}\n`,
    changedFiles
  );

  for (const agent of allAgents) {
    await writeFile(
      path.join(outDir, "claude", "agents", `${agent.id}.md`),
      buildClaudeAgent(agent, agent.sourceContent, protocol),
      changedFiles
    );
    await writeFile(
      path.join(outDir, "codex", "agents", `${agent.id}.toml`),
      buildCodexAgent(agent, agent.sourceContent, protocol),
      changedFiles
    );

    const workspaceDir = path.join(outDir, "openclaw", "workspaces", agent.id);
    await writeFile(path.join(workspaceDir, "SOUL.md"), buildOpenClawSoul(agent, agent.sourceContent, protocol), changedFiles);
    await writeFile(path.join(workspaceDir, "AGENTS.md"), buildOpenClawAgents(agent, protocol), changedFiles);
    await writeFile(path.join(workspaceDir, "TOOLS.md"), buildOpenClawTools(agent), changedFiles);
    await writeFile(path.join(workspaceDir, "BOOTSTRAP.md"), buildOpenClawBootstrap(agent), changedFiles);
    await writeFile(path.join(workspaceDir, "MEMORY.md"), buildOpenClawMemory(agent), changedFiles);
  }

  if (checkOnly) {
    const expected = new Set(
      dedupe([
        path.join(outDir, "README.md"),
        path.join(outDir, "summary.json"),
        path.join(outDir, "claude", "manifest.json"),
        path.join(outDir, "codex", "manifest.json"),
        path.join(outDir, "openclaw", "manifest.json"),
        path.join(outDir, "openclaw", "openclaw.template.json"),
        ...allAgents.flatMap((agent) => [
          path.join(outDir, "claude", "agents", `${agent.id}.md`),
          path.join(outDir, "codex", "agents", `${agent.id}.toml`),
          path.join(outDir, "openclaw", "workspaces", agent.id, "SOUL.md"),
          path.join(outDir, "openclaw", "workspaces", agent.id, "AGENTS.md"),
          path.join(outDir, "openclaw", "workspaces", agent.id, "TOOLS.md"),
          path.join(outDir, "openclaw", "workspaces", agent.id, "BOOTSTRAP.md"),
          path.join(outDir, "openclaw", "workspaces", agent.id, "MEMORY.md"),
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
      console.error("Foundry runtime packs are out of sync:");
      for (const file of changedFiles.sort()) {
        console.error(` - ${file}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log("Foundry runtime packs are in sync.");
    return;
  }

  console.log(
    `Compiled ${departments.length} department runtime agents and ${specialists.length} specialist runtime agents.`
  );
  console.log(`Artifacts written to ${normalize(outDir)}`);
  console.log(
    `Summary: Claude=${allAgents.length}, Codex=${allAgents.length}, OpenClaw=${allAgents.length} workspaces.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
