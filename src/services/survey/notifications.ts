/**
 * Notification service façade — history, read, acknowledgement.
 * Generation happens in surveyService on domain events.
 */

import { surveyApi } from "./client-api";
import type { SurveyNotification } from "./types";

export const notificationService = {
  async list(tenantId = "dubai-giscd"): Promise<SurveyNotification[]> {
    return surveyApi.listNotifications(tenantId);
  },

  async markRead(id: string): Promise<void> {
    await surveyApi.markNotificationRead(id);
  },
};
