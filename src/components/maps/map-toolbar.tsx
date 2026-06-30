"use client";

import { useGisStore } from "@/store/gis-store";
import type { BasemapId } from "@/types";
import {
  Crosshair,
  Eye,
  Layers,
  Map as MapIcon,
  Maximize2,
  Moon,
  Ruler,
  Sun,
} from "lucide-react";

interface MapToolbarProps {
  onFullscreen?: () => void;
  onZoomToDubai?: () => void;
}

export function MapToolbar({ onFullscreen, onZoomToDubai }: MapToolbarProps) {
  const basemap = useGisStore((s) => s.basemap);
  const setBasemap = useGisStore((s) => s.setBasemap);
  const layers = useGisStore((s) => s.layers);
  const setLayer = useGisStore((s) => s.setLayer);
  const measureMode = useGisStore((s) => s.measureMode);
  const setMeasureMode = useGisStore((s) => s.setMeasureMode);
  const identifyMode = useGisStore((s) => s.identifyMode);
  const setIdentifyMode = useGisStore((s) => s.setIdentifyMode);
  const cursorCoords = useGisStore((s) => s.cursorCoords);

  const btn = (active: boolean) =>
    `rounded-lg p-2 transition-colors ${
      active
        ? "bg-gis-blue/25 text-gis-blue-light ring-1 ring-gis-blue/40"
        : "text-slate-300 hover:bg-white/10"
    }`;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3">
      <div className="pointer-events-auto flex flex-wrap items-start gap-2">
        <div className="command-panel flex items-center gap-1 rounded-xl p-1">
          <button
            type="button"
            className={btn(basemap === "english-street")}
            onClick={() => setBasemap("english-street" as BasemapId)}
            title="English Street"
          >
            <MapIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={btn(basemap === "dark-english")}
            onClick={() => setBasemap("dark-english" as BasemapId)}
            title="Dark English"
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={btn(basemap === "light-english")}
            onClick={() => setBasemap("light-english" as BasemapId)}
            title="Light English"
          >
            <Sun className="h-4 w-4" />
          </button>
        </div>

        <div className="command-panel flex items-center gap-1 rounded-xl p-1">
          <button
            type="button"
            className={btn(identifyMode)}
            onClick={() => setIdentifyMode(!identifyMode)}
            title="Identify"
          >
            <Crosshair className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={btn(measureMode)}
            onClick={() => setMeasureMode(!measureMode)}
            title="Measure distance"
          >
            <Ruler className="h-4 w-4" />
          </button>
          <button type="button" className={btn(false)} onClick={onZoomToDubai} title="Zoom to Dubai">
            <Eye className="h-4 w-4" />
          </button>
          <button type="button" className={btn(false)} onClick={onFullscreen} title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="command-panel flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
          <Layers className="h-3.5 w-3.5 text-gis-blue" />
          {(["vehicles", "routes", "areas"] as const).map((key) => (
            <label key={key} className="flex cursor-pointer items-center gap-1.5 text-slate-300">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={(e) => setLayer(key, e.target.checked)}
                className="accent-gis-blue"
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </div>

      {cursorCoords && (
        <div className="pointer-events-none self-start command-panel rounded-lg px-3 py-1.5 font-mono text-[11px] text-slate-300">
          {cursorCoords[1].toFixed(6)}, {cursorCoords[0].toFixed(6)}
        </div>
      )}
    </div>
  );
}
