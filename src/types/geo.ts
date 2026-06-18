export type GeoUploadType = "route" | "area";

export interface GeoUploadRecord {
  id: string;
  permitId: string;
  permitNumber: string;
  type: GeoUploadType;
  name: string;
  fileName: string;
  geometry: GeoJSON.Geometry;
  featureCollection: GeoJSON.FeatureCollection;
  uploadedAt: string;
  uploadedBy: string;
  metadata: {
    featureCount: number;
    bounds?: [number, number, number, number];
  };
}

export interface GeoLayerState {
  id: string;
  name: string;
  type: GeoUploadType;
  visible: boolean;
  opacity: number;
  permitId: string;
}
