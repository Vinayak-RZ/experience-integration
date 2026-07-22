/** Power BI push dataset pilot — bounded batches + durable checkpoints. */

export const POWERBI_MAX_ROWS_PER_REQUEST = 10_000;

export type PowerBiRow = Record<string, string | number | boolean | null>;

export function chunkRows<T>(rows: readonly T[], size = POWERBI_MAX_ROWS_PER_REQUEST): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    out.push(rows.slice(i, i + size));
  }
  return out;
}

export function nextCheckpoint(cursor: string, batchIndex: number, batchCount: number): string {
  if (batchIndex + 1 >= batchCount) return `done:${cursor || "0"}`;
  return `batch:${batchIndex + 1}:${cursor || "0"}`;
}

export async function pushPowerBiBatch(input: {
  accessToken: string;
  datasetId: string;
  table: string;
  rows: PowerBiRow[];
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const base = input.baseUrl ?? "https://api.powerbi.com";
  const url = `${base}/v1.0/myorg/datasets/${encodeURIComponent(input.datasetId)}/tables/${encodeURIComponent(input.table)}/rows`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ rows: input.rows }),
    signal: AbortSignal.timeout(15_000),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

export function fixtureLedgerRows(plantId: string, count = 3): PowerBiRow[] {
  return Array.from({ length: count }, (_, i) => ({
    plant_id: plantId,
    entry_id: `led_sync_${i}`,
    realised_inr: 1000 * (i + 1),
    verification_status: "ops_confirmed",
  }));
}
