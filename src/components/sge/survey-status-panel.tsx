"use client";

import { useSgeStore } from "@/store/sge-store";
import type { RouteState, HeadingStatus } from "@/engines/sge";

const STATE_LABELS: Record<RouteState, string> = {
  NOT_STARTED: "Not Started",
  ON_ROUTE: "On Route",
  WARNING: "Warning",
  OFF_ROUTE: "Off Route",
  RETURNING: "Returning",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  GPS_UNRELIABLE: "GPS Unreliable",
};

const STATE_COLORS: Record<RouteState, string> = {
  NOT_STARTED: "bg-slate-700/50 text-slate-300",
  ON_ROUTE: "bg-emerald-900/50 text-emerald-300",
  WARNING: "bg-amber-900/50 text-amber-300",
  OFF_ROUTE: "bg-red-900/50 text-red-300",
  RETURNING: "bg-blue-900/50 text-blue-300",
  PAUSED: "bg-slate-700/50 text-slate-400",
  COMPLETED: "bg-emerald-900/60 text-emerald-200",
  GPS_UNRELIABLE: "bg-orange-900/50 text-orange-300",
};

const HEADING_LABELS: Record<HeadingStatus, string> = {
  CORRECT: "Correct",
  MONITOR: "Monitor",
  WRONG_DIRECTION: "Wrong Direction",
};

export function SurveyStatusPanel() {
  const isActive = useSgeStore((s) => s.isActive);
  const routeState = useSgeStore((s) => s.routeState);
  const completionPct = useSgeStore((s) => s.completionPct);
  const headingStatus = useSgeStore((s) => s.headingStatus);
  const distanceFromRoute = useSgeStore((s) => s.distanceFromRoute);
  const remainingMetres = useSgeStore((s) => s.remainingMetres);
  const wrongDirection = useSgeStore((s) => s.wrongDirection);

  if (!isActive) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-navy-900/50 p-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-300">Survey Status</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">State</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATE_COLORS[routeState]}`}>
            {STATE_LABELS[routeState]}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Completion</span>
            <span className="text-xs font-medium text-white">{completionPct.toFixed(1)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, completionPct)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Deviation</span>
          <span className={`text-xs font-medium ${distanceFromRoute > 30 ? "text-red-400" : distanceFromRoute > 15 ? "text-amber-400" : "text-emerald-400"}`}>
            {distanceFromRoute.toFixed(0)}m
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Remaining</span>
          <span className="text-xs font-medium text-slate-300">
            {remainingMetres >= 1000
              ? `${(remainingMetres / 1000).toFixed(1)} km`
              : `${remainingMetres.toFixed(0)} m`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Direction</span>
          <span className={`text-xs font-medium ${wrongDirection ? "text-red-400" : headingStatus === "MONITOR" ? "text-amber-400" : "text-emerald-400"}`}>
            {HEADING_LABELS[headingStatus]}
          </span>
        </div>

        {wrongDirection && (
          <div className="mt-1 rounded bg-red-900/40 p-2 text-[10px] font-medium text-red-300">
            ⚠ Wrong direction — please turn around
          </div>
        )}
      </div>
    </div>
  );
}
