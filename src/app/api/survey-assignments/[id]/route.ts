import { surveyService } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_VIEW, async (ctx) => {
    const { id } = await context.params;
    const assignment = surveyService.getAssignment(id);
    if (!assignment) return jsonError("NOT_FOUND", "Assignment not found", 404, ctx.requestId);
    if (assignment.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
      return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
    }
    if (
      ctx.roles.includes("DRIVER") &&
      ctx.vehicleIds?.length &&
      !ctx.vehicleIds.includes(assignment.vehicleId)
    ) {
      return jsonError("FORBIDDEN", "Not your vehicle", 403, ctx.requestId);
    }
    return jsonOk({ assignment }, ctx.requestId);
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withSurveyAuth(request, PERMISSIONS.ASSIGNMENTS_APPROVE, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    const { id } = await context.params;
    try {
      const body = (await request.json()) as { action?: string };
      const existing = surveyService.getAssignment(id);
      if (!existing) return jsonError("NOT_FOUND", "Assignment not found", 404, ctx.requestId);
      if (existing.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
        return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
      }
      if (body.action === "approve") {
        const assignment = surveyService.approveAssignment(id, ctx.userId);
        if (!assignment) return jsonError("INVALID_TRANSITION", "Cannot approve", 409, ctx.requestId);
        return jsonOk({ assignment }, ctx.requestId);
      }
      return jsonError("VALIDATION_ERROR", "Unsupported action", 400, ctx.requestId);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
