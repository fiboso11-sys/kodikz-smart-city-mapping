/**
 * Photo attachment storage under data/survey-photos.
 */

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { surveyRepository } from "@/lib/repositories/survey/survey-repository";
import { surveyService } from "@/services/survey";
import type { SurveyPhotoMeta } from "@/services/survey";

const PHOTO_DIR = path.join(process.cwd(), "data", "survey-photos");

function ensureDir() {
  if (!fs.existsSync(PHOTO_DIR)) {
    fs.mkdirSync(PHOTO_DIR, { recursive: true });
  }
}

export async function storeSurveyPhoto(opts: {
  tenantId: string;
  assignmentId: string;
  vehicleId: string;
  blockageId?: string | null;
  filename: string;
  contentType: string;
  buffer: Buffer;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<SurveyPhotoMeta> {
  ensureDir();
  const id = `pho-${uuidv4()}`;
  const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${id}-${safeName}`;
  const storedPath = path.join(PHOTO_DIR, storedName);
  fs.writeFileSync(storedPath, opts.buffer);

  const meta: SurveyPhotoMeta = {
    id,
    tenantId: opts.tenantId,
    assignmentId: opts.assignmentId,
    vehicleId: opts.vehicleId,
    blockageId: opts.blockageId ?? null,
    filename: opts.filename,
    storedPath: storedName,
    size: opts.buffer.length,
    contentType: opts.contentType,
    timestamp: Date.now(),
    latitude: opts.latitude ?? null,
    longitude: opts.longitude ?? null,
  };
  surveyService.savePhoto(meta);
  return meta;
}

export function resolvePhotoAbsolutePath(storedPath: string): string {
  return path.join(PHOTO_DIR, path.basename(storedPath));
}

export function readPhotoBuffer(meta: SurveyPhotoMeta): Buffer | null {
  const abs = resolvePhotoAbsolutePath(meta.storedPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs);
}

export function deleteSurveyPhotoFile(id: string): boolean {
  const meta = surveyRepository.getPhoto(id);
  if (!meta) return false;
  const abs = resolvePhotoAbsolutePath(meta.storedPath);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
  surveyService.deletePhoto(id);
  return true;
}
