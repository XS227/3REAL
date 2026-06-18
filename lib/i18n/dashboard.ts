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
      tokensLabel: string;
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
      completeKyc: string;
      kycStatus: Record<string, string>;
      kycTier: Record<number, string>;
      resendVerification: string;
      resendVerificationSending: string;
      resendVerificationSent: string;
      resendVerificationFailed: string;
    };
    recentActivity: {
      title: string;
      noActivity: string;
      actions: Record<string, string>;
      justNow: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
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
    verifiedPrefix: string;
    ledgerSection: string;
    viewDetails: string;
    depositCta: string;
    withdrawCta: string;
    totalBalance: string;
    network: string;
    backToWallet: string;
    entriesSuffix: string;
    noHistoryDesc: string;
    txTypes: Record<string, string>;
    txStatus: Record<string, string>;
    accountsSuffix: string;
    accountSuffix: string;
    noAccounts: string;
    noAccountsDesc: string;
    accountTypes: Record<string, string>;
    columns: {
      accountId: string;
      asset: string;
      type: string;
      entries: string;
      created: string;
    };
  };
  deposit: {
    title: string;
    subtitle: string;
    autoCredit: string;
    manualApproval: string;
    realManualBeta: string;
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
    emailNotVerifiedTitle: string;
    emailNotVerifiedDesc: string;
    kycRequiredTitle: string;
    kycRequiredDesc: string;
    optional: string;
    hashPlaceholder: string;
    refPlaceholder: string;
    uploadCta: string;
    submitAnother: string;
    requestSubmittedTitle: string;
    requestSubmittedDesc: string;
    manualNote: string;
    networkError: string;
    submissionFailed: string;
    minimumPrefix: string;
    detailsTitle: string;
    referenceCodeLabel: string;
    referenceCodeNote: string;
    copyLabel: string;
    copiedLabel: string;
    paymentMethods: Record<string, string>;
    noDepositsYet: string;
    historyTitle: string;
    requestSuffix: string;
    requestsSuffix: string;
    depositLabel: string;
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
    assetLabel: string;
    maxLabel: string;
    exceedsBalance: string;
    multiFieldNote: string;
    unavailableTitle: string;
    verifyEmailMsg: string;
    kycTier2Msg: string;
    successRealMsg: string;
    successGenericMsg: string;
    submitAnotherCta: string;
    invalidAmount: string;
    minWithdrawalPrefix: string;
    insufficientBalancePrefix: string;
    destinationRequired: string;
    requestFailed: string;
    networkError: string;
    noWithdrawalsYet: string;
    columns: { date: string; asset: string; amount: string; destination: string; status: string };
  };
  transactions: {
    title: string;
    totalSuffix: string;
    noMatch: string;
    clearFilters: string;
    columns: { date: string; type: string; asset: string; amount: string; status: string; reference: string };
    typeLabels: { deposit: string; withdrawal: string };
    status: Record<string, string>;
    feePrefix: string;
    viewLink: string;
    pagePrefix: string;
    ofPage: string;
    previous: string;
    next: string;
    filters: {
      allTypes: string;
      allAssets: string;
      allStatuses: string;
      fromDate: string;
      toDate: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    profileSection: string;
    emailLabel: string;
    emailImmutableNote: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    displayNameHint: string;
    displayNameUpdated: string;
    displayNameFailed: string;
    saveName: string;
    saving: string;
    securitySection: string;
    googleAccountNote: string;
    forgotPasswordLink: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    newPasswordHint: string;
    confirmPasswordLabel: string;
    passwordsDontMatch: string;
    passwordChanged: string;
    passwordChangeFailed: string;
    changePassword: string;
    networkError: string;
  };
  transactionDetail: {
    backToTransactions: string;
    typeLabels: { deposit: string; withdrawal: string };
    feePrefix: string;
    netPrefix: string;
    status: Record<string, string>;
    detailsTitle: string;
    rows: {
      transactionId: string;
      submitted: string;
      lastUpdated: string;
      paymentMethod: string;
      paymentReference: string;
      chainTxHash: string;
      adminNote: string;
      proofOfPayment: string;
    };
    viewProof: string;
    ledgerTitle: string;
    settledAt: string;
    network: string;
    journalEntries: string;
    columns: { account: string; amount: string; asset: string };
    yourAccount: string;
    platformPrefix: string;
    pendingNote: string;
    rejectedNote: string;
    noLedgerNote: string;
  };
  realDepositSection: {
    howItWorksTitle: string;
    step1Prefix: string;
    step1LinkText: string;
    step2: string;
    step3Prefix: string;
    step3Action: string;
    step3Suffix: string;
    onlyVerifiedNote: string;
    noWalletTitle: string;
    noWalletLinkText: string;
    noWalletSuffix: string;
    addressLabel: string;
    addressNetworkNote: string;
    copyTitle: string;
    checkButton: string;
    checking: string;
    foundSuffix: string;
    noNewDeposits: string;
    recentTitle: string;
    columns: { date: string; amount: string; from: string; txHash: string; status: string };
    credited: string;
    noDepositsYet: string;
  };
  walletConnect: {
    backToWallet: string;
    title: string;
    subtitle: string;
    linkedWalletsTitle: string;
    connectNewTitle: string;
    supportedWalletsLabel: string;
    supportedWalletsList: string;
    howItWorksTitle: string;
    steps: string[];
    noWalletsLinked: string;
    primary: string;
    verifiedPrefix: string;
    setPrimaryTitle: string;
    removeTitle: string;
    removeConfirm: string;
    connectButton: string;
    connecting: string;
    verifying: string;
    verifyingProof: string;
    verificationFailed: string;
    linkedSuccessTitle: string;
    linkedSuccessDesc: string;
    privacyNote: string;
    initFailed: string;
  };
  walletTonDetail: {
    backToWallet: string;
    title: string;
    primary: string;
    address: string;
    network: string;
    verified: string;
    balances: string;
    fetchedAt: string;
    activityTitle: string;
    noTransfers: string;
    columns: { date: string; type: string; amount: string; counterparty: string };
    directionIn: string;
    directionOut: string;
    manageWallets: string;
    balanceFetchFailed: string;
  };
  kyc: {
    title: string;
    subtitle: string;
    docLabels: Record<string, string>;
    docHints: Record<string, string>;
    status: Record<string, string>;
    upload: string;
    reupload: string;
    submit: string;
    submitting: string;
    submitApplication: string;
    resubmitApplication: string;
    submissionFailed: string;
    networkError: string;
    encryptedNote: string;
    whatUnlocked: string;
    tier2Benefits: string[];
    processTitle: string;
    processSteps: string[];
    uploadTitle: string;
    submittedTitle: string;
    underReviewNote: string;
    approvedTitle: string;
    approvedDesc: string;
    required: string;
    optional: string;
    documentFallback: string;
    uploadReplacement: string;
    clickOrDragUpload: string;
    fileTypesHint: string;
    approvedCannotReplace: string;
    banner: {
      labels: Record<string, string>;
      descriptions: Record<string, string>;
      reasonLabel: string;
    };
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
    howItWorksSteps: string[];
    noReferralsYetTitle: string;
    noReferralsYetDesc: string;
    inviteStatusLabels: Record<string, string>;
    rewardStatusLabels: Record<string, string>;
    inviteColumns: { user: string; registered: string; status: string; rewardStatus: string; amount: string };
    inviteTrackingTitle: string;
    rewardColumns: { date: string; from: string; type: string; level: string; amount: string; status: string };
    noRewardsYetTitle: string;
    noRewardsYetDesc: string;
    creditedLabel: string;
    triggerLabels: Record<string, string>;
    qr: { buttonLabel: string; scanPrompt: string; closeButton: string };
    calculatorConfig: {
      title: string;
      directReferralsLabel: string;
      activityLabel: string;
      activityOptions: string[];
      directRewardsLabel: string;
      indirectRewardsLabel: string;
      estimatedTotal: string;
      footerNote: string;
    };
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
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    viewAll: string;
    bellAriaLabel: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    emailVerifiedBadge: string;
    kycTierLabel: string;
    referralCodeLabel: string;
    referredNotice: string;
    sections: {
      real: { title: string; body: string };
      deposits: { title: string; body: string };
      withdrawals: { title: string; body: string };
      kycTier2: { title: string; body: string };
      betaLimits: { title: string; body: string };
    };
    ctaCompleteKyc: string;
    ctaViewWallet: string;
    ctaContinue: string;
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
        tokensLabel: "REAL tokens",
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
        resendVerification: "Resend verification email",
        resendVerificationSending: "Sending…",
        resendVerificationSent: "Verification email sent. Check your inbox.",
        resendVerificationFailed: "Couldn't send the email right now. Please try again later.",
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
        justNow: "just now",
        minutesAgo: "m ago",
        hoursAgo: "h ago",
        daysAgo: "d ago",
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
      verifiedPrefix: "verified",
      ledgerSection: "Ledger Accounts",
      viewDetails: "View details",
      depositCta: "Deposit",
      withdrawCta: "Withdraw",
      totalBalance: "Total Balance",
      network: "Network",
      backToWallet: "Wallet",
      entriesSuffix: "entries",
      noHistoryDesc: "Entries appear here once transactions are settled",
      txTypes: {
        deposit: "Deposit",
        withdrawal: "Withdrawal",
        fiat_deposit: "Fiat Deposit",
        referral_reward: "Referral Reward",
        fee: "Fee",
        transfer: "Internal Transfer",
        blockchain_deposit: "On-chain Deposit",
        blockchain_withdrawal: "On-chain Withdrawal",
        correction: "Manual Correction",
        initial_credit: "Initial Credit",
        conversion: "Conversion",
        pool_topup: "Pool Top-up",
        withdrawal_settlement: "Withdrawal Settlement",
        withdrawal_reversal: "Withdrawal Reversal",
      },
      txStatus: {
        completed: "Completed",
        pending: "Pending",
        processing: "Processing",
        rejected: "Rejected",
        reversed: "Reversed",
      },
      accountsSuffix: "accounts",
      accountSuffix: "account",
      noAccounts: "No ledger accounts yet",
      noAccountsDesc: "Accounts are created automatically when your first transaction is settled",
      accountTypes: {
        asset: "Asset",
        liability: "Liability",
        equity: "Equity",
        revenue: "Revenue",
        expense: "Expense",
      },
      columns: {
        accountId: "Account ID",
        asset: "Asset",
        type: "Type",
        entries: "Entries",
        created: "Created",
      },
    },
    deposit: {
      title: "Deposit",
      subtitle: "Add funds to your 3REAL account",
      autoCredit: "Send REAL Jetton from a connected TON wallet. Credits are automatic.",
      manualApproval: "Submit a deposit request. Funds are credited after admin approval.",
      realManualBeta: "REAL deposits are reviewed manually during beta. Submit proof of your transfer below, or contact support if you need help — automated TON detection is not active until our TON integration is fully verified.",
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
      emailNotVerifiedTitle: "Email not verified",
      emailNotVerifiedDesc: "Verify your email address before making deposits.",
      kycRequiredTitle: "KYC Tier {tier} required for {asset} deposits",
      kycRequiredDesc: "Complete identity verification to unlock deposits for this asset.",
      optional: "optional",
      hashPlaceholder: "0x… or TxHash…",
      refPlaceholder: "Your payment reference",
      uploadCta: "Click to upload proof",
      submitAnother: "Submit another deposit",
      requestSubmittedTitle: "Deposit Request Submitted",
      requestSubmittedDesc: "Your request is pending review. You will be notified once it is processed.",
      manualNote: "Deposits are processed manually. Ledger credit is applied only after admin approval.",
      networkError: "Network error. Please check your connection and try again.",
      submissionFailed: "Submission failed. Please try again.",
      minimumPrefix: "minimum",
      detailsTitle: "How to deposit {asset}",
      referenceCodeLabel: "Your Reference Code",
      referenceCodeNote: "Include this code so we can match your transfer to your account.",
      copyLabel: "Copy",
      copiedLabel: "Copied",
      paymentMethods: {
        bank_transfer: "Bank Transfer",
        usdt_trc20: "USDT TRC-20",
        ton: "TON",
        sepa: "SEPA",
        manual: "Manual",
      },
      noDepositsYet: "No deposit requests yet",
      historyTitle: "Deposit History",
      requestSuffix: "request",
      requestsSuffix: "requests",
      depositLabel: "Deposit",
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
      assetLabel: "Asset",
      maxLabel: "Max",
      exceedsBalance: "Exceeds available balance",
      multiFieldNote: "Note: For multi-field destinations (bank accounts), combine all details into the first field separated by commas. Full structured destination forms coming soon.",
      unavailableTitle: "Withdrawals unavailable",
      verifyEmailMsg: "Verify your email address to enable withdrawals.",
      kycTier2Msg: "Full KYC verification (tier 2) is required for all withdrawals. Complete your verification in the Verification section.",
      successRealMsg: "Your REAL withdrawal is pending admin review. Once approved, the admin will send REAL to your TON wallet and confirm the transaction. You will receive a notification when complete.",
      successGenericMsg: "Your request is pending admin review. You will receive a notification once it is processed.",
      submitAnotherCta: "Submit another request",
      invalidAmount: "Please enter a valid amount.",
      minWithdrawalPrefix: "Minimum withdrawal is",
      insufficientBalancePrefix: "Insufficient balance. Available:",
      destinationRequired: "Please enter your destination address or bank details.",
      requestFailed: "Withdrawal request failed.",
      networkError: "Network error. Please try again.",
      noWithdrawalsYet: "No withdrawal requests yet",
      columns: { date: "Date", asset: "Asset", amount: "Amount", destination: "Destination", status: "Status" },
    },
    transactions: {
      title: "Transaction History",
      totalSuffix: "total transactions",
      noMatch: "No transactions match your filters.",
      clearFilters: "Clear filters",
      columns: { date: "Date", type: "Type", asset: "Asset", amount: "Amount", status: "Status", reference: "Reference" },
      typeLabels: { deposit: "Deposit", withdrawal: "Withdrawal" },
      status: {
        pending: "Pending",
        under_review: "Under Review",
        approved: "Approved",
        processing: "Processing",
        completed: "Completed",
        rejected: "Rejected",
        cancelled: "Cancelled",
        failed: "Failed",
      },
      feePrefix: "fee:",
      viewLink: "View →",
      pagePrefix: "Page",
      ofPage: "of",
      previous: "← Previous",
      next: "Next →",
      filters: {
        allTypes: "All types",
        allAssets: "All assets",
        allStatuses: "All statuses",
        fromDate: "From date",
        toDate: "To date",
      },
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account preferences",
      profileSection: "Profile",
      emailLabel: "Email",
      emailImmutableNote: "Email address cannot be changed.",
      displayNameLabel: "Display Name",
      displayNamePlaceholder: "Your name (optional)",
      displayNameHint: "Shown in your profile. Leave blank to use your email address.",
      displayNameUpdated: "Display name updated.",
      displayNameFailed: "Failed to update",
      saveName: "Save Name",
      saving: "Saving…",
      securitySection: "Security",
      googleAccountNote: "Your account uses Google sign-in. To set a password, use the forgot password flow.",
      forgotPasswordLink: "forgot password",
      currentPasswordLabel: "Current Password",
      newPasswordLabel: "New Password",
      newPasswordHint: "Min 8 characters, at least one letter and one number.",
      confirmPasswordLabel: "Confirm New Password",
      passwordsDontMatch: "New passwords do not match.",
      passwordChanged: "Password changed. You will be signed out of other sessions.",
      passwordChangeFailed: "Failed to change password.",
      changePassword: "Change Password",
      networkError: "Network error. Try again.",
    },
    transactionDetail: {
      backToTransactions: "Back to transactions",
      typeLabels: { deposit: "Deposit", withdrawal: "Withdrawal" },
      feePrefix: "Fee:",
      netPrefix: "Net:",
      status: {
        pending: "Pending",
        under_review: "Under Review",
        approved: "Approved",
        processing: "Processing",
        completed: "Completed",
        rejected: "Rejected",
        cancelled: "Cancelled",
      },
      detailsTitle: "Transaction Details",
      rows: {
        transactionId: "Transaction ID",
        submitted: "Submitted",
        lastUpdated: "Last updated",
        paymentMethod: "Payment method",
        paymentReference: "Payment reference",
        chainTxHash: "Chain TX hash",
        adminNote: "Admin note",
        proofOfPayment: "Proof of payment",
      },
      viewProof: "View proof",
      ledgerTitle: "Ledger Settlement",
      settledAt: "Settled at",
      network: "Network",
      journalEntries: "Journal Entries",
      columns: { account: "Account", amount: "Amount", asset: "Asset" },
      yourAccount: "Your account",
      platformPrefix: "Platform ·",
      pendingNote: "This transaction is pending admin review. The ledger will be updated once approved.",
      rejectedNote: "This transaction was rejected. No ledger entries were created.",
      noLedgerNote: "No ledger settlement on file.",
    },
    realDepositSection: {
      howItWorksTitle: "How REAL deposits work",
      step1Prefix: "Connect a TON wallet on the",
      step1LinkText: "wallet page",
      step2: "Send REAL Jetton from your connected wallet to the platform deposit address below.",
      step3Prefix: "Click",
      step3Action: "Check for Deposit",
      step3Suffix: "— credits appear automatically once your transfer is found on-chain.",
      onlyVerifiedNote: "Only transfers from verified linked wallets are accepted. Minimum: 1 REAL.",
      noWalletTitle: "No TON wallet connected",
      noWalletLinkText: "Connect a TON wallet",
      noWalletSuffix: "before sending a deposit.",
      addressLabel: "Platform Deposit Address",
      addressNetworkNote: "Network: The Open Network (TON) · Asset: REAL Jetton only",
      copyTitle: "Copy address",
      checkButton: "Check for Deposit",
      checking: "Checking…",
      foundSuffix: "deposit(s) credited",
      noNewDeposits: "No new deposits found",
      recentTitle: "Recent REAL Deposits",
      columns: { date: "Date", amount: "Amount", from: "From", txHash: "Tx Hash", status: "Status" },
      credited: "Credited",
      noDepositsYet: "No REAL deposits yet.",
    },
    walletConnect: {
      backToWallet: "Back to Wallet",
      title: "TON Wallet",
      subtitle: "Connect your TON wallet to enable future on-chain features. Only your address is stored — your keys never leave your device.",
      linkedWalletsTitle: "Linked Wallets",
      connectNewTitle: "Connect New Wallet",
      supportedWalletsLabel: "Supported wallets",
      supportedWalletsList: "Tonkeeper · MyTonWallet · OpenMask · Tonhub · and all TON Connect 2.0 wallets",
      howItWorksTitle: "How it works",
      steps: [
        "3REAL generates a one-time nonce",
        "Your wallet signs it with your private key (stays on your device)",
        "3REAL verifies the Ed25519 signature server-side",
        "Your address is saved only after successful verification",
      ],
      noWalletsLinked: "No TON wallets linked yet.",
      primary: "Primary",
      verifiedPrefix: "Verified",
      setPrimaryTitle: "Set as primary",
      removeTitle: "Remove wallet",
      removeConfirm: "Remove this TON wallet from your account?",
      connectButton: "Connect TON Wallet",
      connecting: "Connecting…",
      verifying: "Verifying…",
      verifyingProof: "Verifying cryptographic proof…",
      verificationFailed: "Verification failed",
      linkedSuccessTitle: "Wallet linked successfully",
      linkedSuccessDesc: "Your TON wallet has been verified and saved.",
      privacyNote: "Your wallet's private key never leaves your device. 3REAL only records your address after verifying a cryptographic proof of ownership.",
      initFailed: "Failed to initialise connection. Refresh and try again.",
    },
    walletTonDetail: {
      backToWallet: "Wallet",
      title: "TON Wallet",
      primary: "Primary",
      address: "Address",
      network: "Network",
      verified: "Verified",
      balances: "Balances",
      fetchedAt: "Fetched at",
      activityTitle: "REAL Activity (last 20)",
      noTransfers: "No REAL transfers found.",
      columns: { date: "Date", type: "Type", amount: "Amount", counterparty: "Counterparty" },
      directionIn: "IN",
      directionOut: "OUT",
      manageWallets: "Manage connected wallets",
      balanceFetchFailed: "Failed to fetch balance",
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
      docHints: {
        id_front: "Clear photo of the ID data page or passport photo page",
        id_back: "Back side of national ID card (skip if using passport)",
        selfie: "Hold your ID or passport next to your face — both must be clearly visible",
        address_proof: "Bank statement or utility bill issued within the last 3 months",
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
      submitApplication: "Submit Application",
      resubmitApplication: "Re-submit Application",
      submissionFailed: "Submission failed. Please try again.",
      networkError: "Network error. Please check your connection and try again.",
      encryptedNote: "Documents are encrypted at rest and only reviewed by compliance staff.",
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
      required: "Required",
      optional: "Optional",
      documentFallback: "Document",
      uploadReplacement: "Upload replacement",
      clickOrDragUpload: "Click or drag to upload",
      fileTypesHint: "JPG, PNG, WEBP, PDF · max 10 MB",
      approvedCannotReplace: "This document has been approved and cannot be replaced.",
      banner: {
        labels: {
          not_started: "Not Started",
          pending: "Pending Review",
          under_review: "Under Review",
          approved: "Approved",
          rejected: "Rejected",
          update_requested: "Update Required",
        },
        descriptions: {
          not_started: "Submit your identity documents to verify your account.",
          pending: "Your documents have been received and are awaiting review. This usually takes 1–3 business days.",
          under_review: "A compliance officer is currently reviewing your submission.",
          approved: "Your identity has been verified. Full platform features are now unlocked.",
          rejected: "Your submission was rejected. Please review the reason below and re-submit.",
          update_requested: "Additional information or replacement documents are needed.",
        },
        reasonLabel: "Reason:",
      },
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
      howItWorksSteps: [
        "Friend registers with your code → pending",
        "Friend verifies email → 50 REAL credited instantly",
        "Friend completes KYC → +25 REAL bonus",
        "Friend makes first deposit → +10 REAL bonus",
        "Friend refers others → you earn 15 REAL per (L2)",
      ],
      noReferralsYetTitle: "No referrals yet",
      noReferralsYetDesc: "Share your referral link to start earning REAL rewards",
      inviteStatusLabels: {
        kyc_verified: "KYC Verified",
        email_verified: "Email Verified",
        pending_email: "Pending Email",
      },
      rewardStatusLabels: {
        rewarded: "Rewarded",
        registered: "Pending",
        pending: "Pending",
        invalidated: "Invalid",
      },
      inviteColumns: { user: "User", registered: "Registered", status: "Status", rewardStatus: "Reward Status", amount: "Amount" },
      inviteTrackingTitle: "Invite Tracking",
      rewardColumns: { date: "Date", from: "From", type: "Type", level: "Level", amount: "Amount", status: "Status" },
      noRewardsYetTitle: "No rewards earned yet",
      noRewardsYetDesc: "Rewards are credited when your referrals verify their email",
      creditedLabel: "Credited",
      triggerLabels: { email_verified: "Email Verified" },
      qr: {
        buttonLabel: "QR Code",
        scanPrompt: "Scan to register with your referral",
        closeButton: "Close",
      },
      calculatorConfig: {
        title: "Earnings Calculator",
        directReferralsLabel: "Number of direct referrals",
        activityLabel: "Expected referral activity",
        activityOptions: ["Email only", "Email + KYC", "Email + KYC + Deposit"],
        directRewardsLabel: "Direct rewards",
        indirectRewardsLabel: "Indirect rewards",
        estimatedTotal: "Estimated total",
        footerNote: "Direct: 50 REAL · Indirect: 15 REAL · Plus KYC and deposit bonuses",
      },
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
      justNow: "just now",
      minutesAgo: "m ago",
      hoursAgo: "h ago",
      daysAgo: "d ago",
      viewAll: "View all notifications",
      bellAriaLabel: "Notifications",
    },
    onboarding: {
      title: "Welcome to 3REAL",
      subtitle: "A quick orientation before you dive in.",
      emailVerifiedBadge: "Your email is verified",
      kycTierLabel: "Your current KYC tier",
      referralCodeLabel: "Your referral code",
      referredNotice: "You joined via a referral — that attribution has been saved.",
      sections: {
        real: {
          title: "What is REAL?",
          body: "REAL is the platform's native asset. Your dashboard balance and referral rewards are denominated in REAL.",
        },
        deposits: {
          title: "Deposits",
          body: "Submit a deposit with proof of payment from the Deposit page. An admin reviews and approves it before funds appear in your balance.",
        },
        withdrawals: {
          title: "Withdrawals",
          body: "Request a withdrawal from the Withdraw page once you're eligible. Requests are reviewed by an admin before funds are sent.",
        },
        kycTier2: {
          title: "KYC Tier 2 requirement",
          body: "Withdrawals require KYC Tier 2 (full identity verification), regardless of asset. Complete KYC from the Verification page to unlock withdrawals.",
        },
        betaLimits: {
          title: "Beta limits",
          body: "We're in a closed beta with manual review on every deposit and withdrawal, so processing may take a little longer than usual. Thanks for your patience.",
        },
      },
      ctaCompleteKyc: "Complete KYC",
      ctaViewWallet: "View wallet",
      ctaContinue: "Continue to dashboard",
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
        tokensLabel: "توکن REAL",
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
        resendVerification: "ارسال دوباره ایمیل تأیید",
        resendVerificationSending: "در حال ارسال…",
        resendVerificationSent: "ایمیل تأیید ارسال شد. صندوق ورودی خود را بررسی کنید.",
        resendVerificationFailed: "در حال حاضر امکان ارسال ایمیل نیست. لطفاً بعداً دوباره تلاش کنید.",
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
        justNow: "همین الان",
        minutesAgo: "دقیقه پیش",
        hoursAgo: "ساعت پیش",
        daysAgo: "روز پیش",
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
      verifiedPrefix: "تأیید شده",
      ledgerSection: "حساب‌های دفتر",
      viewDetails: "مشاهده جزئیات",
      depositCta: "واریز",
      withdrawCta: "برداشت",
      totalBalance: "موجودی کل",
      network: "شبکه",
      backToWallet: "کیف پول",
      entriesSuffix: "ردیف",
      noHistoryDesc: "پس از تسویه تراکنش‌ها، ردیف‌ها در اینجا نمایش داده می‌شوند",
      txTypes: {
        deposit: "واریز",
        withdrawal: "برداشت",
        fiat_deposit: "واریز ارز فیات",
        referral_reward: "پاداش معرفی",
        fee: "کارمزد",
        transfer: "انتقال داخلی",
        blockchain_deposit: "واریز زنجیره‌ای",
        blockchain_withdrawal: "برداشت زنجیره‌ای",
        correction: "اصلاح دستی",
        initial_credit: "اعتبار اولیه",
        conversion: "تبدیل",
        pool_topup: "شارژ استخر",
        withdrawal_settlement: "تسویه برداشت",
        withdrawal_reversal: "بازگشت برداشت",
      },
      txStatus: {
        completed: "تکمیل شده",
        pending: "در انتظار",
        processing: "در حال پردازش",
        rejected: "رد شده",
        reversed: "بازگشت داده شده",
      },
      accountsSuffix: "حساب",
      accountSuffix: "حساب",
      noAccounts: "هنوز حساب دفتری ثبت نشده",
      noAccountsDesc: "حساب‌ها به‌صورت خودکار با تسویه نخستین تراکنش شما ایجاد می‌شوند",
      accountTypes: {
        asset: "دارایی",
        liability: "تعهد",
        equity: "حقوق صاحبان سهام",
        revenue: "درآمد",
        expense: "هزینه",
      },
      columns: {
        accountId: "شناسه حساب",
        asset: "دارایی",
        type: "نوع",
        entries: "ردیف‌ها",
        created: "تاریخ ایجاد",
      },
    },
    deposit: {
      title: "واریز",
      subtitle: "افزودن وجه به حساب 3REAL شما",
      autoCredit: "REAL Jetton را از کیف پول TON متصل ارسال کنید. اعتبار به صورت خودکار انجام می‌شود.",
      manualApproval: "درخواست واریز ارسال کنید. وجوه پس از تأیید مدیر به حساب می‌رسد.",
      realManualBeta: "واریز REAL در دوران بتا به‌صورت دستی بررسی می‌شود. مدرک تراکنش خود را در زیر ارسال کنید یا در صورت نیاز با پشتیبانی تماس بگیرید — تشخیص خودکار TON تا زمان تأیید کامل یکپارچه‌سازی TON فعال نیست.",
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
      emailNotVerifiedTitle: "ایمیل تأیید نشده است",
      emailNotVerifiedDesc: "قبل از واریز، آدرس ایمیل خود را تأیید کنید.",
      kycRequiredTitle: "برای واریز {asset} نیاز به سطح {tier} احراز هویت دارید",
      kycRequiredDesc: "برای فعال‌سازی واریز این دارایی، احراز هویت را تکمیل کنید.",
      optional: "اختیاری",
      hashPlaceholder: "0x… یا هش تراکنش…",
      refPlaceholder: "مرجع پرداخت شما",
      uploadCta: "برای آپلود مدرک کلیک کنید",
      submitAnother: "ارسال واریز دیگر",
      requestSubmittedTitle: "درخواست واریز ثبت شد",
      requestSubmittedDesc: "درخواست شما در انتظار بررسی است. پس از پردازش به شما اطلاع داده می‌شود.",
      manualNote: "واریزها به‌صورت دستی پردازش می‌شوند. اعتبار دفتر کل تنها پس از تأیید ادمین اعمال می‌شود.",
      networkError: "خطای شبکه. لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.",
      submissionFailed: "ارسال ناموفق بود. لطفاً دوباره تلاش کنید.",
      minimumPrefix: "حداقل",
      detailsTitle: "نحوه واریز {asset}",
      referenceCodeLabel: "کد ارجاع شما",
      referenceCodeNote: "این کد را وارد کنید تا انتقال شما با حساب شما تطبیق داده شود.",
      copyLabel: "کپی",
      copiedLabel: "کپی شد",
      paymentMethods: {
        bank_transfer: "انتقال بانکی",
        usdt_trc20: "USDT TRC-20",
        ton: "TON",
        sepa: "SEPA",
        manual: "دستی",
      },
      noDepositsYet: "هنوز درخواست واریزی ثبت نشده است",
      historyTitle: "تاریخچه واریز",
      requestSuffix: "درخواست",
      requestsSuffix: "درخواست",
      depositLabel: "واریز",
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
      assetLabel: "دارایی",
      maxLabel: "حداکثر",
      exceedsBalance: "بیشتر از موجودی قابل‌برداشت است",
      multiFieldNote: "توجه: برای مقصدهای چند فیلدی (حساب‌های بانکی)، تمام جزئیات را با کاما در فیلد اول وارد کنید. فرم‌های ساختاریافته کامل به‌زودی اضافه می‌شوند.",
      unavailableTitle: "برداشت در دسترس نیست",
      verifyEmailMsg: "برای فعال‌سازی برداشت، آدرس ایمیل خود را تأیید کنید.",
      kycTier2Msg: "برای تمام برداشت‌ها نیاز به احراز هویت کامل (سطح ۲) دارید. احراز هویت خود را در بخش تأیید تکمیل کنید.",
      successRealMsg: "درخواست برداشت REAL شما در انتظار بررسی ادمین است. پس از تأیید، ادمین REAL را به کیف پول TON شما ارسال و تراکنش را تأیید می‌کند. پس از تکمیل، اعلانی دریافت خواهید کرد.",
      successGenericMsg: "درخواست شما در انتظار بررسی ادمین است. پس از پردازش، اعلانی دریافت خواهید کرد.",
      submitAnotherCta: "ارسال درخواست دیگر",
      invalidAmount: "لطفاً مبلغ معتبری وارد کنید.",
      minWithdrawalPrefix: "حداقل برداشت",
      insufficientBalancePrefix: "موجودی کافی نیست. موجود:",
      destinationRequired: "لطفاً آدرس مقصد یا جزئیات بانکی خود را وارد کنید.",
      requestFailed: "درخواست برداشت ناموفق بود.",
      networkError: "خطای شبکه. لطفاً دوباره تلاش کنید.",
      noWithdrawalsYet: "هنوز درخواست برداشتی ثبت نشده است",
      columns: { date: "تاریخ", asset: "دارایی", amount: "مقدار", destination: "مقصد", status: "وضعیت" },
    },
    transactions: {
      title: "تاریخچه تراکنش‌ها",
      totalSuffix: "تراکنش در کل",
      noMatch: "هیچ تراکنشی با فیلترهای شما مطابقت ندارد.",
      clearFilters: "پاک کردن فیلترها",
      columns: { date: "تاریخ", type: "نوع", asset: "دارایی", amount: "مقدار", status: "وضعیت", reference: "مرجع" },
      typeLabels: { deposit: "واریز", withdrawal: "برداشت" },
      status: {
        pending: "در انتظار",
        under_review: "در حال بررسی",
        approved: "تأیید شده",
        processing: "در حال پردازش",
        completed: "تکمیل شده",
        rejected: "رد شده",
        cancelled: "لغو شده",
        failed: "ناموفق",
      },
      feePrefix: "کارمزد:",
      viewLink: "مشاهده ←",
      pagePrefix: "صفحه",
      ofPage: "از",
      previous: "→ قبلی",
      next: "بعدی ←",
      filters: {
        allTypes: "همه نوع‌ها",
        allAssets: "همه دارایی‌ها",
        allStatuses: "همه وضعیت‌ها",
        fromDate: "از تاریخ",
        toDate: "تا تاریخ",
      },
    },
    settings: {
      title: "تنظیمات",
      subtitle: "مدیریت تنظیمات حساب کاربری شما",
      profileSection: "پروفایل",
      emailLabel: "ایمیل",
      emailImmutableNote: "آدرس ایمیل قابل تغییر نیست.",
      displayNameLabel: "نام نمایشی",
      displayNamePlaceholder: "نام شما (اختیاری)",
      displayNameHint: "در پروفایل شما نمایش داده می‌شود. برای استفاده از آدرس ایمیل، خالی بگذارید.",
      displayNameUpdated: "نام نمایشی به‌روزرسانی شد.",
      displayNameFailed: "به‌روزرسانی ناموفق بود",
      saveName: "ذخیره نام",
      saving: "در حال ذخیره…",
      securitySection: "امنیت",
      googleAccountNote: "حساب شما از طریق Google وارد می‌شود. برای تعیین رمز عبور، از مسیر فراموشی رمز عبور استفاده کنید.",
      forgotPasswordLink: "فراموشی رمز عبور",
      currentPasswordLabel: "رمز عبور فعلی",
      newPasswordLabel: "رمز عبور جدید",
      newPasswordHint: "حداقل ۸ کاراکتر، شامل حداقل یک حرف و یک عدد.",
      confirmPasswordLabel: "تکرار رمز عبور جدید",
      passwordsDontMatch: "رمزهای عبور جدید مطابقت ندارند.",
      passwordChanged: "رمز عبور تغییر یافت. از سایر نشست‌ها خارج خواهید شد.",
      passwordChangeFailed: "تغییر رمز عبور ناموفق بود.",
      changePassword: "تغییر رمز عبور",
      networkError: "خطای شبکه. دوباره تلاش کنید.",
    },
    transactionDetail: {
      backToTransactions: "بازگشت به تراکنش‌ها",
      typeLabels: { deposit: "واریز", withdrawal: "برداشت" },
      feePrefix: "کارمزد:",
      netPrefix: "خالص:",
      status: {
        pending: "در انتظار",
        under_review: "در حال بررسی",
        approved: "تأیید شده",
        processing: "در حال پردازش",
        completed: "تکمیل شده",
        rejected: "رد شده",
        cancelled: "لغو شده",
      },
      detailsTitle: "جزئیات تراکنش",
      rows: {
        transactionId: "شناسه تراکنش",
        submitted: "ارسال شده",
        lastUpdated: "آخرین بروزرسانی",
        paymentMethod: "روش پرداخت",
        paymentReference: "مرجع پرداخت",
        chainTxHash: "هش تراکنش زنجیره",
        adminNote: "یادداشت ادمین",
        proofOfPayment: "مدرک پرداخت",
      },
      viewProof: "مشاهده مدرک",
      ledgerTitle: "تسویه دفتر کل",
      settledAt: "زمان تسویه",
      network: "شبکه",
      journalEntries: "ردیف‌های دفتر روزنامه",
      columns: { account: "حساب", amount: "مقدار", asset: "دارایی" },
      yourAccount: "حساب شما",
      platformPrefix: "پلتفرم ·",
      pendingNote: "این تراکنش در انتظار بررسی ادمین است. پس از تأیید، دفتر کل به‌روزرسانی می‌شود.",
      rejectedNote: "این تراکنش رد شد. هیچ ردیف دفتر کلی ایجاد نشد.",
      noLedgerNote: "هیچ تسویه دفتر کلی ثبت نشده است.",
    },
    realDepositSection: {
      howItWorksTitle: "نحوه واریز REAL",
      step1Prefix: "از",
      step1LinkText: "صفحه کیف پول",
      step2: "REAL Jetton را از کیف پول متصل خود به آدرس واریز پلتفرم زیر ارسال کنید.",
      step3Prefix: "روی",
      step3Action: "بررسی واریز",
      step3Suffix: "کلیک کنید — به محض یافتن انتقال شما در زنجیره، اعتبار به‌صورت خودکار اعمال می‌شود.",
      onlyVerifiedNote: "فقط انتقال از کیف پول‌های متصل و تأییدشده پذیرفته می‌شود. حداقل: ۱ REAL.",
      noWalletTitle: "هیچ کیف پول TON متصل نیست",
      noWalletLinkText: "یک کیف پول TON متصل کنید",
      noWalletSuffix: "قبل از ارسال واریز.",
      addressLabel: "آدرس واریز پلتفرم",
      addressNetworkNote: "شبکه: The Open Network (TON) · دارایی: فقط REAL Jetton",
      copyTitle: "کپی آدرس",
      checkButton: "بررسی واریز",
      checking: "در حال بررسی…",
      foundSuffix: "واریز اعتبار یافت",
      noNewDeposits: "واریز جدیدی یافت نشد",
      recentTitle: "واریزهای REAL اخیر",
      columns: { date: "تاریخ", amount: "مقدار", from: "از طرف", txHash: "هش تراکنش", status: "وضعیت" },
      credited: "اعتبار یافته",
      noDepositsYet: "هنوز واریز REAL ثبت نشده است.",
    },
    walletConnect: {
      backToWallet: "بازگشت به کیف پول",
      title: "کیف پول TON",
      subtitle: "کیف پول TON خود را برای فعال‌سازی امکانات آینده روی زنجیره متصل کنید. فقط آدرس شما ذخیره می‌شود — کلیدهای شما هرگز دستگاه شما را ترک نمی‌کنند.",
      linkedWalletsTitle: "کیف پول‌های متصل",
      connectNewTitle: "اتصال کیف پول جدید",
      supportedWalletsLabel: "کیف پول‌های پشتیبانی‌شده",
      supportedWalletsList: "Tonkeeper · MyTonWallet · OpenMask · Tonhub · و تمام کیف‌پول‌های TON Connect 2.0",
      howItWorksTitle: "نحوه عملکرد",
      steps: [
        "3REAL یک کد یک‌بارمصرف ایجاد می‌کند",
        "کیف پول شما آن را با کلید خصوصی‌تان امضا می‌کند (روی دستگاه شما باقی می‌ماند)",
        "3REAL امضای Ed25519 را در سرور تأیید می‌کند",
        "آدرس شما فقط پس از تأیید موفق ذخیره می‌شود",
      ],
      noWalletsLinked: "هنوز کیف پول TON متصل نشده است.",
      primary: "اصلی",
      verifiedPrefix: "تأیید شده",
      setPrimaryTitle: "تعیین به‌عنوان اصلی",
      removeTitle: "حذف کیف پول",
      removeConfirm: "این کیف پول TON از حساب شما حذف شود؟",
      connectButton: "اتصال کیف پول TON",
      connecting: "در حال اتصال…",
      verifying: "در حال تأیید…",
      verifyingProof: "در حال تأیید مدرک رمزنگاری‌شده…",
      verificationFailed: "تأیید ناموفق بود",
      linkedSuccessTitle: "کیف پول با موفقیت متصل شد",
      linkedSuccessDesc: "کیف پول TON شما تأیید و ذخیره شد.",
      privacyNote: "کلید خصوصی کیف پول شما هرگز دستگاه شما را ترک نمی‌کند. 3REAL فقط پس از تأیید مدرک رمزنگاری‌شده مالکیت، آدرس شما را ثبت می‌کند.",
      initFailed: "راه‌اندازی اتصال ناموفق بود. صفحه را تازه‌سازی کرده و دوباره تلاش کنید.",
    },
    walletTonDetail: {
      backToWallet: "کیف پول",
      title: "کیف پول TON",
      primary: "اصلی",
      address: "آدرس",
      network: "شبکه",
      verified: "تأیید شده",
      balances: "موجودی‌ها",
      fetchedAt: "زمان دریافت",
      activityTitle: "فعالیت REAL (۲۰ مورد آخر)",
      noTransfers: "هیچ انتقال REAL یافت نشد.",
      columns: { date: "تاریخ", type: "نوع", amount: "مقدار", counterparty: "طرف مقابل" },
      directionIn: "ورودی",
      directionOut: "خروجی",
      manageWallets: "مدیریت کیف پول‌های متصل",
      balanceFetchFailed: "دریافت موجودی ناموفق بود",
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
      docHints: {
        id_front: "تصویر واضح از صفحه اطلاعات شناسنامه یا صفحه عکس پاسپورت",
        id_back: "پشت کارت ملی (در صورت استفاده از پاسپورت، نیازی نیست)",
        selfie: "شناسنامه یا پاسپورت خود را کنار صورتتان نگه دارید — هر دو باید واضح دیده شوند",
        address_proof: "صورتحساب بانکی یا قبض آب و برق صادر شده در ۳ ماه گذشته",
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
      submitApplication: "ارسال درخواست",
      resubmitApplication: "ارسال مجدد درخواست",
      submissionFailed: "ارسال ناموفق بود. لطفاً دوباره تلاش کنید.",
      networkError: "خطای شبکه. لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.",
      encryptedNote: "مدارک به‌صورت رمزنگاری‌شده ذخیره می‌شوند و فقط توسط تیم تطبیق بررسی می‌شوند.",
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
      required: "الزامی",
      optional: "اختیاری",
      documentFallback: "مدرک",
      uploadReplacement: "آپلود جایگزین",
      clickOrDragUpload: "برای آپلود کلیک کنید یا فایل را بکشید",
      fileTypesHint: "JPG، PNG، WEBP، PDF · حداکثر ۱۰ مگابایت",
      approvedCannotReplace: "این مدرک تأیید شده و قابل جایگزینی نیست.",
      banner: {
        labels: {
          not_started: "شروع نشده",
          pending: "در انتظار بررسی",
          under_review: "در حال بررسی",
          approved: "تأیید شده",
          rejected: "رد شده",
          update_requested: "نیاز به بروزرسانی",
        },
        descriptions: {
          not_started: "مدارک هویتی خود را برای تأیید حساب ارسال کنید.",
          pending: "مدارک شما دریافت شده و در انتظار بررسی است. این معمولاً ۱ تا ۳ روز کاری طول می‌کشد.",
          under_review: "یک کارشناس تطبیق در حال بررسی درخواست شما است.",
          approved: "هویت شما تأیید شده است. تمام امکانات پلتفرم اکنون باز شده‌اند.",
          rejected: "درخواست شما رد شد. لطفاً دلیل را در زیر بررسی کرده و دوباره ارسال کنید.",
          update_requested: "اطلاعات یا مدارک جایگزین بیشتری لازم است.",
        },
        reasonLabel: "دلیل:",
      },
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
      howItWorksSteps: [
        "دوست شما با کد شما ثبت‌نام می‌کند ← در انتظار",
        "دوست شما ایمیل را تأیید می‌کند ← ۵۰ REAL فوراً اعتبار می‌یابد",
        "دوست شما احراز هویت را تکمیل می‌کند ← پاداش +۲۵ REAL",
        "دوست شما اولین واریز را انجام می‌دهد ← پاداش +۱۰ REAL",
        "دوست شما دیگران را معرفی می‌کند ← شما به ازای هر نفر ۱۵ REAL (سطح ۲) کسب می‌کنید",
      ],
      noReferralsYetTitle: "هنوز معرفی‌ای ثبت نشده است",
      noReferralsYetDesc: "لینک معرفی خود را به اشتراک بگذارید تا پاداش REAL کسب کنید",
      inviteStatusLabels: {
        kyc_verified: "احراز هویت تأیید شده",
        email_verified: "ایمیل تأیید شده",
        pending_email: "در انتظار تأیید ایمیل",
      },
      rewardStatusLabels: {
        rewarded: "پاداش داده شده",
        registered: "در انتظار",
        pending: "در انتظار",
        invalidated: "نامعتبر",
      },
      inviteColumns: { user: "کاربر", registered: "ثبت‌نام", status: "وضعیت", rewardStatus: "وضعیت پاداش", amount: "مقدار" },
      inviteTrackingTitle: "پیگیری دعوت‌ها",
      rewardColumns: { date: "تاریخ", from: "از طرف", type: "نوع", level: "سطح", amount: "مقدار", status: "وضعیت" },
      noRewardsYetTitle: "هنوز پاداشی کسب نشده است",
      noRewardsYetDesc: "پاداش‌ها زمانی اعتبار می‌یابند که افراد معرفی‌شده ایمیل خود را تأیید کنند",
      creditedLabel: "اعتبار یافته",
      triggerLabels: { email_verified: "تأیید ایمیل" },
      qr: {
        buttonLabel: "کد QR",
        scanPrompt: "برای ثبت‌نام با کد معرفی خود اسکن کنید",
        closeButton: "بستن",
      },
      calculatorConfig: {
        title: "محاسبه‌گر درآمد",
        directReferralsLabel: "تعداد معرفی‌های مستقیم",
        activityLabel: "فعالیت مورد انتظار معرفی‌شدگان",
        activityOptions: ["فقط ایمیل", "ایمیل + احراز هویت", "ایمیل + احراز هویت + واریز"],
        directRewardsLabel: "پاداش مستقیم",
        indirectRewardsLabel: "پاداش غیرمستقیم",
        estimatedTotal: "برآورد کل",
        footerNote: "مستقیم: ۵۰ REAL · غیرمستقیم: ۱۵ REAL · به‌علاوه پاداش احراز هویت و واریز",
      },
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
      justNow: "همین الان",
      minutesAgo: "دقیقه پیش",
      hoursAgo: "ساعت پیش",
      daysAgo: "روز پیش",
      viewAll: "مشاهده همه اعلان‌ها",
      bellAriaLabel: "اعلان‌ها",
    },
    onboarding: {
      title: "به 3REAL خوش آمدید",
      subtitle: "یک راهنمای سریع قبل از شروع.",
      emailVerifiedBadge: "ایمیل شما تأیید شده است",
      kycTierLabel: "سطح فعلی احراز هویت شما",
      referralCodeLabel: "کد معرفی شما",
      referredNotice: "شما از طریق یک معرفی پیوستید — این ارجاع ذخیره شده است.",
      sections: {
        real: {
          title: "REAL چیست؟",
          body: "REAL دارایی اصلی پلتفرم است. موجودی داشبورد و پاداش‌های معرفی شما بر اساس REAL محاسبه می‌شود.",
        },
        deposits: {
          title: "واریز",
          body: "از صفحه واریز، درخواست واریز همراه با مدرک پرداخت ارسال کنید. یک ادمین آن را بررسی و تأیید می‌کند تا وجه در موجودی شما نمایش داده شود.",
        },
        withdrawals: {
          title: "برداشت",
          body: "پس از واجد شرایط شدن، از صفحه برداشت درخواست دهید. درخواست‌ها قبل از ارسال وجه توسط ادمین بررسی می‌شوند.",
        },
        kycTier2: {
          title: "نیاز به سطح ۲ احراز هویت",
          body: "برداشت‌ها بدون توجه به نوع دارایی، نیاز به سطح ۲ احراز هویت (تأیید کامل هویت) دارند. برای فعال‌سازی برداشت، احراز هویت را از صفحه تأیید تکمیل کنید.",
        },
        betaLimits: {
          title: "محدودیت‌های بتا",
          body: "ما در نسخه بتای بسته هستیم و هر واریز و برداشت به‌صورت دستی بررسی می‌شود، بنابراین پردازش ممکن است کمی بیشتر از حد معمول طول بکشد. از صبر شما سپاسگزاریم.",
        },
      },
      ctaCompleteKyc: "تکمیل احراز هویت",
      ctaViewWallet: "مشاهده کیف پول",
      ctaContinue: "ادامه به داشبورد",
    },
  },
};

export function resolveDashboardLang(value: string | undefined): Lang {
  return value === "fa" ? "fa" : "en";
}

// Use for Date#toLocaleDateString/toLocaleTimeString/toLocaleString calls so
// dates render in the active language instead of being hardcoded to en-US.
export function dateLocale(lang: Lang): string {
  return lang === "fa" ? "fa-IR" : "en-US";
}
