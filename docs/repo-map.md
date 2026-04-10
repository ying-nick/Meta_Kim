# Meta_Kim 仓库地图

这份文档专门回答两个问题：

1. 每个目录是干嘛的
2. 每个关键文件是干嘛的

结论先说：

- 真正的主源只有三类：`docs/meta.md`、`.claude/agents/*.md`、`.claude/skills/meta-theory/SKILL.md`
- 其他大多数文件不是入口层，就是生成物，或者是运行时适配层

## 一、根目录

### 目录

| 路径 | 作用 |
| --- | --- |
| `.agents/` | Codex 项目级 skill 主入口目录 |
| `.claude/` | Claude Code 运行时主目录，也是 Agent/Skill 主源所在目录 |
| `.codex/` | Codex custom agents 与兼容 skill 镜像目录 |
| `codex/` | Codex 的配置示例目录 |
| `docs/` | 元理论、能力矩阵、覆盖审计 |
| `node_modules/` | npm 依赖目录，自动生成，不手改 |
| `openclaw/` | OpenClaw 运行时适配目录，包含 workspace、skill、配置模板 |
| `scripts/` | 同步、校验、验收、MCP、本地 OpenClaw 准备脚本 |
| `shared-skills/` | 给不同运行时复用的 skill 镜像目录 |

### 文件

| 路径 | 作用 |
| --- | --- |
| `.gitignore` | Git 忽略规则，避免提交不该跟踪的本地文件 |
| `.mcp.json` | Claude Code 项目级 MCP 配置入口 |
| `AGENTS.md` | Codex/跨运行时总入口说明 |
| `CLAUDE.md` | Claude Code 仓库规则与使用说明 |
| `install-deps.sh` | 安装额外 Claude 生态 skill 的辅助脚本 |
| `LICENSE` | 项目许可证，当前为 MIT |
| `package.json` | npm 脚本、依赖、项目元信息 |
| `package-lock.json` | npm 精确依赖锁文件 |
| `README.md` | 仓库总说明、快速开始、命令入口 |

## 二、`.claude/`

### 目录

| 路径 | 作用 |
| --- | --- |
| `.claude/agents/` | 8 个元 agent 的定义主源 |
| `.claude/hooks/` | Claude Code 的项目级 hook 脚本 |
| `.claude/skills/` | Claude Code 的 skill 主源 |

### 文件

| 路径 | 作用 |
| --- | --- |
| `.claude/settings.json` | Claude Code 的权限限制与 hooks 配置 |
| `.claude/hooks/block-dangerous-bash.mjs` | 拦截危险 Bash 操作的安全 hook |
| `.claude/hooks/subagent-context.mjs` | 子代理启动时注入上下文的 hook |

### `.claude/agents/` 中的 8 个主源文件

| 路径 | 作用 |
| --- | --- |
| `.claude/agents/meta-warden.md` | 统筹、质量关卡、元评审、最终整合 |
| `.claude/agents/meta-genesis.md` | `SOUL.md`、提示词人格、认知架构设计 |
| `.claude/agents/meta-artisan.md` | skill、MCP、工具、能力匹配 |
| `.claude/agents/meta-sentinel.md` | 安全边界、Hook、权限、回滚 |
| `.claude/agents/meta-librarian.md` | 记忆、知识、跨会话连续性 |
| `.claude/agents/meta-conductor.md` | 工作流编排、阶段、节奏、交付壳 |
| `.claude/agents/meta-prism.md` | 质量法医、AI-Slop、回归、漂移审查 |
| `.claude/agents/meta-scout.md` | 外部能力发现、ROI 评估、生态引入 |

### `.claude/skills/meta-theory/`

| 路径 | 作用 |
| --- | --- |
| `.claude/skills/meta-theory/SKILL.md` | Meta_Kim 的可移植 skill 主源 |
| `canonical/skills/meta-theory/references/create-agent.md` | 创建 agent 的方法参考 |
| `canonical/skills/meta-theory/references/dev-governance.md` | 开发治理参考 |
| `canonical/skills/meta-theory/references/intent-amplification.md` | 意图放大理论参考 |
| `canonical/skills/meta-theory/references/meta-theory.md` | 元理论参考摘录 |
| `canonical/skills/meta-theory/references/rhythm-orchestration.md` | 节奏编排参考 |
| `canonical/skills/meta-theory/references/ten-step-governance.md` | 十步治理参考 |

## 三、`.codex/` 与 `codex/`

### `.agents/`

| 路径 | 作用 |
| --- | --- |
| `.agents/skills/meta-theory/SKILL.md` | Codex 官方项目级 skill 入口 |
| `.agents/skills/meta-theory/agents/openai.yaml` | Codex skill 的可选元数据文件 |

### `.codex/`

| 路径 | 作用 |
| --- | --- |
| `.codex/agents/*.toml` | Codex 项目级 custom agents，和 8 个 meta agent 一一对应 |
| `.codex/skills/meta-theory.md` | 给 Codex 保留的兼容 skill 镜像 |

### `codex/`

| 路径 | 作用 |
| --- | --- |
| `codex/config.toml.example` | Codex 的 MCP、sandbox、approval、skills 配置示例 |

## 四、`docs/`

### 文件

| 路径 | 作用 |
| --- | --- |
| `docs/meta.md` | 元理论总源，整个仓库的思想基础 |
| `docs/runtime-capability-matrix.md` | Claude Code / OpenClaw / Codex 的能力映射矩阵 |
| `docs/runtime-coverage-audit.md` | 哪些能力面已经覆盖、哪些属于宿主级的审计说明 |
| `docs/repo-map.md` | 这份仓库地图文档 |

## 五、`openclaw/`

### 文件

| 路径 | 作用 |
| --- | --- |
| `openclaw/openclaw.template.json` | OpenClaw 通用配置模板，给别的机器或仓库复用 |
| `openclaw/openclaw.local.json` | 当前仓库的本地配置，优先跟随本机 OpenClaw 主模型 |
| `openclaw/skills/meta-theory.md` | OpenClaw 可安装 skill 镜像 |

### `openclaw/workspaces/`

这里有 8 个 workspace 目录，每个目录对应一个 OpenClaw 元 agent：

| 路径 | 作用 |
| --- | --- |
| `openclaw/workspaces/meta-warden/` | Warden 的 OpenClaw workspace |
| `openclaw/workspaces/meta-genesis/` | Genesis 的 OpenClaw workspace |
| `openclaw/workspaces/meta-artisan/` | Artisan 的 OpenClaw workspace |
| `openclaw/workspaces/meta-sentinel/` | Sentinel 的 OpenClaw workspace |
| `openclaw/workspaces/meta-librarian/` | Librarian 的 OpenClaw workspace |
| `openclaw/workspaces/meta-conductor/` | Conductor 的 OpenClaw workspace |
| `openclaw/workspaces/meta-prism/` | Prism 的 OpenClaw workspace |
| `openclaw/workspaces/meta-scout/` | Scout 的 OpenClaw workspace |

### 每个 workspace 里固定存在的文件

下列文件在 8 个 workspace 里都会各有一份，只是内容换成对应 agent：

| 文件名 | 作用 |
| --- | --- |
| `BOOT.md` | OpenClaw `boot-md` hook 的启动文件，网关启动时使用 |
| `BOOTSTRAP.md` | 冷启动说明，告诉 OpenClaw agent 刚启动时先读什么 |
| `IDENTITY.md` | 该 agent 的身份卡：名字、气质、核心职责 |
| `MEMORY.md` | 长期记忆策略说明，告诉 agent 什么该沉淀、什么不该沉淀 |
| `USER.md` | 用户长期上下文占位文件 |
| `SOUL.md` | 该 agent 的长说明书，是 OpenClaw 运行时真正注入的大脑内容 |
| `AGENTS.md` | 团队目录，说明队友是谁以及各自做什么 |
| `TOOLS.md` | OpenClaw 运行时约定、协作方式、可用 skill 说明 |
| `HEARTBEAT.md` | 心跳/定时任务约定 |
| `memory/README.md` | `session-memory` hook 写入目录的说明文件 |
| `skills/meta-theory/SKILL.md` | 该 workspace 就地可用的 `meta-theory` skill |

## 六、`scripts/`

| 路径 | 作用 |
| --- | --- |
| `scripts/sync-runtimes.mjs` | 从 Claude 主源生成 OpenClaw/Codex/共享镜像文件 |
| `scripts/validate-project.mjs` | 校验主源、生成物、脚本、配置是否齐全且一致 |
| `scripts/eval-meta-agents.mjs` | 跑 Claude / Codex / OpenClaw 的真实验收 |
| `scripts/prepare-openclaw-local.mjs` | 把 `~/.openclaw/agents/main/agent/` 的授权状态同步到 8 个 meta agent |
| `scripts/mcp/meta-runtime-server.mjs` | 本地 MCP 服务，给 Claude Code / Codex 等读取仓库运行时信息 |

## 七、`shared-skills/`

| 路径 | 作用 |
| --- | --- |
| `shared-skills/meta-theory.md` | 给多运行时共用的 `meta-theory` skill 镜像 |

## 八、哪些文件应该优先改，哪些不要乱改

### 优先改的主源

- `docs/meta.md`
- `.claude/agents/*.md`
- `.claude/skills/meta-theory/SKILL.md`

### 通常不直接手改的文件

- `.agents/skills/meta-theory/SKILL.md`
- `.agents/skills/meta-theory/agents/openai.yaml`
- `.codex/agents/*.toml`
- `.codex/skills/meta-theory.md`
- `shared-skills/meta-theory.md`
- `openclaw/skills/meta-theory.md`
- `openclaw/workspaces/*/*`
- `openclaw/openclaw.local.json`

这些通常由 `npm run sync:runtimes` 或 `npm run prepare:openclaw-local` 维护。

## 九、推荐工作顺序

1. 先改主源
2. 运行 `npm run sync:runtimes`
3. 运行 `npm run prepare:openclaw-local`
4. 运行 `npm run check`
5. 运行 `npm run eval:agents`
