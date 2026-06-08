import { NextRequest, NextResponse } from "next/server";
import { getSession, validateSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

function csvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      // Quote fields that contain commas, newlines, or quotes
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

function csvResponse(filename: string, rows: string[]): NextResponse {
  const body = rows.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const jwtSession = await getSession();
  if (!jwtSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(jwtSession);
  if (!session || !["super_admin", "operator"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "";

  switch (type) {
    case "users":
      return exportUsers();
    case "deposits":
      return exportDeposits();
    case "withdrawals":
      return exportWithdrawals();
    case "referrals":
      return exportReferrals();
    case "ledger":
      return exportLedger();
    default:
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }
}

async function exportUsers() {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      kycTier: true,
      emailVerified: true,
      isActive: true,
      referralCode: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const lines = [
    csvRow(["id", "email", "displayName", "role", "kycTier", "emailVerified", "isActive", "referralCode", "createdAt", "lastLoginAt"]),
    ...rows.map((r) =>
      csvRow([
        r.id,
        r.email,
        r.displayName,
        r.role,
        r.kycTier,
        r.emailVerified,
        r.isActive,
        r.referralCode,
        r.createdAt.toISOString(),
        r.lastLoginAt?.toISOString() ?? "",
      ]),
    ),
  ];
  return csvResponse(`users_${ts()}.csv`, lines);
}

async function exportDeposits() {
  const rows = await prisma.transaction.findMany({
    where: { type: "deposit" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  const lines = [
    csvRow(["id", "email", "assetCode", "amount", "feeAmount", "netAmount", "status", "paymentMethod", "paymentRef", "createdAt", "updatedAt", "ledgerTxId"]),
    ...rows.map((r) =>
      csvRow([
        r.id,
        r.user.email,
        r.assetCode,
        r.amount.toString(),
        r.feeAmount.toString(),
        r.netAmount?.toString() ?? "",
        r.status,
        r.paymentMethod ?? "",
        r.paymentRef ?? "",
        r.createdAt.toISOString(),
        r.updatedAt.toISOString(),
        r.ledgerTxId ?? "",
      ]),
    ),
  ];
  return csvResponse(`deposits_${ts()}.csv`, lines);
}

async function exportWithdrawals() {
  const rows = await prisma.transaction.findMany({
    where: { type: "withdrawal" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  const lines = [
    csvRow(["id", "email", "assetCode", "amount", "feeAmount", "netAmount", "status", "destination", "createdAt", "updatedAt", "ledgerTxId"]),
    ...rows.map((r) =>
      csvRow([
        r.id,
        r.user.email,
        r.assetCode,
        r.amount.toString(),
        r.feeAmount.toString(),
        r.netAmount?.toString() ?? "",
        r.status,
        r.paymentRef ?? "",
        r.createdAt.toISOString(),
        r.updatedAt.toISOString(),
        r.ledgerTxId ?? "",
      ]),
    ),
  ];
  return csvResponse(`withdrawals_${ts()}.csv`, lines);
}

async function exportReferrals() {
  const rows = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      referrer: { select: { email: true } },
      referred: { select: { email: true } },
    },
  });

  const lines = [
    csvRow(["id", "referrerEmail", "referredEmail", "referralLevel", "code", "status", "rewardAmount", "clickIp", "registeredAt", "createdAt"]),
    ...rows.map((r) =>
      csvRow([
        r.id,
        r.referrer.email,
        r.referred?.email ?? "",
        r.referralLevel,
        r.code,
        r.status,
        r.rewardAmount.toString(),
        r.clickIp ?? "",
        r.registeredAt?.toISOString() ?? "",
        r.createdAt.toISOString(),
      ]),
    ),
  ];
  return csvResponse(`referrals_${ts()}.csv`, lines);
}

async function exportLedger() {
  const rows = await prisma.ledgerEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: {
      ledgerTransaction: { select: { type: true, status: true, referenceType: true } },
      account: { select: { ownerType: true, ownerId: true, assetCode: true } },
    },
  });

  const lines = [
    csvRow(["id", "ledgerTransactionId", "txType", "txStatus", "ownerType", "ownerId", "assetCode", "amount", "createdAt"]),
    ...rows.map((r) =>
      csvRow([
        r.id,
        r.ledgerTransactionId,
        r.ledgerTransaction.type,
        r.ledgerTransaction.status,
        r.account.ownerType,
        r.account.ownerId,
        r.account.assetCode,
        r.amount.toString(),
        r.createdAt.toISOString(),
      ]),
    ),
  ];
  return csvResponse(`ledger_${ts()}.csv`, lines);
}

function ts(): string {
  return new Date().toISOString().slice(0, 10);
}
