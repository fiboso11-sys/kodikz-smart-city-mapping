import { surveyService } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, resolveTenantId, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ALERTS_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const tenantId = resolveTenantId(ctx, searchParams.get("tenantId"));
    const notifications = surveyService.listNotifications(tenantId);
    return jsonOk({ notifications, count: notifications.length }, ctx.requestId);
  });
}

export async function PATCH(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ALERTS_VIEW, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    try {
      const body = (await request.json()) as { id: string; action: "read" | "ack" };
      if (!body.id) return jsonError("VALIDATION_ERROR", "id required", 400, ctx.requestId);
      if (body.action === "read") {
        const n = surveyService.markNotificationRead(body.id);
        if (!n) return jsonError("NOT_FOUND", "Not found", 404, ctx.requestId);
        if (n.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
          return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
        }
        return jsonOk({ notification: n }, ctx.requestId);
      }
      return jsonError("VALIDATION_ERROR", "Unsupported action", 400, ctx.requestId);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
