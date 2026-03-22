# Meta_Kim Flagship Batch 4

This directory holds the fourth 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.

- These are the fourth refinement wave.
- Focus sectors: Energy, Automotive, Travel & Hospitality, Biotech, Public Sector.

## Included Flagships

| Industry | Department | Runtime Agent ID | Based On |
| --- | --- | --- | --- |
| Energy | Strategy Office | `flagship-energy-strategy-office` | `energy-strategy-office` |
| Automotive | Product & Delivery | `flagship-automotive-product-delivery` | `automotive-product-delivery` |
| Travel & Hospitality | Growth & Operations | `flagship-travel-growth-operations` | `travel-growth-operations` |
| Biotech | Research & Intelligence | `flagship-biotech-research-intelligence` | `biotech-research-intelligence` |
| Public Sector | Strategy Office | `flagship-public-sector-strategy-office` | `public-sector-strategy-office` |

## Layout

```text
factory/flagship-batch-4/
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
