import { surveyService } from "@/services/survey";
import type { SupervisorCommandType } from "@/services/survey";
import { withSurveyAuth, jsonOk, jsonError, mutationRateOk } from "../_survey-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { enqueueOutbox } from "@/services/survey/outbox";
import { getAppConfig } from "@/lib/config/app-config";
import { rateLimit } from "@/lib/auth/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: SupervisorCommandType[] = [
  "PAUSE",
  "RESUME",
  "CANCEL",
  "APPROVE_DIVERSION",
  "REJECT_DIVERSION",
  "SEND_MESSAGE",
  "REQUEST_RETURN",
];

export async function POST(request: Request) {
  return withSurveyAuth(request, PERMISSIONS.COMMANDS_SEND, async (ctx) => {
    const cfg = getAppConfig();
    if (!rateLimit(`cmd:${ctx.userId}`, cfg.rateLimit.commandPerMinute) || !mutationRateOk(ctx)) {
      return jsonError("RATE_LIMITED", "Too many commands", 429, ctx.requestId);
    }
    try {
      const body = (await request.json()) as {
        type: SupervisorCommandType;
        tenantId?: string;
        assignmentId: string;
        vehicleId: string;
        message?: string;
      };
      if (!VALID.includes(body.type)) {
        return jsonError("VALIDATION_ERROR", "Invalid command type", 400, ctx.requestId);
      }
      if (!body.assignmentId || !body.vehicleId) {
        return jsonError("VALIDATION_ERROR", "assignmentId and vehicleId required", 400, ctx.requestId);
      }
      const assignment = surveyService.getAssignment(body.assignmentId);
      if (!assignment || assignment.tenantId !== ctx.tenantId) {
        return jsonError("FORBIDDEN", "Assignment not in tenant", 403, ctx.requestId);
      }

      const command = surveyService.issueCommand(body.type, {
        tenantId: ctx.tenantId,
        assignmentId: body.assignmentId,
        vehicleId: body.vehicleId,
        issuedBy: ctx.userId,
        message: body.message,
      });

      await enqueueOutbox({
        tenantId: ctx.tenantId,
        eventType: body.type === "SEND_MESSAGE" ? "driver_message" : "supervisor_command",
        aggregateType: "command",
        aggregateId: command.id,
        payload: { command },
      });

      return jsonOk({ command }, ctx.requestId, 201);
    } catch {
      return jsonError("BAD_REQUEST", "Invalid request body", 400, ctx.requestId);
    }
  });
}
