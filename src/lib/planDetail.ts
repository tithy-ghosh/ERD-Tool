// Small readers and formatters for the extra values Postgres puts in a plan
// node (buffers, sort details). Kept free of React so they can be reused.

import type { PlanNode } from "../types/plan";

const BLOCK_BYTES = 8 * 1024;

export type BufferUsage = {
  sharedHit: number;
  sharedRead: number;
  sharedDirtied: number;
  sharedWritten: number;
  tempRead: number;
  tempWritten: number;
};

const BUFFER_KEYS: { key: keyof BufferUsage; raw: string }[] = [
  { key: "sharedHit", raw: "Shared Hit Blocks" },
  { key: "sharedRead", raw: "Shared Read Blocks" },
  { key: "sharedDirtied", raw: "Shared Dirtied Blocks" },
  { key: "sharedWritten", raw: "Shared Written Blocks" },
  { key: "tempRead", raw: "Temp Read Blocks" },
  { key: "tempWritten", raw: "Temp Written Blocks" },
];

/** Buffer counters are only present when the plan ran with BUFFERS */
export function readBufferUsage(node: PlanNode): BufferUsage | null {
  const usage: BufferUsage = {
    sharedHit: 0,
    sharedRead: 0,
    sharedDirtied: 0,
    sharedWritten: 0,
    tempRead: 0,
    tempWritten: 0,
  };

  let found = false;
  for (const entry of BUFFER_KEYS) {
    const value = node.raw[entry.raw];
    if (typeof value !== "number") continue;
    usage[entry.key] = value;
    found = true;
  }

  return found ? usage : null;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${Math.round(bytes)} B`;
}

/** Buffer counters are in 8 kB blocks */
export function formatBlocks(blocks: number): string {
  return formatBytes(blocks * BLOCK_BYTES);
}

/** "Sort Space Used" is in kB */
export function formatKilobytes(kb: number): string {
  return formatBytes(kb * 1024);
}

export type SortInfo = {
  method: string | null;
  spaceType: string | null;
  spaceKb: number | null;
};

export function readSortInfo(node: PlanNode): SortInfo | null {
  const method = node.raw["Sort Method"];
  const spaceType = node.raw["Sort Space Type"];
  const spaceKb = node.raw["Sort Space Used"];

  if (
    typeof method !== "string" &&
    typeof spaceType !== "string" &&
    typeof spaceKb !== "number"
  ) {
    return null;
  }

  return {
    method: typeof method === "string" ? method : null,
    spaceType: typeof spaceType === "string" ? spaceType : null,
    spaceKb: typeof spaceKb === "number" ? spaceKb : null,
  };
}
