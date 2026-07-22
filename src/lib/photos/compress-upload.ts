/**
 * Client-side photo compression + upload helpers.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.72
): Promise<{ blob: Blob; filename: string; contentType: string }> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap === "undefined") {
    return { blob: file, filename: file.name, contentType: file.type || "image/jpeg" };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { blob: file, filename: file.name, contentType: file.type };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("compress failed"))),
      "image/jpeg",
      quality
    );
  });

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return { blob, filename: `${base}.jpg`, contentType: "image/jpeg" };
}

export async function uploadSurveyPhoto(opts: {
  file: File;
  tenantId: string;
  assignmentId: string;
  vehicleId: string;
  blockageId?: string;
  latitude?: number;
  longitude?: number;
  retries?: number;
}) {
  const { surveyApi } = await import("@/services/survey/client-api");
  const compressed = await compressImageFile(opts.file);
  const retries = opts.retries ?? 3;
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await surveyApi.uploadPhoto({
        file: compressed.blob,
        filename: compressed.filename,
        tenantId: opts.tenantId,
        assignmentId: opts.assignmentId,
        vehicleId: opts.vehicleId,
        blockageId: opts.blockageId,
        latitude: opts.latitude,
        longitude: opts.longitude,
      });
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("upload failed");
}
