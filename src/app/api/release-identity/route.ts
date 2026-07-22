import { NextResponse } from "next/server";
import { releaseIdentityPublicJson, getReleaseIdentity } from "@/lib/release-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe public release identity — no secrets. */
export async function GET() {
  const id = getReleaseIdentity();
  return NextResponse.json({
    ...releaseIdentityPublicJson(),
    uptimeSeconds: id.uptimeSeconds,
    timestamp: new Date().toISOString(),
  });
}
