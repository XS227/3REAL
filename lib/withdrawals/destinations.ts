import type { AssetCode } from "@/lib/generated/prisma/enums";
import type { Lang } from "@/lib/i18n/dashboard";

export type DestinationField = {
  id: string;
  label: string;
  placeholder: string;
  hint?: string;
};

export type WithdrawalConfig = {
  destinationLabel: string;
  destinationFields: DestinationField[];
  note?: string;
};

const WITHDRAWAL_CONFIG_EN: Record<AssetCode, WithdrawalConfig> = {
  REAL: {
    destinationLabel: "TON Wallet Address",
    destinationFields: [
      {
        id: "address",
        label: "TON Wallet Address",
        placeholder: "EQC...",
        hint: "Your TON wallet address (EQ…, UQ…, or 0:hex format). Must support Jetton tokens.",
      },
    ],
    note: "REAL withdrawals are processed manually. Once approved, the platform will send REAL to your TON wallet — no action required from you. Processing time: 1–24 hours.",
  },
  TON: {
    destinationLabel: "TON Wallet Address",
    destinationFields: [
      {
        id: "address",
        label: "TON Wallet Address",
        placeholder: "EQC...",
        hint: "Your TON-compatible wallet address (EQ... or UQ... format).",
      },
    ],
    note: "TON withdrawals are processed manually (1–24 hours).",
  },
  USDT: {
    destinationLabel: "USDT TRC-20 Address",
    destinationFields: [
      {
        id: "address",
        label: "TRC-20 Wallet Address",
        placeholder: "T...",
        hint: "Must be a valid TRON (TRC-20) address starting with T.",
      },
    ],
    note: "USDT withdrawals are processed manually (1–24 hours). Do NOT enter an ERC-20 or other network address. Sending to a wrong network will result in permanent loss.",
  },
  EUR: {
    destinationLabel: "Bank Account (SEPA)",
    destinationFields: [
      {
        id: "iban",
        label: "IBAN",
        placeholder: "DE00 0000 0000 0000 0000 00",
        hint: "Your IBAN including country code. Spaces are allowed.",
      },
      {
        id: "bic",
        label: "BIC / SWIFT",
        placeholder: "XXXXXXXX",
        hint: "8 or 11 character bank identifier code.",
      },
      {
        id: "account_holder",
        label: "Account Holder Name",
        placeholder: "Full name as on bank account",
      },
    ],
    note: "EUR withdrawals are processed manually via SEPA transfer (1–2 business days).",
  },
  NOK: {
    destinationLabel: "Norwegian Bank Account",
    destinationFields: [
      {
        id: "account_number",
        label: "Account Number",
        placeholder: "0000 00 00000",
        hint: "11-digit Norwegian bank account number.",
      },
      {
        id: "account_holder",
        label: "Account Holder Name",
        placeholder: "Full name as on bank account",
      },
    ],
    note: "NOK withdrawals are processed manually via Norwegian bank transfer (1–2 business days).",
  },
  TRY: {
    destinationLabel: "Turkish Bank Account (IBAN)",
    destinationFields: [
      {
        id: "iban",
        label: "IBAN",
        placeholder: "TR00 0000 0000 0000 0000 0000 00",
        hint: "Turkish IBAN (26 characters, starts with TR).",
      },
      {
        id: "account_holder",
        label: "Account Holder Name",
        placeholder: "Full name as on bank account",
      },
    ],
    note: "TRY withdrawals are processed manually via EFT/FAST bank transfer (1–2 business days).",
  },
};

const WITHDRAWAL_CONFIG_FA: Record<AssetCode, WithdrawalConfig> = {
  REAL: {
    destinationLabel: "آدرس کیف پول TON",
    destinationFields: [
      {
        id: "address",
        label: "آدرس کیف پول TON",
        placeholder: "EQC...",
        hint: "آدرس کیف پول TON شما (فرمت EQ…، UQ… یا 0:hex). باید از توکن‌های Jetton پشتیبانی کند.",
      },
    ],
    note: "برداشت REAL به‌صورت دستی پردازش می‌شود. پس از تأیید، پلتفرم REAL را به کیف پول TON شما ارسال می‌کند — هیچ اقدامی از طرف شما لازم نیست. زمان پردازش: ۱ تا ۲۴ ساعت.",
  },
  TON: {
    destinationLabel: "آدرس کیف پول TON",
    destinationFields: [
      {
        id: "address",
        label: "آدرس کیف پول TON",
        placeholder: "EQC...",
        hint: "آدرس کیف پول سازگار با TON شما (فرمت EQ... یا UQ...).",
      },
    ],
    note: "برداشت TON به‌صورت دستی پردازش می‌شود (۱ تا ۲۴ ساعت).",
  },
  USDT: {
    destinationLabel: "آدرس USDT TRC-20",
    destinationFields: [
      {
        id: "address",
        label: "آدرس کیف پول TRC-20",
        placeholder: "T...",
        hint: "باید یک آدرس معتبر TRON (TRC-20) باشد که با T شروع می‌شود.",
      },
    ],
    note: "برداشت USDT به‌صورت دستی پردازش می‌شود (۱ تا ۲۴ ساعت). هرگز آدرس ERC-20 یا شبکه دیگری وارد نکنید. ارسال به شبکه اشتباه باعث از دست رفتن همیشگی وجه می‌شود.",
  },
  EUR: {
    destinationLabel: "حساب بانکی (SEPA)",
    destinationFields: [
      {
        id: "iban",
        label: "IBAN",
        placeholder: "DE00 0000 0000 0000 0000 00",
        hint: "IBAN شما همراه با کد کشور. فاصله مجاز است.",
      },
      {
        id: "bic",
        label: "BIC / SWIFT",
        placeholder: "XXXXXXXX",
        hint: "کد شناسایی بانکی ۸ یا ۱۱ کاراکتری.",
      },
      {
        id: "account_holder",
        label: "نام صاحب حساب",
        placeholder: "نام کامل مطابق حساب بانکی",
      },
    ],
    note: "برداشت یورو از طریق انتقال SEPA به‌صورت دستی پردازش می‌شود (۱ تا ۲ روز کاری).",
  },
  NOK: {
    destinationLabel: "حساب بانکی نروژی",
    destinationFields: [
      {
        id: "account_number",
        label: "شماره حساب",
        placeholder: "0000 00 00000",
        hint: "شماره حساب بانکی نروژی ۱۱ رقمی.",
      },
      {
        id: "account_holder",
        label: "نام صاحب حساب",
        placeholder: "نام کامل مطابق حساب بانکی",
      },
    ],
    note: "برداشت کرون نروژ از طریق انتقال بانکی نروژی به‌صورت دستی پردازش می‌شود (۱ تا ۲ روز کاری).",
  },
  TRY: {
    destinationLabel: "حساب بانکی ترکیه (IBAN)",
    destinationFields: [
      {
        id: "iban",
        label: "IBAN",
        placeholder: "TR00 0000 0000 0000 0000 0000 00",
        hint: "آیبان ترکیه (۲۶ کاراکتر، با TR شروع می‌شود).",
      },
      {
        id: "account_holder",
        label: "نام صاحب حساب",
        placeholder: "نام کامل مطابق حساب بانکی",
      },
    ],
    note: "برداشت لیر ترکیه از طریق انتقال بانکی EFT/FAST به‌صورت دستی پردازش می‌شود (۱ تا ۲ روز کاری).",
  },
};

export const WITHDRAWAL_CONFIG_BY_LANG: Record<Lang, Record<AssetCode, WithdrawalConfig>> = {
  en: WITHDRAWAL_CONFIG_EN,
  fa: WITHDRAWAL_CONFIG_FA,
};

// Back-compat default (English) for any caller that hasn't been updated to pass a lang.
export const WITHDRAWAL_CONFIG = WITHDRAWAL_CONFIG_EN;

export const WITHDRAWAL_MINIMUMS: Record<AssetCode, number> = {
  REAL: 10,
  TON: 1,
  USDT: 10,
  EUR: 10,
  NOK: 100,
  TRY: 300,
};
