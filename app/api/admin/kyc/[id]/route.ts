import { NextRequest, NextResponse } from "next/server";
import { getSession, validateSession } from "@/lib/auth/guards";
import { approveKYC, rejectKYC, requestUpdate } from "@/lib/kyc/admin";

export const dynamic = "force-dynamic";

async function getAdminSession() {
  const jwt = await getSession();
  if (!jwt) return null;
  const session = await validateSession(jwt);
  if (!session) return null;
  if (session.role !== "super_admin" && session.role !== "operator") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: profileId } = await params;

  let body: { action: string; reason?: string; docIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, reason, docIds } = body;

  try {
    if (action === "approve") {
      await approveKYC(profileId, session.userId);
    } else if (action === "reject") {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Rejection reason required" }, { status: 422 });
      }
      await rejectKYC(profileId, session.userId, reason.trim());
    } else if (action === "request_update") {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Update reason required" }, { status: 422 });
      }
      await requestUpdate(profileId, session.userId, reason.trim(), docIds);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 422 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Action failed";
    if (msg === "INVALID_STATE") {
      return NextResponse.json(
        { error: "This KYC profile is not in a reviewable state" },
        { status: 409 },
      );
    }
    console.error("[admin/kyc] action error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
