import { flagshipBatch2 } from "../factory/catalog/flagship-batch-2.mjs";
import { buildFlagshipBatch } from "./lib/build-flagship-batch.mjs";

await buildFlagshipBatch({
  batchName: "Meta_Kim Flagship Batch 2",
  outDirName: "flagship-batch-2",
  description:
    "This directory holds the second 5 hand-polished flagship agents selected from the broader Meta_Kim foundry.",
  intro: [
    "These are the second refinement wave.",
    "Focus sectors: Stocks, Investment, Web3, Creator Media, E-Commerce.",
  ],
  profileBadge: "Hand-polished second-wave flagship from Meta_Kim Agent Foundry.",
  profiles: flagshipBatch2,
});
