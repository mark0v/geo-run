import { demoGet, printSnapshotSummary } from "./demo-common.mjs";

const snapshot = await demoGet("settlement");

console.log("Demo player is ready.");
printSnapshotSummary(snapshot);
