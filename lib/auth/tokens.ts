import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

type TokenType = "email_verify" | "password_reset" | "refresh_token";

const TTL: Record<TokenType, number> = {
  email_verify: 24,
  password_reset: 2,
  refresh_token: 24 * 7,
};

export function generateReferralCode(): string {
  // 8-char uppercase alphanumeric — avoids look-alike chars (I/1/O/0)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createAuthToken(
  userId: string,
  type: TokenType,
  ipAddress?: string
): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);

  // Invalidate previous unused tokens of the same type
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TTL[type]);

  await prisma.authToken.create({
    data: { userId, tokenHash, type, expiresAt, ipAddress: ipAddress ?? null },
  });

  return raw;
}

export async function consumeAuthToken(rawToken: string, type: TokenType) {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.authToken.findFirst({
    where: {
      tokenHash,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          emailVerified: true,
          isActive: true,
          role: true,
          kycTier: true,
        },
      },
    },
  });

  if (!record) return null;

  await prisma.authToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}
