const functionsBaseUrl = "http://127.0.0.1:54321/functions/v1";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const demoAuthUserId = "00000000-0000-0000-0000-000000000001";

export async function demoGet(pathname) {
  const response = await fetch(`${functionsBaseUrl}/${pathname}`, {
    method: "GET",
    headers: demoHeaders(),
  });

  return readJson(response);
}

export async function demoPost(pathname, payload) {
  const response = await fetch(`${functionsBaseUrl}/${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...demoHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return readJson(response);
}

export function printSnapshotSummary(snapshot) {
  const queue = snapshot.activeQueueItem ? snapshot.activeQueueItem.actionType : "none";
  const buildings = snapshot.buildings
    .map((building) => `${building.buildingType}:lv${building.level}:${building.state}`)
    .join(", ");

  console.log(`Settlement: ${snapshot.settlement.name}`);
  console.log(
    `Balances: supplies=${snapshot.settlement.balances.supplies}, stone=${snapshot.settlement.balances.stone}`,
  );
  console.log(`Milestone: lv${snapshot.settlement.milestoneLevel}`);
  console.log(`Queue: ${queue}`);
  console.log(`Buildings: ${buildings || "none"}`);
}

function demoHeaders() {
  return {
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
    "x-player-auth-user-id": demoAuthUserId,
  };
}

async function readJson(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error ?? payload.msg ?? `Request failed: ${response.status}`);
  }

  return payload;
}
