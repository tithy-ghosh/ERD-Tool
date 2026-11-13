"use client";

import { createContext, useContext } from "react";
import type { TableFlowNode } from "@/types/erd";

type ErdMode = {
  readOnly: boolean;
  /** The nodes shown in read-only mode, where the editor store is not loaded. */
  nodes?: TableFlowNode[];
};

const ErdModeContext = createContext<ErdMode>({ readOnly: false });

export function ErdModeProvider({
  readOnly,
  nodes,
  children,
}: {
  readOnly: boolean;
  nodes?: TableFlowNode[];
  children: React.ReactNode;
}) {
  return (
    <ErdModeContext.Provider value={{ readOnly, nodes }}>
      {children}
    </ErdModeContext.Provider>
  );
}

export function useErdMode() {
  return useContext(ErdModeContext);
}
