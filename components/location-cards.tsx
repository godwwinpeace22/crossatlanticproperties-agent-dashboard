import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const locations = [
  {
    id: 1,
    city: "Lagos",
    properties: "2,450 Properties",
    image: "/lighthouse-by-the-ocean-with-blue-sky.jpg",
    alt: "Lagos cityscape",
  },
  {
    id: 2,
    city: "Abuja",
    properties: "1,230 Properties",
    image: "/sydney-opera-house-with-city-skyline-at-sunset.jpg",
    alt: "Abuja city skyline at sunset",
  },
  {
    id: 3,
    city: "Port Harcourt",
    properties: "890 Properties",
    image: "/city-skyline-at-sunset-with-orange-and-purple-sky.jpg",
    alt: "Port Harcourt city skyline at sunset",
  },
  {
    id: 4,
    city: "Kano",
    properties: "654 Properties",
    image: "/tokyo-tower-with-modern-city-buildings.jpg",
    alt: "Kano modern buildings",
  },
  {
    id: 5,
    city: "Ibadan",
    properties: "567 Properties",
    image: "/empire-state-building-and-new-york-skyline.jpg",
    alt: "Ibadan city skyline",
  },
  {
    id: 6,
    city: "Enugu",
    properties: "423 Properties",
    image: "/berlin-tv-tower-with-modern-architecture-and-blue.jpg",
    alt: "Enugu modern architecture",
  },
];

export function LocationCards() {
  return (
    <section className="py-16 px-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-blue-600 font-medium text-sm tracking-wider uppercase mb-2">
          EXPLORE CITIES
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
          Our Location For You
        </h2>
      </div>

      {/* Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {locations.map((location) => (
          <Card
            key={location.id}
            className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white p-0"
          >
            {/* Image Container with Overlay Content - Full Card Height */}
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={location.image || "/placeholder.svg"}
                alt={location.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Content Card Overlay with Reduced Padding */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-white/95 backdrop-blur-sm rounded-md p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        {location.properties}
                      </p>
                      <h3 className="text-base font-semibold text-foreground">
                        {location.city}
                      </h3>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-600 transition-colors duration-300">
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
