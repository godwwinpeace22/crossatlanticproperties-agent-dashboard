import EnhancedHeroSection from "@/components/enhanced-hero-section";
import ImmersivePropertyShowcase from "@/components/immersive-property-showcase";
import HowItWorks from "@/components/how-it-works";
import TestimonialSection from "@/components/testimonial-section";
import { LocationCards } from "@/components/location-cards";
import { PropertyTypesShowcase } from "@/components/property-types-showcase";
import { WhyChooseUsSection } from "@/components/why-choose-us-section";
import { CTASection } from "@/components/cta-section";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <EnhancedHeroSection />
      <PropertyTypesShowcase />
      <ImmersivePropertyShowcase />
      <HowItWorks />
      <LocationCards />
      {/* <WhyChooseUsSection /> */}
      <TestimonialSection />
      <CTASection />
    </div>
  );
}
