"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { usePermits, useGeoUploads } from "@/hooks/use-permits";
import { validateAreaGeoJson, validateRouteGeoJson } from "@/lib/geo/validation";
import { Upload } from "lucide-react";

const MapView = dynamic(() => import("@/components/maps/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="command-panel flex h-64 items-center justify-center text-sm text-slate-500">
      Loading map preview…
    </div>
  ),
});

export default function GeoUploadPage() {
  const { data: permits = [] } = usePermits();
  const { data: uploads = [] } = useGeoUploads();
  const qc = useQueryClient();

  const [permitId, setPermitId] = useState("");
  const [uploadType, setUploadType] = useState<"route" | "area">("route");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const onFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setFileName(file.name);
    if (!file.name.match(/\.(geojson|json)$/i) && file.type && !file.type.includes("json")) {
      setError("Corrupted or unsupported file — use .geojson or .json");
      setPreview(null);
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        setError("Corrupted file — empty content");
        setPreview(null);
        return;
      }
      const json = JSON.parse(text) as unknown;
      const validated =
        uploadType === "route" ? validateRouteGeoJson(json) : validateAreaGeoJson(json);
      if (!validated.ok) {
        setError(validated.error);
        setPreview(null);
        return;
      }
      setPreview(validated.featureCollection);
    } catch {
      setError("Invalid GeoJSON — file is not valid JSON");
      setPreview(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void onFile(file);
  };

  const submit = async () => {
    if (!permitId || !preview) {
      setError("Select permit and upload valid GeoJSON");
      return;
    }
    const path =
      uploadType === "route"
        ? `/api/permits/${permitId}/upload-route`
        : `/api/permits/${permitId}/upload-area`;

    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geojson: preview, name: name || fileName, fileName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    setError(null);
    setSuccess(`Layer "${name || fileName}" uploaded successfully`);
    setPreview(null);
    setName("");
    setFileName("");
    await qc.invalidateQueries({ queryKey: ["geo-uploads"] });
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Geo Upload"
        subtitle="Upload approved GIS routes (LineString) and areas (Polygon) — GeoJSON Phase 1"
      />

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="command-panel space-y-4 rounded-xl p-5">
          <div className="flex items-center gap-2 text-gold">
            <Upload className="h-5 w-5" />
            <h2 className="font-semibold text-white">Upload Wizard</h2>
          </div>

          <label className="block text-xs text-slate-400">
            Permit
            <select
              value={permitId}
              onChange={(e) => setPermitId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select permit…</option>
              {permits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.permitNumber} — {p.projectName}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            {(["route", "area"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setUploadType(t)}
                className={`flex-1 rounded-lg py-2 text-sm capitalize ${
                  uploadType === t
                    ? "bg-gis-blue/25 text-gis-blue-light ring-1 ring-gis-blue/40"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                Approved {t}
              </button>
            ))}
          </div>

          <label className="block text-xs text-slate-400">
            Layer name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jumeirah Corridor Route A"
              className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
            />
          </label>

          <label
            className={`block cursor-pointer rounded-lg border border-dashed p-6 text-center text-sm transition-colors ${
              dragOver
                ? "border-gis-blue bg-gis-blue/10 text-gis-blue-light"
                : "border-gold/30 bg-navy-900/50 text-slate-400 hover:border-gold/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept=".geojson,.json,application/geo+json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
            Drag &amp; drop GeoJSON here or click to browse
            {fileName && <p className="mt-2 text-xs text-gis-blue-light">{fileName}</p>}
          </label>

          {success && <p className="text-sm text-emerald-400">{success}</p>}
          {error && <p className="text-sm text-dm-red-light">{error}</p>}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={!preview || !permitId}
            className="w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-navy-950 disabled:opacity-40"
          >
            Upload &amp; Register Layer
          </button>

          <p className="text-[11px] text-slate-500">
            Supported: GeoJSON · Future: SHP, KML, GDB. Routes must be LineString /
            MultiLineString. Areas must be Polygon / MultiPolygon.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-72 lg:h-96">
            {preview ? (
              <MapView
                vehicles={[]}
                geoUploadRecords={[
                  {
                    id: "preview",
                    permitId: permitId,
                    permitNumber: "",
                    type: uploadType,
                    name: name || "Preview",
                    fileName,
                    geometry: preview.features[0]?.geometry as GeoJSON.Geometry,
                    featureCollection: preview,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: "preview",
                    metadata: { featureCount: preview.features.length },
                  },
                ]}
                className="h-full"
              />
            ) : (
              <div className="command-panel flex h-full items-center justify-center text-sm text-slate-500">
                Upload GeoJSON to preview on map
              </div>
            )}
          </div>

          <div className="command-panel rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white">Uploaded Layers</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {uploads.length === 0 ? (
                <li className="text-slate-500">No layers uploaded yet</li>
              ) : (
                uploads.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between border-b border-white/5 py-2"
                  >
                    <div>
                      <p className="text-white">{u.name}</p>
                      <p className="text-xs text-slate-500">
                        {u.type} · {u.permitNumber} · {u.fileName}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase text-gis-blue-light">{u.type}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
