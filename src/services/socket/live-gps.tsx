"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import {
  fetchGpsHealth,
  fetchLiveVehicles,
  getSocketUrl,
  type GpsConnectionStatus,
} from "@/services/gps-service";
import { useGisStore } from "@/store/gis-store";
import type { VehicleLivePosition, VehicleWithLive } from "@/types";

const POLL_MS = 5000;

export function LiveGpsProvider({ children }: { children: React.ReactNode }) {
  const setLiveBatch = useGisStore((s) => s.setLiveBatch);
  const setLivePosition = useGisStore((s) => s.setLivePosition);
  const setConnectionStatus = useGisStore((s) => s.setConnectionStatus);
  const setSocketLive = useGisStore((s) => s.setSocketLive);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let active = true;

    const setStatus = (status: GpsConnectionStatus, error: string | null = null) => {
      if (active) setConnectionStatus(status, error);
    };

    const pullFleet = async () => {
      try {
        const res = await fetch("/api/vehicles/live", { cache: "no-store" });
        if (!res.ok) throw new Error(`Fleet API ${res.status}`);
        const data = (await res.json()) as { vehicles: VehicleWithLive[] };
        const positions: VehicleLivePosition[] = (data.vehicles ?? [])
          .filter((v) => v.live?.imei)
          .map((v) => v.live as VehicleLivePosition);
        if (positions.length) setLiveBatch(positions);
      } catch {
        /* fleet merge is supplementary */
      }
    };

    const pullGps = async () => {
      try {
        setStatus("RECONNECTING");
        await fetchGpsHealth();
        const positions = await fetchLiveVehicles();
        if (!active) return;
        if (positions.length) {
          setLiveBatch(positions);
          setStatus("CONNECTED", null);
        } else {
          setStatus("CONNECTED", "No live device data yet");
        }
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "GPS backend unreachable";
        setStatus("DISCONNECTED", msg);
      }
    };

    void pullFleet();
    void pullGps();
    pollTimer = setInterval(() => {
      void pullGps();
      void pullFleet();
    }, POLL_MS);

    try {
      const socket = io(getSocketUrl(), {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setStatus("CONNECTED", null);
        setSocketLive(true);
      });

      socket.io.on("reconnect_attempt", () => {
        setStatus("RECONNECTING");
      });

      socket.on("disconnect", () => {
        setSocketLive(false);
        setStatus("DISCONNECTED", "Socket disconnected");
      });

      socket.on("connect_error", () => {
        setStatus("RECONNECTING", "Socket connection error");
      });

      socket.on("location_update", (payload: VehicleLivePosition) => {
        if (payload?.imei) {
          setLivePosition(payload);
          setStatus("CONNECTED", null);
          setSocketLive(true);
        }
      });
    } catch {
      setStatus("DISCONNECTED", "Socket init failed");
    }

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [setLiveBatch, setLivePosition, setConnectionStatus, setSocketLive]);

  return <>{children}</>;
}
