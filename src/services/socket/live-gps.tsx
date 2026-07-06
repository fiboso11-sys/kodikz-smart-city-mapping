"use client";

import { useEffect } from "react";
import {
  fetchGpsHealth,
  fetchLiveVehicles,
  type GpsConnectionStatus,
} from "@/services/gps-service";
import { getGpsSocket, teardownGpsSocket } from "@/services/socket/gps-socket";
import { useGisStore } from "@/store/gis-store";
import type { VehicleLivePosition, VehicleWithLive } from "@/types";

const POLL_MS = 5000;
const DISCONNECT_GRACE_MS = 5000;

export function LiveGpsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;
    let socketConnected = false;
    let lastConnectedAt = 0;

    const {
      setLiveBatch,
      setLivePosition,
      setConnectionStatus,
      setSocketLive,
    } = useGisStore.getState();

    const clearDisconnectGrace = () => {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
      }
    };

    const applyStatus = (status: GpsConnectionStatus, error: string | null = null) => {
      if (!active) return;
      setConnectionStatus(status, error);
    };

    const markConnected = (error: string | null = null) => {
      clearDisconnectGrace();
      lastConnectedAt = Date.now();
      applyStatus("CONNECTED", error);
    };

    const scheduleDegradedStatus = (next: GpsConnectionStatus, error: string | null) => {
      clearDisconnectGrace();
      if (Date.now() - lastConnectedAt < DISCONNECT_GRACE_MS && socketConnected) {
        return;
      }
      disconnectTimer = setTimeout(() => {
        if (!active) return;
        if (socketConnected && next !== "DISCONNECTED") {
          markConnected(error);
          return;
        }
        applyStatus(next, error);
      }, DISCONNECT_GRACE_MS);
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
        /* supplementary merge */
      }
    };

    const pullGps = async () => {
      try {
        await fetchGpsHealth();
        const positions = await fetchLiveVehicles();
        if (!active) return;
        if (positions.length) setLiveBatch(positions);
        markConnected(positions.length ? null : "No live device data yet");
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "GPS backend unreachable";
        if (socketConnected) return;
        scheduleDegradedStatus("DISCONNECTED", msg);
      }
    };

    void pullFleet();
    void pullGps();
    pollTimer = setInterval(() => {
      void pullGps();
      void pullFleet();
    }, POLL_MS);

    const socket = getGpsSocket();

    const onConnect = () => {
      socketConnected = true;
      setSocketLive(true);
      markConnected(null);
    };

    const onDisconnect = () => {
      socketConnected = false;
      setSocketLive(false);
      scheduleDegradedStatus("RECONNECTING", "Socket disconnected");
    };

    const onConnectError = () => {
      socketConnected = false;
      setSocketLive(false);
      scheduleDegradedStatus("RECONNECTING", "Socket connection error");
    };

    const onReconnectAttempt = () => {
      scheduleDegradedStatus("RECONNECTING", "Reconnecting to GPS stream…");
    };

    const onLocation = (payload: VehicleLivePosition) => {
      if (!payload?.imei) return;
      setLivePosition(payload);
      setSocketLive(true);
      socketConnected = true;
      markConnected(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("location_update", onLocation);

    if (socket.connected) onConnect();

    return () => {
      active = false;
      clearDisconnectGrace();
      if (pollTimer) clearInterval(pollTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("location_update", onLocation);
      teardownGpsSocket();
    };
  }, []);

  return <>{children}</>;
}
