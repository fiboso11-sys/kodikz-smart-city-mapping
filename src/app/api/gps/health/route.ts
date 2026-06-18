import { NextResponse } from "next/server";
import { gpsApiUrl } from "@/lib/config";

export async function GET() {
  const base = gpsApiUrl();
  if (base.includes("localhost:3000") || base.includes("127.0.0.1:3000")) {
    return NextResponse.json({
      status: "local",
      message: "GPS backend not configured — set NEXT_PUBLIC_GPS_API_URL in .env.local",
      configured: false,
    });
  }

  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json(
        { status: "error", message: "GPS backend returned non-JSON response", configured: true },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "GPS backend unreachable",
        configured: true,
      },
      { status: 503 }
    );
  }
}
