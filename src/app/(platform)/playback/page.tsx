"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Rewind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { useAppStore } from "@/store";
import { formatTime } from "@/lib/utils";
import { progressForFrame, snapToRoute, trailToProgress } from "@/lib/geo";

export default function PlaybackPage() {
  const history = useAppStore((s) => s.history);
  const vehicles = useAppStore((s) => s.vehicles);
  const routes = useAppStore((s) => s.routes);
  const setReplayMode = useAppStore((s) => s.setReplayMode);
  const replayIndex = useAppStore((s) => s.replayIndex);
  const setReplayIndex = useAppStore((s) => s.setReplayIndex);
  const replayPlaying = useAppStore((s) => s.replayPlaying);
  const setReplayPlaying = useAppStore((s) => s.setReplayPlaying);
  const applyPlaybackFrame = useAppStore((s) => s.applyPlaybackFrame);
  const resetFromSeed = useAppStore((s) => s.resetFromSeed);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [speed, setSpeed] = useState(300);

  useEffect(() => {
    if (!vehicleFilter && vehicles.length > 0) {
      setVehicleFilter(vehicles[0].id);
    }
  }, [vehicles, vehicleFilter]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleFilter);
  const assignedRoute = useMemo(() => {
    if (!selectedVehicle?.assignedRouteId) return undefined;
    return routes.find((r) => r.id === selectedVehicle.assignedRouteId);
  }, [routes, selectedVehicle]);

  const trackPoints = useMemo(() => {
    if (!vehicleFilter) return [];
    let pts = history.filter((p) => p.vehicleId === vehicleFilter);
    if (start && end) {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      pts = pts.filter((p) => {
        const t = new Date(p.timestamp).getTime();
        return t >= s && t <= e;
      });
    }
    return pts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [history, start, end, vehicleFilter]);

  const currentPoint = trackPoints[replayIndex % Math.max(trackPoints.length, 1)];

  useEffect(() => {
    setReplayMode(true);
    setReplayIndex(0);
    return () => setReplayMode(false);
  }, [setReplayMode, setReplayIndex]);

  useEffect(() => {
    if (!replayPlaying || trackPoints.length === 0) return;
    const id = setInterval(() => {
      const idx = useAppStore.getState().replayIndex;
      const next = (idx + 1) % trackPoints.length;
      setReplayIndex(next);
    }, speed);
    return () => clearInterval(id);
  }, [replayPlaying, trackPoints.length, speed, setReplayIndex]);

  useEffect(() => {
    if (trackPoints.length === 0 || !vehicleFilter) return;
    const idx = replayIndex % trackPoints.length;
    const meta = trackPoints[idx];

    if (assignedRoute) {
      const progress = progressForFrame(idx, trackPoints.length);
      const snap = snapToRoute(assignedRoute, progress);
      const trail = trailToProgress(assignedRoute, progress);
      applyPlaybackFrame({ ...meta, ...snap }, trail, vehicleFilter);
      return;
    }

    const trailCoords = trackPoints
      .slice(0, idx + 1)
      .map((pt) => [pt.longitude, pt.latitude] as [number, number]);
    applyPlaybackFrame(
      meta,
      { type: "LineString", coordinates: trailCoords },
      vehicleFilter
    );
  }, [replayIndex, trackPoints, vehicleFilter, assignedRoute, applyPlaybackFrame]);

  const progress = trackPoints.length ? Math.round((replayIndex / trackPoints.length) * 100) : 0;

  return (
    <section className="flex h-screen flex-col p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Historical Playback</h1>
        <p className="text-sm text-slate-500">
          Replay follows the vehicle&apos;s assigned route on the map (not raw GPS jumps)
        </p>
      </header>

      <fieldset className="glass-panel mb-4 flex flex-wrap items-end gap-4 rounded-xl border-0 p-4">
        <label className="text-xs text-slate-500">
          Vehicle (required)
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setReplayIndex(0);
              setReplayPlaying(false);
            }}
            className="mt-1 block min-w-[180px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plateNumber} — {v.driverName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Start (optional)
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setReplayIndex(0);
            }}
            className="mt-1 block rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-slate-500">
          End (optional)
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setReplayIndex(0);
            }}
            className="mt-1 block rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-slate-500">
          Speed (ms)
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value={150}>Fast</option>
            <option value={300}>Normal</option>
            <option value={600}>Slow</option>
          </select>
        </label>
        <Button
          variant="outline"
          className="gap-2"
          disabled={trackPoints.length === 0}
          onClick={() => setReplayPlaying(!replayPlaying)}
        >
          {replayPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {replayPlaying ? "Pause" : "Play"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setReplayPlaying(false);
            setReplayIndex(0);
          }}
        >
          <Rewind className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => resetFromSeed()}>
          Reload seed data
        </Button>
      </fieldset>

      <section className="glass-panel mb-4 rounded-xl p-4 text-sm">
        {trackPoints.length === 0 ? (
          <p className="text-amber-400">
            No history for this vehicle. Click <strong>Reload seed data</strong>, then refresh the page.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 text-slate-300">
              <span>
                <strong className="text-white">{trackPoints.length}</strong> frames
              </span>
              <span>
                Frame <strong className="text-white">{replayIndex + 1}</strong> / {trackPoints.length}
              </span>
              <span>{progress}%</span>
              {selectedVehicle && (
                <span className="text-blue-400">{selectedVehicle.plateNumber}</span>
              )}
              {assignedRoute && (
                <span className="text-emerald-400/90">On route: {assignedRoute.name}</span>
              )}
            </div>
            {currentPoint && (
              <p className="mt-2 text-xs text-slate-500">
                {formatTime(currentPoint.timestamp)} · {Math.round(currentPoint.speed)} km/h
              </p>
            )}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </section>

      <main className="glass-panel min-h-0 flex-1 rounded-xl p-1">
        <LiveMap />
      </main>
    </section>
  );
}
