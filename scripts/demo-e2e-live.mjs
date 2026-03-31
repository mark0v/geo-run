import { demoGet, demoPost, printSnapshotSummary } from "./demo-common.mjs";

console.log("Resetting demo player...");
const resetPayload = await demoPost("internal-demo-reset", { seed: true });
assert(resetPayload.snapshot, "demo reset should return a seeded snapshot");

console.log("Fetching settlement...");
const initialSnapshot = await demoGet("settlement");
assert(initialSnapshot.activeQueueItem === null, "initial snapshot should have no active queue");

console.log("Syncing activity...");
const activityResponse = await demoPost("activity-sync", {
  windows: [
    {
      windowStart: "2026-03-31T00:00:00Z",
      windowEnd: "2026-03-31T23:59:59Z",
      steps: 8400,
      floors: 6,
      sourcePlatform: "ios",
      sourceDeviceId: "demo-e2e-device",
      dedupeKey: `demo-e2e-${Date.now()}`,
    },
  ],
  clientCheckpoint: new Date().toISOString(),
});
assert(activityResponse.snapshot.settlement.balances.supplies >= 204, "sync should increase supplies");

console.log("Starting workshop build...");
const buildResponse = await demoPost("actions-build", {
  requestId: `build-${Date.now()}`,
  tileKey: "1,0",
  buildingType: "workshop",
});
assert(buildResponse.status === "accepted", "workshop build should be accepted");
assert(buildResponse.snapshot.activeQueueItem, "build should create an active queue item");

console.log("Resolving build queue...");
const resolvedBuild = await demoPost("internal-resolve-queue-item", {
  queueItemId: buildResponse.snapshot.activeQueueItem.id,
});
assert(resolvedBuild.status === "accepted", "build resolve should be accepted");

const workshop = resolvedBuild.snapshot.buildings.find((building) => building.buildingType === "workshop");
assert(workshop, "resolved snapshot should contain a workshop");
assert(workshop.state === "complete", "resolved workshop should be complete");

console.log("Starting workshop upgrade...");
const upgradeResponse = await demoPost("actions-upgrade", {
  requestId: `upgrade-${Date.now()}`,
  buildingId: workshop.id,
});
assert(upgradeResponse.status === "accepted", "workshop upgrade should be accepted");
assert(upgradeResponse.snapshot.activeQueueItem, "upgrade should create a queue item");

console.log("Resolving upgrade queue...");
const resolvedUpgrade = await demoPost("internal-resolve-queue-item", {
  queueItemId: upgradeResponse.snapshot.activeQueueItem.id,
});
assert(resolvedUpgrade.status === "accepted", "upgrade resolve should be accepted");

const upgradedWorkshop = resolvedUpgrade.snapshot.buildings.find(
  (building) => building.buildingType === "workshop",
);
assert(upgradedWorkshop?.level === 2, "workshop should be level 2 after upgrade");
assert(resolvedUpgrade.snapshot.activeQueueItem === null, "queue should be empty after final resolve");

console.log("Live demo e2e passed.");
printSnapshotSummary(resolvedUpgrade.snapshot);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
