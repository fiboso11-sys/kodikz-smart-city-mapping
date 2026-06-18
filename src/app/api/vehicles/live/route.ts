import { NextResponse } from "next/server";
import { mergeLivePositions } from "@/services/api/vehicle-service";
import { fetchLiveFromGpsBackend } from "@/services/api/gps-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveRows = await fetchLiveFromGpsBackend();
    const liveMap = new Map(liveRows.map((r) => [r.imei, r]));
    const vehicles = await mergeLivePositions(liveMap);
    return NextResponse.json({ vehicles, count: vehicles.length, source: "gps" });
  } catch {
    const vehicles = await mergeLivePositions(new Map());
    return NextResponse.json({
      vehicles,
      count: vehicles.length,
      source: "master",
      warning: "GPS backend unavailable — showing master data only",
    });
  }
}
