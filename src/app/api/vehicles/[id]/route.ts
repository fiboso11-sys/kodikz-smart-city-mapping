import { NextResponse } from "next/server";
import { vehicleRepository } from "@/lib/repositories";
import type { UpdateVehicleInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const vehicle = await vehicleRepository().findById(id);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as UpdateVehicleInput;
  const updated = await vehicleRepository().update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const ok = await vehicleRepository().delete(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
