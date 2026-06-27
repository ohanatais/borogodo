import { NavBar } from '@/components/features/landing/NavBar'
import { HeroSection } from '@/components/features/landing/HeroSection'
import { PainPointsSection } from '@/components/features/landing/PainPointsSection'
import { JourneySection } from '@/components/features/landing/JourneySection'
import { ProofSection } from '@/components/features/landing/ProofSection'
import { OwnershipSection } from '@/components/features/landing/OwnershipSection'
import { ManifestoSection } from '@/components/features/landing/ManifestoSection'
import { SocialProofSection } from '@/components/features/landing/SocialProofSection'
import { FaqSection } from '@/components/features/landing/FaqSection'
import { CtaSection } from '@/components/features/landing/CtaSection'
import { Footer } from '@/components/features/landing/Footer'
import { StructuredData } from '@/components/features/landing/StructuredData'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <NavBar />
      <main>
        <HeroSection />
        <AnimatedSection>
          <PainPointsSection />
        </AnimatedSection>
        <AnimatedSection>
          <JourneySection />
        </AnimatedSection>
        <AnimatedSection>
          <ProofSection />
        </AnimatedSection>
        <AnimatedSection>
          <OwnershipSection />
        </AnimatedSection>
        <AnimatedSection>
          <ManifestoSection />
        </AnimatedSection>
        <AnimatedSection>
          <SocialProofSection />
        </AnimatedSection>
        <AnimatedSection>
          <FaqSection />
        </AnimatedSection>
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
