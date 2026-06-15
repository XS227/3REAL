import type { AssetCode, PaymentMethod } from "@/lib/generated/prisma/enums";
import type { PlatformSettings } from "@/lib/settings/platform";

export type DepositInstruction = {
  paymentMethod: PaymentMethod;
  steps: string[];
  details: { label: string; value: string }[];
  refLabel: string;
  refRequired: boolean;
  proofLabel: string;
  note?: string;
};

// Placeholder values — replace with real addresses/IBANs via Settings (Phase 9)
const PLATFORM_TON_WALLET = "EQC_PLACEHOLDER_TON_WALLET_ADDRESS";
const PLATFORM_TRON_WALLET = "T_PLACEHOLDER_TRON_USDT_ADDRESS";
const PLATFORM_EUR_IBAN = "DE00 0000 0000 0000 0000 00";
const PLATFORM_EUR_BIC = "XXXXXXXX";
const PLATFORM_NOK_ACCOUNT = "0000 00 00000";
const PLATFORM_TRY_IBAN = "TR00 0000 0000 0000 0000 0000 00";
const PLATFORM_BANK_NAME = "3REAL Platform Bank";

export const DEPOSIT_INSTRUCTIONS: Record<AssetCode, DepositInstruction> = {
  REAL: {
    paymentMethod: "ton",
    steps: [
      "Connect a TON wallet on the Wallet page.",
      "Send REAL Jetton from your connected wallet to the platform deposit address shown on the deposit page.",
      'Return here and click "Check for Deposit" -- your balance is credited automatically.',
    ],
    details: [
      { label: "Token", value: "REAL (TON Jetton)" },
      { label: "Network", value: "The Open Network (TON)" },
      { label: "Minimum Deposit", value: "1 REAL" },
    ],
    refLabel: "Transaction Hash (optional)",
    refRequired: false,
    proofLabel: "Screenshot (optional)",
    note: "Only transfers from verified linked wallets are accepted. Credits are automatic — no manual review required.",
  },
  TON: {
    paymentMethod: "ton",
    steps: [
      "Transfer TON to the platform wallet address below.",
      "Include your reference code in the transfer memo/comment field.",
      "Paste the transaction hash and submit your request.",
      "Your deposit will be credited after manual verification (1–24 hours).",
    ],
    details: [
      { label: "Platform TON Wallet", value: PLATFORM_TON_WALLET },
      { label: "Network", value: "The Open Network (TON)" },
    ],
    refLabel: "Transaction Hash",
    refRequired: false,
    proofLabel: "Screenshot / proof of transfer",
    note: "TON deposits are processed manually. No automated on-chain monitoring is active at this time.",
  },
  USDT: {
    paymentMethod: "usdt_trc20",
    steps: [
      "Send USDT via the TRC-20 network to the address below.",
      "Do NOT send via ERC-20 or any other network — funds will be lost.",
      "Paste the transaction hash from TRONSCAN and submit your request.",
      "Your deposit will be credited after 1 on-chain confirmation (usually under 3 minutes).",
    ],
    details: [
      { label: "Deposit Address (TRC-20)", value: PLATFORM_TRON_WALLET },
      { label: "Network", value: "TRON (TRC-20)" },
      { label: "Minimum Deposit", value: "10 USDT" },
    ],
    refLabel: "TRC-20 Transaction Hash",
    refRequired: true,
    proofLabel: "TRONSCAN screenshot (optional)",
    note: "Always double-check the network. Sending on ERC-20 will result in permanent loss of funds.",
  },
  EUR: {
    paymentMethod: "sepa",
    steps: [
      "Initiate a SEPA bank transfer to the account details below.",
      "Use your reference code as the payment description/reference.",
      "Submit this form after completing the transfer.",
      "Processing time: 1–2 business days.",
    ],
    details: [
      { label: "Beneficiary", value: PLATFORM_BANK_NAME },
      { label: "IBAN", value: PLATFORM_EUR_IBAN },
      { label: "BIC / SWIFT", value: PLATFORM_EUR_BIC },
      { label: "Currency", value: "EUR" },
    ],
    refLabel: "Payment Reference",
    refRequired: true,
    proofLabel: "Bank transfer receipt (optional)",
    note: "You MUST include your reference code in the payment description, otherwise your deposit cannot be matched.",
  },
  NOK: {
    paymentMethod: "bank_transfer",
    steps: [
      "Transfer NOK to the account number below via Norwegian bank transfer.",
      "Use your reference code as the KID / payment reference.",
      "Submit this form after completing the transfer.",
      "Processing time: 1–2 business days.",
    ],
    details: [
      { label: "Account Holder", value: PLATFORM_BANK_NAME },
      { label: "Account Number", value: PLATFORM_NOK_ACCOUNT },
      { label: "Currency", value: "NOK" },
    ],
    refLabel: "Payment Reference",
    refRequired: true,
    proofLabel: "Bank transfer receipt (optional)",
    note: "Include your reference code as the KID or payment reference.",
  },
  TRY: {
    paymentMethod: "bank_transfer",
    steps: [
      "Initiate a Turkish bank (EFT/FAST) transfer to the IBAN below.",
      "Use your reference code as the transfer description.",
      "Submit this form after completing the transfer.",
      "Processing time: 1–2 business days.",
    ],
    details: [
      { label: "Beneficiary", value: PLATFORM_BANK_NAME },
      { label: "IBAN", value: PLATFORM_TRY_IBAN },
      { label: "Currency", value: "TRY" },
    ],
    refLabel: "Payment Reference",
    refRequired: true,
    proofLabel: "Bank transfer receipt (optional)",
    note: "Include your reference code as the transfer description.",
  },
};

// Per-asset minimum deposit amounts
export const DEPOSIT_MINIMUMS: Record<AssetCode, number> = {
  REAL: 1,
  TON: 0.1,
  USDT: 10,
  EUR: 10,
  NOK: 100,
  TRY: 300,
};

// KYC tier required to deposit each asset
export const DEPOSIT_KYC_TIER: Record<AssetCode, number> = {
  REAL: 1,
  TON: 2,
  USDT: 2,
  EUR: 2,
  NOK: 2,
  TRY: 2,
};

// Build deposit instructions with live DB values merged in (call from server components)
export function buildDepositInstructions(
  platform: PlatformSettings
): Record<AssetCode, DepositInstruction> {
  const bank = platform["platform.bank_name"] || PLATFORM_BANK_NAME;
  const tonWallet = platform["platform.ton_wallet"] || PLATFORM_TON_WALLET;
  const tronWallet = platform["platform.tron_wallet"] || PLATFORM_TRON_WALLET;
  const eurIban = platform["platform.eur_iban"] || PLATFORM_EUR_IBAN;
  const eurBic = platform["platform.eur_bic"] || PLATFORM_EUR_BIC;
  const nokAccount = platform["platform.nok_account"] || PLATFORM_NOK_ACCOUNT;
  const tryIban = platform["platform.try_iban"] || PLATFORM_TRY_IBAN;

  return {
    ...DEPOSIT_INSTRUCTIONS,
    TON: {
      ...DEPOSIT_INSTRUCTIONS.TON,
      details: [
        { label: "Platform TON Wallet", value: tonWallet },
        { label: "Network", value: "The Open Network (TON)" },
      ],
    },
    USDT: {
      ...DEPOSIT_INSTRUCTIONS.USDT,
      details: [
        { label: "Deposit Address (TRC-20)", value: tronWallet },
        { label: "Network", value: "TRON (TRC-20)" },
        { label: "Minimum Deposit", value: "10 USDT" },
      ],
    },
    EUR: {
      ...DEPOSIT_INSTRUCTIONS.EUR,
      details: [
        { label: "Beneficiary", value: bank },
        { label: "IBAN", value: eurIban },
        { label: "BIC / SWIFT", value: eurBic },
        { label: "Currency", value: "EUR" },
      ],
    },
    NOK: {
      ...DEPOSIT_INSTRUCTIONS.NOK,
      details: [
        { label: "Account Holder", value: bank },
        { label: "Account Number", value: nokAccount },
        { label: "Currency", value: "NOK" },
      ],
    },
    TRY: {
      ...DEPOSIT_INSTRUCTIONS.TRY,
      details: [
        { label: "Beneficiary", value: bank },
        { label: "IBAN", value: tryIban },
        { label: "Currency", value: "TRY" },
      ],
    },
  };
}
