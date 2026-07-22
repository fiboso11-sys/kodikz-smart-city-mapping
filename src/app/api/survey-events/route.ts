import { getSurveyEventHistory, subscribeSurveyEvents } from "@/services/survey";
import { resolveAuthContext, jsonError, createRequestId } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { authHas } from "@/lib/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated SSE stream — one shared connection per client (client ref-counts EventSource).
 */
export async function GET(request: Request) {
  const requestId = createRequestId();
  const ctx = await resolveAuthContext(request);
  if (!ctx) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401, requestId);
  }
  if (!authHas(ctx, PERMISSIONS.SURVEYS_VIEW)) {
    return jsonError("FORBIDDEN", "Insufficient permissions", 403, ctx.requestId || requestId);
  }

  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const tenantId = ctx.tenantId;
  const replay = searchParams.get("replay") === "1";
  void searchParams.get("tenantId"); // ignore browser-claimed tenant

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* closed */
        }
      };

      send({ type: "connected", timestamp: Date.now(), tenantId, requestId: ctx.requestId });

      if (replay) {
        for (const ev of getSurveyEventHistory(50)) {
          if (ev.tenantId === tenantId) send(ev);
        }
      }

      cleanup = subscribeSurveyEvents((event) => {
        if (event.tenantId !== tenantId) return;
        send(event);
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        cleanup?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-request-id": ctx.requestId || requestId,
    },
  });
}
