import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { detectAndCreditDeposits } from "@/lib/ton/deposits";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireAuth();

  const result = await detectAndCreditDeposits(session.userId);

  if (result.error === "deposit_address_not_configured") {
    return NextResponse.json(
      { error: "Deposit address not yet configured. Contact support." },
      { status: 503 }
    );
  }

  if (result.error === "no_linked_wallets") {
    return NextResponse.json(
      { error: "No linked TON wallets. Connect a wallet first." },
      { status: 400 }
    );
  }

  if (result.error === "tonapi_error") {
    return NextResponse.json(
      { error: "Failed to reach TON network. Try again shortly." },
      { status: 502 }
    );
  }

  if (result.error === "missing_float_account") {
    return NextResponse.json(
      { error: "Internal configuration error. Contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    credited: result.credited,
    skipped: result.skipped,
    found: result.credited.length,
  });
}
