export type Lang = "en" | "fa";

export interface DashboardDict {
  nav: {
    dashboard: string;
    wallet: string;
    deposit: string;
    transactions: string;
    withdraw: string;
    referrals: string;
    verification: string;
    notifications: string;
    settings: string;
    admin: string;
    soon: string;
  };
  user: {
    logout: string;
  };
  lang: {
    toggle: string; // label shown on the switcher button
  };
  dashboard: {
    welcomeBack: string;
    emailVerified: string;
    emailUnverified: string;
    kyc: string;
    kycLabels: Record<number, string>;
    balanceCard: {
      title: string;
      available: string;
      pending: string;
      deposit: string;
      withdraw: string;
    };
    walletCard: {
      title: string;
      available: string;
      pending: string;
      viewHistory: string;
    };
    referralCard: {
      title: string;
      yourCode: string;
      copyLink: string;
      copied: string;
      invited: string;
      pending: string;
      earned: string;
      shareVia: string;
    };
    profileCard: {
      title: string;
      completion: string;
      emailVerified: string;
      kycApproved: string;
      twoFa: string;
      completeKyc: string;
      kycStatus: Record<string, string>;
      kycTier: Record<number, string>;
    };
    recentActivity: {
      title: string;
      noActivity: string;
      actions: Record<string, string>;
    };
    recentTransactions: {
      title: string;
      noTransactions: string;
      deposit: string;
      withdrawal: string;
      statusLabels: Record<string, string>;
    };
    ecosystem: {
      title: string;
      comingSoon: string;
      active: string;
    };
  };
  wallet: {
    title: string;
    subtitle: string;
    available: string;
    pending: string;
    viewHistory: string;
    noHistory: string;
    ledgerHistory: string;
    accountExplorer: string;
    assets: Record<string, string>;
    assetsSection: string;
    tonSection: string;
    connectWallet: string;
    noTonWallets: string;
    connectTonCta: string;
    details: string;
    primary: string;
    ledgerSection: string;
  };
  deposit: {
    title: string;
    subtitle: string;
    autoCredit: string;
    manualApproval: string;
    selectAsset: string;
    yourDeposits: string;
    allHistory: string;
    form: {
      amount: string;
      reference: string;
      proof: string;
      submit: string;
      submitting: string;
      success: string;
      minAmount: string;
      requiresKyc: string;
    };
    status: Record<string, string>;
  };
  withdraw: {
    title: string;
    subtitle: string;
    yourWithdrawals: string;
    form: {
      amount: string;
      destination: string;
      available: string;
      submit: string;
      submitting: string;
      success: string;
      requiresKyc: string;
    };
    status: Record<string, string>;
  };
  kyc: {
    title: string;
    subtitle: string;
    docLabels: Record<string, string>;
    status: Record<string, string>;
    upload: string;
    reupload: string;
    submit: string;
    submitting: string;
    whatUnlocked: string;
    tier2Benefits: string[];
    processTitle: string;
    processSteps: string[];
    uploadTitle: string;
    submittedTitle: string;
    underReviewNote: string;
    approvedTitle: string;
    approvedDesc: string;
  };
  referrals: {
    title: string;
    subtitle: string;
    stats: {
      invited: string;
      pending: string;
      earned: string;
      tier1: string;
      tier2: string;
      totalInvites: string;
      activeReferrals: string;
      lifetimeReal: string;
      awaitingActivity: string;
      fromReferrals: string;
      allReferralRewards: string;
    };
    shareTitle: string;
    yourLink: string;
    yourCode: string;
    copy: string;
    copied: string;
    qrCode: string;
    calculator: string;
    inviteTable: string;
    rewardHistory: string;
    poolBalance: string;
    howItWorks: string;
  };
  notifications: {
    title: string;
    markAllRead: string;
    empty: string;
    emptyDesc: string;
    loadMore: string;
    loading: string;
    unreadSuffix: string;
    types: Record<string, string>;
  };
}

const statusLabels = {
  en: {
    pending: "Pending",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    processing: "Processing",
    cancelled: "Cancelled",
  },
  fa: {
    pending: "در انتظار",
    under_review: "در حال بررسی",
    approved: "تأیید شده",
    rejected: "رد شده",
    completed: "تکمیل شده",
    processing: "در حال پردازش",
    cancelled: "لغو شده",
  },
};

export const dashboardDicts: Record<Lang, DashboardDict> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      wallet: "Wallet",
      deposit: "Deposit",
      transactions: "Transactions",
      withdraw: "Withdraw",
      referrals: "Referrals",
      verification: "Verification",
      notifications: "Notifications",
      settings: "Settings",
      admin: "Admin",
      soon: "Soon",
    },
    user: { logout: "Sign out" },
    lang: { toggle: "فارسی" },
    dashboard: {
      welcomeBack: "Welcome back",
      emailVerified: "Email verified",
      emailUnverified: "Email unverified",
      kyc: "KYC",
      kycLabels: { 0: "Not verified", 1: "Email tier", 2: "ID verified", 3: "Full KYC" },
      balanceCard: {
        title: "REAL Balance",
        available: "Available",
        pending: "Pending",
        deposit: "Deposit",
        withdraw: "Withdraw",
      },
      walletCard: {
        title: "Multi-Asset Wallet",
        available: "Available",
        pending: "Pending",
        viewHistory: "View history",
      },
      referralCard: {
        title: "Referral Program",
        yourCode: "Your referral code",
        copyLink: "Copy link",
        copied: "Copied!",
        invited: "Invited",
        pending: "Pending",
        earned: "Earned",
        shareVia: "Share via",
      },
      profileCard: {
        title: "Profile",
        completion: "completion",
        emailVerified: "Email verified",
        kycApproved: "KYC approved",
        twoFa: "2FA enabled",
        completeKyc: "Complete KYC",
        kycStatus: {
          not_started: "Not submitted",
          pending: "Pending review",
          under_review: "Under review",
          approved: "Approved",
          rejected: "Rejected",
          update_requested: "Update requested",
        },
        kycTier: { 0: "Not verified", 1: "Email tier", 2: "ID verified", 3: "Full KYC" },
      },
      recentActivity: {
        title: "Recent Activity",
        noActivity: "No activity yet",
        actions: {
          "auth.register": "Registered account",
          "auth.login": "Signed in",
          "auth.logout": "Signed out",
          "auth.email_verified": "Email verified",
          "auth.password_reset_requested": "Password reset requested",
          "auth.password_reset": "Password reset",
          "auth.failed_login": "Failed sign-in attempt",
          "auth.google_linked": "Google account linked",
          "kyc.submitted": "KYC submitted",
          "kyc.approved": "KYC approved",
          "kyc.rejected": "KYC rejected",
          "kyc.update_requested": "KYC update requested",
          "deposit.submitted": "Deposit submitted",
          "deposit.approved": "Deposit approved",
          "deposit.rejected": "Deposit rejected",
          "withdrawal.submitted": "Withdrawal submitted",
          "withdrawal.approved": "Withdrawal approved",
          "withdrawal.rejected": "Withdrawal rejected",
        },
      },
      recentTransactions: {
        title: "Recent Transactions",
        noTransactions: "No transactions yet",
        deposit: "Deposit",
        withdrawal: "Withdrawal",
        statusLabels: statusLabels.en,
      },
      ecosystem: {
        title: "SETAEI Ecosystem",
        comingSoon: "Coming soon",
        active: "Active",
      },
    },
    wallet: {
      title: "Wallet",
      subtitle: "Your multi-asset balances and transaction history",
      available: "Available",
      pending: "Pending",
      viewHistory: "View history",
      noHistory: "No transactions yet",
      ledgerHistory: "Ledger History",
      accountExplorer: "Account Explorer",
      assets: {
        REAL: "REAL Token",
        TON: "Toncoin",
        USDT: "Tether USD",
        EUR: "Euro",
        NOK: "Norwegian Krone",
        TRY: "Turkish Lira",
      },
      assetsSection: "Assets",
      tonSection: "TON Wallets",
      connectWallet: "Connect Wallet",
      noTonWallets: "No TON wallets linked",
      connectTonCta: "Connect a TON wallet",
      details: "Details",
      primary: "Primary",
      ledgerSection: "Ledger Accounts",
    },
    deposit: {
      title: "Deposit",
      subtitle: "Add funds to your 3REAL account",
      autoCredit: "Send REAL Jetton from a connected TON wallet. Credits are automatic.",
      manualApproval: "Submit a deposit request. Funds are credited after admin approval.",
      selectAsset: "Select asset",
      yourDeposits: "Your Deposits",
      allHistory: "All Deposit History",
      form: {
        amount: "Amount",
        reference: "Payment reference",
        proof: "Proof of payment",
        submit: "Submit deposit",
        submitting: "Submitting…",
        success: "Deposit submitted successfully",
        minAmount: "Minimum amount",
        requiresKyc: "Requires KYC verification",
      },
      status: statusLabels.en,
    },
    withdraw: {
      title: "Withdraw",
      subtitle: "Withdraw funds from your 3REAL account",
      yourWithdrawals: "Your Withdrawals",
      form: {
        amount: "Amount",
        destination: "Destination address / account",
        available: "Available",
        submit: "Submit withdrawal",
        submitting: "Submitting…",
        success: "Withdrawal submitted successfully",
        requiresKyc: "Requires KYC tier 2 or higher",
      },
      status: statusLabels.en,
    },
    kyc: {
      title: "Identity Verification",
      subtitle: "Upload your documents to unlock higher limits",
      docLabels: {
        id_front: "Passport",
        id_back: "National ID",
        selfie: "Selfie with Document",
        address_proof: "Proof of Address",
      },
      status: {
        not_started: "Not started",
        pending: "Pending review",
        under_review: "Under review",
        approved: "Approved",
        rejected: "Rejected",
        update_requested: "Update requested",
      },
      upload: "Upload",
      reupload: "Re-upload",
      submit: "Submit for review",
      submitting: "Submitting…",
      whatUnlocked: "What you unlock at KYC Tier 2",
      tier2Benefits: [
        "Full deposit & withdrawal access",
        "Increased transaction limits",
        "Reduced platform fees",
        "Priority support",
      ],
      processTitle: "Verification Process",
      processSteps: [
        "Submit your identity documents using the form above.",
        "Our compliance team reviews your submission within 1–3 business days.",
        "You will be notified of the result. If updates are needed, you can re-submit.",
        "Once approved, your KYC tier is upgraded instantly.",
      ],
      uploadTitle: "Upload Documents",
      submittedTitle: "Submitted Documents",
      underReviewNote: "Your documents are under review. You cannot make changes at this time.",
      approvedTitle: "Verification Complete",
      approvedDesc: "Your identity has been verified. You now have full access to all platform features.",
    },
    referrals: {
      title: "Referral Program",
      subtitle: "Earn REAL by inviting friends · 50 REAL per direct referral · 15 REAL per indirect",
      stats: {
        invited: "Invited",
        pending: "Pending",
        earned: "Earned (REAL)",
        tier1: "Tier 1",
        tier2: "Tier 2",
        totalInvites: "Total Invites",
        activeReferrals: "Active Referrals",
        lifetimeReal: "Lifetime REAL",
        awaitingActivity: "Awaiting activity",
        fromReferrals: "From referrals",
        allReferralRewards: "All referral rewards",
      },
      shareTitle: "Share Your Referral",
      yourCode: "Your code",
      yourLink: "Your link",
      copy: "Copy",
      copied: "Copied!",
      qrCode: "QR Code",
      calculator: "Earnings Calculator",
      inviteTable: "Your Invites",
      rewardHistory: "Reward History",
      poolBalance: "Rewards pool balance",
      howItWorks: "How it works",
    },
    notifications: {
      title: "Notifications",
      markAllRead: "Mark all as read",
      empty: "No notifications yet",
      emptyDesc: "You'll be notified about KYC reviews, deposits, withdrawals, and referral rewards.",
      loadMore: "Load more",
      loading: "Loading…",
      unreadSuffix: "unread",
      types: {
        kyc_approved: "KYC Approved",
        kyc_rejected: "KYC Rejected",
        kyc_update_requested: "KYC Update Requested",
        deposit_approved: "Deposit Approved",
        deposit_rejected: "Deposit Rejected",
        withdrawal_approved: "Withdrawal Approved",
        withdrawal_rejected: "Withdrawal Rejected",
        referral_reward: "Referral Reward",
      },
    },
  },

  fa: {
    nav: {
      dashboard: "داشبورد",
      wallet: "کیف پول",
      deposit: "واریز",
      transactions: "تراکنش‌ها",
      withdraw: "برداشت",
      referrals: "معرفی دوستان",
      verification: "احراز هویت",
      notifications: "اعلان‌ها",
      settings: "تنظیمات",
      admin: "مدیریت",
      soon: "به زودی",
    },
    user: { logout: "خروج" },
    lang: { toggle: "EN" },
    dashboard: {
      welcomeBack: "خوش آمدید",
      emailVerified: "ایمیل تأیید شده",
      emailUnverified: "ایمیل تأیید نشده",
      kyc: "احراز هویت",
      kycLabels: { 0: "تأیید نشده", 1: "سطح ایمیل", 2: "هویت تأیید شده", 3: "KYC کامل" },
      balanceCard: {
        title: "موجودی REAL",
        available: "موجود",
        pending: "در انتظار",
        deposit: "واریز",
        withdraw: "برداشت",
      },
      walletCard: {
        title: "کیف پول چند دارایی",
        available: "موجود",
        pending: "در انتظار",
        viewHistory: "مشاهده تاریخچه",
      },
      referralCard: {
        title: "برنامه معرفی",
        yourCode: "کد معرفی شما",
        copyLink: "کپی لینک",
        copied: "کپی شد!",
        invited: "دعوت شده",
        pending: "در انتظار",
        earned: "کسب شده",
        shareVia: "اشتراک‌گذاری از طریق",
      },
      profileCard: {
        title: "پروفایل",
        completion: "تکمیل شده",
        emailVerified: "ایمیل تأیید شده",
        kycApproved: "احراز هویت تأیید شده",
        twoFa: "احراز دو مرحله‌ای فعال",
        completeKyc: "تکمیل احراز هویت",
        kycStatus: {
          not_started: "ارسال نشده",
          pending: "در انتظار بررسی",
          under_review: "در حال بررسی",
          approved: "تأیید شده",
          rejected: "رد شده",
          update_requested: "نیاز به بروزرسانی",
        },
        kycTier: { 0: "تأیید نشده", 1: "سطح ایمیل", 2: "هویت تأیید شده", 3: "KYC کامل" },
      },
      recentActivity: {
        title: "فعالیت‌های اخیر",
        noActivity: "هنوز فعالیتی ثبت نشده",
        actions: {
          "auth.register": "ثبت‌نام حساب",
          "auth.login": "ورود به سیستم",
          "auth.logout": "خروج از سیستم",
          "auth.email_verified": "ایمیل تأیید شد",
          "auth.password_reset_requested": "درخواست بازنشانی رمز عبور",
          "auth.password_reset": "رمز عبور بازنشانی شد",
          "auth.failed_login": "تلاش ناموفق برای ورود",
          "auth.google_linked": "حساب گوگل متصل شد",
          "kyc.submitted": "احراز هویت ارسال شد",
          "kyc.approved": "احراز هویت تأیید شد",
          "kyc.rejected": "احراز هویت رد شد",
          "kyc.update_requested": "درخواست بروزرسانی احراز هویت",
          "deposit.submitted": "واریز ثبت شد",
          "deposit.approved": "واریز تأیید شد",
          "deposit.rejected": "واریز رد شد",
          "withdrawal.submitted": "برداشت ثبت شد",
          "withdrawal.approved": "برداشت تأیید شد",
          "withdrawal.rejected": "برداشت رد شد",
        },
      },
      recentTransactions: {
        title: "تراکنش‌های اخیر",
        noTransactions: "هنوز تراکنشی ثبت نشده",
        deposit: "واریز",
        withdrawal: "برداشت",
        statusLabels: statusLabels.fa,
      },
      ecosystem: {
        title: "اکوسیستم SETAEI",
        comingSoon: "به زودی",
        active: "فعال",
      },
    },
    wallet: {
      title: "کیف پول",
      subtitle: "موجودی چند دارایی و تاریخچه تراکنش‌های شما",
      available: "موجود",
      pending: "در انتظار",
      viewHistory: "مشاهده تاریخچه",
      noHistory: "هنوز تراکنشی ثبت نشده",
      ledgerHistory: "تاریخچه دفتر",
      accountExplorer: "مرورگر حساب",
      assets: {
        REAL: "توکن REAL",
        TON: "Toncoin",
        USDT: "تتر USD",
        EUR: "یورو",
        NOK: "کرون نروژ",
        TRY: "لیر ترکیه",
      },
      assetsSection: "دارایی‌ها",
      tonSection: "کیف‌پول‌های TON",
      connectWallet: "اتصال کیف پول",
      noTonWallets: "کیف پول TON متصل نیست",
      connectTonCta: "اتصال کیف پول TON",
      details: "جزئیات",
      primary: "اصلی",
      ledgerSection: "حساب‌های دفتر",
    },
    deposit: {
      title: "واریز",
      subtitle: "افزودن وجه به حساب 3REAL شما",
      autoCredit: "REAL Jetton را از کیف پول TON متصل ارسال کنید. اعتبار به صورت خودکار انجام می‌شود.",
      manualApproval: "درخواست واریز ارسال کنید. وجوه پس از تأیید مدیر به حساب می‌رسد.",
      selectAsset: "انتخاب دارایی",
      yourDeposits: "واریزهای شما",
      allHistory: "تمام تاریخچه واریز",
      form: {
        amount: "مبلغ",
        reference: "مرجع پرداخت",
        proof: "مدرک پرداخت",
        submit: "ارسال واریز",
        submitting: "در حال ارسال…",
        success: "واریز با موفقیت ثبت شد",
        minAmount: "حداقل مبلغ",
        requiresKyc: "نیاز به احراز هویت دارد",
      },
      status: statusLabels.fa,
    },
    withdraw: {
      title: "برداشت",
      subtitle: "برداشت وجه از حساب 3REAL شما",
      yourWithdrawals: "برداشت‌های شما",
      form: {
        amount: "مبلغ",
        destination: "آدرس مقصد / حساب",
        available: "موجود",
        submit: "ارسال درخواست برداشت",
        submitting: "در حال ارسال…",
        success: "درخواست برداشت با موفقیت ثبت شد",
        requiresKyc: "نیاز به احراز هویت سطح ۲ یا بالاتر دارد",
      },
      status: statusLabels.fa,
    },
    kyc: {
      title: "احراز هویت",
      subtitle: "مدارک خود را برای افزایش سقف تراکنش آپلود کنید",
      docLabels: {
        id_front: "پاسپورت",
        id_back: "کارت ملی",
        selfie: "سلفی با مدرک",
        address_proof: "مدرک آدرس",
      },
      status: {
        not_started: "شروع نشده",
        pending: "در انتظار بررسی",
        under_review: "در حال بررسی",
        approved: "تأیید شده",
        rejected: "رد شده",
        update_requested: "نیاز به بروزرسانی",
      },
      upload: "آپلود",
      reupload: "آپلود مجدد",
      submit: "ارسال برای بررسی",
      submitting: "در حال ارسال…",
      whatUnlocked: "چه چیزی در سطح ۲ احراز هویت باز می‌شود",
      tier2Benefits: [
        "دسترسی کامل به واریز و برداشت",
        "افزایش سقف تراکنش",
        "کاهش کارمزد پلتفرم",
        "پشتیبانی اولویت‌دار",
      ],
      processTitle: "فرآیند تأیید هویت",
      processSteps: [
        "مدارک هویتی خود را از طریق فرم بالا ارسال کنید.",
        "تیم انطباق ما در ظرف ۱ تا ۳ روز کاری بررسی می‌کند.",
        "نتیجه به شما اطلاع داده می‌شود. در صورت نیاز به اصلاح می‌توانید مجدداً ارسال کنید.",
        "پس از تأیید، سطح KYC شما فوری ارتقا می‌یابد.",
      ],
      uploadTitle: "آپلود مدارک",
      submittedTitle: "مدارک ارسال شده",
      underReviewNote: "مدارک شما در حال بررسی است. در حال حاضر امکان تغییر وجود ندارد.",
      approvedTitle: "تأیید هویت کامل شد",
      approvedDesc: "هویت شما تأیید شده است. اکنون به تمام امکانات پلتفرم دسترسی کامل دارید.",
    },
    referrals: {
      title: "برنامه معرفی",
      subtitle: "با دعوت دوستان REAL کسب کنید · ۵۰ REAL به ازای هر معرفی مستقیم · ۱۵ REAL غیرمستقیم",
      stats: {
        invited: "دعوت شده",
        pending: "در انتظار",
        earned: "کسب شده (REAL)",
        tier1: "سطح ۱",
        tier2: "سطح ۲",
        totalInvites: "مجموع دعوت‌ها",
        activeReferrals: "معرفی‌های فعال",
        lifetimeReal: "مجموع REAL",
        awaitingActivity: "در انتظار فعالیت",
        fromReferrals: "از معرفی‌ها",
        allReferralRewards: "تمام پاداش‌های معرفی",
      },
      shareTitle: "معرفی خود را به اشتراک بگذارید",
      yourCode: "کد شما",
      yourLink: "لینک شما",
      copy: "کپی",
      copied: "کپی شد!",
      qrCode: "کد QR",
      calculator: "ماشین حساب درآمد",
      inviteTable: "دعوت‌های شما",
      rewardHistory: "تاریخچه پاداش",
      poolBalance: "موجودی استخر پاداش",
      howItWorks: "نحوه کار",
    },
    notifications: {
      title: "اعلان‌ها",
      markAllRead: "همه را خوانده علامت بزن",
      empty: "هنوز اعلانی وجود ندارد",
      emptyDesc: "درباره بررسی KYC، واریز، برداشت و پاداش معرفی اطلاع‌رسانی می‌شوید.",
      loadMore: "بارگذاری بیشتر",
      loading: "در حال بارگذاری…",
      unreadSuffix: "خوانده نشده",
      types: {
        kyc_approved: "احراز هویت تأیید شد",
        kyc_rejected: "احراز هویت رد شد",
        kyc_update_requested: "درخواست بروزرسانی احراز هویت",
        deposit_approved: "واریز تأیید شد",
        deposit_rejected: "واریز رد شد",
        withdrawal_approved: "برداشت تأیید شد",
        withdrawal_rejected: "برداشت رد شد",
        referral_reward: "پاداش معرفی",
      },
    },
  },
};

export function resolveDashboardLang(value: string | undefined): Lang {
  return value === "fa" ? "fa" : "en";
}
