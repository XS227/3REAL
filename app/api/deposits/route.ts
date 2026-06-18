import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getStorage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/storage";
import { audit, ipFromRequest } from "@/lib/audit";
import { getDepositHistory } from "@/lib/deposits/queries";
import { DEPOSIT_KYC_TIER, DEPOSIT_MINIMUMS, DEPOSIT_INSTRUCTIONS } from "@/lib/deposits/instructions";
import type { AssetCode } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

const VALID_ASSETS: AssetCode[] = ["REAL", "TON", "USDT", "EUR", "NOK", "TRY"];

// ── GET /api/deposits ─────────────────────────────────────────────────────────
export async function GET() {
  const session = await requireAuth();
  const deposits = await getDepositHistory(session.userId);
  return NextResponse.json(deposits);
}

// ── POST /api/deposits ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const userId = session.userId;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const assetCode = (formData.get("assetCode") as string | null)?.toUpperCase() as AssetCode;
  const amountRaw = formData.get("amount") as string | null;
  const paymentRef = (formData.get("paymentRef") as string | null)?.trim() || null;
  const proofFile = formData.get("proof");

  // Validate asset
  if (!assetCode || !VALID_ASSETS.includes(assetCode)) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 422 });
  }

  // Validate amount
  const amount = parseFloat(amountRaw ?? "");
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 422 });
  }
  const minimum = DEPOSIT_MINIMUMS[assetCode];
  if (amount < minimum) {
    return NextResponse.json(
      { error: `Minimum deposit for ${assetCode} is ${minimum}` },
      { status: 422 },
    );
  }

  // Email must be verified
  if (!session.emailVerified) {
    return NextResponse.json(
      { error: "Email verification required before making a deposit" },
      { status: 403 },
    );
  }

  // KYC tier check
  const requiredTier = DEPOSIT_KYC_TIER[assetCode];
  if (session.kycTier < requiredTier) {
    return NextResponse.json(
      {
        error: `KYC Tier ${requiredTier} required to deposit ${assetCode}. Complete identity verification first.`,
      },
      { status: 403 },
    );
  }

  // Validate optional proof file
  let proofFilePath: string | null = null;
  if (proofFile instanceof File && proofFile.size > 0) {
    if (proofFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Proof file exceeds 10 MB limit" }, { status: 422 });
    }
    if (!ALLOWED_MIME_TYPES.includes(proofFile.type)) {
      return NextResponse.json(
        { error: `Unsupported proof file type: ${proofFile.type}` },
        { status: 422 },
      );
    }
  }

  // Get 3REAL ecosystem
  const ecosystem = await prisma.ecosystem.findUniqueOrThrow({
    where: { code: "three_real" },
    select: { id: true },
  });

  // Generate transaction ID so we can use it in the storage path
  const txId = crypto.randomUUID();

  // Upload proof if provided
  if (proofFile instanceof File && proofFile.size > 0) {
    const ext = proofFile.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin";
    const relativePath = `deposits/${userId}/${txId}/proof.${ext}`;
    await getStorage().upload(proofFile, relativePath);
    proofFilePath = relativePath;
  }

  const instruction = DEPOSIT_INSTRUCTIONS.en[assetCode];

  // Create the Transaction record
  await prisma.transaction.create({
    data: {
      id: txId,
      ecosystemId: ecosystem.id,
      userId,
      type: "deposit",
      assetCode,
      amount,
      status: "pending",
      paymentMethod: instruction.paymentMethod,
      paymentRef,
      proofFilePath,
    },
  });

  await audit({
    actorId: userId,
    targetId: userId,
    targetType: "user",
    action: "deposit.created",
    meta: { txId, assetCode, amount, paymentMethod: instruction.paymentMethod },
    ipAddress: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ id: txId, status: "pending" }, { status: 201 });
}
