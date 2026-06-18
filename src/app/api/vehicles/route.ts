import { NextResponse } from "next/server";
import { vehicleRepository } from "@/lib/repositories";
import type { CreateVehicleInput } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const vehicles = await vehicleRepository().findAll();
  return NextResponse.json({ vehicles, count: vehicles.length });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateVehicleInput;
    if (!body.imei?.trim() || !body.plateNumber?.trim()) {
      return NextResponse.json({ error: "IMEI and plate number required" }, { status: 400 });
    }
    const existing = await vehicleRepository().findByImei(body.imei.trim());
    if (existing) {
      return NextResponse.json({ error: "IMEI already registered" }, { status: 409 });
    }
    const vehicle = await vehicleRepository().create(body);
    return NextResponse.json(vehicle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
