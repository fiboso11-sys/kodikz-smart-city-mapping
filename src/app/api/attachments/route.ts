import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../_survey-helpers";
import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  buildObjectKey,
  getObjectStorage,
  validateUploadFile,
} from "@/lib/storage/object-storage";
import { surveyService } from "@/services/survey";
import { v4 as uuidv4 } from "uuid";
import { getAppConfig } from "@/lib/config/app-config";
import { rateLimit } from "@/lib/auth/api";
import { enqueueOutbox } from "@/services/survey/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ATTACHMENTS_UPLOAD, async (ctx) => {
    const cfg = getAppConfig();
    if (!rateLimit(`upload:${ctx.userId}`, cfg.rateLimit.uploadPerMinute)) {
      return jsonError("RATE_LIMITED", "Upload rate exceeded", 429, ctx.requestId);
    }
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }

    const storageHealth = await getObjectStorage().health();
    if (!storageHealth.ok && cfg.deploymentMode !== "local") {
      return jsonError(
        "STORAGE_UNAVAILABLE",
        "Object storage unavailable — blockage can still be saved without photo",
        503,
        ctx.requestId
      );
    }

    try {
      const form = await request.formData();
      const file = form.get("file");
      const assignmentId = String(form.get("assignmentId") ?? "");
      const vehicleId = String(form.get("vehicleId") ?? "");
      const blockageId = form.get("blockageId") ? String(form.get("blockageId")) : null;
      const latitude = form.get("latitude") ? Number(form.get("latitude")) : null;
      const longitude = form.get("longitude") ? Number(form.get("longitude")) : null;

      if (!assignmentId || !vehicleId || !(file instanceof File)) {
        return jsonError("VALIDATION_ERROR", "file, assignmentId, vehicleId required", 400, ctx.requestId);
      }

      const assignment = surveyService.getAssignment(assignmentId);
      if (!assignment || assignment.tenantId !== ctx.tenantId) {
        return jsonError("FORBIDDEN", "Assignment not in tenant", 403, ctx.requestId);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const validation = validateUploadFile({
        filename: file.name || "photo.jpg",
        contentType: file.type || "image/jpeg",
        size: buffer.length,
        buffer,
      });
      if (!validation.ok) {
        return jsonError(validation.error, "Invalid upload", 400, ctx.requestId);
      }

      const id = `pho-${uuidv4()}`;
      const objectKey = buildObjectKey({
        tenantId: ctx.tenantId,
        assignmentId,
        attachmentId: id,
        safeFilename: validation.safeFilename,
      });

      try {
        await getObjectStorage().upload(objectKey, buffer, file.type || "image/jpeg");
      } catch {
        return jsonError("STORAGE_UNAVAILABLE", "Upload failed — retry later", 503, ctx.requestId);
      }

      const photo = {
        id,
        tenantId: ctx.tenantId,
        assignmentId,
        vehicleId,
        blockageId,
        filename: validation.safeFilename,
        storedPath: objectKey,
        size: buffer.length,
        contentType: file.type || "image/jpeg",
        timestamp: Date.now(),
        latitude,
        longitude,
      };
      surveyService.savePhoto(photo);

      await enqueueOutbox({
        tenantId: ctx.tenantId,
        eventType: "survey_photo_uploaded",
        aggregateType: "photo",
        aggregateId: id,
        payload: {
          photo: {
            ...photo,
            objectKey,
            checksum: validation.checksum,
            uploadedBy: ctx.userId,
          },
        },
      });

      return jsonOk({ photo: { ...photo, objectKey, checksum: validation.checksum } }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Upload failed", 400, ctx.requestId);
    }
  });
}

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ATTACHMENTS_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const key = searchParams.get("key");
    if (id) {
      const photo = surveyService.getPhoto(id);
      if (!photo || photo.tenantId !== ctx.tenantId) {
        return jsonError("NOT_FOUND", "Photo not found", 404, ctx.requestId);
      }
      if (searchParams.get("download") === "1") {
        const buf = await getObjectStorage().download(photo.storedPath);
        if (!buf) return jsonError("NOT_FOUND", "Object missing", 404, ctx.requestId);
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "Content-Type": photo.contentType,
            "x-request-id": ctx.requestId,
          },
        });
      }
      return jsonOk({ photo }, ctx.requestId);
    }
    if (key) {
      if (!key.startsWith(`tenants/${ctx.tenantId}/`)) {
        return jsonError("FORBIDDEN", "Cross-tenant object access denied", 403, ctx.requestId);
      }
      const url = await getObjectStorage().signedUrl(key, 300);
      return jsonOk({ url, expiresIn: 300 }, ctx.requestId);
    }
    return jsonError("VALIDATION_ERROR", "id or key required", 400, ctx.requestId);
  });
}

export async function DELETE(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ATTACHMENTS_UPLOAD, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("VALIDATION_ERROR", "id required", 400, ctx.requestId);
    const photo = surveyService.getPhoto(id);
    if (!photo || photo.tenantId !== ctx.tenantId) {
      return jsonError("NOT_FOUND", "Photo not found", 404, ctx.requestId);
    }
    await getObjectStorage().delete(photo.storedPath);
    surveyService.deletePhoto(id);
    return jsonOk({ ok: true }, ctx.requestId);
  });
}
