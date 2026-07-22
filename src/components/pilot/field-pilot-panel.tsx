"use client";

/**
 * Dubai GISCD Field Pilot diagnostics — hidden by default.
 * Toggle: Ctrl+Shift+P or ?pilot=1
 */

import { useEffect, useState } from "react";
import { useSurveySync } from "@/hooks/use-survey-sync";
import { useRouteAssignmentStore } from "@/store/route-assignment-store";
import { useSgeStore } from "@/store/sge-store";
import { useGisStore } from "@/store/gis-store";
import { offlineQueue, voiceCopilot } from "@/platform/sge";
import { useLocaleStore } from "@/lib/i18n";

export function FieldPilotPanel() {
  const [open, setOpen] = useState(false);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const { status: syncStatus, lastEvent } = useSurveySync("dubai-giscd");
  const activeAssignment = useRouteAssignmentStore((s) => s.activeAssignment);
  const storeSync = useRouteAssignmentStore((s) => s.syncStatus);
  const completionPct = useSgeStore((s) => s.completionPct);
  const routeState = useSgeStore((s) => s.routeState);
  const gpsAccuracy = useSgeStore((s) => s.latestSnapshot?.gpsAccuracy ?? null);
  const liveCount = useGisStore((s) => Object.keys(s.liveByImei).length);
  const m = useLocaleStore((s) => s.messages);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("pilot") === "1") setOpen(true);

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const tick = async () => {
      const t0 = performance.now();
      try {
        await fetch("/api/survey-assignments?tenantId=dubai-giscd");
        if (!cancelled) setApiLatencyMs(Math.round(performance.now() - t0));
      } catch {
        if (!cancelled) setApiLatencyMs(null);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open]);

  if (!open) return null;

  const gpsQuality =
    gpsAccuracy == null
      ? "—"
      : gpsAccuracy <= 10
        ? "GOOD"
        : gpsAccuracy <= 25
          ? "FAIR"
          : gpsAccuracy <= 50
            ? "POOR"
            : "UNRELIABLE";

  const voiceHistoryLen =
    typeof voiceCopilot.getHistory === "function" ? voiceCopilot.getHistory().length : 0;

  return (
    <div className="fixed bottom-3 left-3 z-[80] w-72 rounded-lg border border-amber-700/40 bg-navy-950/95 p-3 text-[11px] text-slate-300 shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-amber-400">{m.fieldPilot}</span>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded bg-white/5 px-1.5 py-0.5"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          >
            {locale.toUpperCase()}
          </button>
          <button type="button" className="rounded bg-white/5 px-1.5" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
      </div>
      <dl className="space-y-1">
        <Row label={m.socketHealth} value={syncStatus} />
        <Row label="Store sync" value={storeSync} />
        <Row label={m.syncPending} value={String(offlineQueue.pendingCount())} />
        <Row label={m.gpsQuality} value={gpsQuality} />
        <Row label="Live vehicles" value={String(liveCount)} />
        <Row label={m.apiLatency} value={apiLatencyMs != null ? `${apiLatencyMs} ms` : "—"} />
        <Row label={m.voiceStatus} value={`hist=${voiceHistoryLen}`} />
        <Row
          label={m.currentAssignment}
          value={activeAssignment ? `${activeAssignment.status} · ${activeAssignment.routeName}` : "none"}
        />
        <Row label="Route state" value={routeState} />
        <Row label={m.completed} value={`${completionPct.toFixed(1)}%`} />
        <Row label="Last event" value={lastEvent?.type ?? "—"} />
      </dl>
      <p className="mt-2 text-[9px] text-slate-600">Ctrl+Shift+P · Dubai GISCD Pilot</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate text-right font-mono text-slate-200">{value}</dd>
    </div>
  );
}
