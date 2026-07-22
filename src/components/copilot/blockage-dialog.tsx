"use client";

import { useState } from "react";
import type { BlockageReason } from "@/engines/sge";
import { CopilotActionButton } from "./action-button";

const REASONS: { value: BlockageReason; label: string }[] = [
  { value: "ROAD_CLOSED", label: "Road Closed" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "POLICE", label: "Police" },
  { value: "ACCIDENT", label: "Accident" },
  { value: "UNSAFE", label: "Unsafe" },
  { value: "FLOOD", label: "Flood" },
  { value: "OTHER", label: "Other" },
];

export function CopilotBlockageDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: BlockageReason, notes: string) => void;
}) {
  const [reason, setReason] = useState<BlockageReason>("ROAD_CLOSED");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-navy-950 p-5 shadow-2xl">
        <h2 className="text-xl font-bold text-white">Report Blockage</h2>
        <p className="mt-1 text-sm text-slate-400">
          GPS, time, and vehicle are attached automatically.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`min-h-[48px] rounded-xl px-3 py-3 text-sm font-semibold ${
                reason === r.value
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          className="mt-4 w-full rounded-xl border border-white/10 bg-navy-900 p-3 text-sm text-white placeholder:text-slate-500"
        />

        <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-3 py-6 text-center text-xs text-slate-500">
          Photo capture — coming soon
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <CopilotActionButton label="Cancel" variant="ghost" onClick={onClose} />
          <CopilotActionButton
            label="Submit"
            variant="danger"
            onClick={() => {
              onSubmit(reason, notes);
              setNotes("");
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
