"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUp,
  Send,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import { useLocations } from "@/hooks/use-locations";

export function Footer() {
  const { locations, isLoading } = useLocations();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-800 text-white relative">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top section with logo and social media */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 lg:mb-0">
            <Image
              src="/logo.jpg"
              alt="Crossatlanticproperties Logo"
              width={120}
              height={40}
              className="h-auto w-[50px]"
            />
            <div>
              <h2 className="text-xl font-semibold">
                CrossAtlantic Properties
              </h2>
              <p className="text-gray-400 text-sm">
                Your Trusted Real Estate Partner
              </p>
            </div>
          </div>

          {/* Social media */}
          <div className="flex items-center gap-4">
            <span className="text-gray-300 mr-2">Follow Us:</span>
            <div className="flex gap-2">
              <a
                href="https://www.facebook.com/crossatlanticproperties/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/AtlanticCr64331"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors duration-300"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/crossatlanticproperties/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors duration-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company info */}
          <div className="lg:col-span-1">
            {/* <p className="text-gray-300 mb-6 leading-relaxed">
              Connecting property buyers, sellers, and investors across Nigeria
              with premium real estate opportunities. Your dream property
              awaits.
            </p> */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <div className="text-gray-300 text-sm">
                  <div className="mb-3">
                    <strong>Nigeria</strong> <br />
                    Block D flat 4, Sky Memorial Complex, Wuse Zone 5, FCT,
                    Abuja, Nigeria
                  </div>
                  <div>
                    <strong>United Kingdom</strong> <br />
                    The Ingenuity Lab, C16 The Ingenuity Centre, Jubilee Campus,
                    University of Nottingham
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <div className="text-gray-300 text-sm">
                  <div>+234 806 158 2043</div>
                  <div>+234 708 611 2909</div>
                  <div>+44 743 546 8699</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <span className="text-gray-300 text-sm">
                  info@crossatlanticproperties.com
                </span>
              </div>
            </div>
          </div>

          {/* Property Services */}
          <div>
            <h3 className="text-white font-semibold mb-6">Property Services</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/properties?purpose=sale"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Buy Properties
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Sell Properties
                </a>
              </li>
              <li>
                <a
                  href="/properties?purpose=rent"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Rent Properties
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Property Valuation
                </a>
              </li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-white font-semibold mb-6">Property Types</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/properties?category=house"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Residential Homes
                </a>
              </li>
              <li>
                <a
                  href="/properties?category=commercial"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Commercial Spaces
                </a>
              </li>
              <li>
                <a
                  href="/properties?category=villa"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Luxury Estates
                </a>
              </li>
              <li>
                <a
                  href="/properties?category=land"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Land & Plots
                </a>
              </li>
            </ul>
          </div>

          {/* Popular Locations */}
          <div>
            <h3 className="text-white font-semibold mb-6">Popular Locations</h3>
            <ul className="space-y-3">
              {isLoading ? (
                // Loading skeleton
                <>
                  {[...Array(5)].map((_, index) => (
                    <li key={index}>
                      <div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div>
                    </li>
                  ))}
                </>
              ) : locations.length > 0 ? (
                // Display actual locations from database
                locations.slice(0, 6).map((location) => (
                  <li key={location.id}>
                    <a
                      href={`/properties?location=${location.id}`}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {location.name}
                    </a>
                  </li>
                ))
              ) : (
                // Fallback when no locations are available
                <li>
                  <span className="text-gray-400 text-sm">
                    No locations available
                  </span>
                </li>
              )}
              {locations.length > 6 && (
                <li>
                  <a
                    href="/properties"
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                  >
                    View all locations →
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-6">
              Property Newsletter
            </h3>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              Get the latest property listings, market insights, and investment
              opportunities delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 flex-1"
              />
              <Button className="bg-blue-500 hover:bg-blue-600 px-4">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              ©2026 CrossAtlantic Properties. All Rights Reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms Of Use
              </a>
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="/contact"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <Button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
        size="icon"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </footer>
  );
}
