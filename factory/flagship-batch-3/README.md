# Meta_Kim Flagship Batch 3

This directory holds the third 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.

- These are the third refinement wave.
- Focus sectors: Education, Legal, Manufacturing, Logistics, Real Estate.

## Included Flagships

| Industry | Department | Runtime Agent ID | Based On |
| --- | --- | --- | --- |
| Education | Product & Delivery | `flagship-education-product-delivery` | `education-product-delivery` |
| Legal | Risk & Compliance | `flagship-legal-risk-compliance` | `legal-risk-compliance` |
| Manufacturing | Product & Delivery | `flagship-manufacturing-product-delivery` | `manufacturing-product-delivery` |
| Logistics | Growth & Operations | `flagship-logistics-growth-operations` | `logistics-growth-operations` |
| Real Estate | Strategy Office | `flagship-real-estate-strategy-office` | `real-estate-strategy-office` |

## Layout

```text
factory/flagship-batch-3/
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
