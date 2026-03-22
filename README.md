# Meta_Kim

[English](README.md) | [简体中文](README.zh-CN.md)

![Runtime](https://img.shields.io/badge/runtime-Claude%20Code%20%7C%20Codex%20%7C%20OpenClaw-111827)
![Method](https://img.shields.io/badge/method-Meta%20-%3E%20Organizational%20Mirroring%20-%3E%20Rhythm%20Orchestration%20-%3E%20Intent%20Amplification-0f766e)
![License](https://img.shields.io/badge/license-CC%20BY%204.0-f59e0b)

<div align="center">

**An open-source meta-architecture for intent amplification across Claude Code, Codex, and OpenClaw**

Meta_Kim is not a prompt dump. It is a cross-runtime operating system for organizing complex work through meta units, organizational mirroring, rhythm orchestration, and intent amplification.

</div>

## What This Project Is

Meta_Kim exists for one reason:

**to make the same intent-amplification discipline hold across multiple AI runtimes, instead of collapsing into one-off lucky outputs.**

The project treats user requests as raw intent, not finished tasks.  
Before execution, the system should:

- identify the real objective
- surface missing constraints
- choose the right structure
- decide what should happen now, later, or not at all
- produce a task shape that is actually executable

So this repository is not:

- a chatbot product
- a website or SaaS
- a single giant prompt
- a random pile of agent files

It is an architecture pack that combines:

- agents
- skills
- MCP integrations
- hooks
- memory strategy
- workspace layouts
- runtime sync scripts
- validation and evaluation tooling

## The Four-Part Method

Meta_Kim is built around one chain:

**Meta -> Organizational Mirroring -> Rhythm Orchestration -> Intent Amplification**

```mermaid
flowchart LR
    A["Meta<br/>the smallest governable unit"] --> B["Organizational Mirroring<br/>turn units into structure"]
    B --> C["Rhythm Orchestration<br/>control timing and sequencing"]
    C --> D["Intent Amplification<br/>expand raw intent into executable work"]
```

Each layer solves a different problem:

- `Meta` solves decomposition
- `Organizational Mirroring` solves structure
- `Rhythm Orchestration` solves timing
- `Intent Amplification` solves completion

If one layer is missing, the method is incomplete.

## What “Meta” Means Here

In Meta_Kim, a meta unit is:

**the smallest governable unit that exists to support intent amplification.**

It is not just a small component. It must be:

- independent enough to reason about on its own
- small enough to stay controllable
- bounded enough to know what it does not own
- replaceable without collapsing the whole system
- reusable across workflows

This is why Meta_Kim uses the word `meta` as an architectural term, not as decoration.

## Why This Matters

A common failure mode in AI work is mistaking a single successful output for a stable system.

Meta_Kim rejects that.

A mature system needs a governance loop. In this project, that loop is framed through a ten-step operating discipline:

1. Direction
2. Planning
3. Execution
4. Review
5. Meta-review
6. Revision
7. Verification
8. Synthesis
9. Feedback
10. Evolution

The goal is not to look smart once. The goal is to become repeatable, auditable, and improvable.

## How It Lands in Three Runtimes

Meta_Kim does not force Claude Code, Codex, and OpenClaw to look identical.

It enforces one underlying operating logic while letting each runtime keep its native interface.

```mermaid
flowchart TD
    A["Meta_Kim Core Method"] --> B["Claude Code<br/>CLAUDE.md + .claude/ + .mcp.json"]
    A --> C["Codex<br/>AGENTS.md + .codex/ + .agents/ + codex/config.toml.example"]
    A --> D["OpenClaw<br/>openclaw/workspaces/ + openclaw/openclaw.template.json"]
```

| Runtime | User-facing entry | Main repo surface | Purpose |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md` | `.claude/`, `.mcp.json` | Primary editing runtime and canonical source for meta agents and skills |
| Codex | `AGENTS.md` | `.codex/`, `.agents/`, `codex/config.toml.example` | Codex-native agent and skill projection from the same source |
| OpenClaw | `openclaw/workspaces/` | `openclaw/` | Local workspace agents that preserve the same governance logic |

The outer shell can differ.  
The core discipline cannot.

## The Eight Meta Agents

These are not menu items. They are the current organizational backbone.

- `meta-warden`: default entry, arbitration, final synthesis
- `meta-conductor`: orchestration, sequencing, rhythm control
- `meta-genesis`: prompt identity, persona, `SOUL.md`
- `meta-artisan`: skills, MCP, tool fit, capability design
- `meta-sentinel`: hooks, safety, permissions, rollback
- `meta-librarian`: memory, knowledge continuity, context policy
- `meta-prism`: quality review, drift detection, anti-slop enforcement
- `meta-scout`: external tool discovery and evaluation

The default user-facing interpretation should be:

**`meta-warden` is the front door. The other seven are backstage structure.**

## Agent Foundry

The next production layer in this repository is not “add 100 prompts by hand”.

It is a scalable foundry for **department-first industry expansion**.

The current scaffold is:

- **20 industries**
- **5 departments per industry**
- **100 department-level agents**
- **1000 generated specialist agents**
- **1 organization map plus orchestration playbooks**

Industries currently include:

- gaming
- internet products
- finance
- AI
- healthcare
- stocks
- investment
- web3
- creator media
- e-commerce
- education
- legal
- manufacturing
- logistics
- real estate
- energy
- automotive
- travel and hospitality
- biotech
- public sector

The foundry combines:

- industry blueprints
- department templates
- expert thinking references
- tool recommendations
- a generator that emits structured **department seeds and specialist briefs**
- a runtime-pack compiler that projects those briefs into Claude Code, Codex, and OpenClaw import assets

See:

- [`factory/README.md`](factory/README.md)
- [`scripts/generate-industry-agents.mjs`](scripts/generate-industry-agents.mjs)
- [`factory/generated/industry-coverage-matrix.md`](factory/generated/industry-coverage-matrix.md)
- [`factory/generated/flagship-20.md`](factory/generated/flagship-20.md)
- [`factory/flagship-batch-1/README.md`](factory/flagship-batch-1/README.md)
- [`factory/flagship-batch-2/README.md`](factory/flagship-batch-2/README.md)
- [`factory/flagship-batch-3/README.md`](factory/flagship-batch-3/README.md)
- [`factory/flagship-batch-4/README.md`](factory/flagship-batch-4/README.md)

Important: these generated department and specialist agents are a production layer, not the canonical runtime source.  
They are intended to be refined by the meta system and then compiled into runtime-specific import packs under `factory/runtime-packs/`.

## Public vs Private Research

The long-form local research manuscript under `meta/` is intentionally not part of the public GitHub payload.

This public repository ships the runtime-facing architecture and production tooling.  
Private research notes stay local.

## Repository Map

```text
Meta_Kim/
├─ .claude/        Canonical Claude Code source: agents, skills, hooks, settings
├─ .codex/         Codex-native agents and skills generated from the Claude source
├─ .agents/        Codex project-level skill mirror
├─ codex/          Global Codex config example, not a second runtime
├─ openclaw/       OpenClaw workspaces, templates, and runtime mirrors
├─ factory/        Department-agent foundry: catalog, generated seeds, 1000 specialists, protocol files, runtime packs
├─ scripts/        Sync, validation, MCP, evaluation, and generation scripts
├─ shared-skills/  Shared skill mirrors across runtimes
├─ AGENTS.md       Codex and cross-runtime orientation
├─ CLAUDE.md       Claude Code orientation
├─ .mcp.json       Claude Code project MCP entry
├─ README.md       English primary README
└─ README.zh-CN.md Chinese README
```

## Why There Is a `codex/` Folder

This confuses people the most.

Codex consumes two kinds of configuration:

- repo-local assets, which live in `.codex/` and `.agents/`
- user-global configuration, which cannot live directly inside the repo

So:

- `.codex/` is what Codex reads inside the repository
- `codex/` is only an example directory showing how to wire `~/.codex/config.toml`

It is not duplication. It is a consequence of Codex's config model.

## Human-Friendly Command Guide

Not every reader needs to run every command.

### `npm install`

Use this when:

- you just cloned the repo
- you want to validate or generate assets locally

Skip this when:

- you are only reading docs

### `npm run sync:runtimes`

Use this when:

- you changed canonical agents or skills
- you changed runtime-facing configuration
- you want Claude Code, Codex, and OpenClaw mirrors regenerated

Think of it as: **rebuild the runtime projections**.

### `npm run prepare:openclaw-local`

Use this only when:

- you actually want to run the OpenClaw side on your own machine

This command prepares local OpenClaw auth/state wiring that cannot live purely inside the repo.

### `npm run verify:all`

Use this when:

- you are about to publish
- you changed runtime assets and want a full acceptance pass
- you want one command that runs the full repo check and evaluation flow

### `npm run build:agent-foundry`

Use this when:

- you want to regenerate the industry foundry
- you changed industry blueprints, department templates, or specialist templates
- you want fresh runtime-pack projections for Claude Code, Codex, and OpenClaw

This command now does two things:

- regenerates the department seeds and specialist briefs under `factory/generated/`
- compiles runtime-ready import packs under `factory/runtime-packs/`
- rebuilds all 20 hand-polished flagship agents under `factory/flagship-batch-{1..4}/`

### `npm run check:agent-foundry`

Use this when:

- you want to confirm the foundry outputs and runtime packs are in sync
- you changed catalog logic and want a targeted check without rerunning the full runtime eval suite

### `npm run build:flagship-batch-1`

Use this when:

- you only want to rebuild the first 5 hand-polished flagship agents
- you are iterating on the flagship refinement layer without touching the full foundry matrix

### `npm run build:flagship-batch-2`

Use this when:

- you want to rebuild the second 5 hand-polished flagship agents
- you are iterating on the stocks / investment / web3 / creator media / e-commerce refinement layer

### `npm run build:flagships`

Use this when:

- you want to rebuild all 20 hand-polished flagship agents
- you want the full flagship layer refreshed without touching the broader foundry logic manually

## Simplest Way to Start

If you are just reading the project:

- read `README.md`
- read `CLAUDE.md`
- read `AGENTS.md`
- inspect `.claude/agents/`

If you want to verify the repo is real and not a shell:

```bash
npm install
npm run sync:runtimes
npm run verify:all
```

If you also want to run OpenClaw locally:

```bash
npm run prepare:openclaw-local
```

If you want to build the 100 department-agent foundry output and runtime packs:

```bash
npm run build:agent-foundry
```

If you only want to verify the foundry layer is still in sync:

```bash
npm run check:agent-foundry
```

## Paper and Method Basis

The methodological basis for this repository comes from the author's evaluation work on meta-based intent amplification.

- Paper: <https://zenodo.org/records/18957649>
- DOI: `10.5281/zenodo.18957649`

The paper explains:

- why meta units matter
- why structure matters more than isolated model brilliance
- why organizational mirroring and rhythm orchestration are necessary layers
- why intent amplification is a result layer, not a starting slogan

This repository explains:

- how to turn that method into runtime-ready engineering assets

## Author and Contact

<div align="center">
  <img src="images/二维码基础款.png" alt="Contact QR" width="600"/>
  <p><strong>For updates, discussion, and longer-term project follow-up</strong></p>
  <p>
    🌐 <a href="https://www.aiking.dev/">aiking.dev</a> |
    GitHub <a href="https://github.com/KimYx0207">KimYx0207</a> |
    𝕏 <a href="https://x.com/KimYx0207">@KimYx0207</a> |
    WeChat Official Account: <strong>老金带你玩AI</strong>
  </p>
  <p>
    Open knowledge base:
    <a href="https://my.feishu.cn/wiki/OhQ8wqntFihcI1kWVDlcNdpznFf">Feishu knowledge base</a>
  </p>
</div>

## Support the Author

<div align="center">
  <p><strong>If this method, repository structure, or documentation helps you, support is welcome.</strong></p>
  <table align="center">
    <tr>
      <td align="center">
        <img src="images/微信.jpg" alt="WeChat donation QR" width="260"/>
        <br/>
        <strong>WeChat Pay</strong>
      </td>
      <td align="center">
        <img src="images/支付宝.jpg" alt="Alipay donation QR" width="260"/>
        <br/>
        <strong>Alipay</strong>
      </td>
    </tr>
  </table>
</div>

## License

This project is released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

You may share and adapt it, as long as attribution is preserved and changes are clearly marked.
