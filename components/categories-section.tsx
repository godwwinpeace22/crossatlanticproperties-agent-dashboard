import Link from "next/link";
import { Building2, Home, MapPin, TrendingUp } from "lucide-react";

export function CategoriesSection() {
  const categories = [
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
  ];

  return (
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
          {categories.map((category, index) => (
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
  );
}
