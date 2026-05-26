"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { useAppStore } from "@/store";
import type { Route } from "@/types";

const SAMPLE: GeoJSON.LineString = {
  type: "LineString",
  coordinates: [
    [55.27, 25.2],
    [55.28, 25.21],
    [55.29, 25.22],
    [55.3, 25.21],
  ],
};

export default function RoutesPage() {
  const routes = useAppStore((s) => s.routes);
  const addRoute = useAppStore((s) => s.addRoute);
  const deleteRoute = useAppStore((s) => s.deleteRoute);
  const [name, setName] = useState("New Route");

  const createSample = () => {
    addRoute({
      id: `rt-${Date.now()}`,
      name,
      companyId: null,
      permitId: null,
      vehicleId: null,
      color: "#3b82f6",
      geometry: SAMPLE,
    });
    setName("New Route");
  };

  const upload = async (file: File) => {
    const geo = JSON.parse(await file.text());
    const geometry = geo.type === "Feature" ? geo.geometry : geo.features?.[0]?.geometry ?? geo;
    addRoute({
      id: `rt-${Date.now()}`,
      name: file.name.replace(/\.(json|geojson)$/i, ""),
      companyId: null,
      permitId: null,
      vehicleId: null,
      color: "#06b6d4",
      geometry,
    });
  };

  return (
    <div className="flex h-screen flex-col p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Route Management</h1>
        <p className="text-sm text-slate-500">Upload GeoJSON · draw · assign vehicles & permits</p>
      </header>
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="w-96 space-y-4 overflow-y-auto">
          <div className="glass-panel space-y-3 rounded-xl p-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              placeholder="Route name"
            />
            <Button onClick={createSample} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add Sample Route
            </Button>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-4 text-sm text-slate-400 hover:bg-white/5">
              <Upload className="h-4 w-4" /> Upload GeoJSON
              <input type="file" accept=".json,.geojson" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
          {routes.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="glass-panel flex items-center justify-between rounded-xl p-3">
              <div>
                <p className="font-medium text-white">{r.name}</p>
                <p className="text-xs text-slate-500">{r.geometry.coordinates.length} points</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteRoute(r.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </motion.div>
          ))}
        </div>
        <div className="glass-panel min-h-0 flex-1 rounded-xl p-1">
          <LiveMap />
        </div>
      </div>
    </div>
  );
}
