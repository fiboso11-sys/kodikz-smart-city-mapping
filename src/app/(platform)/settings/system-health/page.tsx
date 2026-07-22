"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { formatDubaiDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type HealthState = "healthy" | "degraded" | "unavailable" | "unknown" | "not_configured";

interface ComponentInfo {
  status: HealthState;
  responseTimeMs?: number;
  lastCheckedAt?: string;
  message?: string;
  configured?: boolean;
}

interface SystemHealthResponse {
  status: string;
  product?: string;
  version?: string;
  release?: string;
  gitTag?: string;
  commitSha?: string;
  buildTime?: string;
  environment?: string;
  uptimeSeconds?: number;
  migrationVersion?: string;
  serverTime?: string;
  timestamp?: string;
  checkedAt?: string;
  overall?: string;
  components?: {
    application?: ComponentInfo;
    database?: ComponentInfo;
    socketIo?: ComponentInfo;
    gpsBackend?: ComponentInfo;
    objectStorage?: ComponentInfo;
  };
  modules?: Record<string, { status: string; detail?: string; backend?: string }>;
}

const STATE_LABEL: Record<string, string> = {
  healthy: "HEALTHY",
  degraded: "DEGRADED",
  unavailable: "UNAVAILABLE",
  unknown: "UNKNOWN",
  not_configured: "NOT CONFIGURED",
  ONLINE: "HEALTHY",
  OFFLINE: "UNAVAILABLE",
  DEGRADED: "DEGRADED",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATE_LABEL[status] ?? status.toUpperCase();
  const tone =
    label === "HEALTHY"
      ? "bg-emerald-500/15 text-emerald-400"
      : label === "DEGRADED" || label === "NOT CONFIGURED" || label === "UNKNOWN"
        ? "bg-amber-500/15 text-amber-400"
        : "bg-red-500/15 text-red-400";
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-semibold uppercase", tone)}>
      {label}
    </span>
  );
}

function ComponentCard({ title, mod, note }: { title: string; mod?: ComponentInfo; note?: string }) {
  if (!mod) {
    return (
      <section className="command-panel rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <StatusBadge status="unknown" />
        </div>
        <p className="mt-3 text-sm text-slate-400">{note ?? "No data"}</p>
      </section>
    );
  }
  return (
    <section className="command-panel rounded-xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <StatusBadge status={mod.status} />
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {typeof mod.configured === "boolean" && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Configured</dt>
            <dd className="text-slate-300">{mod.configured ? "Yes" : "No"}</dd>
          </div>
        )}
        {typeof mod.responseTimeMs === "number" && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Response</dt>
            <dd className="text-slate-300">{mod.responseTimeMs} ms</dd>
          </div>
        )}
        {mod.message && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Detail</dt>
            <dd className="text-right text-slate-300">{mod.message}</dd>
          </div>
        )}
        {note && <p className="pt-1 text-xs text-slate-500">{note}</p>}
      </dl>
    </section>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/system-health", { cache: "no-store" })
        .then(async (r) => {
          const data = (await r.json()) as SystemHealthResponse;
          setHealth(data);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const c = health?.components;

  return (
    <div className="min-h-screen">
      <PageHeader title="System Health" subtitle="Operational status — safe fields only">
        <Link
          href="/settings"
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
      </PageHeader>

      <div className="p-4">
        {error && <p className="mb-4 text-sm text-dm-red-light">{error}</p>}

        {health && (
          <>
            <div className="command-panel mb-4 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Overall status</p>
                  <p className="text-lg font-semibold text-white">
                    <StatusBadge status={health.status || health.overall || "unknown"} />
                  </p>
                  {health.product && (
                    <p className="mt-2 text-xs text-slate-400">{health.product}</p>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Checked: {formatDubaiDateTime(health.serverTime || health.checkedAt || "")}</p>
                  {typeof health.uptimeSeconds === "number" && (
                    <p className="mt-1">Uptime: {health.uptimeSeconds}s</p>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  Version: <span className="text-slate-200">{health.version ?? "—"}</span>
                </div>
                <div>
                  Release: <span className="text-slate-200">{health.release ?? "—"}</span>
                </div>
                <div>
                  Tag: <span className="font-mono text-slate-200">{health.gitTag ?? "—"}</span>
                </div>
                <div className="truncate">
                  Commit:{" "}
                  <span className="font-mono text-slate-200">
                    {health.commitSha ? health.commitSha.slice(0, 12) : "—"}
                  </span>
                </div>
                <div>
                  Environment: <span className="text-slate-200">{health.environment ?? "—"}</span>
                </div>
                <div>
                  Migration: <span className="text-slate-200">{health.migrationVersion ?? "—"}</span>
                </div>
                <div className="sm:col-span-2">
                  Build: <span className="font-mono text-slate-200">{health.buildTime ?? "—"}</span>
                </div>
              </dl>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ComponentCard title="Application" mod={c?.application} />
              <ComponentCard
                title="Database"
                mod={c?.database}
                note="Application database — paths and connection strings are not shown"
              />
              <ComponentCard
                title="GPS Backend"
                mod={c?.gpsBackend}
                note="External integration"
              />
              <ComponentCard
                title="Socket.IO"
                mod={c?.socketIo}
                note="External GPS realtime channel"
              />
              <ComponentCard
                title="Object Storage"
                mod={c?.objectStorage}
                note="Not configured is normal in local mode"
              />
              {health.modules?.geoUpload && (
                <ComponentCard
                  title="Geo Upload Module"
                  mod={{
                    status:
                      health.modules.geoUpload.status === "ONLINE"
                        ? "healthy"
                        : health.modules.geoUpload.status === "DEGRADED"
                          ? "degraded"
                          : "unavailable",
                    message: health.modules.geoUpload.detail,
                    configured: true,
                  }}
                />
              )}
            </div>
          </>
        )}

        {!health && !error && (
          <p className="text-sm text-slate-500">Running system health checks…</p>
        )}
      </div>
    </div>
  );
}
