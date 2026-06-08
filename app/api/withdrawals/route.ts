import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { getUserBalances } from "@/lib/ledger/balance";
import { getWithdrawalHistory } from "@/lib/withdrawals/queries";
import { WITHDRAWAL_MINIMUMS } from "@/lib/withdrawals/destinations";
import { parseTonAddress } from "@/lib/ton/withdrawals";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

const VALID_ASSETS: AssetCode[] = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

// ── GET /api/withdrawals ──────────────────────────────────────────────────────

export async function GET() {
  const session = await requireAuth();
  const history = await getWithdrawalHistory(session.userId);
  return NextResponse.json(history);
}

// ── POST /api/withdrawals ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const userId = session.userId;

  // All withdrawals require KYC tier 2
  if (!session.emailVerified) {
    return NextResponse.json({ error: "Email verification required" }, { status: 403 });
  }
  if (session.kycTier < 2) {
    return NextResponse.json(
      { error: "KYC tier 2 required for withdrawals" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { assetCode: rawAsset, amount: rawAmount, destination } = body as Record<string, unknown>;

  const assetCode = (typeof rawAsset === "string" ? rawAsset.toUpperCase() : "") as AssetCode;
  if (!VALID_ASSETS.includes(assetCode)) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 422 });
  }

  const amount = parseFloat(typeof rawAmount === "string" || typeof rawAmount === "number"
    ? String(rawAmount)
    : "");
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 422 });
  }

  const minimum = WITHDRAWAL_MINIMUMS[assetCode];
  if (amount < minimum) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${minimum} ${assetCode}` },
      { status: 422 },
    );
  }

  if (!destination || typeof destination !== "string" || destination.trim().length < 5) {
    return NextResponse.json(
      { error: "Destination address or bank details are required" },
      { status: 422 },
    );
  }

  // For REAL withdrawals: validate and normalise the TON destination address
  let normalizedDestination = destination.trim();
  if (assetCode === "REAL") {
    const parsed = parseTonAddress(normalizedDestination);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid TON address. Must be in EQ…, UQ…, or 0:hex format." },
        { status: 422 },
      );
    }
    normalizedDestination = parsed.friendly; // store canonical bounceable form
  }

  // Check available balance
  const balances = await getUserBalances(userId);
  const available = balances[assetCode]?.available ?? 0;
  if (amount > available) {
    return NextResponse.json(
      { error: `Insufficient balance. Available: ${available} ${assetCode}` },
      { status: 422 },
    );
  }

  // Get the ecosystem for this platform
  const ecosystem = await prisma.ecosystem.findFirstOrThrow({
    where: { code: "three_real" },
    select: { id: true },
  });

  const paymentMethod = assetCode === "REAL" ? "ton" : undefined;

  const transaction = await prisma.transaction.create({
    data: {
      ecosystemId: ecosystem.id,
      userId,
      type: "withdrawal",
      assetCode,
      amount: amount.toString(),
      status: "pending",
      paymentRef: normalizedDestination,
      paymentMethod: paymentMethod as typeof paymentMethod,
    },
    select: { id: true, status: true },
  });

  await audit({
    actorId: userId,
    targetId: transaction.id,
    targetType: "transaction",
    action: "withdrawal.created",
    meta: { txId: transaction.id, assetCode, amount, destination: normalizedDestination },
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ id: transaction.id, status: transaction.status }, { status: 201 });
}
