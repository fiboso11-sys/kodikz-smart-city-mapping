"use client";

import { useSgeFeed } from "@/hooks/use-sge-feed";
import { FieldPilotPanel } from "@/components/pilot/field-pilot-panel";

/**
 * SGE Provider: Activates the GPS → SGE bridge + field pilot diagnostics.
 * Place inside PlatformLayout to receive live GPS updates.
 */
export function SgeProvider({ children }: { children: React.ReactNode }) {
  useSgeFeed();
  return (
    <>
      {children}
      <FieldPilotPanel />
    </>
  );
}
