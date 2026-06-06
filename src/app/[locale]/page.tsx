import { NavBar } from '@/components/features/landing/NavBar'
import { HeroSection } from '@/components/features/landing/HeroSection'
import { PainPointsSection } from '@/components/features/landing/PainPointsSection'
import { HowItWorksSection } from '@/components/features/landing/HowItWorksSection'
import { MirrorMockup } from '@/components/features/landing/MirrorMockup'
import { CareerMapMockup } from '@/components/features/landing/CareerMapMockup'
import { ContentGenSection } from '@/components/features/landing/ContentGenSection'
import { CtaSection } from '@/components/features/landing/CtaSection'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <PainPointsSection />
        <HowItWorksSection />
        <AnimatedSection>
          <MirrorMockup />
        </AnimatedSection>
        <AnimatedSection>
          <CareerMapMockup />
        </AnimatedSection>
        <AnimatedSection>
          <ContentGenSection />
        </AnimatedSection>
        <CtaSection />
      </main>
    </>
  )
}
