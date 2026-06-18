import { NextResponse } from "next/server";
import { fetchHistoryFromGpsBackend } from "@/services/api/gps-client";

type Params = { params: Promise<{ imei: string }> };

export async function GET(request: Request, { params }: Params) {
  const { imei } = await params;
  const limit = Number(new URL(request.url).searchParams.get("limit") || 50);

  try {
    const points = await fetchHistoryFromGpsBackend(imei, limit);
    return NextResponse.json({ imei, points, count: points.length });
  } catch {
    return NextResponse.json({ imei, points: [], count: 0 });
  }
}
