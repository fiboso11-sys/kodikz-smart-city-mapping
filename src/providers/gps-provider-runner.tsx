"use client";

import { useEffect, useRef } from "react";
import { createGPSProvider } from "@/providers/factory";
import type { IGPSProvider } from "@/providers/igps-provider";
import { useAppStore } from "@/store";

export function GPSProviderRunner() {
  const initialized = useAppStore((s) => s.initialized);
  const providerKind = useAppStore((s) => s.providerKind);
  const replayMode = useAppStore((s) => s.replayMode);
  const providerRef = useRef<IGPSProvider | null>(null);

  useEffect(() => {
    if (!initialized || replayMode) {
      providerRef.current?.stop();
      return;
    }

    const provider = createGPSProvider(
      providerKind,
      () => useAppStore.getState().vehicles,
      () => useAppStore.getState().routes,
      (vehicles) => {
        useAppStore.getState().applyTelemetry(vehicles);
        return vehicles;
      }
    );
    providerRef.current = provider;
    const cleanup = provider.start(() => {});

    return () => {
      cleanup();
      provider.stop();
    };
  }, [initialized, providerKind, replayMode]);

  return null;
}
