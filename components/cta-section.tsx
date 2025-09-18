import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
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
            through CrossAtlantic Properties.
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
  );
}
