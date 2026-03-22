import { flagshipBatch3 } from "../factory/catalog/flagship-batch-3.mjs";
import { buildFlagshipBatch } from "./lib/build-flagship-batch.mjs";

await buildFlagshipBatch({
  batchName: "Meta_Kim Flagship Batch 3",
  outDirName: "flagship-batch-3",
  description:
    "This directory holds the third 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.",
  intro: [
    "These are the third refinement wave.",
    "Focus sectors: Education, Legal, Manufacturing, Logistics, Real Estate.",
  ],
  profileBadge: "Hand-polished third-wave flagship from Meta_Kim Agent Foundry.",
  profiles: flagshipBatch3,
});
