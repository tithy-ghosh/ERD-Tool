// Small sample plans that ship with the app, so the plan view can be tried
// without a database. These are app data, not test fixtures.

export type ExamplePlan = {
  id: string;
  label: string;
  description: string;
  /** Postgres EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) output */
  plan: unknown;
};

const ZERO_BUFFERS = {
  "Shared Hit Blocks": 0,
  "Shared Read Blocks": 0,
  "Shared Dirtied Blocks": 0,
  "Shared Written Blocks": 0,
  "Local Hit Blocks": 0,
  "Local Read Blocks": 0,
  "Local Dirtied Blocks": 0,
  "Local Written Blocks": 0,
  "Temp Read Blocks": 0,
  "Temp Written Blocks": 0,
} as const;

function withBuffers(
  hit: number,
  tempRead = 0,
  tempWritten = 0
): Record<string, number> {
  return {
    ...ZERO_BUFFERS,
    "Shared Hit Blocks": hit,
    "Temp Read Blocks": tempRead,
    "Temp Written Blocks": tempWritten,
  };
}

// 1. A Seq Scan that reads all 60,000 orders to return 1,188 pending ones.
const slowOrdersScan = [
  {
    Plan: {
      "Node Type": "Seq Scan",
      "Parallel Aware": false,
      "Async Capable": false,
      "Relation Name": "orders",
      Alias: "orders",
      "Startup Cost": 0,
      "Total Cost": 1926,
      "Plan Rows": 1200,
      "Plan Width": 64,
      "Actual Startup Time": 0.018,
      "Actual Total Time": 28.64,
      "Actual Rows": 1188,
      "Actual Loops": 1,
      Output: ["id", "customer_id", "status", "created_at"],
      Filter: "(status = 'pending'::text)",
      "Rows Removed by Filter": 58812,
      ...withBuffers(4020),
      "I/O Read Time": 0,
      "I/O Write Time": 0,
    },
    "Planning Time": 0.094,
    Triggers: [],
    "Execution Time": 29.12,
  },
];

// 2. A sort on order_items that spills to disk because work_mem is small.
const diskSort = [
  {
    Plan: {
      "Node Type": "Sort",
      "Parallel Aware": false,
      "Async Capable": false,
      "Startup Cost": 912.4,
      "Total Cost": 942.4,
      "Plan Rows": 12000,
      "Plan Width": 48,
      "Actual Startup Time": 46.2,
      "Actual Total Time": 47.8,
      "Actual Rows": 12000,
      "Actual Loops": 1,
      Output: ["id", "order_id", "product_id", "quantity"],
      "Sort Key": ["order_items.quantity DESC", "order_items.id"],
      "Sort Method": "external merge",
      "Sort Space Used": 18432,
      "Sort Space Type": "Disk",
      ...withBuffers(620, 3456, 3520),
      Plans: [
        {
          "Node Type": "Seq Scan",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Async Capable": false,
          "Relation Name": "order_items",
          Alias: "order_items",
          "Startup Cost": 0,
          "Total Cost": 872.4,
          "Plan Rows": 12000,
          "Plan Width": 48,
          "Actual Startup Time": 0.012,
          "Actual Total Time": 15.6,
          "Actual Rows": 12000,
          "Actual Loops": 1,
          Output: ["id", "order_id", "product_id", "quantity"],
          ...withBuffers(620),
        },
      ],
    },
    "Planning Time": 0.142,
    Triggers: [],
    "Execution Time": 51.36,
  },
];

// 3. A nested loop whose inner index scan on orders runs 5,000 times.
const nestedLoop = [
  {
    Plan: {
      "Node Type": "Nested Loop",
      "Join Type": "Inner",
      "Parallel Aware": false,
      "Async Capable": false,
      "Startup Cost": 0.57,
      "Total Cost": 21980.5,
      "Plan Rows": 5000,
      "Plan Width": 56,
      "Actual Startup Time": 0.14,
      "Actual Total Time": 186.4,
      "Actual Rows": 5000,
      "Actual Loops": 1,
      ...withBuffers(24500),
      Plans: [
        {
          "Node Type": "Seq Scan",
          "Parent Relationship": "Outer",
          "Parallel Aware": false,
          "Async Capable": false,
          "Relation Name": "customers",
          Alias: "c",
          "Startup Cost": 0,
          "Total Cost": 75,
          "Plan Rows": 5000,
          "Plan Width": 28,
          "Actual Startup Time": 0.007,
          "Actual Total Time": 3.1,
          "Actual Rows": 5000,
          "Actual Loops": 1,
          Output: ["id", "full_name"],
          ...withBuffers(500),
        },
        {
          "Node Type": "Index Scan",
          "Parent Relationship": "Inner",
          "Parallel Aware": false,
          "Async Capable": false,
          "Scan Direction": "Forward",
          "Index Name": "orders_customer_id_idx",
          "Relation Name": "orders",
          Alias: "o",
          "Startup Cost": 0.29,
          "Total Cost": 4.38,
          "Plan Rows": 1,
          "Plan Width": 28,
          "Actual Startup Time": 0.016,
          "Actual Total Time": 0.032,
          "Actual Rows": 1,
          "Actual Loops": 5000,
          Output: ["id", "customer_id", "status"],
          "Index Cond": "(customer_id = c.id)",
          ...withBuffers(24000),
        },
      ],
    },
    "Planning Time": 0.207,
    Triggers: [],
    "Execution Time": 190.82,
  },
];

export const EXAMPLE_PLANS: ExamplePlan[] = [
  {
    id: "slow-orders-scan",
    label: "Slow order lookup",
    description: "A Seq Scan reads every order to find the pending ones.",
    plan: slowOrdersScan,
  },
  {
    id: "disk-sort",
    label: "Order items sorted on disk",
    description: "Sorting a large order_items result spills to disk.",
    plan: diskSort,
  },
  {
    id: "nested-loop-customers-orders",
    label: "Nested loop over customers and orders",
    description:
      "The inner index scan on orders runs once for every customer.",
    plan: nestedLoop,
  },
];
