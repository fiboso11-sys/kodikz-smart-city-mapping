"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { ArrowLeft } from "lucide-react";

interface ReleaseInfo {
  product?: string;
  version?: string;
  release?: string;
  gitTag?: string;
  commitSha?: string;
  buildTime?: string;
  environment?: string;
  migrationVersion?: string;
  copyright?: string;
  supportContact?: string;
  documentationRef?: string;
  deploymentId?: string;
  imageName?: string;
}

export default function AboutVersionPage() {
  const [info, setInfo] = useState<ReleaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/release-identity", { cache: "no-store" })
      .then((r) => r.json())
      .then(setInfo)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader title="About / Version" subtitle="Release identity for support and handover">
        <Link
          href="/settings"
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
      </PageHeader>

      <div className="p-4">
        {error && <p className="mb-4 text-sm text-dm-red-light">{error}</p>}

        <section className="command-panel mx-auto max-w-2xl rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Release identity</h2>
          {!info && !error && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
          {info && (
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Product" value={info.product ?? "—"} />
              <Row label="Version" value={info.version ?? "—"} />
              <Row label="Release channel" value={info.release ?? "—"} />
              <Row label="Git tag" value={info.gitTag ?? "—"} mono />
              <Row
                label="Commit SHA"
                value={info.commitSha ?? "—"}
                mono
              />
              <Row label="Build date" value={info.buildTime ?? "—"} mono />
              <Row label="Database migration" value={info.migrationVersion ?? "—"} />
              <Row label="Runtime environment" value={info.environment ?? "—"} />
              <Row label="Image" value={info.imageName ?? "—"} mono />
              <Row label="Deployment ID" value={info.deploymentId ?? "—"} mono />
              <Row label="Copyright" value={info.copyright ?? "—"} />
              <Row label="Support" value={info.supportContact ?? "—"} />
              <Row label="Documentation" value={info.documentationRef ?? "—"} />
            </dl>
          )}
          <p className="mt-5 text-xs text-slate-500">
            For sanitized server diagnostics, Dubai operators run{" "}
            <code className="text-slate-300">./scripts/support.sh</code> on the deployment host.
            Application-side diagnostic file export is not enabled for this pilot (see
            DIAGNOSTICS-EXPORT-DECISION.md).
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
      <dd className={`max-w-[65%] break-all text-right text-slate-200 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
