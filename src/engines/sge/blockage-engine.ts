/**
 * Survey Guidance Engine — Blockage Reporting System
 *
 * Allows drivers to report road blockages with categorized reasons.
 * Reports are stored locally and queued for supervisor notification.
 */

import type { BlockageReason, BlockageReport } from "./types";

let _idCounter = 0;

function generateBlockageId(): string {
  _idCounter++;
  return `blk-${Date.now()}-${_idCounter}`;
}

export interface BlockageContext {
  reports: BlockageReport[];
  pendingNotifications: BlockageReport[];
}

export function createBlockageContext(): BlockageContext {
  return {
    reports: [],
    pendingNotifications: [],
  };
}

export interface BlockageInput {
  vehicleId: string;
  assignmentId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  reason: BlockageReason;
  notes?: string;
}

export function reportBlockage(
  ctx: BlockageContext,
  input: BlockageInput
): { report: BlockageReport; updatedCtx: BlockageContext } {
  const report: BlockageReport = {
    id: generateBlockageId(),
    vehicleId: input.vehicleId,
    assignmentId: input.assignmentId,
    routeId: input.routeId,
    latitude: input.latitude,
    longitude: input.longitude,
    timestamp: Date.now(),
    reason: input.reason,
    notes: input.notes,
  };

  const updatedCtx: BlockageContext = {
    reports: [...ctx.reports, report],
    pendingNotifications: [...ctx.pendingNotifications, report],
  };

  return { report, updatedCtx };
}

export function acknowledgePendingNotifications(
  ctx: BlockageContext
): BlockageContext {
  return { ...ctx, pendingNotifications: [] };
}

export function getBlockagesForRoute(
  ctx: BlockageContext,
  routeId: string
): BlockageReport[] {
  return ctx.reports.filter((r) => r.routeId === routeId);
}
