import { surveyService } from "@/services/survey";
import type { SurveyProgressRecord } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_VIEW, async (ctx) => {
    const progress = surveyService
      .listProgress()
      .filter((p) => p.tenantId === ctx.tenantId || ctx.roles.includes("SUPER_ADMIN"));
    return jsonOk({ progress, count: progress.length }, ctx.requestId);
  });
}

export async function POST(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_CONTROL, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    try {
      const body = (await request.json()) as SurveyProgressRecord;
      if (!body.assignmentId || !body.vehicleId) {
        return jsonError("VALIDATION_ERROR", "Invalid progress payload", 400, ctx.requestId);
      }
      body.tenantId = ctx.tenantId;
      surveyService.saveProgress({
        ...body,
        updatedAt: body.updatedAt ?? Date.now(),
      });
      return jsonOk({ ok: true }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
