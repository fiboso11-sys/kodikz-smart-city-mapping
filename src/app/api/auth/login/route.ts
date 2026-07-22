import { getAuthProvider, seedLocalAuthUsers } from "@/lib/auth/provider";
import { jsonError, jsonOk, createRequestId, rateLimit } from "@/lib/auth/api";
import { getAppConfig } from "@/lib/config/app-config";
import { log } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const cfg = getAppConfig();
  try {
    const body = (await request.json()) as { email?: string; password?: string; tenantId?: string };
    if (!body.email || !body.password) {
      return jsonError("VALIDATION_ERROR", "email and password required", 400, requestId);
    }
    if (!rateLimit(`login:${body.email.toLowerCase()}`, cfg.rateLimit.loginPerMinute)) {
      return jsonError("RATE_LIMITED", "Too many login attempts", 429, requestId);
    }

    seedLocalAuthUsers();
    const user = await getAuthProvider().authenticate(body.email, body.password, body.tenantId);
    if (!user) {
      log("warn", "login_failed", { requestId, email: body.email });
      return jsonError("UNAUTHORIZED", "Invalid credentials", 401, requestId);
    }

    const session = await getAuthProvider().issueSession(user);
    log("info", "login_success", { requestId, userId: user.id, tenantId: user.tenantId });

    const res = jsonOk(
      {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          tenantId: user.tenantId,
          roles: user.roles,
        },
      },
      requestId
    );

    // HttpOnly cookie for browser sessions
    res.cookies.set("kodikz_access", session.accessToken, {
      httpOnly: true,
      secure: cfg.auth.cookieSecure,
      sameSite: "lax",
      path: "/",
      maxAge: cfg.auth.sessionTtlSeconds,
    });
    return res;
  } catch (err) {
    log("error", "login_error", { requestId, error: err instanceof Error ? err.message : "error" });
    return jsonError("INTERNAL_ERROR", "Login failed", 500, requestId);
  }
}
