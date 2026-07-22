/**
 * Nominatim (OpenStreetMap) reverse geocoding provider.
 * Respects rate limits via RoadResolver cache + inflight dedupe.
 */

import type { RoadProvider } from "./road-resolver";

export class NominatimRoadProvider implements RoadProvider {
  private lastRequestAt = 0;
  private readonly minIntervalMs = 1100;

  async resolve(lat: number, lon: number): Promise<string | null> {
    const wait = this.minIntervalMs - (Date.now() - this.lastRequestAt);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastRequestAt = Date.now();

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}` +
      `&zoom=17&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Kodikz-GISCD-Survey/2.3 (Dubai Municipality Pilot)",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      name?: string;
      display_name?: string;
      address?: {
        road?: string;
        pedestrian?: string;
        residential?: string;
        suburb?: string;
      };
    };
    return (
      data.address?.road ||
      data.address?.pedestrian ||
      data.address?.residential ||
      data.name ||
      data.address?.suburb ||
      data.display_name?.split(",")[0]?.trim() ||
      null
    );
  }
}
