import type { AssetCode } from "@/lib/generated/prisma/enums";

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

export const WITHDRAWAL_CONFIG: Record<AssetCode, WithdrawalConfig> = {
  REAL: {
    destinationLabel: "TON Wallet Address",
    destinationFields: [
      {
        id: "address",
        label: "TON Wallet Address",
        placeholder: "EQC...",
        hint: "Your TON wallet address that holds or can receive REAL Jettons.",
      },
    ],
    note: "REAL tokens are sent to TON wallets. Ensure your wallet supports Jetton tokens.",
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
    note: "Do NOT enter an ERC-20 or other network address. Sending to a wrong network will result in permanent loss.",
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
    note: "EUR withdrawals are processed via SEPA transfer (1–2 business days).",
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
    note: "NOK withdrawals are processed via Norwegian bank transfer (1–2 business days).",
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
    note: "TRY withdrawals are processed via EFT/FAST bank transfer (1–2 business days).",
  },
};

export const WITHDRAWAL_MINIMUMS: Record<AssetCode, number> = {
  REAL: 10,
  TON: 1,
  USDT: 10,
  EUR: 10,
  NOK: 100,
  TRY: 300,
};
