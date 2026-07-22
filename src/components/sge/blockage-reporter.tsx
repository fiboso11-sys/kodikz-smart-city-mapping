"use client";

import { useRef, useState } from "react";
import { useSgeStore } from "@/store/sge-store";
import { useGisStore } from "@/store/gis-store";
import { useLocaleStore } from "@/lib/i18n";
import { uploadSurveyPhoto } from "@/lib/photos/compress-upload";
import { surveyApi } from "@/services/survey/client-api";
import type { BlockageReason } from "@/engines/sge";
import { v4 as uuidv4 } from "uuid";

export function BlockageReporter() {
  const isActive = useSgeStore((s) => s.isActive);
  const reportBlockage = useSgeStore((s) => s.reportBlockage);
  const session = useSgeStore((s) => s.session);
  const liveByImei = useGisStore((s) => s.liveByImei);
  const m = useLocaleStore((s) => s.messages);

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<BlockageReason>("ROAD_CLOSED");
  const [notes, setNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  if (!isActive) return null;

  const reasons = (Object.keys(m.blockageReasons) as BlockageReason[]).map((value) => ({
    value,
    label: m.blockageReasons[value],
  }));

  const onPick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!session) return;
    const live = liveByImei[session.vehicleId];
    const lat = live?.latitude ?? session.lastSnapshot?.latitude ?? 0;
    const lon = live?.longitude ?? session.lastSnapshot?.longitude ?? 0;

    setUploading(true);
    setError(null);
    try {
      reportBlockage(reason, lat, lon, notes || undefined);

      if (file) {
        const photo = await uploadSurveyPhoto({
          file,
          tenantId: "dubai-giscd",
          assignmentId: session.assignment.id,
          vehicleId: session.vehicleId,
          latitude: lat,
          longitude: lon,
        });
        // Re-post blockage with photo id when possible
        await surveyApi
          .postBlockage({
            id: `blk-${uuidv4()}`,
            tenantId: "dubai-giscd",
            assignmentId: session.assignment.id,
            vehicleId: session.vehicleId,
            routeId: session.assignment.routeId,
            latitude: lat,
            longitude: lon,
            timestamp: Date.now(),
            reason,
            notes: notes || undefined,
            photoIds: [photo.id],
          })
          .catch(() => undefined);
      }

      setOpen(false);
      setNotes("");
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40 transition-colors"
      >
        {m.reportBlockage}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-navy-900/50 p-3">
      <h4 className="mb-2 text-xs font-semibold text-slate-300">{m.reportBlockage}</h4>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {reasons.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                reason === r.value
                  ? "bg-red-700 text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="…"
          className="w-full rounded border border-white/10 bg-navy-900 p-2 text-xs text-white placeholder-slate-500 focus:border-gis-blue/40 focus:outline-none"
          rows={2}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 rounded bg-white/5 px-2 py-1.5 text-[11px] text-slate-300"
          >
            {m.takePhoto}
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex-1 rounded bg-white/5 px-2 py-1.5 text-[11px] text-slate-300"
          >
            {m.chooseGallery}
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        {previewUrl && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" className="max-h-32 w-full rounded object-cover" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
              className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white"
            >
              {m.delete}
            </button>
          </div>
        )}

        {error && <p className="text-[10px] text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => void handleSubmit()}
            disabled={uploading}
            className="flex-1 rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {uploading ? "…" : m.upload}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            className="flex-1 rounded bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
          >
            {m.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
