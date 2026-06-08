-- CreateTable
CREATE TABLE "ton_wallets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "walletAddress" VARCHAR(66) NOT NULL,
    "network" VARCHAR(16) NOT NULL DEFAULT 'mainnet',
    "publicKey" VARCHAR(64),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConnectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ton_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ton_wallets_userId_idx" ON "ton_wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ton_wallets_userId_walletAddress_key" ON "ton_wallets"("userId", "walletAddress");

-- AddForeignKey
ALTER TABLE "ton_wallets" ADD CONSTRAINT "ton_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
