import Link from "next/link";

export const metadata = { title: "About — 3REAL" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function TeamCard({
  name,
  role,
  note,
}: {
  name: string;
  role: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm font-semibold text-zinc-100">{name}</p>
      <p className="mt-1 text-sm text-amber-400">{role}</p>
      <p className="mt-2 text-sm text-zinc-500">{note}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase mb-2">
            3REAL
          </p>
          <h1 className="text-3xl font-bold text-zinc-100">About 3REAL</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            3REAL is a beta digital asset portal, part of the SETAEI ecosystem
            and operated from Norway. It lets you manage REAL tokens and other
            supported digital assets — REAL, TON, USDT, EUR, NOK, and TRY — from
            a single account, with a double-entry ledger behind every balance.
          </p>
        </div>

        <Section title="What 3REAL Is">
          <p>
            3REAL is a digital asset portal, not a cryptocurrency exchange. We
            do not operate an order book or offer trading between assets — we
            provide deposits, withdrawals, balance management, and a referral
            program built around the REAL token, which trades on the open TON
            market independent of 3REAL.
          </p>
          <p>
            3REAL is currently in <span className="text-zinc-300">public beta</span>.
            Deposits and withdrawals are reviewed manually by our team while we
            harden automated systems. We are upfront about this so you can make
            an informed decision before depositing funds — see our{" "}
            <Link href="/whitepaper" className="text-amber-400 hover:underline">
              whitepaper
            </Link>{" "}
            and{" "}
            <Link href="/security" className="text-amber-400 hover:underline">
              security page
            </Link>{" "}
            for details.
          </p>
        </Section>

        <Section title="Regulatory Status">
          <p>
            3REAL is not a licensed bank, payment institution, or regulated
            exchange. We do not claim any financial license or regulatory
            authorization beyond what is explicitly stated here. We comply with
            applicable KYC/AML obligations on a best-effort basis during beta
            and are evaluating formal licensing as the platform matures. If
            this status changes, we will update this page.
          </p>
        </Section>

        <Section title="Team">
          <p>
            3REAL is built and operated by SETAEI. The current team:
          </p>
          <div className="grid gap-3 sm:grid-cols-1">
            <TeamCard
              name="Khabat Setaei (SETAEI)"
              role="Founder"
              note="Founded and directs 3REAL and the wider SETAEI ecosystem."
            />
            <TeamCard
              name="TBD"
              role="Operations Partner — Iran"
              note="Under onboarding. This role will be announced here once finalized."
            />
            <TeamCard
              name="SETAEI Engineering"
              role="Technical & Security"
              note="Responsible for platform engineering, infrastructure, and security practices, led by SETAEI."
            />
          </div>
          <p>
            We will keep this section current as the team grows — if a role
            says TBD, it means we have not finalized that hire yet, not that
            the position doesn&apos;t exist.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, concerns, or beta feedback are welcome at{" "}
            <a href="mailto:support@3real.no" className="text-amber-400 hover:underline">
              support@3real.no
            </a>
            .
          </p>
        </Section>

        <p className="pt-4 text-center text-xs text-zinc-700">
          <Link href="/whitepaper" className="text-zinc-500 hover:text-amber-400">
            Whitepaper
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
