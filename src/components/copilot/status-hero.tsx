"use client";

import type { RouteState } from "@/engines/sge";

const STATE_STYLE: Record<
  RouteState,
  { bg: string; border: string; label: string }
> = {
  NOT_STARTED: {
    bg: "from-slate-800 to-slate-900",
    border: "border-slate-500",
    label: "NOT STARTED",
  },
  ON_ROUTE: {
    bg: "from-emerald-700 to-emerald-950",
    border: "border-emerald-400",
    label: "ON ROUTE",
  },
  WARNING: {
    bg: "from-amber-600 to-amber-950",
    border: "border-amber-400",
    label: "WARNING",
  },
  OFF_ROUTE: {
    bg: "from-red-700 to-red-950",
    border: "border-red-400",
    label: "OFF ROUTE",
  },
  RETURNING: {
    bg: "from-blue-700 to-blue-950",
    border: "border-blue-400",
    label: "RETURNING",
  },
  PAUSED: {
    bg: "from-slate-600 to-slate-900",
    border: "border-slate-400",
    label: "PAUSED",
  },
  COMPLETED: {
    bg: "from-emerald-600 to-teal-950",
    border: "border-emerald-300",
    label: "COMPLETED",
  },
  GPS_UNRELIABLE: {
    bg: "from-orange-700 to-orange-950",
    border: "border-orange-400",
    label: "GPS LOST",
  },
};

export function CopilotStatusHero({
  routeState,
  completionPct,
  remainingMetres,
  currentRoad,
  gpsQuality,
}: {
  routeState: RouteState;
  completionPct: number;
  remainingMetres: number;
  currentRoad: string;
  gpsQuality: string;
}) {
  const style = STATE_STYLE[routeState];
  const remaining =
    remainingMetres >= 1000
      ? `${(remainingMetres / 1000).toFixed(1)} km`
      : `${Math.round(remainingMetres)} m`;

  // Rough ETA: assume 25 km/h average survey speed
  const etaMin = remainingMetres > 0 ? Math.max(1, Math.round(remainingMetres / 1000 / 25 * 60)) : 0;

  return (
    <div
      className={`rounded-2xl border-2 bg-gradient-to-br ${style.bg} ${style.border} p-5 shadow-lg`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
        Survey Status
      </p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
        {style.label}
      </h1>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-white">{completionPct.toFixed(0)}%</span>
          <span className="text-sm text-white/70">{remaining} left · ~{etaMin} min</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-white/90 transition-all duration-500"
            style={{ width: `${Math.min(100, completionPct)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/50">Current Street</p>
          <p className="mt-0.5 truncate font-semibold text-white">{currentRoad || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/50">GPS Quality</p>
          <p className="mt-0.5 font-semibold text-white">{gpsQuality}</p>
        </div>
      </div>
    </div>
  );
}
