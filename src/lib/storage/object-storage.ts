/**
 * S3-compatible object storage abstraction.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { getAppConfig } from "@/lib/config/app-config";

export interface StorageObjectMeta {
  key: string;
  size: number;
  contentType: string;
  checksum?: string;
}

export interface ObjectStorageProvider {
  upload(key: string, body: Buffer, contentType: string): Promise<StorageObjectMeta>;
  download(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  signedUrl(key: string, expiresSeconds?: number): Promise<string>;
  health(): Promise<{ ok: boolean; error?: string }>;
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function validateUploadFile(opts: {
  filename: string;
  contentType: string;
  size: number;
  buffer: Buffer;
}): { ok: true; safeFilename: string; checksum: string } | { ok: false; error: string } {
  const cfg = getAppConfig();
  if (opts.size <= 0 || opts.size > cfg.storage.maxUploadBytes) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }
  if (!ALLOWED_MIME.has(opts.contentType)) {
    return { ok: false, error: "MIME_NOT_ALLOWED" };
  }
  const base = path.basename(opts.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!base || base.includes("..")) {
    return { ok: false, error: "UNSAFE_FILENAME" };
  }
  // Magic-byte sniff (JPEG/PNG/WEBP)
  const sig = opts.buffer.subarray(0, 12);
  const isJpeg = sig[0] === 0xff && sig[1] === 0xd8;
  const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
  const isWebp = sig.toString("ascii", 0, 4) === "RIFF" && sig.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp && !opts.contentType.includes("heic") && !opts.contentType.includes("heif")) {
    return { ok: false, error: "INVALID_FILE_SIGNATURE" };
  }
  const checksum = createHash("sha256").update(opts.buffer).digest("hex");
  return { ok: true, safeFilename: base, checksum };
}

export class LocalDevStorageProvider implements ObjectStorageProvider {
  private root: string;
  constructor(root = path.join(process.cwd(), "data", "object-storage")) {
    this.root = root;
    if (!fs.existsSync(this.root)) fs.mkdirSync(this.root, { recursive: true });
  }
  private abs(key: string) {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.root, safe);
  }
  async upload(key: string, body: Buffer, contentType: string): Promise<StorageObjectMeta> {
    const abs = this.abs(key);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
    return { key, size: body.length, contentType, checksum: createHash("sha256").update(body).digest("hex") };
  }
  async download(key: string): Promise<Buffer | null> {
    const abs = this.abs(key);
    if (!fs.existsSync(abs)) return null;
    return fs.readFileSync(abs);
  }
  async delete(key: string): Promise<void> {
    const abs = this.abs(key);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
  async exists(key: string): Promise<boolean> {
    return fs.existsSync(this.abs(key));
  }
  async signedUrl(key: string): Promise<string> {
    return `/api/attachments/download?key=${encodeURIComponent(key)}`;
  }
  async health() {
    return { ok: true };
  }
}

export class S3StorageProvider implements ObjectStorageProvider {
  private client: S3Client;
  private bucket: string;
  constructor() {
    const cfg = getAppConfig().storage;
    this.bucket = cfg.bucket;
    this.client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials:
        cfg.accessKeyId && cfg.secretAccessKey
          ? { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
          : undefined,
    });
  }
  async upload(key: string, body: Buffer, contentType: string): Promise<StorageObjectMeta> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return {
      key,
      size: body.length,
      contentType,
      checksum: createHash("sha256").update(body).digest("hex"),
    };
  }
  async download(key: string): Promise<Buffer | null> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }
  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
  async signedUrl(key: string, expiresSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresSeconds }
    );
  }
  async health() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "s3_unhealthy" };
    }
  }
}

export class DisabledStorageProvider implements ObjectStorageProvider {
  async upload(): Promise<StorageObjectMeta> {
    throw new Error("STORAGE_UNAVAILABLE");
  }
  async download(): Promise<Buffer | null> {
    return null;
  }
  async delete(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async signedUrl(): Promise<string> {
    throw new Error("STORAGE_UNAVAILABLE");
  }
  async health() {
    return { ok: false, error: "disabled" };
  }
}

let storage: ObjectStorageProvider | null = null;

export function getObjectStorage(): ObjectStorageProvider {
  if (storage) return storage;
  const provider = getAppConfig().storage.provider;
  if (provider === "s3") storage = new S3StorageProvider();
  else if (provider === "disabled") storage = new DisabledStorageProvider();
  else storage = new LocalDevStorageProvider();
  return storage;
}

export function buildObjectKey(opts: {
  tenantId: string;
  assignmentId: string;
  attachmentId: string;
  safeFilename: string;
}): string {
  return `tenants/${opts.tenantId}/assignments/${opts.assignmentId}/${opts.attachmentId}-${opts.safeFilename}`;
}

export function resetObjectStorageForTests(): void {
  storage = null;
}
