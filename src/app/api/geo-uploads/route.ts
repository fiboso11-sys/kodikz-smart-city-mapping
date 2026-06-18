import { NextResponse } from "next/server";
import { geoRepository } from "@/lib/repositories";

export async function GET() {
  const uploads = await geoRepository().findAll();
  return NextResponse.json({ uploads, count: uploads.length });
}
