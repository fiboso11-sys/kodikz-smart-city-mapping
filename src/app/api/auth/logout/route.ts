import { requireAuth, jsonOk, createRequestId } from "@/lib/auth/api";
import { getAuthProvider } from "@/lib/auth/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  await getAuthProvider().revokeSession(auth.ctx.sessionId);
  const res = jsonOk({ ok: true }, auth.ctx.requestId || createRequestId());
  res.cookies.set("kodikz_access", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
