export type PanelState =
  | "none"
  | "sql"
  | "import"
  | "share"
  | "ai"
  | "examples";

export type PanelTarget = Exclude<PanelState, "none">;
