import { flagshipBatch1 } from "../factory/catalog/flagship-batch-1.mjs";
import { buildFlagshipBatch } from "./lib/build-flagship-batch.mjs";

await buildFlagshipBatch({
  batchName: "Meta_Kim Flagship Batch 1",
  outDirName: "flagship-batch-1",
  description:
    "This directory holds the first 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.",
  intro: [
    "These are not the full 100 department seeds or the full 1000 specialists.",
    "They are the first refinement wave.",
    "Focus sectors: Game, Internet Product, Finance, AI, Healthcare.",
  ],
  profileBadge: "Hand-polished first-wave flagship from Meta_Kim Agent Foundry.",
  profiles: flagshipBatch1,
});
