/**
 * Authoritative release identity for RC1.
 * Single source consumed by UI, health endpoints, diagnostics, and docs sync.
 * Override at build/runtime via KODIKZ_* / NEXT_PUBLIC_KODIKZ_* env vars — do not fork values elsewhere.
 */

export const RELEASE_IDENTITY = {
  productName: "Kodikz Smart City Mapping & Survey Guidance Platform",
  applicationVersion: "1.0.0",
  releaseChannel: "RC1",
  gitTag: "v1.0.0-rc1",
  /** Freeze commit — override with KODIKZ_GIT_COMMIT when rebuilt */
  gitCommitSha: "8612a33f03db738cffc0bfd6bd089abe3f8fd414",
  buildTimestamp: "REQUIRES_DOCKER_BUILD_HOST",
  databaseMigrationVersion: "1",
  imageName: "kodikz-smart-city-app",
  imageTag: "1.0.0-rc1",
  imageDigest: "REQUIRES_DOCKER_BUILD_HOST",
  workerImageName: "kodikz-smart-city-worker",
  workerImageTag: "1.0.0-rc1",
  copyright: "© Kodikz. All rights reserved.",
  supportContact: "See PILOT-SUPPORT-PLAN.md / OPERATOR-SUPPORT-GUIDE.md",
  documentationRef: "handover/RC1-1.0.0/QUICK-START.md",
} as const;

export type ComponentHealthStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unknown"
  | "not_configured";

export type OverallHealthStatus = "healthy" | "degraded" | "unavailable";

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** Process start time for uptime (server-side only). */
const PROCESS_STARTED_AT = Date.now();

export function getReleaseIdentity() {
  const commit =
    env("KODIKZ_GIT_COMMIT") ??
    env("NEXT_PUBLIC_KODIKZ_GIT_COMMIT") ??
    RELEASE_IDENTITY.gitCommitSha;
  const buildTime =
    env("KODIKZ_BUILD_TIME") ??
    env("NEXT_PUBLIC_KODIKZ_BUILD_TIME") ??
    RELEASE_IDENTITY.buildTimestamp;
  const imageDigest =
    env("KODIKZ_IMAGE_DIGEST") ?? RELEASE_IDENTITY.imageDigest;
  const deploymentId =
    env("KODIKZ_DEPLOYMENT_ID") ??
    `${RELEASE_IDENTITY.gitTag}-${commit.slice(0, 12)}`;
  const environment =
    env("DEPLOYMENT_MODE") ??
    env("NODE_ENV") ??
    "unknown";

  return {
    product: RELEASE_IDENTITY.productName,
    version: RELEASE_IDENTITY.applicationVersion,
    release: RELEASE_IDENTITY.releaseChannel,
    gitTag: RELEASE_IDENTITY.gitTag,
    commitSha: commit,
    buildTime,
    environment,
    migrationVersion: env("KODIKZ_MIGRATION_VERSION") ?? RELEASE_IDENTITY.databaseMigrationVersion,
    imageName: `${RELEASE_IDENTITY.imageName}:${RELEASE_IDENTITY.imageTag}`,
    imageDigest,
    workerImageName: `${RELEASE_IDENTITY.workerImageName}:${RELEASE_IDENTITY.workerImageTag}`,
    deploymentId,
    copyright: RELEASE_IDENTITY.copyright,
    supportContact: RELEASE_IDENTITY.supportContact,
    documentationRef: RELEASE_IDENTITY.documentationRef,
    uptimeSeconds: Math.floor((Date.now() - PROCESS_STARTED_AT) / 1000),
  };
}

export function releaseIdentityPublicJson() {
  const id = getReleaseIdentity();
  return {
    product: id.product,
    version: id.version,
    release: id.release,
    gitTag: id.gitTag,
    commitSha: id.commitSha,
    buildTime: id.buildTime,
    environment: id.environment,
    migrationVersion: id.migrationVersion,
    imageName: id.imageName,
    imageDigest: id.imageDigest,
    deploymentId: id.deploymentId,
    copyright: id.copyright,
    supportContact: id.supportContact,
    documentationRef: id.documentationRef,
  };
}
