import Image from "next/image";
import { Building, Globe, MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32 text-white overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/about1.jpg"
              alt="Cross Atlantic Properties Background"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/85 to-orange-600/75" />
          </div>

          {/* Content */}
          <div className="relative z-10 container-custom mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Welcome to Cross Atlantic Properties Ltd
                </h1>
                <p className=" md:text-xl/relaxed text-center">
                  "Real Estate Beyond Borders"
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container-custom mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <Image
                src="/about1.jpg"
                width={1200}
                height={800}
                alt="Cross Atlantic Properties Office"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Our Story
                  </h2>
                  <p className="text-muted-foreground md:text-xl/relaxed">
                    Cross Atlantic Properties Ltd offers safe and reliable real
                    estate services to Nigerians in the diaspora wanting to
                    acquire properties in Nigeria and also supports clients
                    domiciled in Nigeria to buy properties or secure mortgages
                    abroad.
                  </p>
                </div>
                <p className="text-muted-foreground">
                  We also support clients by integrating their property
                  acquisition with securing residency permits in the country
                  where they purchased their property. We have a presence in
                  Nigeria (Abuja, Enugu, Asaba, Port Harcourt, Lagos) and
                  property agents in the UK, Canada, USA, Dubai, Ethiopia,
                  Rwanda & Ghana.
                </p>
                <p className="text-muted-foreground">
                  Discover your dream home effortlessly. Explore diverse
                  properties and expert guidance for a seamless procurement
                  experience.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container-custom">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Discover What Sets Our Real Estate Expertise Apart
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Welcome to Cross Atlantic Properties Ltd (CAP), where we turn
                  houses into homes and dreams into reality.
                </p>
              </div>
              <div className="max-w-4xl text-center space-y-4">
                <p className="text-muted-foreground">
                  This CAP Portal is designed to make property management and
                  browsing a breeze, offering a robust set of features tailored
                  to the needs of today's real estate market.
                </p>
                <p className="text-muted-foreground">
                  At CAP, our unwavering commitment lies in crafting
                  unparalleled real estate journeys. Our seasoned professionals,
                  armed with extensive market knowledge, walk alongside you
                  through every phase of your property endeavor. We prioritize
                  understanding your unique aspirations, tailoring our expertise
                  to match your vision.
                </p>
                <div className="pt-4">
                  <h3 className="text-2xl font-bold text-dnx-blue mb-2">
                    "Empowering Property Ownership Across Continents"
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container-custom">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Our Global Presence
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Serving clients across multiple continents with local
                  expertise.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 text-white mb-4">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Nigeria</h3>
                  <p className="text-muted-foreground">
                    Abuja, Enugu, Asaba, Port Harcourt, Lagos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 text-white mb-4">
                    <Globe className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">International</h3>
                  <p className="text-muted-foreground">
                    UK, Canada, USA, Dubai
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 text-white mb-4">
                    <Building className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Africa</h3>
                  <p className="text-muted-foreground">
                    Ethiopia, Rwanda, Ghana
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container-custom">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Our Services
                  </h2>
                  <p className="text-muted-foreground md:text-xl/relaxed">
                    Comprehensive real estate solutions across borders.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <Card className="bg-blue-400 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">
                        For Diaspora Clients
                      </h3>
                      <p>
                        Safe and reliable real estate services for Nigerians in
                        the diaspora wanting to acquire properties in Nigeria,
                        with expert guidance every step of the way.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-400 border-2">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4 text-orange-400">
                        International Expansion
                      </h3>
                      <p className="text-muted-foreground">
                        Supporting clients domiciled in Nigeria to buy
                        properties or secure mortgages abroad, including
                        assistance with residency permit integration.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/about2.jpg"
                  width={600}
                  height={500}
                  alt="Cross Atlantic Properties Team"
                  className="aspect-square overflow-hidden rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative w-full py-12 md:py-16 lg:py-20 text-white overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/about2.jpg"
              alt="Cross Atlantic Properties Team Background"
              fill
              className="object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/70" />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Start Your Property Journey
                </h2>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Whether you're in the diaspora or looking to invest abroad,
                  we're here to help.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" variant="secondary">
                  <Link href="/properties">Browse Properties</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white hover:bg-white/10"
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
