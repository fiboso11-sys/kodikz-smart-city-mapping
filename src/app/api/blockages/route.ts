import { surveyService } from "@/services/survey";
import type { SurveyBlockageRecord } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.BLOCKAGES_VIEW, async (ctx) => {
    const blockages = surveyService
      .listBlockages()
      .filter((b) => b.tenantId === ctx.tenantId || ctx.roles.includes("SUPER_ADMIN"));
    return jsonOk({ blockages, count: blockages.length }, ctx.requestId);
  });
}

export async function POST(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.BLOCKAGES_CREATE, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    try {
      const body = (await request.json()) as SurveyBlockageRecord;
      if (!body.id || !body.assignmentId || !body.vehicleId) {
        return jsonError("VALIDATION_ERROR", "Invalid blockage payload", 400, ctx.requestId);
      }
      body.tenantId = ctx.tenantId;
      if (!body.photoIds) body.photoIds = [];

      const assignment = surveyService.getAssignment(body.assignmentId);
      if (!assignment || assignment.tenantId !== ctx.tenantId) {
        return jsonError("FORBIDDEN", "Assignment not in tenant", 403, ctx.requestId);
      }
      if (
        ctx.roles.includes("DRIVER") &&
        ctx.vehicleIds?.length &&
        !ctx.vehicleIds.includes(body.vehicleId)
      ) {
        return jsonError("FORBIDDEN", "Not your vehicle", 403, ctx.requestId);
      }

      surveyService.saveBlockage(body);
      return jsonOk({ blockage: body }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
