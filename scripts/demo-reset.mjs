import { demoPost, printSnapshotSummary } from "./demo-common.mjs";

const noSeed = process.argv.includes("--no-seed");
const payload = await demoPost("internal-demo-reset", {
  seed: !noSeed,
});

console.log("Demo player reset complete.");

if (payload.snapshot) {
  printSnapshotSummary(payload.snapshot);
}
