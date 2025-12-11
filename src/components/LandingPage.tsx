import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatureGrid } from '@/components/landing/LandingFeatureGrid';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingCompare } from '@/components/landing/LandingCompare';
import { LandingProSectionContainer } from '@/components/landing/LandingProSectionContainer';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingLeadFormProvider } from '@/components/landing/LandingLeadFormContext';

export default function LandingPage() {
  return (
    <LandingLeadFormProvider>
      <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-orange-100 dark:selection:bg-orange-900 overflow-x-hidden">
        <LandingNav />
        <LandingHero />
        <LandingFeatureGrid />
        <LandingTestimonials />
        <LandingCompare />
        <LandingProSectionContainer />
        <LandingFaq />
        <LandingFooter />
      </div>
    </LandingLeadFormProvider>
  );
}
