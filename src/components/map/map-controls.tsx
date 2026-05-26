"use client";

import { useAppStore } from "@/store";
import { useFilteredVehicles } from "@/hooks/use-filtered-vehicles";
import { Button } from "@/components/ui/button";

export function MapControls() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const companyFilter = useAppStore((s) => s.companyFilter);
  const setCompanyFilter = useAppStore((s) => s.setCompanyFilter);
  const setStatusFilter = useAppStore((s) => s.setStatusFilter);
  const companies = useAppStore((s) => s.companies);
  const count = useFilteredVehicles().length;

  return (
    <div className="glass-panel space-y-4 rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Layers & Filters</h3>
      <div className="flex flex-wrap gap-2">
        {(["vehicles", "routes", "violations"] as const).map((layer) => (
          <Button
            key={layer}
            size="sm"
            variant={layers[layer] ? "default" : "outline"}
            onClick={() => toggleLayer(layer)}
            className="capitalize"
          >
            {layer}
          </Button>
        ))}
      </div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search plate or driver..."
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-municipality"
      />
      <select
        value={companyFilter ?? ""}
        onChange={(e) => setCompanyFilter(e.target.value || null)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      >
        <option value="">All companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        onChange={(e) => setStatusFilter(e.target.value || null)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="idle">Idle</option>
        <option value="offline">Offline</option>
      </select>
      <p className="text-xs text-slate-500">
        {count} vehicles visible · toggle <span className="text-slate-400">routes</span> to show assigned paths only
      </p>
    </div>
  );
}
