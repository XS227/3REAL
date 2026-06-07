export const en = {
  nav: {
    logo: "3REAL",
    links: [
      { label: "Ecosystem", href: "#ecosystem" },
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
    cta: { signIn: "Sign In", register: "Create Account" },
  },

  hero: {
    badge: "Powered by REAL",
    title: "3REAL",
    tagline: "Secure. Rewarding. Connected.",
    description:
      "The digital asset portal of the SETAEI ecosystem. Manage your REAL tokens, grow your network, and access tomorrow's financial infrastructure — today.",
    cta: { primary: "Create Account", secondary: "Learn More" },
  },

  ecosystem: {
    title: "The SETAEI Ecosystem",
    subtitle:
      "3REAL is your gateway to a growing network of connected platforms, all powered by the REAL token.",
    products: [
      {
        name: "3REAL",
        tag: "Active",
        description:
          "Digital asset portal. Manage, earn, and use REAL tokens within the SETAEI ecosystem.",
        active: true,
      },
      {
        name: "Shahnameh",
        tag: "Coming Soon",
        description:
          "A cultural commerce platform bridging Persian heritage and the digital economy.",
        active: false,
      },
      {
        name: "TrustAI",
        tag: "Coming Soon",
        description:
          "AI-powered trust and verification services for individuals and organizations.",
        active: false,
      },
      {
        name: "SETAEI Pay",
        tag: "Coming Soon",
        description:
          "Seamless cross-ecosystem payment infrastructure, powered by the REAL token.",
        active: false,
      },
    ],
  },

  features: {
    title: "Everything You Need",
    subtitle:
      "A complete platform for managing digital assets — built for people, not traders.",
    items: [
      {
        icon: "Wallet",
        title: "REAL Wallet",
        description:
          "Store, send, and receive REAL tokens and other supported digital assets from one secure wallet.",
      },
      {
        icon: "Users",
        title: "Referral Rewards",
        description:
          "Invite friends and earn REAL tokens. Two-tier rewards mean you also benefit from your referrals' referrals.",
      },
      {
        icon: "ShieldCheck",
        title: "Secure Asset Management",
        description:
          "Double-entry ledger and multi-layer encryption protect every unit of your digital assets.",
      },
      {
        icon: "BadgeCheck",
        title: "KYC Verification",
        description:
          "Tiered verification unlocks higher limits progressively. Start with email — upgrade when you're ready.",
      },
      {
        icon: "Coins",
        title: "Multi-Asset Support",
        description:
          "REAL, USDT (TRC-20), TON, and more. One portal for your entire digital asset portfolio.",
      },
    ],
  },

  howItWorks: {
    title: "How It Works",
    subtitle: "From sign-up to earning REAL in four steps.",
    steps: [
      {
        number: "01",
        title: "Create Account",
        description:
          "Sign up with your email address. Account creation takes less than a minute.",
      },
      {
        number: "02",
        title: "Verify Identity",
        description:
          "Confirm your email for Tier 1 access. Submit a government ID to unlock higher transaction limits.",
      },
      {
        number: "03",
        title: "Earn REAL",
        description:
          "Share your unique referral code. Earn REAL tokens when your network joins and uses the platform.",
      },
      {
        number: "04",
        title: "Use Across Ecosystem",
        description:
          "Spend, transfer, and grow your REAL holdings as the SETAEI ecosystem continues to expand.",
      },
    ],
  },

  security: {
    title: "Built on Trust",
    subtitle:
      "Security is not a feature — it is the foundation. Every design decision prioritises the safety of your assets.",
    pillars: [
      {
        icon: "BookOpen",
        title: "Double-Entry Ledger",
        description:
          "Every transaction is recorded with double-entry accounting — the same method used by banks. No balance can change without a corresponding journal entry. The books always balance.",
      },
      {
        icon: "Lock",
        title: "End-to-End Encryption",
        description:
          "Sensitive data is encrypted at rest and in transit. Passwords are hashed with bcrypt. Tokens are stored as SHA-256 digests — never in plaintext.",
      },
      {
        icon: "FileSearch",
        title: "Immutable Audit Trail",
        description:
          "Every login, transaction, and admin action is written to an append-only activity log. Nothing is deleted — everything is traceable.",
      },
      {
        icon: "ShieldCheck",
        title: "Session Protection",
        description:
          "JWT sessions with version-based invalidation. Password resets and account changes immediately revoke all active sessions across all devices.",
      },
    ],
  },

  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know before getting started.",
    items: [
      {
        question: "What is 3REAL?",
        answer:
          "3REAL is a digital asset portal within the SETAEI ecosystem. It lets you manage REAL tokens and other supported digital assets securely. It is not a cryptocurrency exchange — we do not operate an order book or offer trading pairs.",
      },
      {
        question: "What is the REAL token?",
        answer:
          "REAL is the native utility token of the SETAEI ecosystem. It powers transactions, rewards, and access across 3REAL, Shahnameh, TrustAI, and SETAEI Pay. REAL is earned through participation and the referral program.",
      },
      {
        question: "How does the referral program work?",
        answer:
          "Every account receives a unique 8-character referral code. When someone registers with your code, you earn REAL tokens. If your referral then invites others, you earn a secondary reward — two tiers in total.",
      },
      {
        question: "What KYC verification is required?",
        answer:
          "KYC is tiered. Tier 1 requires email verification only and unlocks basic access. Tier 2 requires a government-issued photo ID. Tier 3 requires full identity verification and unlocks the highest transaction limits.",
      },
      {
        question: "Which digital assets are supported?",
        answer:
          "Currently supported: REAL (native token), USDT (TRC-20 network), and TON (The Open Network). Additional assets will be added as the platform grows.",
      },
      {
        question: "Is 3REAL a cryptocurrency exchange?",
        answer:
          "No. 3REAL is a digital asset portal — not an exchange. We do not operate a trading engine, order book, or price discovery mechanism. Peer-to-peer asset trading is not supported through 3REAL.",
      },
      {
        question: "When will Shahnameh, TrustAI, and SETAEI Pay launch?",
        answer:
          "These ecosystem products are currently in development. Launch timelines will be announced through official SETAEI channels. REAL tokens earned now will be usable across all ecosystem products at launch.",
      },
      {
        question: "How are my assets protected?",
        answer:
          "All assets are tracked through a double-entry accounting ledger — identical to the method used by licensed financial institutions. Every transaction must balance. We use end-to-end encryption, immutable audit logs, and session-version invalidation so that a password reset immediately revokes all active sessions.",
      },
    ],
  },

  footer: {
    tagline: "Powered by REAL",
    description: "Part of the SETAEI ecosystem.",
    links: {
      platform: {
        title: "Platform",
        items: [
          { label: "Create Account", href: "/auth/register" },
          { label: "Sign In", href: "/auth/login" },
        ],
      },
      legal: {
        title: "Legal",
        items: [
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of Service", href: "#" },
        ],
      },
      ecosystem: {
        title: "Ecosystem",
        items: [
          { label: "SETAEI", href: "#" },
          { label: "Shahnameh", href: "#" },
          { label: "TrustAI", href: "#" },
          { label: "SETAEI Pay", href: "#" },
        ],
      },
    },
    copyright: "© 2026 SETAEI. All rights reserved.",
  },
} as const;

export type LandingDict = typeof en;
