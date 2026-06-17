import Link from "next/link";

export const metadata = { title: "Terms of Service — 3REAL" };

const LAST_UPDATED = "June 17, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mb-2">
            3REAL
          </p>
          <h1 className="text-3xl font-bold text-zinc-100">Terms of Service</h1>
          <p className="mt-2 text-sm text-zinc-600">Last updated: {LAST_UPDATED}</p>
        </div>

        <p className="text-sm leading-relaxed text-zinc-400">
          These Terms of Service (&quot;Terms&quot;) govern access to and use of the 3REAL
          platform (&quot;3REAL&quot;, &quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;), operated as part of the
          SETAEI ecosystem. By creating an account or otherwise using the Platform, you
          agree to be bound by these Terms. If you do not agree, do not use the Platform.
        </p>

        <Section title="1. Jurisdiction and Governing Law">
          <p>
            3REAL is operated from Norway. These Terms are governed by the laws of
            Norway, without regard to conflict-of-law principles. Any dispute arising
            out of or relating to these Terms or the Platform shall be subject to the
            exclusive jurisdiction of the Norwegian courts, unless mandatory consumer
            protection law in your country of residence provides otherwise.
          </p>
        </Section>

        <Section title="2. Eligibility and Account Responsibilities">
          <p>
            You must be at least 18 years old and have full legal capacity to enter into
            a binding agreement to use the Platform. You are responsible for:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Providing accurate, current, and complete information during registration and KYC verification.</li>
            <li>Maintaining the confidentiality of your password and any credentials linked to your account.</li>
            <li>All activity that occurs under your account, whether or not authorized by you.</li>
            <li>Notifying us immediately of any unauthorized access or suspected security breach.</li>
          </ul>
          <p>
            One natural person may hold only one account. Accounts may not be sold,
            transferred, or shared.
          </p>
        </Section>

        <Section title="3. KYC and Identity Verification">
          <p>
            Access to certain features, transaction limits, and asset tiers is
            conditioned on completing Know Your Customer (KYC) identity verification.
            We may request government-issued identification, proof of address, or
            other documentation, and may use third-party or automated tools to verify
            submitted information.
          </p>
          <p>
            We reserve the right to request additional verification at any time,
            restrict account functionality pending verification, or reject submissions
            that appear incomplete, falsified, or fraudulent. Providing false
            information during KYC is a material breach of these Terms.
          </p>
        </Section>

        <Section title="4. Deposits and Withdrawals">
          <p>
            Deposits and withdrawals are processed manually or via supported on-chain
            mechanisms as described on the Platform. All deposit and withdrawal
            requests are subject to review and approval before funds are credited or
            released. We reserve the right to:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Set and modify minimum/maximum transaction limits per KYC tier.</li>
            <li>Delay, request additional information for, or decline any transaction we reasonably believe to be erroneous, fraudulent, or in violation of these Terms.</li>
            <li>Apply fees disclosed on the Platform at the time of the transaction.</li>
          </ul>
          <p>
            You are solely responsible for the accuracy of payment details, wallet
            addresses, and reference information you submit. We are not liable for
            funds lost due to incorrect information provided by you.
          </p>
        </Section>

        <Section title="5. Anti-Money Laundering and Fraud Prevention">
          <p>
            3REAL maintains anti-money laundering (AML) and counter-terrorist financing
            (CTF) controls consistent with applicable Norwegian and EU regulation. We
            may monitor transactions, freeze funds, or report activity to competent
            authorities where required by law or where we reasonably suspect illicit
            activity, fraud, or abuse of the Platform.
          </p>
          <p>
            We reserve the right to suspend an account and withhold funds for the
            duration of any investigation into suspected fraud, money laundering, or
            violation of these Terms, without prior notice, to the extent permitted by
            law.
          </p>
        </Section>

        <Section title="6. No Investment Advice">
          <p>
            Nothing on the Platform constitutes financial, investment, legal, or tax
            advice. 3REAL does not recommend that any digital asset be bought, sold, or
            held by you, and nothing on the Platform should be construed as a
            solicitation or offer to buy or sell any asset. You are solely responsible
            for evaluating the merits and risks of any transaction you undertake.
          </p>
        </Section>

        <Section title="7. Digital Asset Risk Disclosure">
          <p>
            Digital assets, including REAL, TON, and other supported tokens, are
            volatile and carry significant risk, including but not limited to:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Total or partial loss of value, including the possibility of an asset becoming worthless.</li>
            <li>Irreversibility of on-chain transactions — funds sent to an incorrect address generally cannot be recovered.</li>
            <li>Regulatory changes that may affect the availability, legality, or value of an asset.</li>
            <li>Technical risks including network congestion, smart contract vulnerabilities, and third-party infrastructure failures outside our control.</li>
          </ul>
          <p>
            You acknowledge these risks and confirm that you are using the Platform at
            your own discretion and risk.
          </p>
        </Section>

        <Section title="8. Suspension and Termination">
          <p>
            We may suspend or terminate your account, in whole or in part, at our
            discretion, with or without notice, where we reasonably believe:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>You have violated these Terms or any applicable law or regulation.</li>
            <li>Your account poses a security, fraud, or compliance risk to the Platform or other users.</li>
            <li>Continued provision of service is no longer commercially or legally viable.</li>
          </ul>
          <p>
            Upon termination, you remain entitled to request withdrawal of any
            verified, unencumbered balance, subject to completion of any pending
            compliance review.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, 3REAL and its operators,
            affiliates, and personnel shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits,
            revenue, data, or digital assets, arising from or related to your use of
            the Platform, even if advised of the possibility of such damages.
          </p>
          <p>
            Nothing in these Terms limits liability that cannot be excluded under
            mandatory Norwegian consumer protection law.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Material changes will be
            communicated via the Platform or by email. Continued use of the Platform
            after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these Terms can be directed to{" "}
            <a href="mailto:support@3real.no" className="text-amber-400 hover:underline">
              support@3real.no
            </a>
            .
          </p>
        </Section>

        <p className="pt-4 text-center text-xs text-zinc-700">
          <Link href="/privacy" className="text-zinc-500 hover:text-amber-400">
            Privacy Policy
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
