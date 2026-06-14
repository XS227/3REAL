import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, validateSession } from "@/lib/auth/guards";
import { landingDicts, resolveLandingLang } from "@/lib/i18n";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarketSection } from "@/components/landing/MarketSection";
import { MarketOverviewSection } from "@/components/landing/MarketOverviewSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";

export default async function RootPage() {
  // Valid, non-expired sessions go straight to the dashboard
  const jwtSession = await getSession();
  if (jwtSession) {
    const session = await validateSession(jwtSession);
    if (session) redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const lang = resolveLandingLang(cookieStore.get("lang")?.value);
  const t = landingDicts[lang];
  const rtl = lang === "fa";

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      lang={lang}
      className={`bg-zinc-950 text-white ${rtl ? "font-fa" : ""}`}
    >
      <Navbar t={t.nav} lang={lang} />
      <main>
        <HeroSection t={t.hero} />
        <Suspense fallback={<section id="market" className="px-4 py-24" />}>
          <MarketSection t={t.market} />
        </Suspense>
        <EcosystemSection t={t.ecosystem} />
        <FeaturesSection t={t.features} />
        <HowItWorksSection t={t.howItWorks} />
        <SecuritySection t={t.security} />
        <Suspense fallback={<section id="market-overview" className="px-4 py-24" />}>
          <MarketOverviewSection t={t.marketOverview} />
        </Suspense>
        <FaqSection t={t.faq} />
      </main>
      <Footer t={t.footer} lang={lang} />
    </div>
  );
}
