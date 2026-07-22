import { surveyService } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, resolveTenantId, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { CreateAssignmentInput } from "@/platform/sge";
import { enqueueOutbox } from "@/services/survey/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.SURVEYS_VIEW, async (ctx) => {
    const { searchParams } = new URL(request.url);
    const tenantId = resolveTenantId(ctx, searchParams.get("tenantId"));
    const vehicleId = searchParams.get("vehicleId");
    let assignments = surveyService.listAssignments(tenantId);
    if (ctx.roles.includes("DRIVER") && ctx.vehicleIds?.length) {
      assignments = assignments.filter((a) => ctx.vehicleIds!.includes(a.vehicleId));
    }
    if (vehicleId) {
      if (ctx.roles.includes("DRIVER") && ctx.vehicleIds?.length && !ctx.vehicleIds.includes(vehicleId)) {
        return jsonError("FORBIDDEN", "Vehicle not assigned to driver", 403, ctx.requestId);
      }
      assignments = assignments.filter((a) => a.vehicleId === vehicleId);
    }
    return jsonOk({ assignments, count: assignments.length }, ctx.requestId);
  });
}

export async function POST(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.ASSIGNMENTS_CREATE, async (ctx) => {
    if (!mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
    }
    try {
      const body = (await request.json()) as CreateAssignmentInput & {
        autoStart?: boolean;
        idempotencyKey?: string;
      };
      const tenantId = resolveTenantId(ctx, body.tenantId);
      body.tenantId = tenantId;
      body.createdBy = ctx.userId;
      if (!body.vehicleId || !body.routeId || !body.routeName || !body.geometry) {
        return jsonError("VALIDATION_ERROR", "vehicleId, routeId, routeName, geometry required", 400, ctx.requestId, {
          validationErrors: [{ field: "geometry", message: "required" }],
        });
      }

      let assignment = surveyService.createAssignment(body);
      assignment = surveyService.approveAssignment(assignment.id, ctx.userId) ?? assignment;
      if (body.autoStart !== false) {
        assignment = surveyService.startAssignment(assignment.id, ctx.userId) ?? assignment;
      }

      await enqueueOutbox({
        tenantId,
        eventType: "survey_assignment_created",
        aggregateType: "assignment",
        aggregateId: assignment.id,
        payload: { assignment },
      });

      return jsonOk({ assignment }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
