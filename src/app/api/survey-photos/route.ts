/**
 * Legacy photo endpoint — same handlers as /api/attachments.
 * Prefer /api/attachments for new clients.
 */
export { GET, POST, DELETE } from "../attachments/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
