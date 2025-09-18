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

const heroImages = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3",
];

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
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`Hero background ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
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
            <h1 className="text-5xl md:text-7xl lg:text-6xl font-display font-bold leading-tight">
              Find Your
              <span className="block bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                Dream Home
              </span>
            </h1>
            <p className="text-sm md:text-lg lg:text-lg font-light max-w-3xl mx-auto leading-relaxed">
              Discover premium properties across Africa with intelligent
              matching technology that connects you to your perfect home or
              investment opportunity
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
                    <SelectTrigger className="form-select text-gray-900 h-12 border-0 bg-white/90 hover:bg-white focus:bg-white">
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
                    <SelectTrigger className="form-select text-gray-900 h-12 border-0 bg-white/90 hover:bg-white focus:bg-white">
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
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <Input
                    type="text"
                    placeholder="Enter location, city, or property ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="form-input pl-12 pr-4 h-12 text-gray-900 border-0 bg-white/90 hover:bg-white focus:bg-white placeholder:text-gray-500"
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 rounded-xl font-semibold transition-all duration-200 hover:scale-105 lg:w-auto w-full"
                >
                  <Search className="mr-2 h-5 w-5" />
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
                    "Land in Ghana",
                    "Villas in Dubai",
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
