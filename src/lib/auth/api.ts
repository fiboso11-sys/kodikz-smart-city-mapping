/**
 * API auth helpers — extract server context from Authorization / cookie.
 */

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAuthProvider } from "./provider";
import { authHas, type AuthContext } from "./context";
import type { Permission } from "./permissions";
import { getAppConfig } from "@/lib/config/app-config";

export interface ApiErrorBody {
  code: string;
  message: string;
  requestId: string;
  details?: unknown;
  validationErrors?: Array<{ field: string; message: string }>;
}

export function createRequestId(): string {
  return `req-${uuidv4()}`;
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  requestId: string,
  extras?: Partial<ApiErrorBody>
) {
  const body: ApiErrorBody = {
    code,
    message,
    requestId,
    ...extras,
  };
  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}

export function jsonOk<T>(data: T, requestId: string, status = 200) {
  return NextResponse.json(
    { ...((typeof data === "object" && data !== null ? data : { data }) as object), requestId },
    { status, headers: { "x-request-id": requestId } }
  );
}

function extractBearer(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (h?.startsWith("Bearer ")) return h.slice(7);
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)kodikz_access=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function resolveAuthContext(request: Request): Promise<AuthContext | null> {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const token = extractBearer(request);
  const cfg = getAppConfig();

  // Local mock bypass only when explicitly enabled
  if (!token && cfg.deploymentMode === "local" && cfg.auth.mockAuthEnabled) {
    const mockRole = (request.headers.get("x-mock-role") ?? "SUPERVISOR") as AuthContext["roles"][number];
    const { buildAuthContext } = await import("./context");
    return buildAuthContext({
      userId: "usr-local-dev",
      tenantId: "dubai-giscd",
      roles: [mockRole],
      sessionId: "ses-local-dev",
      requestId,
      email: "dev@local",
      displayName: "Local Dev",
    });
  }

  if (!token) return null;
  const ctx = await getAuthProvider().verifyAccessToken(token);
  if (!ctx) return null;
  return { ...ctx, requestId };
}

export async function requireAuth(
  request: Request,
  permission?: Permission
): Promise<{ ctx: AuthContext } | { response: NextResponse }> {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const ctx = await resolveAuthContext(request);
  if (!ctx) {
    return { response: jsonError("UNAUTHORIZED", "Authentication required", 401, requestId) };
  }
  const withId = { ...ctx, requestId: ctx.requestId || requestId };
  if (permission && !authHas(withId, permission)) {
    return {
      response: jsonError("FORBIDDEN", "Insufficient permissions", 403, withId.requestId),
    };
  }
  return { ctx: withId };
}

/** Simple in-memory rate limiter (per-process; Redis for multi-instance) */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
