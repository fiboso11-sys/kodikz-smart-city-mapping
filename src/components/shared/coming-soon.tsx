import { Construction } from "lucide-react";
import { PageHeader } from "./page-header";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <PageHeader title={title} subtitle="Phase 2 module — scheduled for next release" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-2xl border border-gold/20 bg-navy-900/60 p-6">
          <Construction className="mx-auto h-12 w-12 text-gold" />
        </div>
        <h2 className="text-lg font-semibold text-white">Coming Soon</h2>
        <p className="max-w-md text-sm text-slate-400">
          This module is part of the Dubai Street Mapping Monitoring System roadmap and will be
          activated in Phase 2. Phase 1 focuses on Dashboard, Live Monitoring, Vehicles, Permits,
          Geo Upload, and Settings.
        </p>
      </div>
    </div>
  );
}
