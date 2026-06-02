"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFleetHealth } from "@/hooks/use-fleet-health";
import { cn, formatRelativeSeconds, formatTime, formatUptime } from "@/lib/utils";

function StatusPill({ up, label }: { up: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        up
          ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
          : "bg-red-500/15 text-red-400 ring-red-500/30"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", up ? "bg-emerald-400" : "bg-red-400")} />
      {label}
    </span>
  );
}

function HealthRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={cn("text-right text-sm text-white", valueClassName)}>{value}</span>
    </div>
  );
}

export function FleetHealthPanel() {
  const { health, error, enabled } = useFleetHealth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) {
    return (
      <section aria-label="Fleet health" className="shrink-0">
        <div className="glass-panel rounded-xl p-4 text-sm text-slate-500">
          Fleet health is available in live GPS mode (Teltonika / VPS backend).
        </div>
      </section>
    );
  }

  const apiUp = health?.checks.http === "up";
  const tcpUp = health?.checks.tcp === "up";
  const dataMode = health?.dataMode ?? "live";
  const connected = health?.connectedDevices ?? health?.devices ?? 0;
  const reporting = health?.reportingDevices ?? 0;
  const protocol = health?.protocol?.supported?.[0] ?? "Codec 8 (0x08)";

  return (
    <motion.section
      aria-label="Fleet health"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="shrink-0"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fleet health
        </h2>
        {health && (
          <span className="text-[10px] text-slate-600">
            {health.status === "ok" ? "Operational" : "Starting"}
          </span>
        )}
      </div>

      <div className="glass-panel rounded-xl p-4">
        {error && !health && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Backend
            </h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill up={apiUp} label="API" />
              <StatusPill up={tcpUp} label="TCP" />
            </div>
            <div className="text-sm">
              <HealthRow
                label="API status"
                value={health ? (apiUp ? "Up" : "Down") : "—"}
                valueClassName={apiUp ? "text-emerald-400" : "text-red-400"}
              />
              <HealthRow
                label="TCP listener"
                value={health ? (tcpUp ? "Up" : "Down") : "—"}
                valueClassName={tcpUp ? "text-emerald-400" : "text-red-400"}
              />
              <HealthRow
                label="Uptime"
                value={health ? formatUptime(health.uptimeSec) : "—"}
              />
              <HealthRow
                label="Environment"
                value={
                  health
                    ? `${health.environment} · ${dataMode === "simulation" ? "Simulation" : "Live GPS"}`
                    : "—"
                }
                valueClassName={
                  dataMode === "simulation" ? "text-amber-400" : "text-cyan-400"
                }
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Devices
            </h3>
            <div className="text-sm">
              <HealthRow label="Connected devices" value={health ? String(connected) : "—"} />
              <HealthRow
                label="Reporting devices"
                value={health ? String(reporting) : "—"}
                valueClassName="text-cyan-400"
              />
              <HealthRow
                label="Last packet"
                value={
                  health?.lastPacketReceivedAt
                    ? `${formatRelativeSeconds(health.lastPacketReceivedAt, now)} (${formatTime(health.lastPacketReceivedAt)})`
                    : health
                      ? "None yet"
                      : "—"
                }
                valueClassName="text-xs"
              />
              <HealthRow label="Supported protocol" value={protocol} valueClassName="text-xs" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
