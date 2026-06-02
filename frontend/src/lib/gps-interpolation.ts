/** Ease-out cubic — smooth deceleration into each GPS fix. */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export interface LatLngHeading {
  latitude: number;
  longitude: number;
  heading: number;
}

interface Segment {
  from: LatLngHeading;
  to: LatLngHeading;
  startMs: number;
  durationMs: number;
}

/**
 * Interpolates marker positions between GPS polls (e.g. every 2s).
 */
export class VehiclePositionInterpolator {
  private segments = new Map<string, Segment>();
  private current = new Map<string, LatLngHeading>();

  setTarget(
    vehicleId: string,
    target: LatLngHeading,
    durationMs: number,
    nowMs: number = performance.now()
  ): void {
    const prev =
      this.current.get(vehicleId) ??
      this.sample(vehicleId, nowMs) ??
      target;

    const moved =
      Math.abs(prev.latitude - target.latitude) > 1e-7 ||
      Math.abs(prev.longitude - target.longitude) > 1e-7;

    if (!moved) {
      this.current.set(vehicleId, target);
      return;
    }

    const at = this.sample(vehicleId, nowMs) ?? prev;

    this.segments.set(vehicleId, {
      from: at,
      to: target,
      startMs: nowMs,
      durationMs: Math.max(250, durationMs),
    });
    this.current.set(vehicleId, at);
  }

  sample(vehicleId: string, nowMs: number = performance.now()): LatLngHeading | null {
    const seg = this.segments.get(vehicleId);
    if (!seg) return this.current.get(vehicleId) ?? null;

    const t = easeOutCubic((nowMs - seg.startMs) / seg.durationMs);
    const pos: LatLngHeading = {
      latitude: seg.from.latitude + (seg.to.latitude - seg.from.latitude) * t,
      longitude: seg.from.longitude + (seg.to.longitude - seg.from.longitude) * t,
      heading: lerpAngle(seg.from.heading, seg.to.heading, t),
    };

    this.current.set(vehicleId, pos);

    if (t >= 1) {
      this.segments.delete(vehicleId);
      this.current.set(vehicleId, seg.to);
    }

    return pos;
  }

  remove(vehicleId: string): void {
    this.segments.delete(vehicleId);
    this.current.delete(vehicleId);
  }

  prune(validIds: ReadonlySet<string>): void {
    for (const id of this.segments.keys()) {
      if (!validIds.has(id)) this.remove(id);
    }
    for (const id of this.current.keys()) {
      if (!validIds.has(id)) this.remove(id);
    }
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  const delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}
