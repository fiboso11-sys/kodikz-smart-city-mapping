import { surveyService } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Timeline is built entirely from audit log entries. */
export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.AUDIT_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId") ?? undefined;
    if (assignmentId) {
      const a = surveyService.getAssignment(assignmentId);
      if (a && a.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
        return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
      }
    }
    const audit = surveyService.listAudit(assignmentId).filter(
      (e) => e.tenantId === ctx.tenantId || ctx.roles.includes("SUPER_ADMIN")
    );
    const timeline = audit.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      actor: e.actor,
      action: e.action,
      assignmentId: e.assignmentId,
      vehicleId: e.vehicleId,
      payload: e.payload,
    }));
    return jsonOk({ timeline, count: timeline.length }, ctx.requestId);
  });
}
