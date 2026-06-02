"use client";

import { useAppStore } from "@/store";

/** Reads backend health refreshed on each GPS poll cycle. */
export function useFleetHealth() {
  const health = useAppStore((s) => s.fleetHealth);
  const error = useAppStore((s) => s.fleetHealthError);
  const providerKind = useAppStore((s) => s.providerKind);
  const initialized = useAppStore((s) => s.initialized);
  const replayMode = useAppStore((s) => s.replayMode);

  const enabled = initialized && !replayMode && providerKind === "teltonika";

  return { health, error, enabled };
}
