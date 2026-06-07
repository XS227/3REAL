import type { LandingDict } from "@/lib/i18n/en";

export function HowItWorksSection({ t }: { t: LandingDict["howItWorks"] }) {
  return (
    <section id="how-it-works" className="bg-zinc-900/40 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="mx-auto max-w-xl text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px lg:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.25) 15%, rgba(245,158,11,0.25) 85%, transparent 100%)",
            }}
          />

          {t.steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center sm:items-start sm:text-left lg:items-center lg:text-center">
              {/* Number bubble */}
              <div className="relative mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/50 bg-zinc-950 font-black text-amber-400 text-sm">
                {step.number}
              </div>

              <h3 className="mb-2 text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
