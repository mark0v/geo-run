import type { SettlementSnapshot } from "./contracts";
import { mockSettlementSnapshot } from "./mock";

const USE_MOCK_API = true;
const SETTLEMENT_ENDPOINT = "http://localhost:54321/functions/v1/settlement";

export async function fetchSettlementSnapshot(): Promise<SettlementSnapshot> {
  if (USE_MOCK_API) {
    await delay(150);
    return mockSettlementSnapshot;
  }

  const response = await fetch(SETTLEMENT_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Failed to load settlement snapshot: ${response.status}`);
  }

  return (await response.json()) as SettlementSnapshot;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
