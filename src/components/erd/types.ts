export type PanelState =
  | "none"
  | "properties"
  | "sql"
  | "import"
  | "share"
  | "ai"
  | "examples";

export type PanelTarget = Exclude<PanelState, "none">;
