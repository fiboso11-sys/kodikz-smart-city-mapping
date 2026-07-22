import { surveyService } from "@/services/survey";
import type { SurveyDecision } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId") ?? undefined;
    const assignmentId = searchParams.get("assignmentId") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "50");

    if (
      vehicleId &&
      ctx.roles.includes("DRIVER") &&
      ctx.vehicleIds?.length &&
      !ctx.vehicleIds.includes(vehicleId)
    ) {
      return jsonError("FORBIDDEN", "Not your vehicle", 403, ctx.requestId);
    }

    let decisions = surveyService.listDecisions({ vehicleId, assignmentId, limit });
    decisions = decisions.filter(
      (d) => d.tenantId === ctx.tenantId || ctx.roles.includes("SUPER_ADMIN")
    );
    return jsonOk({ decisions, count: decisions.length }, ctx.requestId);
  });
}

export async function POST(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_CONTROL, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    try {
      const decision = (await request.json()) as SurveyDecision;
      if (!decision?.id || !decision.assignmentId || !decision.vehicleId) {
        return jsonError("VALIDATION_ERROR", "Invalid decision payload", 400, ctx.requestId);
      }
      if (decision.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
        return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
      }
      // SGE remains decision source — API only persists
      surveyService.saveDecision({ ...decision, tenantId: ctx.tenantId });
      return jsonOk({ ok: true }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
