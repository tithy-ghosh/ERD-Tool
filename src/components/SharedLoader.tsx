"use client";

import { useEffect, useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import ErdCanvas from "@/components/ErdCanvas";
import { useErdStore } from "@/store/useErdStore";

type Props = {
  nodes: Node[];
  edges: Edge[];
};

export default function SharedLoader({ nodes, edges }: Props) {
  const [ready, setReady] = useState(false);
  // React Strict Mode runs effects twice in dev, so guard with a ref
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function load() {
      await useErdStore.persist.rehydrate();

      const current = useErdStore.getState();
      const hasLocalWork = current.nodes.length > 0;

      if (hasLocalWork) {
        const ok = window.confirm(
          "This will replace the diagram saved in your browser. Continue?"
        );
        if (!ok) {
          window.location.href = "/";
          return;
        }
      }

      useErdStore.setState({
        nodes: nodes as typeof current.nodes,
        edges: edges as typeof current.edges,
      });
      setReady(true);
    }

    load();
  }, [nodes, edges]);

  if (!ready) {
    return (
      <main className="flex h-screen w-screen items-center justify-center">
        Loading diagram...
      </main>
    );
  }

  return (
    <main className="h-screen w-screen">
      <ErdCanvas skipRehydrate/>
    </main>
  );
}