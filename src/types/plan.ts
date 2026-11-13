
export type RawPlanNode = { [key: string]: unknown };

export type PlanNode = {

  id: string;
  nodeType: string;

  parentRelationship: string | null;
  relation: string | null;
  alias: string | null;
  indexName: string | null;
  joinType: string | null;
  filter: string | null;
  indexCond: string | null;


  estimatedRows: number;
  totalCost: number;
  exclusiveCost: number;


  actualRows: number | null;
  actualLoops: number | null;
  totalTime: number | null;
  exclusiveTime: number | null;
  percentOfTotal: number | null;
  rowsRemovedByFilter: number | null;

  children: PlanNode[];
  raw: RawPlanNode;
};

export type ParsedPlan = {
  root: PlanNode;
  hasActuals: boolean;
  planningTime: number | null;
  executionTime: number | null;
  nodeCount: number;
};