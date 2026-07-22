/**
 * Central permission constants and role → permission map.
 */

export const PERMISSIONS = {
  TENANT_MANAGE: "tenant.manage",
  USERS_MANAGE: "users.manage",
  VEHICLES_MANAGE: "vehicles.manage",
  DRIVERS_MANAGE: "drivers.manage",
  ROUTES_MANAGE: "routes.manage",
  PERMITS_MANAGE: "permits.manage",
  ASSIGNMENTS_CREATE: "assignments.create",
  ASSIGNMENTS_APPROVE: "assignments.approve",
  ASSIGNMENTS_START: "assignments.start",
  ASSIGNMENTS_PAUSE: "assignments.pause",
  ASSIGNMENTS_RESUME: "assignments.resume",
  ASSIGNMENTS_COMPLETE: "assignments.complete",
  ASSIGNMENTS_CANCEL: "assignments.cancel",
  ASSIGNMENTS_REASSIGN: "assignments.reassign",
  SURVEYS_VIEW: "surveys.view",
  SURVEYS_CONTROL: "surveys.control",
  ALERTS_VIEW: "alerts.view",
  ALERTS_ACKNOWLEDGE: "alerts.acknowledge",
  BLOCKAGES_CREATE: "blockages.create",
  BLOCKAGES_VIEW: "blockages.view",
  COMMANDS_SEND: "commands.send",
  ATTACHMENTS_UPLOAD: "attachments.upload",
  ATTACHMENTS_VIEW: "attachments.view",
  AUDIT_VIEW: "audit.view",
  DIAGNOSTICS_VIEW: "diagnostics.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type RoleCode = "SUPER_ADMIN" | "TENANT_ADMIN" | "SUPERVISOR" | "DRIVER" | "VIEWER";

const ALL = Object.values(PERMISSIONS);

export const ROLE_PERMISSION_MAP: Record<RoleCode, Permission[]> = {
  SUPER_ADMIN: ALL,
  TENANT_ADMIN: ALL.filter((p) => p !== PERMISSIONS.TENANT_MANAGE || true),
  SUPERVISOR: [
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_APPROVE,
    PERMISSIONS.ASSIGNMENTS_START,
    PERMISSIONS.ASSIGNMENTS_PAUSE,
    PERMISSIONS.ASSIGNMENTS_RESUME,
    PERMISSIONS.ASSIGNMENTS_COMPLETE,
    PERMISSIONS.ASSIGNMENTS_CANCEL,
    PERMISSIONS.ASSIGNMENTS_REASSIGN,
    PERMISSIONS.SURVEYS_VIEW,
    PERMISSIONS.SURVEYS_CONTROL,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.ALERTS_ACKNOWLEDGE,
    PERMISSIONS.BLOCKAGES_VIEW,
    PERMISSIONS.COMMANDS_SEND,
    PERMISSIONS.ATTACHMENTS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.DIAGNOSTICS_VIEW,
    PERMISSIONS.ROUTES_MANAGE,
    PERMISSIONS.VEHICLES_MANAGE,
  ],
  DRIVER: [
    PERMISSIONS.SURVEYS_VIEW,
    PERMISSIONS.ASSIGNMENTS_START,
    PERMISSIONS.ASSIGNMENTS_PAUSE,
    PERMISSIONS.ASSIGNMENTS_RESUME,
    PERMISSIONS.ASSIGNMENTS_COMPLETE,
    PERMISSIONS.BLOCKAGES_CREATE,
    PERMISSIONS.BLOCKAGES_VIEW,
    PERMISSIONS.ATTACHMENTS_UPLOAD,
    PERMISSIONS.ATTACHMENTS_VIEW,
    PERMISSIONS.ALERTS_VIEW,
  ],
  VIEWER: [
    PERMISSIONS.SURVEYS_VIEW,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.BLOCKAGES_VIEW,
    PERMISSIONS.ATTACHMENTS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
};

export function permissionsForRoles(roles: RoleCode[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSION_MAP[role] ?? []) set.add(p);
  }
  return set;
}

export function hasPermission(roles: RoleCode[], permission: Permission): boolean {
  return permissionsForRoles(roles).has(permission);
}
