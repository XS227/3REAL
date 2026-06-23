import Link from "next/link";

export const metadata = { title: "Whitepaper — 3REAL" };

const LAST_UPDATED = "June 23, 2026";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">
        <span className="text-amber-400">{number}.</span> {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function AssetRow({ code, name, network }: { code: string; name: string; network: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-2.5 last:border-0">
      <div>
        <span className="text-sm font-semibold text-zinc-200">{code}</span>
        <span className="ml-2 text-sm text-zinc-500">{name}</span>
      </div>
      <span className="text-xs text-zinc-600">{network}</span>
    </div>
  );
}

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mb-2">
            3REAL
          </p>
          <h1 className="text-3xl font-bold text-zinc-100">Whitepaper</h1>
          <p className="mt-2 text-sm text-zinc-600">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            This document explains what 3REAL is, how it works today, and what
            we are still building. It is written for beta users deciding
            whether to deposit funds — it favors plain, verifiable statements
            over marketing language. Where something is not yet live, we say
            so explicitly.
          </p>
        </div>

        <Section number="1" title="Introduction">
          <p>
            3REAL is a digital asset portal within the SETAEI ecosystem,
            operated from Norway. It gives users a single place to hold,
            deposit, withdraw, and track digital assets and select fiat
            currencies, backed by a double-entry ledger. 3REAL is the home of
            the REAL token, which originated in the Shahnameh project and now
            functions as the SETAEI ecosystem&apos;s utility token.
          </p>
        </Section>

        <Section number="2" title="The Problem">
          <p>
            Most people who hold digital assets face a tradeoff: self-custody
            tools are powerful but unforgiving (a lost key or a wrong address
            means permanent loss), while many custodial platforms are opaque
            about how funds move, who reviews transactions, and what happens
            during the early stages of a new product. Newcomers in particular
            need a platform that is honest about its current state, not one
            that hides manual processes behind automated-sounding language.
          </p>
        </Section>

        <Section number="3" title="The 3REAL Solution">
          <p>
            3REAL provides a managed digital asset portal with:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>A single account for multiple digital assets and fiat currencies.</li>
            <li>A double-entry ledger, so every balance change has a traceable, balanced counterpart.</li>
            <li>Tiered KYC that unlocks higher limits as users verify their identity.</li>
            <li>A two-tier referral program that rewards users for growing the network.</li>
            <li>Human review of deposits and withdrawals during beta, prioritizing safety over speed while the platform is young.</li>
          </ul>
          <p>
            3REAL is not a trading exchange. We do not operate an order book
            or set prices for REAL or any other asset — REAL trades on the
            open TON market, and 3REAL only reflects that market data.
          </p>
        </Section>

        <Section number="4" title="Supported Assets">
          <p>3REAL currently supports the following assets:</p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-1">
            <AssetRow code="REAL" name="REAL Token" network="TON Jetton" />
            <AssetRow code="TON" name="Toncoin" network="The Open Network" />
            <AssetRow code="USDT" name="Tether USD" network="TRC-20 (TRON)" />
            <AssetRow code="EUR" name="Euro" network="SEPA / Bank Transfer" />
            <AssetRow code="NOK" name="Norwegian Krone" network="Bank Transfer" />
            <AssetRow code="TRY" name="Turkish Lira" network="Bank Transfer (EFT/FAST)" />
          </div>
          <p>
            Additional assets may be added as the platform matures and our
            operational capacity to review them safely grows.
          </p>
        </Section>

        <Section number="5" title="How Deposits & Withdrawals Work">
          <p>
            <span className="text-zinc-300">Deposits:</span> You initiate a
            deposit by sending funds (on-chain for REAL/TON/USDT, or by bank
            transfer for EUR/NOK/TRY) to the address or account shown in the
            app, including your reference code where required, and submitting
            proof of the transfer. An admin manually reviews each submission
            and credits your balance once verified.
          </p>
          <p>
            <span className="text-zinc-300">Withdrawals:</span> Withdrawal
            requests are submitted from your dashboard and enter a{" "}
            <span className="text-zinc-300">pending</span> state. They are
            manually reviewed and approved by our team before funds are sent.
          </p>
          <p>
            We are explicit about this: no asset on 3REAL has automated
            on-chain or bank-feed detection wired up yet. Every credit and
            every payout passes through a human checkpoint during beta. This
            adds review time, but it is a deliberate safety choice while the
            platform is new — not an oversight we are hiding.
          </p>
        </Section>

        <Section number="6" title="KYC / AML Approach">
          <p>
            3REAL uses tiered identity verification. Higher tiers unlock
            higher transaction limits and access to additional assets:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="text-zinc-300">Tier 1</span> — unlocked after email verification (or Google sign-in), with conservative limits.</li>
            <li><span className="text-zinc-300">Tier 2</span> — requires a government-issued photo ID; required for TON, USDT, EUR, NOK, and TRY deposits.</li>
            <li><span className="text-zinc-300">Tier 3</span> — full identity verification, unlocking the highest transaction limits.</li>
          </ul>
          <p>
            KYC submissions and supporting documents are reviewed by
            authorized personnel and stored in access-restricted storage. We
            apply AML-conscious controls — including manual transaction
            review — and may request additional verification, delay, or
            decline transactions we reasonably suspect are fraudulent or
            non-compliant. See our{" "}
            <Link href="/privacy" className="text-amber-400 hover:underline">
              Privacy Policy
            </Link>{" "}
            for how KYC data is handled.
          </p>
        </Section>

        <Section number="7" title="Referral Model">
          <p>
            Every account receives a unique referral code. When someone
            registers using your code, you earn a referral reward in REAL once
            that referral meets the reward conditions. If your referral goes
            on to refer others, you also earn a secondary reward — a two-tier
            structure in total. Reward history and status are visible from
            your dashboard.
          </p>
        </Section>

        <Section number="8" title="Security Model">
          <p>
            Passwords are hashed with bcrypt; sensitive tokens are stored as
            SHA-256 digests, never in plaintext. Sessions use signed, HTTP-only
            cookies and are invalidated on password change or other sensitive
            account events. All production traffic runs over HTTPS/TLS. Every
            login, transaction, and admin action is written to an
            append-only, immutable activity log, and access to KYC documents,
            ledger data, and admin functions is restricted by role-based
            permissions. Full detail is on our{" "}
            <Link href="/security" className="text-amber-400 hover:underline">
              Security page
            </Link>
            .
          </p>
        </Section>

        <Section number="9" title="Login & Account Recovery">
          <p>
            You can create and access your account with an email address and
            password, or optionally with Google sign-in — Google is a
            convenience, never a requirement. Email addresses must be
            verified before full account access is granted.
          </p>
          <p>
            App-based two-factor authentication (TOTP) and one-time backup
            recovery codes are planned but not yet live. Until they ship,
            account recovery relies on email-based password reset, which
            makes the security of your email account an important part of
            your overall account security — see{" "}
            <Link href="/security" className="text-amber-400 hover:underline">
              Security
            </Link>{" "}
            for guidance.
          </p>
        </Section>

        <Section number="10" title="Roadmap">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Automated on-chain deposit detection for TON and USDT.</li>
            <li>Two-factor authentication (TOTP) and recovery codes.</li>
            <li>Expanded bank-feed reconciliation for fiat deposits.</li>
            <li>Additional supported assets, evaluated for operational and compliance readiness.</li>
            <li>AI trading agents for the SETAEI ecosystem (in active development).</li>
            <li>Evaluation of formal licensing as usage and jurisdictional requirements grow.</li>
          </ul>
          <p>
            Roadmap items are directional, not commitments to a fixed date.
            We will update this page as items ship.
          </p>
        </Section>

        <Section number="11" title="Team">
          <p>
            3REAL is built and operated by SETAEI, founded by Khabat Setaei.
            An operations partner for Iran is currently under onboarding and
            will be announced once finalized. Full team details are on the{" "}
            <Link href="/about" className="text-amber-400 hover:underline">
              About page
            </Link>
            .
          </p>
        </Section>

        <Section number="12" title="Risk Disclaimer">
          <p>
            3REAL is a beta product. Digital assets are volatile and carry
            significant risk, including total or partial loss of value.
            On-chain and bank transactions are generally irreversible — funds
            sent to an incorrect address or account typically cannot be
            recovered. Manual review during beta means processing times can
            vary and are not instantaneous.
          </p>
          <p>
            Nothing in this document constitutes financial, investment,
            legal, or tax advice. 3REAL is not a licensed bank, payment
            institution, or regulated exchange, and we make no claim of
            licensing or regulatory authorization beyond what is stated on our{" "}
            <Link href="/about" className="text-amber-400 hover:underline">
              About page
            </Link>
            . You are solely responsible for evaluating the risks of using the
            platform. See our{" "}
            <Link href="/terms" className="text-amber-400 hover:underline">
              Terms of Service
            </Link>{" "}
            for the full legal terms governing your use of 3REAL.
          </p>
        </Section>

        <p className="pt-4 text-center text-xs text-zinc-700">
          <Link href="/about" className="text-zinc-500 hover:text-amber-400">
            About
          </Link>
          {" · "}
          <Link href="/security" className="text-zinc-500 hover:text-amber-400">
            Security
          </Link>
          {" · "}
          <Link href="/" className="text-zinc-500 hover:text-amber-400">
            Back to 3REAL
          </Link>
        </p>
      </div>
    </div>
  );
}
