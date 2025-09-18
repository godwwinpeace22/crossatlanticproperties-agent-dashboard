import Image from "next/image";
import Link from "next/link";
import {
  Building,
  Globe,
  MapPin,
  Shield,
  TrendingUp,
  Users,
  Home,
  FileText,
  Search,
  Hammer,
  Calculator,
  Award,
  Heart,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ServicesPage() {
  const services = [
    {
      icon: Building,
      title: "Property Procurement, Lease, Rental and Sales",
      description:
        "Comprehensive property services across the globe for all your real estate needs.",
      category: "Core Services",
    },
    {
      icon: Heart,
      title: "Diaspora Community Support",
      description:
        "Supporting the diaspora community to safely invest in properties in Africa with expert guidance.",
      category: "Diaspora Services",
    },
    {
      icon: Globe,
      title: "International Property Acquisition",
      description:
        "Supporting African investors to acquire properties in Western countries.",
      category: "International Services",
    },
    {
      icon: MapPin,
      title: "Trading on Land and Landed Properties",
      description:
        "Professional trading services for land and landed property investments.",
      category: "Investment Services",
    },
    {
      icon: TrendingUp,
      title: "Local & International Real Estate Investments",
      description:
        "Facilitating both local and international real estate investment opportunities.",
      category: "Investment Services",
    },
    {
      icon: Hammer,
      title: "Estate/Building Design & Construction",
      description:
        "Complete design and construction services for your estate and building projects.",
      category: "Construction Services",
    },
    {
      icon: FileText,
      title: "Legal Services, Brokerage and Mortgages",
      description:
        "Comprehensive legal support, brokerage services, and mortgage facilitation.",
      category: "Legal & Financial",
    },
    {
      icon: Shield,
      title: "Property Investment Insurance",
      description:
        "Protecting your property investments with comprehensive insurance solutions.",
      category: "Insurance & Protection",
    },
    {
      icon: Calculator,
      title: "Real Estate Investment Consultancy",
      description:
        "Expert consultancy services for informed real estate investment decisions.",
      category: "Consultancy",
    },
    {
      icon: Building2,
      title: "Real Estate Business Development",
      description:
        "Strategic business development services for real estate ventures.",
      category: "Business Development",
    },
    {
      icon: TrendingUp,
      title: "Real Estate/Housing Project Funding",
      description:
        "Funding solutions for real estate and housing development projects.",
      category: "Funding & Finance",
    },
    {
      icon: Hammer,
      title: "Building Construction Management",
      description:
        "Professional construction management services from start to finish.",
      category: "Construction Services",
    },
    {
      icon: Search,
      title: "Property Search, Verification, Documentation, Survey",
      description:
        "Comprehensive property search, verification, documentation, and survey services.",
      category: "Property Services",
    },
    {
      icon: Home,
      title: "Estate/Property Management Services",
      description:
        "Complete estate and property management solutions for property owners.",
      category: "Management Services",
    },
    {
      icon: Award,
      title: "Real Estate Investment Advice",
      description:
        "Professional investment advice to maximize your real estate portfolio returns.",
      category: "Advisory Services",
    },
  ];

  const serviceCategories = [
    "Core Services",
    "Diaspora Services",
    "International Services",
    "Investment Services",
    "Construction Services",
    "Legal & Financial",
    "Insurance & Protection",
    "Consultancy",
    "Business Development",
    "Funding & Finance",
    "Property Services",
    "Management Services",
    "Advisory Services",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-dnx-blue text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Our Services
                </h1>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Cross Atlantic Property Ltd - Your Complete Real Estate
                  Partner
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Business Interest & Services Section */}
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Our Business Interest & Services
              </h2>
              <p className="max-w-[800px] mx-auto text-muted-foreground md:text-xl/relaxed">
                Comprehensive real estate solutions spanning across continents,
                serving both local and international clients with expertise and
                dedication.
              </p>
            </div>
          </div>
        </section>

        {/* Core Services Highlight */}
        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card className="bg-dnx-blue text-white">
                <CardContent className="p-8 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-4">Diaspora Support</h3>
                  <p>
                    Specialized services helping Nigerian diaspora safely invest
                    in African properties with complete peace of mind.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-dnx-orange border-2">
                <CardContent className="p-8 text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-dnx-blue" />
                  <h3 className="text-xl font-bold mb-4 text-dnx-blue">
                    Global Reach
                  </h3>
                  <p className="text-muted-foreground">
                    Property procurement, lease, rental and sales services
                    across the globe with local expertise.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-dnx-orange text-white">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-4">
                    Investment Excellence
                  </h3>
                  <p>
                    Supporting African investors to acquire properties in
                    Western countries with comprehensive guidance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* All Services Grid */}
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Complete Service Portfolio
              </h2>
              <p className="max-w-[600px] mx-auto text-muted-foreground">
                From property search to construction management, we provide
                end-to-end real estate solutions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dnx-blue/10 flex-shrink-0">
                        <service.icon className="h-6 w-6 text-dnx-blue" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-dnx-orange font-medium uppercase tracking-wide">
                          {service.category}
                        </div>
                        <h3 className="font-semibold leading-tight">
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Why Choose Cross Atlantic Properties?
              </h2>
              <p className="max-w-[600px] mx-auto text-muted-foreground">
                Your trusted partner for seamless real estate experiences across
                continents.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mx-auto">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="font-bold">Global Presence</h3>
                <p className="text-sm text-muted-foreground">
                  Operating across Nigeria, UK, Canada, USA, Dubai, Ethiopia,
                  Rwanda & Ghana.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mx-auto">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="font-bold">Safe & Reliable</h3>
                <p className="text-sm text-muted-foreground">
                  Secure investment processes with comprehensive insurance and
                  legal support.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mx-auto">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-bold">Expert Team</h3>
                <p className="text-sm text-muted-foreground">
                  Experienced professionals with deep market knowledge and local
                  expertise.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dnx-blue text-white mx-auto">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="font-bold">End-to-End Service</h3>
                <p className="text-sm text-muted-foreground">
                  Complete solutions from property search to construction
                  management.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 md:py-16 lg:py-20 bg-dnx-blue text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Ready to Start Your Property Journey?
                </h2>
                <p className="max-w-[700px] md:text-xl/relaxed">
                  Contact us today to discuss your real estate needs and
                  discover how we can help you achieve your property goals.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" variant="secondary">
                  <Link href="/contact">Get Started Today</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white hover:bg-white/10"
                >
                  <Link href="/properties">Browse Properties</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
