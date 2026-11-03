"use client";

import { create } from "zustand";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmState = {
  open: boolean;
  options: ConfirmOptions | null;
  show: (options: ConfirmOptions) => void;
  close: () => void;
};

const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  options: null,
  show: (options) => set({ open: true, options }),
  close: () => set({ open: false }),
}));

let resolveCurrent: ((value: boolean) => void) | null = null;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  resolveCurrent?.(false);

  return new Promise((resolve) => {
    resolveCurrent = resolve;
    useConfirmStore.getState().show(options);
  });
}

function finish(value: boolean) {
  resolveCurrent?.(value);
  resolveCurrent = null;
  useConfirmStore.getState().close();
}

export function ConfirmHost() {
  const open = useConfirmStore((state) => state.open);
  const options = useConfirmStore((state) => state.options);

  if (!options) return null;

  return (
    <Modal
      open={open}
      onClose={() => finish(false)}
      title={options.title}
      description={options.description}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => finish(false)}
            autoFocus
          >
            {options.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={options.tone === "default" ? "primary" : "danger"}
            size="sm"
            onClick={() => finish(true)}
          >
            {options.confirmLabel ?? "Continue"}
          </Button>
        </>
      }
    />
  );
}
