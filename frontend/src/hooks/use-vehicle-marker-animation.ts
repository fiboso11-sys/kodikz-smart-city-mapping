"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Marker } from "maplibre-gl";
import { TELTONIKA_POLL_MS } from "@/providers/teltonika-provider";
import { VehiclePositionInterpolator } from "@/lib/gps-interpolation";
import type { Vehicle } from "@/types";

/**
 * Smoothly moves map markers between GPS fixes (no jump on each poll).
 * Does not change layout — only updates Marker lng/lat via rAF.
 */
export function useVehicleMarkerAnimation(
  enabled: boolean,
  vehicles: Vehicle[],
  markersRef: RefObject<Map<string, Marker>>
) {
  const interpolatorRef = useRef(new VehiclePositionInterpolator());
  const vehiclesRef = useRef(vehicles);

  vehiclesRef.current = vehicles;

  useEffect(() => {
    if (!enabled) return;

    const interpolator = interpolatorRef.current;

    for (const v of vehicles) {
      interpolator.setTarget(
        v.id,
        { latitude: v.latitude, longitude: v.longitude, heading: v.heading },
        TELTONIKA_POLL_MS
      );
    }

    interpolator.prune(new Set(vehicles.map((v) => v.id)));
  }, [enabled, vehicles]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    const frame = () => {
      const markers = markersRef.current;
      const fleet = vehiclesRef.current;
      if (markers) {
        const interpolator = interpolatorRef.current;
        const now = performance.now();

        for (const v of fleet) {
          const marker = markers.get(v.id);
          if (!marker) continue;

          const pos =
            interpolator.sample(v.id, now) ?? {
              latitude: v.latitude,
              longitude: v.longitude,
              heading: v.heading,
            };

          marker.setLngLat([pos.longitude, pos.latitude]);
          const el = marker.getElement();
          if (el) el.style.transform = `rotate(${pos.heading}deg)`;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled, markersRef]);
}
