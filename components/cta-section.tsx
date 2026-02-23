import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section
      className="section-padding relative overflow-hidden bg-cover bg-center bg-no-repeat text-white md:bg-fixed"
      style={{
        backgroundImage:
          "url('/sydney-opera-house-with-city-skyline-at-sunset.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
      <div className="container-custom relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Cross-border real estate made simple
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
              Invest confidently in premium properties from anywhere in the
              world.
            </h2>
            <p className="text-base md:text-lg text-white/80 max-w-2xl">
              Explore verified listings, transparent pricing, and guided support
              tailored for Nigerians in the diaspora looking to own property
              back home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                <Link href="/properties">
                  Browse Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/50 bg-white/10"
              >
                <Link href="/register">Start Your Journey</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-semibold">200+ Listings</p>
              <p className="text-sm text-white/70">
                Curated properties with verified documentation.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-semibold">Flexible Payments</p>
              <p className="text-sm text-white/70">
                Installment plans that match your cash flow.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-semibold">Trusted Advisors</p>
              <p className="text-sm text-white/70">
                Dedicated support from discovery to closing.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-semibold">Secure KYC</p>
              <p className="text-sm text-white/70">
                Verified identities for safer transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
