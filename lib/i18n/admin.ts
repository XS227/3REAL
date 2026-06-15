import type { Lang } from "./dashboard";

export type { Lang };

export interface AdminDict {
  badge: string;
  nav: {
    dashboard: string;
    kyc: string;
    deposits: string;
    withdrawals: string;
    referrals: string;
    users: string;
    reports: string;
    analytics: string;
    reconciliation: string;
    auditLog: string;
    tonDeposits: string;
    tonSettings: string;
    settings: string;
  };
  user: {
    logout: string;
    roles: Record<string, string>;
  };
  lang: {
    toggle: string;
  };
}

export const adminDicts: Record<Lang, AdminDict> = {
  en: {
    badge: "Admin",
    nav: {
      dashboard: "Dashboard",
      kyc: "KYC Review",
      deposits: "Deposits",
      withdrawals: "Withdrawals",
      referrals: "Referrals",
      users: "Users",
      reports: "Reports",
      analytics: "Analytics",
      reconciliation: "Reconciliation",
      auditLog: "Audit Log",
      tonDeposits: "TON Deposits",
      tonSettings: "TON Settings",
      settings: "Settings",
    },
    user: {
      logout: "Log out",
      roles: {
        super_admin: "Super Admin",
        operator: "Operator",
      },
    },
    lang: { toggle: "FA" },
  },

  fa: {
    badge: "ادمین",
    nav: {
      dashboard: "داشبورد",
      kyc: "بررسی احراز هویت",
      deposits: "واریزها",
      withdrawals: "برداشت‌ها",
      referrals: "معرفی‌ها",
      users: "کاربران",
      reports: "گزارش‌ها",
      analytics: "آمار",
      reconciliation: "تطبیق حساب",
      auditLog: "گزارش فعالیت",
      tonDeposits: "واریزهای TON",
      tonSettings: "تنظیمات TON",
      settings: "تنظیمات پلتفرم",
    },
    user: {
      logout: "خروج",
      roles: {
        super_admin: "مدیر ارشد",
        operator: "اپراتور",
      },
    },
    lang: { toggle: "EN" },
  },
};

export function resolveAdminLang(value: string | undefined): Lang {
  return value === "fa" ? "fa" : "en";
}
