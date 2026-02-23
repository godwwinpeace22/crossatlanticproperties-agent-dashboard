"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Play,
  Search,
  MapPin,
  Home,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicSystemSettings } from "@/hooks/use-system-settings";

const defaultHeroSlides: HeroSlide[] = [
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3",
  },
];

const defaultHeroTitle = "Find Your Dream Home";
const defaultHeroSubtitle =
  "Discover premium properties across Africa with intelligent matching technology that connects you to your perfect home or investment opportunity";

type HeroSlide = {
  type: "image" | "video";
  url: string;
  poster?: string;
};

const stats = [
  { icon: Home, value: "50K+", label: "Properties Listed" },
  { icon: TrendingUp, value: "98%", label: "Customer Satisfaction" },
  { icon: MapPin, value: "25+", label: "Cities Covered" },
];

export default function EnhancedHeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("any");
  const [listingType, setListingType] = useState("buy");
  const [heroTitle, setHeroTitle] = useState(defaultHeroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(defaultHeroSubtitle);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(defaultHeroSlides);
  const { settings, loading: settingsLoading } = usePublicSystemSettings();
  const router = useRouter();

  useEffect(() => {
    if (settingsLoading) return;

    const title = settings.hero_title || defaultHeroTitle;
    const subtitle = settings.hero_subtitle || defaultHeroSubtitle;
    const slides = Array.isArray(settings.hero_slides)
      ? settings.hero_slides
      : defaultHeroSlides;

    const normalizedSlides = slides
      .map((slide: any) => {
        if (!slide?.url) return null;
        return {
          type: slide.type === "video" ? "video" : "image",
          url: String(slide.url),
          poster: slide.poster ? String(slide.poster) : undefined,
        } as HeroSlide;
      })
      .filter(Boolean) as HeroSlide[];

    setHeroTitle(title);
    setHeroSubtitle(subtitle);
    setHeroSlides(
      normalizedSlides.length > 0 ? normalizedSlides : defaultHeroSlides,
    );
  }, [settings, settingsLoading]);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const handleSearch = () => {
    // Build search parameters to match what the properties page expects
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (category && category !== "any") {
      params.set("category", category);
    }

    // Map listing type to purpose that the properties page expects
    if (listingType === "buy") {
      params.set("purpose", "sale");
    } else if (listingType === "rent") {
      params.set("purpose", "rent");
    }

    // Navigate to properties page with search parameters
    const queryString = params.toString();
    const url = queryString ? `/properties?${queryString}` : "/properties";
    router.push(url);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide.type === "video" ? (
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster={slide.poster}
              >
                <source src={slide.url} />
              </video>
            ) : (
              <Image
                src={slide.url || "/placeholder.svg"}
                alt={`Hero background ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </div>
        ))}
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-500/20 rounded-full animate-float" />
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-blue-500/20 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-40 left-20 w-12 h-12 bg-orange-500/30 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 container-custom text-center text-white py-5 md:py-0">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Main Heading */}
          <div className="space-y-6 animate-fade-in">
            {(() => {
              const [leadRaw, emphasisRaw] = heroTitle.includes("|")
                ? heroTitle.split("|")
                : [heroTitle, ""];
              const lead = leadRaw?.trim() || defaultHeroTitle;
              const emphasis = emphasisRaw?.trim();

              return (
                <h1 className="text-5xl md:text-7xl lg:text-6xl font-display font-bold leading-tight">
                  {lead}
                  {emphasis ? (
                    <span className="block bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                      {emphasis}
                    </span>
                  ) : null}
                </h1>
              );
            })()}
            <p className="text-sm md:text-lg lg:text-lg font-light max-w-3xl mx-auto leading-relaxed">
              {heroSubtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div
            className="max-w-5xl mx-auto animate-slide-in-left"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="glass-effect rounded-3xl p-4 md:p-6">
              {/* Search Form */}
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-2">
                {/* Listing Type */}
                <div className="lg:w-32">
                  <Select value={listingType} onValueChange={setListingType}>
                    <SelectTrigger className="form-select text-gray-900 h-20 border-0 bg-white/90 hover:bg-white focus:bg-white">
                      <SelectValue placeholder="Buy/Rent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type */}
                <div className="lg:w-40">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="form-select text-gray-900 h-20 border-0 bg-white/90 hover:bg-white focus:bg-white">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Search */}
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Enter location, city, or property ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="form-input pl-12 pr-4 h- text-gray-900 border-0 bg-white/90 hover:bg-white focus:bg-white placeholder:text-gray-500"
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-xl px-8 rounded-xl font-semibold transition-all duration-200 hover:scale-105 lg:w-auto w-full"
                >
                  {/* <Search className="mr-2 h-5 w-5" /> */}
                  <span className="hidden sm:inline">Search Properties</span>
                  <span className="sm:hidden">Search</span>
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-white/70 text-sm mr-2">Popular:</span>
                  {[
                    "Houses in Lagos",
                    "Apartments in Abuja",
                    "Land in PortHarcourt",
                  ].map((filter, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(filter.split(" in ")[1])}
                      className="text-white/80 hover:text-white text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all duration-200"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {/* <div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-scale-in"
            style={{ animationDelay: "0.9s" }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass-effect rounded-xl p-6 text-center"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-dnx-orange" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* Scroll Indicator */}
      {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div> */}
    </section>
  );
}
