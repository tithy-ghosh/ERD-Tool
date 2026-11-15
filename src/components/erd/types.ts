export type PanelState =
  | "none"
  | "properties"
  | "sql"
  | "import"
  | "share"
  | "ai"
  | "examples"
  | "plan";

export type PanelTarget = Exclude<PanelState, "none">;
