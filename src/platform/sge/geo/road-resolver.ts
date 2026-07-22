/**
 * Reverse Geocoding — provider abstraction + intelligent cache.
 * Never reverse-geocode every GPS point.
 */

import { haversineDistance } from "@/engines/sge";
import { loadJson, saveJson, SGE_STORAGE_KEYS } from "../persistence/storage";

export interface RoadResolveResult {
  roadName: string;
  source: "cache" | "provider" | "fallback";
  latitude: number;
  longitude: number;
  resolvedAt: number;
}

export interface RoadProvider {
  resolve(lat: number, lon: number): Promise<string | null>;
}

/** Fallback provider — no network; returns approximate Dubai grid label */
export class PlaceholderRoadProvider implements RoadProvider {
  async resolve(lat: number, lon: number): Promise<string | null> {
    return `Road near ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

interface CacheEntry {
  lat: number;
  lon: number;
  roadName: string;
  resolvedAt: number;
}

const CACHE_RADIUS_M = 40;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE = 500;

export class RoadResolver {
  private cache: CacheEntry[] = [];
  private provider: RoadProvider;
  private inflight = new Map<string, Promise<RoadResolveResult>>();

  constructor(provider: RoadProvider = new PlaceholderRoadProvider()) {
    this.provider = provider;
    this.cache = loadJson<CacheEntry[]>(SGE_STORAGE_KEYS.roadCache, []);
  }

  setProvider(provider: RoadProvider): void {
    this.provider = provider;
  }

  async resolve(lat: number, lon: number): Promise<RoadResolveResult> {
    const cached = this.findCache(lat, lon);
    if (cached) {
      return {
        roadName: cached.roadName,
        source: "cache",
        latitude: lat,
        longitude: lon,
        resolvedAt: cached.resolvedAt,
      };
    }

    const key = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = this.resolveFresh(lat, lon);
    this.inflight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }

  /** Sync peek — returns cached road or null without network */
  peek(lat: number, lon: number): string | null {
    return this.findCache(lat, lon)?.roadName ?? null;
  }

  private async resolveFresh(lat: number, lon: number): Promise<RoadResolveResult> {
    try {
      const name = await this.provider.resolve(lat, lon);
      const roadName = name ?? `Unnamed (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      this.putCache(lat, lon, roadName);
      return {
        roadName,
        source: name ? "provider" : "fallback",
        latitude: lat,
        longitude: lon,
        resolvedAt: Date.now(),
      };
    } catch {
      const roadName = `Road near ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      this.putCache(lat, lon, roadName);
      return {
        roadName,
        source: "fallback",
        latitude: lat,
        longitude: lon,
        resolvedAt: Date.now(),
      };
    }
  }

  private findCache(lat: number, lon: number): CacheEntry | undefined {
    const now = Date.now();
    return this.cache.find(
      (e) =>
        now - e.resolvedAt < CACHE_TTL_MS &&
        haversineDistance(lat, lon, e.lat, e.lon) <= CACHE_RADIUS_M
    );
  }

  private putCache(lat: number, lon: number, roadName: string): void {
    this.cache.push({ lat, lon, roadName, resolvedAt: Date.now() });
    if (this.cache.length > MAX_CACHE) {
      this.cache = this.cache.slice(-MAX_CACHE);
    }
    saveJson(SGE_STORAGE_KEYS.roadCache, this.cache);
  }
}

export const roadResolver = new RoadResolver();
