import { NextResponse } from "next/server";
import { permitRepository } from "@/lib/repositories";
import type { UpdatePermitInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const permit = await permitRepository().findById(id);
  if (!permit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(permit);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as UpdatePermitInput;
  const updated = await permitRepository().update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const ok = await permitRepository().delete(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
