"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { formatDubaiDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type ModuleStatus = "ONLINE" | "OFFLINE";

interface HealthModule {
  status: ModuleStatus;
  detail?: string;
  url?: string;
  backend?: string;
  path?: string | null;
}

interface SystemHealthResponse {
  overall: string;
  checkedAt: string;
  modules: {
    backendApi: HealthModule;
    socket: HealthModule;
    database: HealthModule;
    geoUpload: HealthModule;
  };
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-xs font-semibold uppercase",
        status === "ONLINE"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      )}
    >
      {status}
    </span>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/system-health", { cache: "no-store" })
        .then((r) => r.json())
        .then(setHealth)
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader title="System Health" subtitle="Backend API, Socket.IO, database & geo module status">
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
            <div className="command-panel mb-4 flex items-center justify-between rounded-xl p-4">
              <div>
                <p className="text-xs text-slate-500">Overall status</p>
                <p className="text-lg font-semibold text-white">{health.overall}</p>
              </div>
              <p className="text-xs text-slate-500">
                Last check: {formatDubaiDateTime(health.checkedAt)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["Backend API", health.modules.backendApi],
                  ["Socket.IO", health.modules.socket],
                  ["Database", health.modules.database],
                  ["Geo Upload Module", health.modules.geoUpload],
                ] as const
              ).map(([title, mod]) => (
                <section key={title} className="command-panel rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <StatusBadge status={mod.status} />
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    {mod.url && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">URL</dt>
                        <dd className="truncate font-mono text-xs text-slate-300">{mod.url}</dd>
                      </div>
                    )}
                    {mod.backend && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Backend</dt>
                        <dd className="text-slate-300">{mod.backend}</dd>
                      </div>
                    )}
                    {mod.path && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Path</dt>
                        <dd className="truncate font-mono text-xs text-slate-300">{mod.path}</dd>
                      </div>
                    )}
                    {mod.detail && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Detail</dt>
                        <dd className="text-right text-slate-300">{mod.detail}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              ))}
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
