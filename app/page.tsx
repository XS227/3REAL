import { redirect } from "next/navigation";
import { getSession, validateSession } from "@/lib/auth/guards";
import { en } from "@/lib/i18n/en";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
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

  const t = en;

  return (
    <div className="bg-zinc-950 text-white">
      <Navbar t={t.nav} />
      <main>
        <HeroSection t={t.hero} />
        <EcosystemSection t={t.ecosystem} />
        <FeaturesSection t={t.features} />
        <HowItWorksSection t={t.howItWorks} />
        <SecuritySection t={t.security} />
        <FaqSection t={t.faq} />
      </main>
      <Footer t={t.footer} />
    </div>
  );
}
