"use client";

import { useEffect, useState } from "react";
import { useErdStore } from "@/store/useErdStore";

export type SaveState = "saved" | "saving";

export function useSaveStatus(): SaveState {
  const [state, setState] = useState<SaveState>("saved");

  useEffect(() => {
    let timer: number | undefined;

    const unsubscribe = useErdStore.subscribe((next, previous) => {
      if (next.nodes === previous.nodes && next.edges === previous.edges) {
        return;
      }

      setState("saving");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setState("saved"), 550);
    });

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}
