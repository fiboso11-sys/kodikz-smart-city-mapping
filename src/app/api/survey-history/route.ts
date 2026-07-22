import { surveyService } from "@/services/survey";
import { withSurveyAuth, jsonOk, resolveTenantId } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const tenantId = resolveTenantId(ctx, searchParams.get("tenantId"));
    const vehicleId = searchParams.get("vehicleId");
    let assignments = surveyService.listAssignments(tenantId);
    if (vehicleId) {
      if (
        ctx.roles.includes("DRIVER") &&
        ctx.vehicleIds?.length &&
        !ctx.vehicleIds.includes(vehicleId)
      ) {
        return jsonOk({ history: [], count: 0 }, ctx.requestId);
      }
      assignments = assignments.filter((a) => a.vehicleId === vehicleId);
    }
    const history = assignments.filter(
      (a) => a.status === "COMPLETED" || a.status === "CANCELLED"
    );
    return jsonOk({ history, count: history.length }, ctx.requestId);
  });
}
