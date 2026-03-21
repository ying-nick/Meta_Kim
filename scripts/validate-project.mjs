import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const claudeAgentsDir = path.join(repoRoot, ".claude", "agents");
const openclawWorkspacesDir = path.join(repoRoot, "openclaw", "workspaces");
const execFileAsync = promisify(execFile);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${filePath} is missing YAML frontmatter.`);
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      throw new Error(`${filePath} has an invalid frontmatter line: ${line}`);
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    data[key] = value.replace(/^['"]|['"]$/g, "");
  }

  return data;
}

async function validateRequiredFiles() {
  const requiredFiles = [
    "README.md",
    "CLAUDE.md",
    "AGENTS.md",
    "LICENSE",
    ".gitignore",
    ".mcp.json",
    ".claude/settings.json",
    "meta/meta.md",
    "meta/runtime-capability-matrix.md",
    "meta/repo-map.md",
    ".claude/skills/meta-theory/SKILL.md",
    ".codex/skills/meta-theory.md",
    "shared-skills/meta-theory.md",
    "openclaw/skills/meta-theory.md",
    "openclaw/openclaw.template.json",
    "codex/config.toml.example",
    "scripts/mcp/meta-runtime-server.mjs",
    "scripts/eval-meta-agents.mjs",
    "scripts/prepare-openclaw-local.mjs"
  ];

  for (const relativePath of requiredFiles) {
    assert(
      await exists(path.join(repoRoot, relativePath)),
      `Missing required file: ${relativePath}`
    );
  }
}

async function validateClaudeAgents() {
  const files = (await fs.readdir(claudeAgentsDir))
    .filter((file) => file.endsWith(".md"))
    .sort();

  assert(files.length >= 1, "No Claude agent files found.");

  const ids = [];
  for (const file of files) {
    const filePath = path.join(claudeAgentsDir, file);
    const raw = await fs.readFile(filePath, "utf8");
    const frontmatter = parseFrontmatter(raw, filePath);
    assert(frontmatter.name, `${file} is missing frontmatter name.`);
    assert(frontmatter.description, `${file} is missing frontmatter description.`);
    assert(
      frontmatter.name === file.replace(/\.md$/, ""),
      `${file} frontmatter name must match filename.`
    );
    ids.push(frontmatter.name);
  }

  return ids;
}

async function validateOpenClawArtifacts(agentIds) {
  const templateConfigPath = path.join(repoRoot, "openclaw", "openclaw.template.json");
  const templateConfig = JSON.parse(await fs.readFile(templateConfigPath, "utf8"));
  const configIds = templateConfig.agents?.list?.map((agent) => agent.id) ?? [];
  const sortedAgentIds = [...agentIds].sort();
  const sortedConfigIds = [...configIds].sort();

  assert(
    typeof templateConfig.agents?.defaults?.model === "string" &&
      templateConfig.agents.defaults.model.length >= 1,
    "openclaw/openclaw.template.json is missing a default model."
  );

  assert(
    JSON.stringify(sortedConfigIds) === JSON.stringify(sortedAgentIds),
    "openclaw/openclaw.template.json agent list is out of sync with .claude/agents."
  );

  const allowedIds = templateConfig.tools?.agentToAgent?.allow ?? [];
  const sortedAllowedIds = [...allowedIds].sort();
  assert(
    JSON.stringify(sortedAllowedIds) === JSON.stringify(sortedAgentIds),
    "OpenClaw agentToAgent allow-list is out of sync with .claude/agents."
  );

  for (const agentId of agentIds) {
    for (const fileName of [
      "BOOTSTRAP.md",
      "IDENTITY.md",
      "USER.md",
      "SOUL.md",
      "AGENTS.md",
      "HEARTBEAT.md",
      "TOOLS.md"
    ]) {
      const workspaceFile = path.join(openclawWorkspacesDir, agentId, fileName);
      assert(await exists(workspaceFile), `Missing OpenClaw workspace file: ${path.relative(repoRoot, workspaceFile)}`);
    }
    const workspaceSkill = path.join(
      openclawWorkspacesDir,
      agentId,
      "skills",
      "meta-theory",
      "SKILL.md"
    );
    assert(
      await exists(workspaceSkill),
      `Missing OpenClaw workspace skill: ${path.relative(repoRoot, workspaceSkill)}`
    );
  }
}

async function validatePortableSkill() {
  const skillSourcePath = path.join(
    repoRoot,
    ".claude",
    "skills",
    "meta-theory",
    "SKILL.md"
  );
  const skillSource = await fs.readFile(skillSourcePath, "utf8");

  for (const expected of [
    "name: meta-theory",
    "version:",
    "author:",
    "trigger:",
    "tools:"
  ]) {
    assert(skillSource.includes(expected), `Portable skill is missing ${expected}`);
  }

  const sharedSkill = await fs.readFile(
    path.join(repoRoot, "shared-skills", "meta-theory.md"),
    "utf8"
  );
  const codexSkill = await fs.readFile(
    path.join(repoRoot, ".codex", "skills", "meta-theory.md"),
    "utf8"
  );
  const openclawSkill = await fs.readFile(
    path.join(repoRoot, "openclaw", "skills", "meta-theory.md"),
    "utf8"
  );

  assert(
    sharedSkill === skillSource,
    "shared-skills/meta-theory.md is out of sync with the canonical Claude skill."
  );
  assert(
    openclawSkill === skillSource,
    "openclaw/skills/meta-theory.md is out of sync with the canonical Claude skill."
  );
  assert(
    codexSkill === skillSource,
    ".codex/skills/meta-theory.md is out of sync with the canonical Claude skill."
  );
}

async function validatePackageJson() {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  assert(pkg.scripts?.["sync:runtimes"], "package.json is missing sync:runtimes.");
  assert(pkg.scripts?.validate, "package.json is missing validate.");
  assert(pkg.scripts?.["eval:agents"], "package.json is missing eval:agents.");
  assert(
    pkg.scripts?.["prepare:openclaw-local"],
    "package.json is missing prepare:openclaw-local."
  );
  assert(pkg.dependencies?.["@modelcontextprotocol/sdk"], "package.json is missing @modelcontextprotocol/sdk.");
  assert(pkg.dependencies?.zod, "package.json is missing zod.");
  assert(pkg.license === "MIT", "package.json license must be MIT.");
}

async function validateGitignore() {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  const gitignore = await fs.readFile(gitignorePath, "utf8");
  for (const expected of [
    "node_modules/",
    "openclaw/openclaw.local.json",
    "openclaw/workspaces/*/.openclaw/"
  ]) {
    assert(gitignore.includes(expected), `.gitignore is missing ${expected}`);
  }
}

async function validateClaudeSettings() {
  const settings = JSON.parse(
    await fs.readFile(path.join(repoRoot, ".claude", "settings.json"), "utf8")
  );
  assert(settings.permissions?.deny?.length >= 1, ".claude/settings.json is missing deny rules.");
  assert(settings.hooks?.PreToolUse?.length >= 1, ".claude/settings.json is missing PreToolUse hooks.");
  assert(settings.hooks?.SubagentStart?.length >= 1, ".claude/settings.json is missing SubagentStart hooks.");
}

async function validateMcpConfig() {
  const config = JSON.parse(await fs.readFile(path.join(repoRoot, ".mcp.json"), "utf8"));
  const server = config.mcpServers?.["meta-kim-runtime"];
  assert(server, ".mcp.json is missing meta-kim-runtime.");
  assert(server.command === "node", "meta-kim-runtime must run through node.");
}

async function validateMcpSelfTest() {
  const scriptPath = path.join(repoRoot, "scripts", "mcp", "meta-runtime-server.mjs");
  const { stdout } = await execFileAsync("node", [scriptPath, "--self-test"], {
    cwd: repoRoot
  });
  const parsed = JSON.parse(stdout);
  assert(parsed.ok === true, "MCP self-test did not report ok=true.");
  assert(parsed.agentCount >= 1, "MCP self-test returned no agents.");
}

async function main() {
  await validateRequiredFiles();
  const agentIds = await validateClaudeAgents();
  await validateOpenClawArtifacts(agentIds);
  await validatePortableSkill();
  await validatePackageJson();
  await validateGitignore();
  await validateClaudeSettings();
  await validateMcpConfig();
  await validateMcpSelfTest();
  console.log(`Validation passed for ${agentIds.length} agents.`);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
