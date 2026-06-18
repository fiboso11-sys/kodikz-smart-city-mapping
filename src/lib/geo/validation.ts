export type GeoValidationResult =
  | { ok: true; geometry: GeoJSON.Geometry; featureCollection: GeoJSON.FeatureCollection }
  | { ok: false; error: string };

const ROUTE_TYPES = new Set(["LineString", "MultiLineString"]);
const AREA_TYPES = new Set(["Polygon", "MultiPolygon"]);

function boundsFromCoords(coords: number[][]): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  return [minLng, minLat, maxLng, maxLat];
}

function flattenCoords(geometry: GeoJSON.Geometry): number[][] {
  if (geometry.type === "LineString") return geometry.coordinates as number[][];
  if (geometry.type === "MultiLineString")
    return (geometry.coordinates as number[][][]).flat();
  if (geometry.type === "Polygon")
    return (geometry.coordinates as number[][][]).flat();
  if (geometry.type === "MultiPolygon")
    return (geometry.coordinates as number[][][][]).flat(2);
  return [];
}

export function parseGeoJsonInput(raw: unknown): GeoValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid JSON payload" };
  }

  let fc: GeoJSON.FeatureCollection;

  if ((raw as GeoJSON.FeatureCollection).type === "FeatureCollection") {
    fc = raw as GeoJSON.FeatureCollection;
  } else if ((raw as GeoJSON.Feature).type === "Feature") {
    fc = { type: "FeatureCollection", features: [raw as GeoJSON.Feature] };
  } else if ((raw as GeoJSON.Geometry).type) {
    fc = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: raw as GeoJSON.Geometry }],
    };
  } else {
    return { ok: false, error: "Expected FeatureCollection, Feature, or Geometry" };
  }

  if (!fc.features?.length) {
    return { ok: false, error: "GeoJSON contains no features" };
  }

  const geometry = fc.features[0].geometry;
  if (!geometry) return { ok: false, error: "Feature has no geometry" };

  return { ok: true, geometry, featureCollection: fc };
}

export function validateRouteGeoJson(raw: unknown): GeoValidationResult {
  const parsed = parseGeoJsonInput(raw);
  if (!parsed.ok) return parsed;
  if (!ROUTE_TYPES.has(parsed.geometry.type)) {
    return {
      ok: false,
      error: `Route must be LineString or MultiLineString (got ${parsed.geometry.type})`,
    };
  }
  return parsed;
}

export function validateAreaGeoJson(raw: unknown): GeoValidationResult {
  const parsed = parseGeoJsonInput(raw);
  if (!parsed.ok) return parsed;
  if (!AREA_TYPES.has(parsed.geometry.type)) {
    return {
      ok: false,
      error: `Area must be Polygon or MultiPolygon (got ${parsed.geometry.type})`,
    };
  }
  return parsed;
}

export function geoMetadata(geometry: GeoJSON.Geometry, featureCount: number) {
  const coords = flattenCoords(geometry);
  return {
    featureCount,
    bounds: coords.length ? boundsFromCoords(coords) : undefined,
  };
}
