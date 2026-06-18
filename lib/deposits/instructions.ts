import type { AssetCode, PaymentMethod } from "@/lib/generated/prisma/enums";
import type { PlatformSettings } from "@/lib/settings/platform";
import type { Lang } from "@/lib/i18n/dashboard";

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
const PLATFORM_BANK_NAME_EN = "3REAL Platform Bank";
const PLATFORM_BANK_NAME_FA = "بانک پلتفرم 3REAL";

// Every asset is manually reviewed by an admin during beta — no automated
// on-chain or bank-feed detection is wired up for any asset yet (confirmed:
// ton.api_key / ton.deposit_address are empty, and there is no
// TronGrid/TronScan integration for USDT). Do not describe any asset as
// "automatic" or "credited after N confirmations" until that's actually true.
const DEPOSIT_INSTRUCTIONS_EN: Record<AssetCode, DepositInstruction> = {
  REAL: {
    paymentMethod: "ton",
    steps: [
      "Connect a TON wallet from the Wallet page.",
      "Send REAL Jetton from your connected wallet to the platform deposit address shown on the deposit page.",
      "Submit the transaction hash and a screenshot as proof below — an admin reviews and approves it manually.",
    ],
    details: [
      { label: "Token", value: "REAL (TON Jetton)" },
      { label: "Network", value: "The Open Network (TON)" },
      { label: "Minimum Deposit", value: "1 REAL" },
    ],
    refLabel: "Transaction Hash",
    refRequired: false,
    proofLabel: "Screenshot (optional)",
    note: "REAL deposits are reviewed manually during beta. Automated on-chain detection is not active until our TON integration is fully verified — your balance is credited only after an admin approves the request.",
  },
  TON: {
    paymentMethod: "ton",
    steps: [
      "Transfer TON to the platform wallet address below.",
      "Include your reference code in the transfer memo/comment field.",
      "Paste the transaction hash and submit your request.",
    ],
    details: [
      { label: "Platform TON Wallet", value: PLATFORM_TON_WALLET },
      { label: "Network", value: "The Open Network (TON)" },
    ],
    refLabel: "Transaction Hash",
    refRequired: false,
    proofLabel: "Screenshot / proof of transfer",
    note: "TON deposits are reviewed and credited manually by an admin. No automated on-chain monitoring is active at this time.",
  },
  USDT: {
    paymentMethod: "usdt_trc20",
    steps: [
      "Send USDT via the TRC-20 network to the address below.",
      "Do NOT send via ERC-20 or any other network — funds will be lost.",
      "Paste the transaction hash from TRONSCAN and submit your request.",
    ],
    details: [
      { label: "Deposit Address (TRC-20)", value: PLATFORM_TRON_WALLET },
      { label: "Network", value: "TRON (TRC-20)" },
      { label: "Minimum Deposit", value: "10 USDT" },
    ],
    refLabel: "TRC-20 Transaction Hash",
    refRequired: true,
    proofLabel: "TRONSCAN screenshot (optional)",
    note: "USDT deposits are reviewed and credited manually by an admin — there is no automated TRON network monitoring yet. Always double-check the network: sending on ERC-20 will result in permanent loss of funds.",
  },
  EUR: {
    paymentMethod: "sepa",
    steps: [
      "Initiate a SEPA bank transfer to the account details below.",
      "Use your reference code as the payment description/reference.",
      "Submit this form after completing the transfer.",
    ],
    details: [
      { label: "Beneficiary", value: PLATFORM_BANK_NAME_EN },
      { label: "IBAN", value: PLATFORM_EUR_IBAN },
      { label: "BIC / SWIFT", value: PLATFORM_EUR_BIC },
      { label: "Currency", value: "EUR" },
    ],
    refLabel: "Payment Reference",
    refRequired: true,
    proofLabel: "Bank transfer receipt (optional)",
    note: "EUR deposits are reviewed manually by an admin after the bank transfer arrives (typically 1–2 business days). You MUST include your reference code in the payment description, otherwise your deposit cannot be matched.",
  },
  NOK: {
    paymentMethod: "bank_transfer",
    steps: [
      "Transfer NOK to the account number below via Norwegian bank transfer.",
      "Use your reference code as the KID / payment reference.",
      "Submit this form after completing the transfer.",
    ],
    details: [
      { label: "Account Holder", value: PLATFORM_BANK_NAME_EN },
      { label: "Account Number", value: PLATFORM_NOK_ACCOUNT },
      { label: "Currency", value: "NOK" },
    ],
    refLabel: "Payment Reference",
    refRequired: true,
    proofLabel: "Bank transfer receipt (optional)",
    note: "NOK deposits are reviewed manually by an admin after the bank transfer arrives (typically 1–2 business days). Include your reference code as the KID or payment reference.",
  },
  TRY: {
    paymentMethod: "bank_transfer",
    steps: [
      "Initiate a Turkish bank (EFT/FAST) transfer to the IBAN below.",
      "Use your reference code as the transfer description.",
      "Submit this form after completing the transfer.",
    ],
    details: [
      { label: "Beneficiary", value: PLATFORM_BANK_NAME_EN },
      { label: "IBAN", value: PLATFORM_TRY_IBAN },
      { label: "Currency", value: "TRY" },
    ],
    refLabel: "Payment Reference",
    refRequired: true,
    proofLabel: "Bank transfer receipt (optional)",
    note: "TRY deposits are reviewed manually by an admin after the bank transfer arrives (typically 1–2 business days). Include your reference code as the transfer description.",
  },
};

const DEPOSIT_INSTRUCTIONS_FA: Record<AssetCode, DepositInstruction> = {
  REAL: {
    paymentMethod: "ton",
    steps: [
      "از صفحه کیف پول، یک کیف پول TON متصل کنید.",
      "REAL Jetton را از کیف پول متصل خود به آدرس واریز پلتفرم که در صفحه واریز نمایش داده می‌شود ارسال کنید.",
      "هش تراکنش و یک تصویر اسکرین‌شات را به‌عنوان مدرک در زیر ارسال کنید — یک ادمین آن را به‌صورت دستی بررسی و تأیید می‌کند.",
    ],
    details: [
      { label: "توکن", value: "REAL (TON Jetton)" },
      { label: "شبکه", value: "The Open Network (TON)" },
      { label: "حداقل واریز", value: "۱ REAL" },
    ],
    refLabel: "هش تراکنش",
    refRequired: false,
    proofLabel: "اسکرین‌شات (اختیاری)",
    note: "واریز REAL در دوران بتا به‌صورت دستی بررسی می‌شود. تشخیص خودکار روی زنجیره تا زمان تأیید کامل یکپارچه‌سازی TON فعال نیست — موجودی شما تنها پس از تأیید درخواست توسط ادمین اعتبار می‌یابد.",
  },
  TON: {
    paymentMethod: "ton",
    steps: [
      "TON را به آدرس کیف پول پلتفرم زیر منتقل کنید.",
      "کد ارجاع خود را در فیلد یادداشت/کامنت تراکنش وارد کنید.",
      "هش تراکنش را وارد کرده و درخواست خود را ارسال کنید.",
    ],
    details: [
      { label: "کیف پول TON پلتفرم", value: PLATFORM_TON_WALLET },
      { label: "شبکه", value: "The Open Network (TON)" },
    ],
    refLabel: "هش تراکنش",
    refRequired: false,
    proofLabel: "اسکرین‌شات / مدرک انتقال",
    note: "واریز TON به‌صورت دستی توسط ادمین بررسی و اعتبار داده می‌شود. در حال حاضر هیچ نظارت خودکار روی زنجیره فعال نیست.",
  },
  USDT: {
    paymentMethod: "usdt_trc20",
    steps: [
      "USDT را از طریق شبکه TRC-20 به آدرس زیر ارسال کنید.",
      "هرگز از طریق ERC-20 یا هر شبکه دیگری ارسال نکنید — وجه از بین می‌رود.",
      "هش تراکنش را از TRONSCAN کپی کرده و درخواست خود را ارسال کنید.",
    ],
    details: [
      { label: "آدرس واریز (TRC-20)", value: PLATFORM_TRON_WALLET },
      { label: "شبکه", value: "TRON (TRC-20)" },
      { label: "حداقل واریز", value: "۱۰ USDT" },
    ],
    refLabel: "هش تراکنش TRC-20",
    refRequired: true,
    proofLabel: "اسکرین‌شات TRONSCAN (اختیاری)",
    note: "واریز USDT به‌صورت دستی توسط ادمین بررسی و اعتبار داده می‌شود — هنوز نظارت خودکار شبکه TRON فعال نیست. همیشه شبکه را دوباره بررسی کنید: ارسال از طریق ERC-20 باعث از دست رفتن همیشگی وجه می‌شود.",
  },
  EUR: {
    paymentMethod: "sepa",
    steps: [
      "یک انتقال بانکی SEPA به جزئیات حساب زیر انجام دهید.",
      "کد ارجاع خود را به‌عنوان توضیح/مرجع پرداخت استفاده کنید.",
      "پس از تکمیل انتقال، این فرم را ارسال کنید.",
    ],
    details: [
      { label: "ذی‌نفع", value: PLATFORM_BANK_NAME_FA },
      { label: "IBAN", value: PLATFORM_EUR_IBAN },
      { label: "BIC / SWIFT", value: PLATFORM_EUR_BIC },
      { label: "ارز", value: "EUR" },
    ],
    refLabel: "مرجع پرداخت",
    refRequired: true,
    proofLabel: "رسید انتقال بانکی (اختیاری)",
    note: "واریز یورو پس از رسیدن انتقال بانکی (معمولاً ۱ تا ۲ روز کاری) به‌صورت دستی توسط ادمین بررسی می‌شود. باید کد ارجاع خود را در توضیح پرداخت وارد کنید، در غیر این صورت واریز شما قابل تطبیق نخواهد بود.",
  },
  NOK: {
    paymentMethod: "bank_transfer",
    steps: [
      "NOK را از طریق انتقال بانکی نروژی به شماره حساب زیر منتقل کنید.",
      "کد ارجاع خود را به‌عنوان KID / مرجع پرداخت استفاده کنید.",
      "پس از تکمیل انتقال، این فرم را ارسال کنید.",
    ],
    details: [
      { label: "صاحب حساب", value: PLATFORM_BANK_NAME_FA },
      { label: "شماره حساب", value: PLATFORM_NOK_ACCOUNT },
      { label: "ارز", value: "NOK" },
    ],
    refLabel: "مرجع پرداخت",
    refRequired: true,
    proofLabel: "رسید انتقال بانکی (اختیاری)",
    note: "واریز کرون نروژ پس از رسیدن انتقال بانکی (معمولاً ۱ تا ۲ روز کاری) به‌صورت دستی توسط ادمین بررسی می‌شود. کد ارجاع خود را به‌عنوان KID یا مرجع پرداخت وارد کنید.",
  },
  TRY: {
    paymentMethod: "bank_transfer",
    steps: [
      "یک انتقال بانکی ترکیه (EFT/FAST) به شماره IBAN زیر انجام دهید.",
      "کد ارجاع خود را به‌عنوان توضیح انتقال استفاده کنید.",
      "پس از تکمیل انتقال، این فرم را ارسال کنید.",
    ],
    details: [
      { label: "ذی‌نفع", value: PLATFORM_BANK_NAME_FA },
      { label: "IBAN", value: PLATFORM_TRY_IBAN },
      { label: "ارز", value: "TRY" },
    ],
    refLabel: "مرجع پرداخت",
    refRequired: true,
    proofLabel: "رسید انتقال بانکی (اختیاری)",
    note: "واریز لیر ترکیه پس از رسیدن انتقال بانکی (معمولاً ۱ تا ۲ روز کاری) به‌صورت دستی توسط ادمین بررسی می‌شود. کد ارجاع خود را به‌عنوان توضیح انتقال وارد کنید.",
  },
};

export const DEPOSIT_INSTRUCTIONS: Record<Lang, Record<AssetCode, DepositInstruction>> = {
  en: DEPOSIT_INSTRUCTIONS_EN,
  fa: DEPOSIT_INSTRUCTIONS_FA,
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
  platform: PlatformSettings,
  lang: Lang = "en"
): Record<AssetCode, DepositInstruction> {
  const base = DEPOSIT_INSTRUCTIONS[lang];
  const bankName = lang === "fa" ? PLATFORM_BANK_NAME_FA : PLATFORM_BANK_NAME_EN;
  const bank = platform["platform.bank_name"] || bankName;
  const tonWallet = platform["platform.ton_wallet"] || PLATFORM_TON_WALLET;
  const tronWallet = platform["platform.tron_wallet"] || PLATFORM_TRON_WALLET;
  const eurIban = platform["platform.eur_iban"] || PLATFORM_EUR_IBAN;
  const eurBic = platform["platform.eur_bic"] || PLATFORM_EUR_BIC;
  const nokAccount = platform["platform.nok_account"] || PLATFORM_NOK_ACCOUNT;
  const tryIban = platform["platform.try_iban"] || PLATFORM_TRY_IBAN;

  return {
    ...base,
    TON: {
      ...base.TON,
      details: [
        { label: base.TON.details[0].label, value: tonWallet },
        base.TON.details[1],
      ],
    },
    USDT: {
      ...base.USDT,
      details: [
        { label: base.USDT.details[0].label, value: tronWallet },
        base.USDT.details[1],
        base.USDT.details[2],
      ],
    },
    EUR: {
      ...base.EUR,
      details: [
        { label: base.EUR.details[0].label, value: bank },
        { label: base.EUR.details[1].label, value: eurIban },
        { label: base.EUR.details[2].label, value: eurBic },
        base.EUR.details[3],
      ],
    },
    NOK: {
      ...base.NOK,
      details: [
        { label: base.NOK.details[0].label, value: bank },
        { label: base.NOK.details[1].label, value: nokAccount },
        base.NOK.details[2],
      ],
    },
    TRY: {
      ...base.TRY,
      details: [
        { label: base.TRY.details[0].label, value: bank },
        { label: base.TRY.details[1].label, value: tryIban },
        base.TRY.details[2],
      ],
    },
  };
}
