"use client";

import { useEffect, useState } from "react";
import {
  voiceCopilot,
  type VoiceHistoryEntry,
} from "@/platform/sge";
import { CopilotActionButton } from "./action-button";

export function CopilotVoicePanel({ vehicleId }: { vehicleId: string | null }) {
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [volume, setVolume] = useState(0.85);

  useEffect(() => {
    voiceCopilot.start(vehicleId);
    setMuted(voiceCopilot.isMuted());
    setVolume(voiceCopilot.getVolume());
    setHistory(voiceCopilot.getHistory());
    const unsub = voiceCopilot.subscribe(setHistory);
    return () => {
      unsub();
      voiceCopilot.stop();
    };
  }, [vehicleId]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Voice Copilot</h3>
        <span className={`text-xs font-semibold ${muted ? "text-amber-400" : "text-emerald-400"}`}>
          {muted ? "MUTED" : "ACTIVE"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <CopilotActionButton
          label={muted ? "Unmute" : "Mute"}
          variant="ghost"
          onClick={() => {
            const next = !muted;
            voiceCopilot.setMuted(next);
            setMuted(next);
          }}
        />
        <CopilotActionButton
          label="Volume Test"
          variant="ghost"
          onClick={() => voiceCopilot.testVolume()}
        />
      </div>

      <label className="mt-3 block text-[10px] uppercase tracking-wider text-slate-500">
        Volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            voiceCopilot.setVolume(v);
          }}
          className="mt-1 w-full"
        />
      </label>

      <div className="mt-3 max-h-28 space-y-1 overflow-auto">
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No voice events yet.</p>
        ) : (
          history
            .slice(-6)
            .reverse()
            .map((h, i) => (
              <div key={`${h.timestamp}-${i}`} className="text-xs text-slate-300">
                <span className="text-slate-500">
                  {new Date(h.timestamp).toLocaleTimeString()}{" "}
                </span>
                {h.message}
                {!h.spoken && <span className="text-slate-600"> (cooldown)</span>}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
