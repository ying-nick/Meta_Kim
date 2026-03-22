# Meta_Kim Foundry Runtime Packs

Generated runtime-pack summary:

- **100 department runtime agents**
- **1000 specialist runtime agents**
- **1100 total runtime agents**

This layer compiles the foundry briefs into runtime-specific import packs for:

- Claude Code
- Codex
- OpenClaw

## Layout

```text
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
```

## Counts

- Department packs: 100
- Specialist packs: 1000
- Total packs: 1100

## Source of Truth

The canonical logic remains:

- `factory/catalog/foundry-config.mjs`
- `factory/generated/*.json`
- `factory/generated/departments/**`
- `factory/generated/specialists/**`

These runtime packs are generated projections, not hand-maintained source files.
