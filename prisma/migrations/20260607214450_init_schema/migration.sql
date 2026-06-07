-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'operator', 'super_admin');

-- CreateEnum
CREATE TYPE "AssetCode" AS ENUM ('REAL', 'USDT', 'TON', 'EUR', 'NOK', 'TRY');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('ton', 'trc20', 'erc20', 'real_chain', 'bank', 'sepa');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('user', 'platform');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('deposit', 'withdrawal', 'fiat_deposit', 'referral_reward', 'fee', 'transfer', 'blockchain_deposit', 'blockchain_withdrawal', 'correction', 'initial_credit', 'conversion', 'pool_topup', 'withdrawal_settlement', 'withdrawal_reversal');

-- CreateEnum
CREATE TYPE "LedgerTransactionStatus" AS ENUM ('pending', 'processing', 'completed', 'rejected', 'reversed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'under_review', 'approved', 'processing', 'completed', 'rejected', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('bank_transfer', 'usdt_trc20', 'ton', 'sepa', 'manual');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'registered', 'rewarded', 'invalidated');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'update_requested');

-- CreateEnum
CREATE TYPE "KycDocType" AS ENUM ('id_front', 'id_back', 'selfie', 'address_proof', 'bank_statement');

-- CreateEnum
CREATE TYPE "KycDocStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('email_verify', 'password_reset', 'refresh_token');

-- CreateEnum
CREATE TYPE "FeeDirection" AS ENUM ('deposit', 'withdrawal', 'conversion');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('flat', 'percent', 'flat_percent');

-- CreateEnum
CREATE TYPE "ExchangeRateSource" AS ENUM ('manual', 'oracle', 'admin');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('kyc_submitted', 'kyc_approved', 'kyc_rejected', 'kyc_update_requested', 'deposit_received', 'deposit_approved', 'deposit_rejected', 'withdrawal_approved', 'withdrawal_rejected', 'withdrawal_processing', 'withdrawal_failed', 'referral_reward', 'pool_depleted', 'system');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'push');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "WithdrawalDestType" AS ENUM ('crypto', 'bank_transfer', 'sepa');

-- CreateTable
CREATE TABLE "ecosystems" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecosystems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "kycTier" SMALLINT NOT NULL DEFAULT 0,
    "referralCode" VARCHAR(16) NOT NULL,
    "referredById" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "displayName" VARCHAR(128),
    "locale" VARCHAR(8) NOT NULL DEFAULT 'en',
    "avatarPath" VARCHAR(512),
    "twoFaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFaSecret" VARCHAR(128),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "ownerType" "OwnerType" NOT NULL,
    "ownerId" VARCHAR(255) NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "assetCode" "AssetCode" NOT NULL,
    "label" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "type" "LedgerTransactionType" NOT NULL,
    "status" "LedgerTransactionStatus" NOT NULL DEFAULT 'completed',
    "referenceId" UUID,
    "referenceType" VARCHAR(64),
    "chainTxHash" VARCHAR(128),
    "chainNetwork" "Network",
    "initiatedById" UUID,
    "approvedById" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "ledgerTransactionId" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "assetCode" "AssetCode" NOT NULL,
    "amount" DECIMAL(28,8) NOT NULL,
    "runningBalance" DECIMAL(28,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "assetCode" "AssetCode" NOT NULL,
    "amount" DECIMAL(28,8) NOT NULL,
    "feeAmount" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(28,8),
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "ledgerTxId" UUID,
    "paymentMethod" "PaymentMethod",
    "paymentRef" VARCHAR(255),
    "adminNote" TEXT,
    "chainTxHash" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "referrerId" UUID NOT NULL,
    "referredId" UUID,
    "code" VARCHAR(16) NOT NULL,
    "referralLevel" SMALLINT NOT NULL DEFAULT 1,
    "parentReferralId" UUID,
    "clickIp" VARCHAR(64),
    "clickAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "rewardAmount" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "ledgerTxId" UUID,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tierRequested" SMALLINT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" UUID NOT NULL,
    "kycProfileId" UUID NOT NULL,
    "docType" "KycDocType" NOT NULL,
    "filePath" VARCHAR(512) NOT NULL,
    "fileName" VARCHAR(255),
    "fileSizeBytes" INTEGER,
    "mimeType" VARCHAR(64),
    "status" "KycDocStatus" NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "version" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID,
    "actorId" UUID,
    "targetId" UUID,
    "targetType" VARCHAR(64),
    "action" VARCHAR(128) NOT NULL,
    "meta" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ecosystemId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "referenceId" UUID,
    "referenceType" VARCHAR(64),
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "sentAt" TIMESTAMP(3),
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL DEFAULT 'string',
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_tiers" (
    "id" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "kycTier" SMALLINT NOT NULL DEFAULT 0,
    "assetCode" "AssetCode" NOT NULL,
    "direction" "FeeDirection" NOT NULL,
    "feeType" "FeeType" NOT NULL,
    "flatAmount" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "percentAmount" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "minFee" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "maxFee" DECIMAL(28,8),
    "minTransaction" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "maxTransaction" DECIMAL(28,8),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "fromAsset" "AssetCode" NOT NULL,
    "toAsset" "AssetCode" NOT NULL,
    "rate" DECIMAL(28,8) NOT NULL,
    "source" "ExchangeRateSource" NOT NULL DEFAULT 'manual',
    "setById" UUID,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "network" "Network" NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "derivationPath" VARCHAR(128),
    "label" VARCHAR(128),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_destinations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "WithdrawalDestType" NOT NULL,
    "network" "Network",
    "address" VARCHAR(512) NOT NULL,
    "label" VARCHAR(128),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecosystems_code_key" ON "ecosystems"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_referralCode_idx" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "users_referredById_idx" ON "users"("referredById");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "accounts_ownerType_ownerId_idx" ON "accounts"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "accounts_ecosystemId_idx" ON "accounts"("ecosystemId");

-- CreateIndex
CREATE INDEX "accounts_assetCode_idx" ON "accounts"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_ecosystemId_ownerType_ownerId_assetCode_key" ON "accounts"("ecosystemId", "ownerType", "ownerId", "assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_chainTxHash_key" ON "ledger_transactions"("chainTxHash");

-- CreateIndex
CREATE INDEX "ledger_transactions_ecosystemId_idx" ON "ledger_transactions"("ecosystemId");

-- CreateIndex
CREATE INDEX "ledger_transactions_referenceId_referenceType_idx" ON "ledger_transactions"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "ledger_transactions_type_status_idx" ON "ledger_transactions"("type", "status");

-- CreateIndex
CREATE INDEX "ledger_transactions_initiatedById_idx" ON "ledger_transactions"("initiatedById");

-- CreateIndex
CREATE INDEX "ledger_transactions_createdAt_idx" ON "ledger_transactions"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ledger_entries_accountId_idx" ON "ledger_entries"("accountId");

-- CreateIndex
CREATE INDEX "ledger_entries_ecosystemId_idx" ON "ledger_entries"("ecosystemId");

-- CreateIndex
CREATE INDEX "ledger_entries_assetCode_idx" ON "ledger_entries"("assetCode");

-- CreateIndex
CREATE INDEX "ledger_entries_ledgerTransactionId_idx" ON "ledger_entries"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_ecosystemId_idx" ON "transactions"("ecosystemId");

-- CreateIndex
CREATE INDEX "transactions_status_type_idx" ON "transactions"("status", "type");

-- CreateIndex
CREATE INDEX "transactions_status_type_createdAt_idx" ON "transactions"("status", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "transactions_userId_type_createdAt_idx" ON "transactions"("userId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "referrals_referrerId_status_idx" ON "referrals"("referrerId", "status");

-- CreateIndex
CREATE INDEX "referrals_referredId_idx" ON "referrals"("referredId");

-- CreateIndex
CREATE INDEX "referrals_code_idx" ON "referrals"("code");

-- CreateIndex
CREATE INDEX "referrals_referralLevel_parentReferralId_idx" ON "referrals"("referralLevel", "parentReferralId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_profiles_userId_key" ON "kyc_profiles"("userId");

-- CreateIndex
CREATE INDEX "kyc_profiles_status_idx" ON "kyc_profiles"("status");

-- CreateIndex
CREATE INDEX "kyc_profiles_userId_idx" ON "kyc_profiles"("userId");

-- CreateIndex
CREATE INDEX "kyc_profiles_submittedAt_idx" ON "kyc_profiles"("submittedAt" ASC);

-- CreateIndex
CREATE INDEX "kyc_documents_kycProfileId_docType_idx" ON "kyc_documents"("kycProfileId", "docType");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents"("status");

-- CreateIndex
CREATE INDEX "activity_logs_actorId_idx" ON "activity_logs"("actorId");

-- CreateIndex
CREATE INDEX "activity_logs_targetId_targetType_idx" ON "activity_logs"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "activity_logs_ecosystemId_idx" ON "activity_logs"("ecosystemId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_deliveryStatus_idx" ON "notifications"("deliveryStatus");

-- CreateIndex
CREATE INDEX "settings_ecosystemId_idx" ON "settings"("ecosystemId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_ecosystemId_key_key" ON "settings"("ecosystemId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_tokens_userId_type_idx" ON "auth_tokens"("userId", "type");

-- CreateIndex
CREATE INDEX "auth_tokens_expiresAt_idx" ON "auth_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "fee_tiers_ecosystemId_assetCode_direction_kycTier_idx" ON "fee_tiers"("ecosystemId", "assetCode", "direction", "kycTier");

-- CreateIndex
CREATE UNIQUE INDEX "fee_tiers_ecosystemId_kycTier_assetCode_direction_key" ON "fee_tiers"("ecosystemId", "kycTier", "assetCode", "direction");

-- CreateIndex
CREATE INDEX "exchange_rates_fromAsset_toAsset_validFrom_idx" ON "exchange_rates"("fromAsset", "toAsset", "validFrom" DESC);

-- CreateIndex
CREATE INDEX "exchange_rates_validUntil_idx" ON "exchange_rates"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_addresses_address_key" ON "deposit_addresses"("address");

-- CreateIndex
CREATE INDEX "deposit_addresses_address_idx" ON "deposit_addresses"("address");

-- CreateIndex
CREATE INDEX "deposit_addresses_userId_idx" ON "deposit_addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_addresses_userId_ecosystemId_network_key" ON "deposit_addresses"("userId", "ecosystemId", "network");

-- CreateIndex
CREATE INDEX "withdrawal_destinations_userId_type_isActive_idx" ON "withdrawal_destinations"("userId", "type", "isActive");

-- CreateIndex
CREATE INDEX "withdrawal_destinations_userId_idx" ON "withdrawal_destinations"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledgerTxId_fkey" FOREIGN KEY ("ledgerTxId") REFERENCES "ledger_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_ledgerTxId_fkey" FOREIGN KEY ("ledgerTxId") REFERENCES "ledger_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_parentReferralId_fkey" FOREIGN KEY ("parentReferralId") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_profiles" ADD CONSTRAINT "kyc_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_profiles" ADD CONSTRAINT "kyc_profiles_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kycProfileId_fkey" FOREIGN KEY ("kycProfileId") REFERENCES "kyc_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_tiers" ADD CONSTRAINT "fee_tiers_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_setById_fkey" FOREIGN KEY ("setById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_addresses" ADD CONSTRAINT "deposit_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_addresses" ADD CONSTRAINT "deposit_addresses_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_destinations" ADD CONSTRAINT "withdrawal_destinations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
