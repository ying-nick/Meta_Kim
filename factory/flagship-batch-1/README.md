# Meta_Kim Flagship Batch 1

This directory holds the first 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.

- These are not the full 100 department seeds or the full 1000 specialists.
- They are the first refinement wave.
- Focus sectors: Game, Internet Product, Finance, AI, Healthcare.

## Included Flagships

| Industry | Department | Runtime Agent ID | Based On |
| --- | --- | --- | --- |
| Game | Strategy Office | `flagship-game-strategy-office` | `game-strategy-office` |
| Internet Product | Growth & Operations | `flagship-internet-growth-operations` | `internet-growth-operations` |
| Finance | Strategy Office | `flagship-finance-strategy-office` | `finance-strategy-office` |
| AI | Product & Delivery | `flagship-ai-product-delivery` | `ai-product-delivery` |
| Healthcare | Risk & Compliance | `flagship-healthcare-risk-compliance` | `healthcare-risk-compliance` |

## Layout

```text
factory/flagship-batch-1/
├─ README.md
├─ index.json
├─ agents/*.md
└─ runtime-packs/
   ├─ claude/agents/*.md
   ├─ codex/agents/*.toml
   └─ openclaw/
      ├─ openclaw.template.json
      └─ workspaces/<agent-id>/*
```
