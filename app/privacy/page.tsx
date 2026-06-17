import Link from "next/link";

export const metadata = { title: "Privacy Policy — 3REAL" };

const LAST_UPDATED = "June 17, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mb-2">
            3REAL
          </p>
          <h1 className="text-3xl font-bold text-zinc-100">Privacy Policy</h1>
          <p className="mt-2 text-sm text-zinc-600">Last updated: {LAST_UPDATED}</p>
        </div>

        <p className="text-sm leading-relaxed text-zinc-400">
          This Privacy Policy explains how 3REAL (&quot;we&quot;, &quot;us&quot;), part of the SETAEI
          ecosystem and operated from Norway, collects, uses, stores, and protects
          personal data when you use the Platform. We process personal data in
          accordance with the Norwegian Personal Data Act and, where applicable, the
          EU General Data Protection Regulation (GDPR).
        </p>

        <Section title="1. Data We Collect">
          <ul className="list-disc space-y-1 pl-5">
            <li><span className="text-zinc-300">Account data</span> — email address, password hash, display name, referral code, account preferences.</li>
            <li><span className="text-zinc-300">KYC data</span> — government-issued ID documents, proof of address, date of birth, and other identity verification information you submit.</li>
            <li><span className="text-zinc-300">Transaction data</span> — deposit and withdrawal records, ledger entries, payment references, and on-chain transaction hashes where applicable.</li>
            <li><span className="text-zinc-300">Technical data</span> — IP address, browser/device information, session and authentication tokens, and activity logs (e.g. login times, referral link clicks).</li>
            <li><span className="text-zinc-300">Communications</span> — support requests and any correspondence with us.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <ul className="list-disc space-y-1 pl-5">
            <li>To create and maintain your account and authenticate your sessions.</li>
            <li>To verify your identity and comply with KYC/AML legal obligations.</li>
            <li>To process deposits, withdrawals, and ledger entries accurately.</li>
            <li>To detect, investigate, and prevent fraud, abuse, and security incidents.</li>
            <li>To send transactional emails (e.g. KYC status, deposit/withdrawal confirmations, security alerts).</li>
            <li>To comply with legal and regulatory obligations, including reporting to competent authorities where required.</li>
          </ul>
        </Section>

        <Section title="3. KYC Document Handling">
          <p>
            Identity documents submitted for KYC are stored in access-restricted
            storage on infrastructure we control. Access is limited to authorized
            personnel performing compliance review. KYC documents are retained for as
            long as your account is active and for the period thereafter required by
            applicable AML record-keeping obligations, after which they are securely
            deleted.
          </p>
        </Section>

        <Section title="4. Cookies and Sessions">
          <p>
            We use a single essential, HTTP-only session cookie to keep you signed in.
            This cookie is required for the Platform to function and is not used for
            advertising or cross-site tracking. We do not use third-party analytics or
            advertising cookies. Session cookies are transmitted only over encrypted
            (HTTPS) connections in production.
          </p>
        </Section>

        <Section title="5. Security Practices">
          <ul className="list-disc space-y-1 pl-5">
            <li>Passwords are hashed using bcrypt; we never store plaintext passwords.</li>
            <li>Sessions are authenticated via signed, HTTP-only cookies and are invalidated on password change or other sensitive account events.</li>
            <li>All production traffic is served over HTTPS/TLS.</li>
            <li>Access to KYC documents, ledger data, and admin functions is restricted by role-based permissions and logged via audit trails.</li>
            <li>Database backups are encrypted at rest where supported by infrastructure and access-restricted.</li>
          </ul>
          <p>
            No system is perfectly secure. If we become aware of a data breach
            affecting your personal data, we will notify you and relevant authorities
            as required by applicable law.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain account and transaction data for as long as your account is
            active, and for a reasonable period afterward to meet legal, accounting,
            and AML record-keeping obligations (which can require retention of several
            years after account closure). Technical logs are retained for a limited
            period for security and debugging purposes and are then deleted or
            anonymized.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>
            Subject to applicable law (including GDPR, where it applies to you), you
            have the right to:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data, subject to our legal retention obligations (e.g. AML record-keeping cannot be overridden by a deletion request).</li>
            <li>Object to or request restriction of certain processing.</li>
            <li>Request a copy of your data in a portable format.</li>
            <li>Lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet) or your local supervisory authority.</li>
          </ul>
          <p>To exercise any of these rights, contact us using the details below.</p>
        </Section>

        <Section title="8. Data Sharing">
          <p>
            We do not sell personal data. We may share data with:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Service providers acting on our behalf (e.g. email delivery, hosting), bound by confidentiality obligations.</li>
            <li>Regulators or law enforcement where required by applicable law or a valid legal request.</li>
            <li>Successors in the event of a merger, acquisition, or asset transfer, subject to equivalent privacy protections.</li>
          </ul>
        </Section>

        <Section title="9. Contact">
          <p>
            For privacy questions or to exercise your rights, contact{" "}
            <a href="mailto:privacy@3real.no" className="text-amber-400 hover:underline">
              privacy@3real.no
            </a>
            .
          </p>
        </Section>

        <p className="pt-4 text-center text-xs text-zinc-700">
          <Link href="/terms" className="text-zinc-500 hover:text-amber-400">
            Terms of Service
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
