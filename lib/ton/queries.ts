import { prisma } from "@/lib/prisma";

export type TonWalletRow = {
  id: string;
  walletAddress: string;
  network: string;
  publicKey: string | null;
  isPrimary: boolean;
  verifiedAt: Date;
  lastConnectedAt: Date;
  createdAt: Date;
};

export async function getTonWallets(userId: string): Promise<TonWalletRow[]> {
  return prisma.tonWallet.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      walletAddress: true,
      network: true,
      publicKey: true,
      isPrimary: true,
      verifiedAt: true,
      lastConnectedAt: true,
      createdAt: true,
    },
  });
}

export async function upsertTonWallet(
  userId: string,
  walletAddress: string,
  network: "mainnet" | "testnet",
  publicKey: string
): Promise<TonWalletRow> {
  const existing = await prisma.tonWallet.findUnique({
    where: { userId_walletAddress: { userId, walletAddress } },
  });

  if (existing) {
    // Re-verification: update proof timestamp, publicKey, lastConnectedAt
    return prisma.tonWallet.update({
      where: { id: existing.id },
      data: {
        publicKey,
        network,
        verifiedAt: new Date(),
        lastConnectedAt: new Date(),
      },
      select: {
        id: true,
        walletAddress: true,
        network: true,
        publicKey: true,
        isPrimary: true,
        verifiedAt: true,
        lastConnectedAt: true,
        createdAt: true,
      },
    });
  }

  // New wallet: check if this is the user's first (auto-set as primary)
  const count = await prisma.tonWallet.count({ where: { userId } });
  return prisma.tonWallet.create({
    data: {
      userId,
      walletAddress,
      network,
      publicKey,
      isPrimary: count === 0,
      verifiedAt: new Date(),
      lastConnectedAt: new Date(),
    },
    select: {
      id: true,
      walletAddress: true,
      network: true,
      publicKey: true,
      isPrimary: true,
      verifiedAt: true,
      lastConnectedAt: true,
      createdAt: true,
    },
  });
}

export async function unlinkTonWallet(userId: string, walletId: string): Promise<boolean> {
  const wallet = await prisma.tonWallet.findFirst({
    where: { id: walletId, userId },
    select: { id: true, isPrimary: true },
  });
  if (!wallet) return false;

  await prisma.tonWallet.delete({ where: { id: walletId } });

  // If the deleted wallet was primary, promote the oldest remaining wallet
  if (wallet.isPrimary) {
    const next = await prisma.tonWallet.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.tonWallet.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }
  return true;
}

export async function setPrimaryWallet(userId: string, walletId: string): Promise<boolean> {
  const wallet = await prisma.tonWallet.findFirst({
    where: { id: walletId, userId },
    select: { id: true },
  });
  if (!wallet) return false;

  // Atomic: clear all primary flags, set new one
  await prisma.$transaction([
    prisma.tonWallet.updateMany({ where: { userId }, data: { isPrimary: false } }),
    prisma.tonWallet.update({ where: { id: walletId }, data: { isPrimary: true } }),
  ]);
  return true;
}
