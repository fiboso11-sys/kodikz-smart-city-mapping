/**
 * Supervisor command client helpers.
 */

import { surveyApi } from "@/services/survey/client-api";
import type { SupervisorCommandType } from "@/services/survey/types";

export async function sendSupervisorCommand(opts: {
  type: SupervisorCommandType;
  tenantId: string;
  assignmentId: string;
  vehicleId: string;
  issuedBy?: string;
  message?: string;
}) {
  return surveyApi.issueCommand(opts);
}
