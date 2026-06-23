import Link from "next/link";
import { Mail, KeyRound, ShieldCheck, ClipboardCheck, Lock, AlertTriangle } from "lucide-react";

export const metadata = { title: "Security — 3REAL" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: "live" | "planned" }) {
  return status === "live" ? (
    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
      Live
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
      Planned
    </span>
  );
}

function Item({
  icon: Icon,
  title,
  status,
  children,
}: {
  icon: React.ElementType;
  title: string;
  status: "live" | "planned";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-amber-400" />
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <StatusPill status={status} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{children}</p>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mb-2">
            3REAL
          </p>
          <h1 className="text-3xl font-bold text-zinc-100">Security</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            This page explains, plainly, how account access and fund-movement
            security work on 3REAL today, and what is still on the roadmap.
            3REAL is in public beta — we would rather be precise about current
            limitations than overstate them.
          </p>
        </div>

        <Section title="Account Access">
          <div className="space-y-3">
            <Item icon={KeyRound} title="Email + Password Login" status="live">
              You can register and sign in with an email address and password.
              Passwords are hashed with bcrypt and are never stored or logged
              in plaintext.
            </Item>
            <Item icon={ShieldCheck} title="Google Sign-In (Optional)" status="live">
              Google sign-in is offered as a convenience, not a requirement.
              You can use 3REAL fully with email and password alone — Google
              is never the only way in.
            </Item>
            <Item icon={Mail} title="Email Verification" status="live">
              New accounts must verify their email address before full access
              is granted. This reduces fake-account and account-takeover risk.
            </Item>
            <Item icon={Lock} title="Two-Factor Authentication (TOTP)" status="planned">
              App-based two-factor authentication (e.g. Google Authenticator,
              Authy) is planned. It is not yet available — do not assume your
              account has 2FA enabled today.
            </Item>
            <Item icon={ClipboardCheck} title="Recovery Codes" status="planned">
              One-time backup recovery codes for account access, in case you
              lose access to your email or 2FA device, are planned but not yet
              implemented.
            </Item>
          </div>
        </Section>

        <Section title="Funds & Transactions">
          <p>
            During beta, every deposit and every withdrawal is reviewed
            manually by our team before funds are credited or released. We do
            not yet run fully automated on-chain or bank-feed detection for
            any supported asset. This is slower than an automated system, but
            it gives a human checkpoint on every movement of funds while the
            platform is young.
          </p>
          <p>
            All balances are tracked through a double-entry ledger — the same
            accounting method used by banks. Every transaction must balance;
            no balance can change without a matching journal entry.
          </p>
        </Section>

        <Section title="Sessions & Infrastructure">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Sessions use signed, HTTP-only cookies and are invalidated immediately on password change or other sensitive account events.</li>
            <li>All production traffic is served over HTTPS/TLS.</li>
            <li>Every login, transaction, and admin action is written to an append-only activity log.</li>
            <li>Access to KYC documents, ledger data, and admin functions is restricted by role-based permissions.</li>
          </ul>
        </Section>

        <Section title="Your Responsibility">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
              <p className="text-sm leading-relaxed text-amber-100/90">
                We can secure our infrastructure, but we cannot secure your
                email account, your device, or your wallet for you. Please:
              </p>
            </div>
          </div>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Use a strong, unique password for your 3REAL account and for the email address linked to it.</li>
            <li>Enable any security features your email provider offers (2FA, login alerts).</li>
            <li>Never share your password, verification codes, or (once available) 2FA/recovery codes with anyone — 3REAL staff will never ask for them.</li>
            <li>Double-check wallet addresses and bank details before sending a deposit — on-chain and bank transfers are generally irreversible.</li>
            <li>Report anything suspicious to <a href="mailto:support@3real.no" className="text-amber-400 hover:underline">support@3real.no</a> immediately.</li>
          </ul>
        </Section>

        <p className="pt-4 text-center text-xs text-zinc-700">
          <Link href="/whitepaper" className="text-zinc-500 hover:text-amber-400">
            Whitepaper
          </Link>
          {" · "}
          <Link href="/about" className="text-zinc-500 hover:text-amber-400">
            About
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
