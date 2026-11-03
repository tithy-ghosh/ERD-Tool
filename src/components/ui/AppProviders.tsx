"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import { ConfirmHost } from "@/components/ui/confirm";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
      <ConfirmHost />
    </>
  );
}
