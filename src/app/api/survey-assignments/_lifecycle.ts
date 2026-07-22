import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { surveyService } from "@/services/survey";
import { enqueueOutbox } from "@/services/survey/outbox";
import type { Permission } from "@/lib/auth/permissions";
import type { AuthContext } from "@/lib/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "start" | "pause" | "resume" | "complete" | "cancel";

const ACTION_PERM: Record<Action, Permission> = {
  start: PERMISSIONS.ASSIGNMENTS_START,
  pause: PERMISSIONS.ASSIGNMENTS_PAUSE,
  resume: PERMISSIONS.ASSIGNMENTS_RESUME,
  complete: PERMISSIONS.ASSIGNMENTS_COMPLETE,
  cancel: PERMISSIONS.ASSIGNMENTS_CANCEL,
};

function makeHandler(action: Action) {
  return async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    return withSurveyAuth(request, ACTION_PERM[action], async (ctx: AuthContext) => {
      if (!mutationRateOk(ctx)) {
        return jsonError("RATE_LIMITED", "Too many requests", 429, ctx.requestId);
      }
      const { id } = await context.params;
      const existing = surveyService.getAssignment(id);
      if (!existing) return jsonError("NOT_FOUND", "Assignment not found", 404, ctx.requestId);
      if (existing.tenantId !== ctx.tenantId && !ctx.roles.includes("SUPER_ADMIN")) {
        return jsonError("FORBIDDEN", "Tenant isolation", 403, ctx.requestId);
      }
      if (ctx.roles.includes("DRIVER") && ctx.vehicleIds?.length && !ctx.vehicleIds.includes(existing.vehicleId)) {
        return jsonError("FORBIDDEN", "Not your vehicle", 403, ctx.requestId);
      }

      try {
        await request.json();
      } catch {
        /* optional */
      }

      const fn = {
        start: () => surveyService.startAssignment(id, ctx.userId),
        pause: () => surveyService.pauseAssignment(id, ctx.userId),
        resume: () => surveyService.resumeAssignment(id, ctx.userId),
        complete: () => surveyService.completeAssignment(id, ctx.userId),
        cancel: () => surveyService.cancelAssignment(id, ctx.userId),
      }[action];

      const assignment = fn();
      if (!assignment) {
        return jsonError("INVALID_TRANSITION", `Cannot ${action} assignment`, 409, ctx.requestId);
      }

      const eventType =
        action === "start"
          ? "survey_started"
          : action === "pause"
            ? "survey_paused"
            : action === "resume"
              ? "survey_resumed"
              : action === "complete"
                ? "survey_completed"
                : "survey_assignment_updated";

      await enqueueOutbox({
        tenantId: assignment.tenantId,
        eventType,
        aggregateType: "assignment",
        aggregateId: assignment.id,
        payload: { assignment },
      });

      return jsonOk({ assignment }, ctx.requestId);
    });
  };
}

export const startHandler = makeHandler("start");
export const pauseHandler = makeHandler("pause");
export const resumeHandler = makeHandler("resume");
export const completeHandler = makeHandler("complete");
export const cancelHandler = makeHandler("cancel");
