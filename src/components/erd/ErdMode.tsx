"use client";

import { createContext, useContext } from "react";

type ErdMode = {
  readOnly: boolean;
};

const ErdModeContext = createContext<ErdMode>({ readOnly: false });

export function ErdModeProvider({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: React.ReactNode;
}) {
  return (
    <ErdModeContext.Provider value={{ readOnly }}>
      {children}
    </ErdModeContext.Provider>
  );
}

export function useErdMode() {
  return useContext(ErdModeContext);
}
