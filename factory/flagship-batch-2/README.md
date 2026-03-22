# Meta_Kim Flagship Batch 2

This directory holds the second 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.

- These are the second refinement wave.
- Focus sectors: Stocks, Investment, Web3, Creator Media, E-Commerce.

## Included Flagships

| Industry | Department | Runtime Agent ID | Based On |
| --- | --- | --- | --- |
| Stocks | Research & Intelligence | `flagship-stocks-research-intelligence` | `stocks-research-intelligence` |
| Investment | Research & Intelligence | `flagship-investment-research-intelligence` | `investment-research-intelligence` |
| Web3 | Risk & Compliance | `flagship-web3-risk-compliance` | `web3-risk-compliance` |
| Creator Media | Growth & Operations | `flagship-media-growth-operations` | `media-growth-operations` |
| E-Commerce | Growth & Operations | `flagship-ecommerce-growth-operations` | `ecommerce-growth-operations` |

## Layout

```text
factory/flagship-batch-2/
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
