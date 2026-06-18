import { NextResponse } from "next/server";
import { permitRepository } from "@/lib/repositories";
import type { CreatePermitInput } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const permits = await permitRepository().findAll();
  return NextResponse.json({ permits, count: permits.length });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePermitInput;
    if (!body.permitNumber?.trim() || !body.projectName?.trim()) {
      return NextResponse.json({ error: "Permit number and project name required" }, { status: 400 });
    }
    const permit = await permitRepository().create(body);
    return NextResponse.json(permit, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
