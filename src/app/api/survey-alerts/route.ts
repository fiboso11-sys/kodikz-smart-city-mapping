import { surveyService } from "@/services/survey";
import type { SupervisorAlert } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, resolveTenantId, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ALERTS_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const tenantId = resolveTenantId(ctx, searchParams.get("tenantId"));
    const alerts = surveyService.listAlerts(tenantId);
    return jsonOk({ alerts, count: alerts.length }, ctx.requestId);
  });
}

export async function POST(request: Request) {
  return withSurveyAuth(request, undefined, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    try {
      const body = (await request.json()) as
        | SupervisorAlert
        | { action: "acknowledge"; id: string; by?: string };

      if ("action" in body && body.action === "acknowledge") {
        if (!ctx.permissions.includes(PERMISSIONS.ALERTS_ACKNOWLEDGE)) {
          return jsonError("FORBIDDEN", "Insufficient permissions", 403, ctx.requestId);
        }
        const alert = surveyService.acknowledgeAlert(body.id, body.by ?? ctx.userId);
        if (!alert) return jsonError("NOT_FOUND", "Alert not found", 404, ctx.requestId);
        if (alert.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
          return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
        }
        return jsonOk({ alert }, ctx.requestId);
      }

      if (!ctx.permissions.includes(PERMISSIONS.SURVEYS_CONTROL)) {
        return jsonError("FORBIDDEN", "Insufficient permissions", 403, ctx.requestId);
      }
      const alert = body as SupervisorAlert;
      if (!alert.id) return jsonError("VALIDATION_ERROR", "Invalid alert", 400, ctx.requestId);
      alert.tenantId = ctx.tenantId;
      surveyService.saveAlert(alert);
      return jsonOk({ alert }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
