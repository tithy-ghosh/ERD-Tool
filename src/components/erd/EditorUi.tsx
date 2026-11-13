"use client";

import { createContext, useContext } from "react";

type EditorUi = {
  openProperties: (tableId?: string) => void;
};

const EditorUiContext = createContext<EditorUi>({
  openProperties: () => {},
});

export function EditorUiProvider({
  openProperties,
  children,
}: EditorUi & {
  children: React.ReactNode;
}) {
  return (
    <EditorUiContext.Provider value={{ openProperties }}>
      {children}
    </EditorUiContext.Provider>
  );
}

export function useEditorUi() {
  return useContext(EditorUiContext);
}
