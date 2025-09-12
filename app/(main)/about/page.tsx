import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Building, Globe, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-dnx-blue text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  About Us
                </h1>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Revolutionizing property exploration across Africa and beyond.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <Image
                src="/placeholder.svg?height=800&width=1200"
                width={1200}
                height={800}
                alt="Crossatlantic Properties Team"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Our Story
                  </h2>
                  <p className="text-muted-foreground md:text-xl/relaxed">
                    Crossatlantic Properties was founded in 2020 with a vision
                    to transform how people discover, explore, and invest in
                    real estate across Africa.
                  </p>
                </div>
                <p className="text-muted-foreground">
                  Our journey began when our founders recognized a significant
                  gap in the African real estate market: the lack of accessible,
                  transparent, and comprehensive property information for both
                  local and international investors. With backgrounds in real
                  estate, technology, and finance, they set out to create a
                  platform that would bridge this gap.
                </p>
                <p className="text-muted-foreground">
                  Today, Crossatlantic Properties stands as a pioneering virtual
                  real estate platform, leveraging cutting-edge technology to
                  provide immersive property experiences. Our mission is to make
                  property exploration accessible to everyone, regardless of
                  geographical limitations, while promoting transparency and
                  trust in the African real estate market.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Our Mission & Vision
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Driving innovation and accessibility in the African real
                  estate market.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16 max-w-5xl">
                <Card className="bg-dnx-blue text-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Our Mission</h3>
                    <p>
                      To democratize access to real estate opportunities across
                      Africa by providing a transparent, immersive, and
                      user-friendly platform that connects property seekers with
                      verified listings, comprehensive information, and
                      innovative virtual experiences.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-dnx-orange border-2">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-dnx-blue">
                      Our Vision
                    </h3>
                    <p className="text-muted-foreground">
                      To become the leading virtual real estate platform in
                      Africa, known for revolutionizing property discovery
                      through technology, fostering trust in the market, and
                      creating opportunities for sustainable investment and
                      development.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Our Core Values
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  The principles that guide everything we do.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mb-4">
                    <Award className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Integrity</h3>
                  <p className="text-muted-foreground">
                    We are committed to honesty, transparency, and ethical
                    practices in all our operations.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Inclusivity</h3>
                  <p className="text-muted-foreground">
                    We believe in creating a platform that serves diverse
                    communities and needs across Africa.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mb-4">
                    <Building className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Innovation</h3>
                  <p className="text-muted-foreground">
                    We continuously strive to leverage technology to enhance the
                    real estate experience.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mb-4">
                    <Globe className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Impact</h3>
                  <p className="text-muted-foreground">
                    We aim to make a positive difference in the African real
                    estate market and the communities we serve.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Our Team
                  </h2>
                  <p className="text-muted-foreground md:text-xl/relaxed">
                    A diverse group of professionals passionate about real
                    estate and technology.
                  </p>
                </div>
                <p className="text-muted-foreground">
                  At Crossatlantic Properties, our team brings together
                  expertise from real estate, technology, finance, and customer
                  service. We are united by our passion for innovation and our
                  commitment to transforming the African real estate market.
                </p>
                <p className="text-muted-foreground">
                  Our leadership team has over 50 years of combined experience
                  in the real estate and technology sectors, with a deep
                  understanding of the unique challenges and opportunities in
                  the African market.
                </p>
                <div className="flex justify-start">
                  <Button asChild>
                    <Link href="/team">
                      Meet Our Team <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Image
                  src="/placeholder.svg?height=400&width=400"
                  width={400}
                  height={400}
                  alt="Team member"
                  className="aspect-square overflow-hidden rounded-xl object-cover"
                />
                <Image
                  src="/placeholder.svg?height=400&width=400"
                  width={400}
                  height={400}
                  alt="Team member"
                  className="aspect-square overflow-hidden rounded-xl object-cover"
                />
                <Image
                  src="/placeholder.svg?height=400&width=400"
                  width={400}
                  height={400}
                  alt="Team member"
                  className="aspect-square overflow-hidden rounded-xl object-cover"
                />
                <Image
                  src="/placeholder.svg?height=400&width=400"
                  width={400}
                  height={400}
                  alt="Team member"
                  className="aspect-square overflow-hidden rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20 bg-dnx-blue text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Join Our Journey
                </h2>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Be part of the revolution in African real estate.
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
