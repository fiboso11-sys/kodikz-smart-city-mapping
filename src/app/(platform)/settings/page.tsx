"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE, gpsApiUrl, mapProvider, socketUrl } from "@/lib/config";
import { Activity } from "lucide-react";

export default function SettingsPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gps/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setHealthError(e instanceof Error ? e.message : "Unreachable"));
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader title="Settings" subtitle="Platform configuration & integration status">
        <Link
          href="/settings/system-health"
          className="flex items-center gap-2 rounded-lg bg-gis-blue/20 px-3 py-2 text-sm text-gis-blue-light ring-1 ring-gis-blue/30"
        >
          <Activity className="h-4 w-4" /> System Health
        </Link>
      </PageHeader>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <section className="command-panel rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Application</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="System" value={APP_NAME} />
            <Row label="Department" value={APP_SUBTITLE} />
            <Row label="Platform" value={APP_TAGLINE} />
            <Row label="Phase" value="Phase 1 — Production Foundation" />
          </dl>
        </section>

        <section className="command-panel rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">GPS Backend Integration</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="API URL" value={gpsApiUrl()} mono />
            <Row label="Socket URL" value={socketUrl()} mono />
            <Row label="Map engine" value={`MapLibre GL JS (${mapProvider()})`} />
            <Row label="Basemap" value="CARTO English (Voyager / Dark / Light)" />
            <Row label="Socket event" value="location_update" mono />
          </dl>
          <div className="mt-4 rounded-lg bg-navy-900 p-3 font-mono text-[11px] text-slate-400">
            {healthError ? (
              <span className="text-dm-red-light">{healthError}</span>
            ) : health ? (
              <pre className="overflow-auto whitespace-pre-wrap">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : (
              "Checking backend health…"
            )}
          </div>
        </section>

        <section className="command-panel rounded-xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Environment Variables</h2>
          <div className="mt-3 grid gap-2 font-mono text-xs text-slate-400 md:grid-cols-2">
            <code>NEXT_PUBLIC_API_URL</code>
            <code>NEXT_PUBLIC_SOCKET_URL</code>
            <code>NEXT_PUBLIC_GPS_API_URL</code>
            <code>NEXT_PUBLIC_MAP_PROVIDER=maplibre</code>
            <code>SQLITE_PATH</code>
            <code>DATABASE_URL</code>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            No Mapbox token is required. Phase 1 uses CARTO English basemaps via MapLibre GL JS.
          </p>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right text-slate-200 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
