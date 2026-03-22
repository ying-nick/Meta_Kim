import { flagshipBatch4 } from "../factory/catalog/flagship-batch-4.mjs";
import { buildFlagshipBatch } from "./lib/build-flagship-batch.mjs";

await buildFlagshipBatch({
  batchName: "Meta_Kim Flagship Batch 4",
  outDirName: "flagship-batch-4",
  description:
    "This directory holds the fourth 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.",
  intro: [
    "These are the fourth refinement wave.",
    "Focus sectors: Energy, Automotive, Travel & Hospitality, Biotech, Public Sector.",
  ],
  profileBadge: "Hand-polished fourth-wave flagship from Meta_Kim Agent Foundry.",
  profiles: flagshipBatch4,
});
