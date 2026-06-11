import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { consumeChallenge } from "@/lib/ton/challenge";
import { verifyTonProof, type TonAccount, type TonProofPayload } from "@/lib/ton/proof";
import { upsertTonWallet } from "@/lib/ton/queries";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "3real.no";

export async function POST(req: NextRequest) {
  const session = await requireAuth();

  let body: { account: TonAccount; proof: TonProofPayload };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { account, proof } = body;

  if (!account?.address || !account?.publicKey || !proof?.payload || !proof?.signature) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Verify the challenge nonce — this also consumes it (one-time use)
  const challengeOk = consumeChallenge(session.userId, proof.payload);
  if (!challengeOk) {
    logger.warn("ton.connect: challenge mismatch", {
      userId: session.userId,
      address: account.address,
    });
    return NextResponse.json({ error: "challenge_invalid" }, { status: 400 });
  }

  // Verify the cryptographic proof
  const result = verifyTonProof(account, proof, proof.payload, APP_DOMAIN);
  if (!result.ok) {
    logger.warn("ton.connect: proof verification failed", {
      userId: session.userId,
      address: account.address,
      reason: result.reason,
    });
    return NextResponse.json({ error: "proof_invalid", reason: result.reason }, { status: 400 });
  }

  // Save wallet to database
  const wallet = await upsertTonWallet(
    session.userId,
    result.address,
    result.network,
    result.publicKey
  );

  // Audit log
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ?? null;

  await prisma.activityLog.create({
    data: {
      actorId: session.userId,
      targetId: wallet.id,
      targetType: "ton_wallet",
      action: "ton_wallet.connected",
      meta: {
        address: result.address,
        network: result.network,
        isPrimary: wallet.isPrimary,
      },
      ipAddress: ip,
    },
  });

  logger.info("ton.connect: wallet linked", {
    userId: session.userId,
    address: result.address,
    network: result.network,
    walletId: wallet.id,
  });

  return NextResponse.json({ wallet });
}
