import { NextResponse } from "next/server";
import { geoMetadata, validateAreaGeoJson } from "@/lib/geo/validation";
import { geoRepository, permitRepository } from "@/lib/repositories";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const permit = await permitRepository().findById(id);
  if (!permit) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

  const body = await request.json();
  const geojson = body.geojson ?? body;
  const name = String(body.name ?? "Approved Area").trim();
  const fileName = String(body.fileName ?? "upload.geojson");

  const validated = validateAreaGeoJson(geojson);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const record = await geoRepository().create({
    permitId: permit.id,
    permitNumber: permit.permitNumber,
    type: "area",
    name,
    fileName,
    geometry: validated.geometry,
    featureCollection: validated.featureCollection,
    uploadedBy: "GISCD Operator",
    metadata: geoMetadata(validated.geometry, validated.featureCollection.features.length),
  });

  return NextResponse.json(record, { status: 201 });
}
