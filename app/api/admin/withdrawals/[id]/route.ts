import { NextRequest, NextResponse } from "next/server";
import { getSession, validateSession } from "@/lib/auth/guards";
import { approveWithdrawal, rejectWithdrawal } from "@/lib/admin/withdrawal-service";

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

  const { id: txId } = await params;

  let body: { action: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, reason } = body;

  try {
    if (action === "approve") {
      await approveWithdrawal(txId, session.userId);
    } else if (action === "reject") {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Rejection reason required" }, { status: 422 });
      }
      await rejectWithdrawal(txId, session.userId, reason.trim());
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 422 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Action failed";
    if (msg === "ALREADY_SETTLED") {
      return NextResponse.json(
        { error: "This withdrawal has already been processed in the ledger" },
        { status: 409 },
      );
    }
    if (msg === "INVALID_STATE") {
      return NextResponse.json(
        { error: "This withdrawal is not in a reviewable state" },
        { status: 409 },
      );
    }
    if (msg.startsWith("INSUFFICIENT_BALANCE")) {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    console.error("[admin/withdrawals] action error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
