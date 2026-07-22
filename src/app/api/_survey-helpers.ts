/**
 * Hardened survey API helpers with auth + standardized errors.
 * Backward-compatible wrappers keep Phase 2.3 routes compiling during migration.
 */

import { NextResponse } from "next/server";
import {
  requireAuth,
  jsonError as authJsonError,
  jsonOk as authJsonOk,
  createRequestId,
  rateLimit,
} from "@/lib/auth/api";
import type { Permission } from "@/lib/auth/permissions";
import type { AuthContext } from "@/lib/auth/context";
import { getAppConfig } from "@/lib/config/app-config";
import { assertSameTenant } from "@/lib/auth/context";

export const surveyApiRuntime = {
  runtime: "nodejs" as const,
  dynamic: "force-dynamic" as const,
};

export { createRequestId, rateLimit };

/** @deprecated Prefer resolveTenantId(ctx) — never trust browser alone in pilot/municipality */
export function requireTenant(searchParams: URLSearchParams, bodyTenant?: string): string {
  return bodyTenant || searchParams.get("tenantId") || "dubai-giscd";
}

export function jsonOk<T>(data: T, requestIdOrStatus?: string | number, status = 200) {
  if (typeof requestIdOrStatus === "string") {
    return authJsonOk(data, requestIdOrStatus, status);
  }
  const st = typeof requestIdOrStatus === "number" ? requestIdOrStatus : 200;
  return NextResponse.json(data, { status: st });
}

export function jsonError(
  codeOrMessage: string,
  messageOrStatus?: string | number,
  statusOrRequestId?: number | string,
  requestId?: string,
  extras?: Parameters<typeof authJsonError>[4]
) {
  // New: jsonError(code, message, status, requestId)
  if (typeof messageOrStatus === "string" && typeof statusOrRequestId === "number" && requestId) {
    return authJsonError(codeOrMessage, messageOrStatus, statusOrRequestId, requestId, extras);
  }
  // Legacy: jsonError(message, status?)
  const message = codeOrMessage;
  const status = typeof messageOrStatus === "number" ? messageOrStatus : 400;
  return NextResponse.json({ error: message, code: "ERROR", requestId: createRequestId() }, { status });
}

export async function withSurveyAuth(
  request: Request,
  permission: Permission | undefined,
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await requireAuth(request, permission);
  if ("response" in auth) return auth.response;
  try {
    return await handler(auth.ctx);
  } catch (err) {
    const requestId = auth.ctx.requestId;
    const code = (err as { code?: string }).code;
    if (code === "FORBIDDEN" || (err instanceof Error && err.message === "TENANT_ISOLATION_VIOLATION")) {
      return authJsonError("FORBIDDEN", "Access denied", 403, requestId);
    }
    if (code === "INVALID_TRANSITION") {
      return authJsonError(
        "INVALID_TRANSITION",
        err instanceof Error ? err.message : "Invalid transition",
        409,
        requestId
      );
    }
    if (code === "CONCURRENCY_CONFLICT") {
      return authJsonError("CONCURRENCY_CONFLICT", "Conflict — refresh and retry", 409, requestId);
    }
    console.error(JSON.stringify({ level: "error", requestId, error: err instanceof Error ? err.message : "error" }));
    return authJsonError("INTERNAL_ERROR", "Unexpected server error", 500, requestId);
  }
}

export function resolveTenantId(ctx: AuthContext, claimed?: string | null): string {
  if (claimed && claimed !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
    assertSameTenant(ctx, claimed);
  }
  return ctx.tenantId;
}

export function mutationRateOk(ctx: AuthContext): boolean {
  const limit = getAppConfig().rateLimit.mutationPerMinute;
  return rateLimit(`mut:${ctx.userId}`, limit);
}
