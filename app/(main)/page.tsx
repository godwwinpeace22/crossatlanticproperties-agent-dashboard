import EnhancedHeroSection from "@/components/enhanced-hero-section";
import ImmersivePropertyShowcase from "@/components/immersive-property-showcase";
import HowItWorks from "@/components/how-it-works";
import TestimonialSection from "@/components/testimonial-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Home,
  MapPin,
  TrendingUp,
  Users,
  Shield,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <EnhancedHeroSection />
      <ImmersivePropertyShowcase />
      <HowItWorks />

      {/* Enhanced Categories Section */}
      <section className="section-padding bg-gradient-to-br from-blue-500/5 to-orange-500/5">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Browse by Category</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore properties by type to find exactly what you're looking for
              with our advanced filtering system.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Home,
                title: "Residential",
                count: "15,000+",
                href: "/properties?type=residential",
              },
              {
                icon: Building2,
                title: "Commercial",
                count: "3,500+",
                href: "/properties?type=commercial",
              },
              {
                icon: MapPin,
                title: "Land",
                count: "8,200+",
                href: "/properties?type=land",
              },
              {
                icon: TrendingUp,
                title: "Investment",
                count: "2,100+",
                href: "/properties?type=investment",
              },
            ].map((category, index) => (
              <Link key={index} href={category.href} className="group">
                <div className="shadow-xl rounded-xl p-8 text-center h-full">
                  <category.icon className="h-16 w-16 mx-auto mb-6 text-dnx-blue group-hover:text-dnx-orange transition-colors duration-300" />
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {category.title}
                  </h3>
                  <p className="text-3xl font-bold text-orange-500 mb-4">
                    {category.count}
                  </p>
                  <p className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                    Properties Available
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Us Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Why Choose <span className="gradient-text">Us</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing real estate in Africa with cutting-edge
              technology and unmatched service.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Verified Properties",
                description:
                  "Every property is thoroughly verified and authenticated by our expert team before listing.",
                features: [
                  "Legal verification",
                  "Property inspection",
                  "Document authentication",
                  "Owner verification",
                ],
              },
              {
                icon: Zap,
                title: "AI-Powered Matching",
                description:
                  "Our advanced AI algorithm matches you with properties that perfectly fit your preferences.",
                features: [
                  "Smart recommendations",
                  "Preference learning",
                  "Market analysis",
                  "Price predictions",
                ],
              },
              {
                icon: Users,
                title: "Expert Support",
                description:
                  "Get personalized assistance from our team of licensed real estate professionals.",
                features: [
                  "24/7 support",
                  "Licensed agents",
                  "Legal assistance",
                  "Financing help",
                ],
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-gray-500 hover:shadow-xl transition-all duration-300 p-8 text-center animate-scale-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <feature.icon className="h-16 w-16 mx-auto mb-6 text-dnx-blue" />
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-center text-sm text-gray-500"
                    >
                      <div className="w-2 h-2 bg-dnx-orange rounded-full mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialSection />

      {/* Enhanced CTA Section */}
      <section className="section-padding hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="container-custom relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-fade-in">
              Ready to Find Your Dream Property?
            </h2>
            <p
              className="text-xl md:text-2xl mb-12 opacity-90 animate-slide-in-left"
              style={{ animationDelay: "0.3s" }}
            >
              Join thousands of satisfied customers who found their perfect home
              through DNX Properties.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-in-right"
              style={{ animationDelay: "0.6s" }}
            >
              <Button
                asChild
                size="lg"
                className="bg-white text-dnx-blue hover:bg-gray-100 text-lg px-8 py-4"
              >
                <Link href="/properties">
                  Browse Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-black hover:bg-white/10 text-lg px-8 py-4"
              >
                <Link href="/register">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
