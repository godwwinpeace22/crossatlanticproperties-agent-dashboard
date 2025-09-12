"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
];

const stats = [
  { icon: Home, value: "50K+", label: "Properties Listed" },
  { icon: TrendingUp, value: "98%", label: "Customer Satisfaction" },
  { icon: MapPin, value: "25+", label: "Cities Covered" },
];

export default function EnhancedHeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [listingType, setListingType] = useState("buy");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    // Implement search functionality
    console.log("Searching for:", { searchQuery, propertyType, listingType });
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
        <div className="absolute top-20 left-10 w-20 h-20 bg-dnx-orange/20 rounded-full animate-float" />
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-dnx-blue/20 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-40 left-20 w-12 h-12 bg-dnx-orange/30 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 container-custom text-center text-white">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Main Heading */}
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-7xl lg:text-6xl font-display font-bold leading-tight">
              Discover Your
              <span className="block bg-gradient-to-r from-dnx-orange to-yellow-400 bg-clip-text text-transparent">
                Dream Property
              </span>
            </h1>
            <p className="text-sm md:text-lg lg:text-lg font-light max-w-3xl mx-auto leading-relaxed">
              Experience the future of real estate with immersive virtual tours
              and AI-powered property matching across Africa
            </p>
          </div>

          {/* Search Bar */}
          <div
            className="max-w-4xl mx-auto animate-slide-in-left"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="glass-effect rounded-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="form-select text-gray-900">
                    <SelectValue placeholder="Buy/Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="form-select text-gray-900">
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

                <div className="md:col-span-2 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Location or Property ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input pl-10 text-gray-900"
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="w-full btn-primary text-lg py-4 rounded-xl"
              >
                <Search className="mr-2 h-5 w-5" />
                Search Properties
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div
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
          </div>
        </div>
      </div>

      {/* Video Background Option */}
      <div className="absolute bottom-8 right-8 z-30">
        <Button
          variant="outline"
          size="sm"
          className="glass-effect border-white/30 text-white hover:bg-white/20"
        >
          <Play className="h-4 w-4 mr-2" />
          Watch Demo
        </Button>
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
