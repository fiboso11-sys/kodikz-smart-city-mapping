"use client";

import { useEffect, useRef } from "react";
import { fetchHealth } from "@/lib/gps-api";
import { createGPSProvider } from "@/providers/factory";
import type { IGPSProvider } from "@/providers/igps-provider";
import { useAppStore } from "@/store";

export function GPSProviderRunner() {
  const initialized = useAppStore((s) => s.initialized);
  const providerKind = useAppStore((s) => s.providerKind);
  const replayMode = useAppStore((s) => s.replayMode);
  const setGpsApiStatus = useAppStore((s) => s.setGpsApiStatus);
  const setFleetHealth = useAppStore((s) => s.setFleetHealth);
  const setFleetHealthError = useAppStore((s) => s.setFleetHealthError);
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

    const syncStatus = () => {
      const { connected, message } = provider.getStatus();
      setGpsApiStatus({ connected, message });

      if (providerKind === "teltonika") {
        void fetchHealth()
          .then((health) => {
            setFleetHealth(health);
            setFleetHealthError(null);
          })
          .catch((err) => {
            setFleetHealthError(err instanceof Error ? err.message : "Health check failed");
          });
      }
    };

    const cleanup = provider.start(
      (readings) => {
        if (!readings.length) return;
        const state = useAppStore.getState();
        const byVehicle = new Map(readings.map((r) => [r.vehicleId, r]));
        const updates = state.vehicles
          .filter((v) => byVehicle.has(v.id))
          .map((v) => {
            const r = byVehicle.get(v.id)!;
            return {
              ...v,
              latitude: r.latitude,
              longitude: r.longitude,
              speed: r.speed,
              heading: r.heading,
              ignition: r.ignition,
              batteryVoltage: r.batteryVoltage ?? v.batteryVoltage ?? null,
              externalPower: r.externalPower ?? v.externalPower ?? null,
              gsmSignal: r.gsmSignal ?? v.gsmSignal ?? null,
              satellites: r.satellites ?? v.satellites ?? null,
              lastUpdate: r.timestamp,
              status: r.speed > 2 ? ("active" as const) : ("idle" as const),
            };
          });
        if (updates.length) state.applyTelemetry(updates);
      },
      syncStatus
    );

    return () => {
      cleanup();
      provider.stop();
    };
  }, [initialized, providerKind, replayMode, setGpsApiStatus, setFleetHealth, setFleetHealthError]);

  return null;
}
