/**
 * 3REAL — Database Seed
 * Phase 2: Initial data for ecosystems, platform accounts, admin user,
 * default fee tiers, referral settings, and rewards pool seeding.
 *
 * Idempotent: uses upsert/skipDuplicates — safe to re-run.
 */

import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  process.stdout.write(`  ${msg}\n`);
}

// ─── 1. Ecosystems ────────────────────────────────────────────────────────────

async function seedEcosystems() {
  log("Seeding ecosystems...");

  const ecosystems = [
    { code: "three_real",  name: "3REAL",       isActive: true  },
    { code: "shahnameh",   name: "Shahnameh",    isActive: false },
    { code: "trust_ai",    name: "TrustAI",      isActive: false },
    { code: "setaei_pay",  name: "SETAEI Pay",   isActive: false },
  ];

  for (const eco of ecosystems) {
    await prisma.ecosystem.upsert({
      where:  { code: eco.code },
      update: {},
      create: eco,
    });
  }

  const threeReal = await prisma.ecosystem.findUniqueOrThrow({ where: { code: "three_real" } });
  log(`  ✓ 4 ecosystems (active: 3REAL, inactive: Shahnameh, TrustAI, SETAEI Pay)`);
  return threeReal;
}

// ─── 2. Platform Accounts ─────────────────────────────────────────────────────

async function seedPlatformAccounts(ecosystemId: string) {
  log("Seeding platform accounts...");

  const accounts = [
    // ── Asset accounts (platform holds these)
    { ownerId: "float", accountType: "asset",   assetCode: "REAL", label: "Platform REAL Float"    },
    { ownerId: "float", accountType: "asset",   assetCode: "USDT", label: "Platform USDT Float"    },
    { ownerId: "float", accountType: "asset",   assetCode: "TON",  label: "Platform TON Float"     },
    { ownerId: "float", accountType: "asset",   assetCode: "EUR",  label: "Platform EUR Float"     },
    { ownerId: "float", accountType: "asset",   assetCode: "NOK",  label: "Platform NOK Float"     },
    // ── Liability accounts (platform owes these)
    { ownerId: "deposits-pending",   accountType: "liability", assetCode: "REAL", label: "Pending Deposit Escrow"     },
    { ownerId: "withdrawals-pending",accountType: "liability", assetCode: "REAL", label: "Pending Withdrawal Escrow"  },
    // ── Expense account (rewards paid out)
    { ownerId: "rewards-pool",       accountType: "expense",   assetCode: "REAL", label: "Referral Rewards Pool"      },
    // ── Revenue account (fee income)
    { ownerId: "fees",               accountType: "revenue",   assetCode: "REAL", label: "Platform Fee Collection"    },
    // ── Equity account (platform's own capital)
    { ownerId: "equity",             accountType: "equity",    assetCode: "REAL", label: "Platform Equity"            },
  ] as const;

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: {
        ecosystemId_ownerType_ownerId_assetCode: {
          ecosystemId,
          ownerType: "platform",
          ownerId:   acc.ownerId,
          assetCode: acc.assetCode,
        },
      },
      update: {},
      create: {
        ecosystemId,
        ownerType:   "platform",
        ownerId:     acc.ownerId,
        accountType: acc.accountType,
        assetCode:   acc.assetCode,
        label:       acc.label,
      },
    });
  }

  log(`  ✓ ${accounts.length} platform accounts (float×5, escrow×2, rewards-pool, fees, equity)`);
}

// ─── 3. Admin User ────────────────────────────────────────────────────────────

async function seedAdminUser() {
  log("Seeding admin user...");

  const email        = process.env.ADMIN_EMAIL    ?? "admin@3real.no";
  const password     = process.env.ADMIN_PASSWORD ?? "ChangeMe@3REAL!2026";
  const referralCode = "SETAEI00000001";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    log(`  ✓ Admin already exists: ${email}`);
    return existing;
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role:          "super_admin",
      kycTier:       3,
      referralCode,
      isActive:      true,
      emailVerified: true,
      displayName:   "SETAEI Admin",
      locale:        "en",
    },
  });

  log(`  ✓ Admin user created: ${email} (password: ${password})`);
  log(`    ⚠  Change ADMIN_PASSWORD before production deployment`);
  return admin;
}

// ─── 4. Default Fee Tiers ─────────────────────────────────────────────────────

async function seedFeeTiers(ecosystemId: string) {
  log("Seeding default fee tiers...");

  // v1: REAL only. Free deposits, flat 2 REAL withdrawal for Tier 0-1, flat 1 REAL for Tier 2+.
  // Conversion: 2% for all tiers.
  const tiers = [
    // REAL deposits — free for all tiers
    {
      kycTier: 0, assetCode: "REAL", direction: "deposit",
      feeType: "flat", flatAmount: "0", percentAmount: "0",
      minTransaction: "10", maxTransaction: null,
    },
    // REAL withdrawals — Tier 0/1: flat 2 REAL fee
    {
      kycTier: 1, assetCode: "REAL", direction: "withdrawal",
      feeType: "flat", flatAmount: "2", percentAmount: "0",
      minTransaction: "5", maxTransaction: "10000",
    },
    // REAL withdrawals — Tier 2+: flat 1 REAL fee
    {
      kycTier: 2, assetCode: "REAL", direction: "withdrawal",
      feeType: "flat", flatAmount: "1", percentAmount: "0",
      minTransaction: "5", maxTransaction: "100000",
    },
    // REAL conversion — 2% for all tiers (spread revenue)
    {
      kycTier: 0, assetCode: "REAL", direction: "conversion",
      feeType: "percent", flatAmount: "0", percentAmount: "2.0000",
      minTransaction: "1", maxTransaction: null,
    },
    // USDT deposits — free (v2 placeholder)
    {
      kycTier: 0, assetCode: "USDT", direction: "deposit",
      feeType: "flat", flatAmount: "0", percentAmount: "0",
      minTransaction: "10", maxTransaction: null,
    },
    // USDT withdrawals — 1 USDT flat (v2 placeholder)
    {
      kycTier: 0, assetCode: "USDT", direction: "withdrawal",
      feeType: "flat", flatAmount: "1", percentAmount: "0",
      minTransaction: "5", maxTransaction: null,
    },
    // TON deposits — free (v2 placeholder)
    {
      kycTier: 0, assetCode: "TON", direction: "deposit",
      feeType: "flat", flatAmount: "0", percentAmount: "0",
      minTransaction: "1", maxTransaction: null,
    },
    // TON withdrawals — 0.1 TON flat + 0.5% (v2 placeholder)
    {
      kycTier: 0, assetCode: "TON", direction: "withdrawal",
      feeType: "flat_percent", flatAmount: "0.1", percentAmount: "0.5000",
      minTransaction: "1", maxTransaction: null,
    },
  ] as const;

  for (const tier of tiers) {
    await prisma.feeTier.upsert({
      where: {
        ecosystemId_kycTier_assetCode_direction: {
          ecosystemId,
          kycTier:   tier.kycTier,
          assetCode: tier.assetCode,
          direction: tier.direction,
        },
      },
      update: {},
      create: {
        ecosystemId,
        kycTier:       tier.kycTier,
        assetCode:     tier.assetCode,
        direction:     tier.direction,
        feeType:       tier.feeType,
        flatAmount:    tier.flatAmount,
        percentAmount: tier.percentAmount,
        minTransaction:tier.minTransaction,
        maxTransaction:tier.maxTransaction ?? undefined,
        isActive:      true,
      },
    });
  }

  log(`  ✓ ${tiers.length} fee tiers (REAL, USDT, TON — deposit/withdrawal/conversion)`);
}

// ─── 5. Settings ──────────────────────────────────────────────────────────────

async function seedSettings(ecosystemId: string) {
  log("Seeding platform settings...");

  const settings = [
    // Referral reward amounts
    { key: "referral.reward.level1",   value: "50",             type: "number" },
    { key: "referral.reward.level2",   value: "15",             type: "number" },
    { key: "referral.trigger",         value: "email_verified", type: "string" },
    { key: "referral.min_days_payout", value: "0",              type: "number" },
    { key: "referral.daily_limit",     value: "20",             type: "number" },

    // KYC limits per tier
    { key: "kyc.tier1.deposit_limit_daily",    value: "1000",  type: "number" },
    { key: "kyc.tier2.deposit_limit_daily",    value: "10000", type: "number" },
    { key: "kyc.tier3.deposit_limit_daily",    value: "100000",type: "number" },
    { key: "kyc.tier1.withdrawal_limit_daily", value: "500",   type: "number" },
    { key: "kyc.tier2.withdrawal_limit_daily", value: "5000",  type: "number" },
    { key: "kyc.tier3.withdrawal_limit_daily", value: "50000", type: "number" },

    // Rewards pool alert threshold (alert when balance < this value in REAL)
    { key: "rewards_pool.alert_threshold", value: "50000", type: "number" },

    // Platform info
    { key: "platform.name",    value: "3REAL",      type: "string" },
    { key: "platform.domain",  value: "3real.no",   type: "string" },
    { key: "platform.support_email", value: "support@3real.no", type: "string" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where:  { ecosystemId_key: { ecosystemId, key: s.key } },
      update: {},
      create: { ecosystemId, key: s.key, value: s.value, type: s.type },
    });
  }

  log(`  ✓ ${settings.length} settings (referral rewards, KYC limits, platform info)`);
}

// ─── 6. Rewards Pool Seeding (Ledger) ─────────────────────────────────────────

async function seedRewardsPool(ecosystemId: string) {
  log("Seeding rewards pool (ledger entries)...");

  // Check if already seeded
  const existing = await prisma.ledgerTransaction.findFirst({
    where: { ecosystemId, type: "initial_credit" },
  });

  if (existing) {
    log("  ✓ Rewards pool already seeded (skipping)");
    return;
  }

  const equityAccount = await prisma.account.findUniqueOrThrow({
    where: {
      ecosystemId_ownerType_ownerId_assetCode: {
        ecosystemId, ownerType: "platform", ownerId: "equity", assetCode: "REAL",
      },
    },
  });

  const rewardsAccount = await prisma.account.findUniqueOrThrow({
    where: {
      ecosystemId_ownerType_ownerId_assetCode: {
        ecosystemId, ownerType: "platform", ownerId: "rewards-pool", assetCode: "REAL",
      },
    },
  });

  const POOL_AMOUNT = "500000"; // 500,000 REAL to rewards pool

  await prisma.$transaction(async (tx: any) => {
    const lt = await tx.ledgerTransaction.create({
      data: {
        ecosystemId,
        type:   "initial_credit",
        status: "completed",
        note:   `Platform rewards pool seeding at launch — ${POOL_AMOUNT} REAL allocated`,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          // DR platform:equity:REAL  (debit = negative)
          ledgerTransactionId: lt.id,
          ecosystemId,
          accountId: equityAccount.id,
          assetCode: "REAL",
          amount:    `-${POOL_AMOUNT}`,
        },
        {
          // CR platform:rewards-pool:REAL  (credit = positive)
          ledgerTransactionId: lt.id,
          ecosystemId,
          accountId: rewardsAccount.id,
          assetCode: "REAL",
          amount:    POOL_AMOUNT,
        },
      ],
    });
  });

  log(`  ✓ Rewards pool seeded: 500,000 REAL (DR equity / CR rewards-pool)`);
}

// ─── 7. Exchange Rates ────────────────────────────────────────────────────────

async function seedExchangeRates() {
  log("Seeding initial exchange rates...");

  const rates = [
    { fromAsset: "USDT", toAsset: "REAL", rate: "50.00000000" },  // 1 USDT = 50 REAL (sell)
    { fromAsset: "REAL", toAsset: "USDT", rate: "0.01900000"  },  // 1 REAL = 0.019 USDT (buy, ~5% spread)
    { fromAsset: "TON",  toAsset: "REAL", rate: "250.00000000"},  // 1 TON = 250 REAL
    { fromAsset: "REAL", toAsset: "TON",  rate: "0.00380000"  },
    { fromAsset: "EUR",  toAsset: "REAL", rate: "55.00000000" },  // 1 EUR ≈ 55 REAL
    { fromAsset: "NOK",  toAsset: "REAL", rate: "5.00000000"  },  // 1 NOK ≈ 5 REAL
  ] as const;

  for (const r of rates) {
    const existing = await prisma.exchangeRate.findFirst({
      where: {
        fromAsset:  r.fromAsset,
        toAsset:    r.toAsset,
        validUntil: null,
      },
    });

    if (!existing) {
      await prisma.exchangeRate.create({
        data: {
          fromAsset: r.fromAsset,
          toAsset:   r.toAsset,
          rate:      r.rate,
          source:    "manual",
        },
      });
    }
  }

  log(`  ✓ ${rates.length} exchange rates (USDT, TON, EUR, NOK ↔ REAL)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedTonSettings() {
  log("Seeding TON global settings...");

  const defaults = [
    { key: "ton.jetton_master", value: "EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p" },
    { key: "ton.network",       value: "mainnet" },
    { key: "ton.api_key",       value: "" },
  ];

  for (const s of defaults) {
    const existing = await prisma.setting.findFirst({
      where: { key: s.key, ecosystemId: null },
      select: { id: true },
    });
    if (!existing) {
      await prisma.setting.create({ data: { key: s.key, value: s.value } });
    }
  }

  log(`  ✓ ${defaults.length} TON settings (jetton_master, network, api_key)`);
}

async function main() {
  process.stdout.write("\n🌱 3REAL Database Seed\n\n");

  const ecosystem = await seedEcosystems();
  await seedPlatformAccounts(ecosystem.id);
  await seedAdminUser();
  await seedFeeTiers(ecosystem.id);
  await seedSettings(ecosystem.id);
  await seedRewardsPool(ecosystem.id);
  await seedExchangeRates();
  await seedTonSettings();

  process.stdout.write("\n✅ Seed complete.\n\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
