"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, MapPin, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLocations } from "@/hooks/use-locations";

interface HeaderProps {
  user?: any; // You can define a proper User type later
}

export function Header({ user }: HeaderProps) {
  const { locations, isLoading } = useLocations();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo.png"
            alt="Crossatlanticproperties Logo"
            width={420}
            height={40}
            className="h-auto w-[150px]"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-10">
          <Link href="/" className="transition-colors hover:text-dnx-orange">
            Home
          </Link>
          <Link
            href="/properties"
            className="transition-colors hover:text-dnx-orange"
          >
            Properties
          </Link>
          <div className="group relative">
            <div className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-dnx-orange cursor-pointer">
              Locations
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                {locations.map((location) => (
                  <Link
                    key={location.id}
                    href={`/properties?location=${location.id}`}
                    className="block px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    {location.name}
                  </Link>
                ))}
                {locations.length === 0 && isLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading locations...
                  </div>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/blog"
            className="transition-colors hover:text-dnx-orange"
          >
            Blog
          </Link>
          <Link
            href="/market-analysis"
            className="transition-colors hover:text-dnx-orange"
          >
            Market Analysis
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-dnx-orange"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-dnx-orange"
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button size="sm" asChild className="hidden md:flex">
                <Link href="/dashboard/profile">My Profile</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="hidden md:flex">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex items-center gap-2 font-semibold mb-8">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dnx%20name%20c%201-VD3PkU82RPbsV5mDPfEu4ZyLX4bt1y.png"
                  alt="Crossatlanticproperties Logo"
                  width={420}
                  height={40}
                  className="h-auto w-[150px]"
                />
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="ml-auto">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </SheetTrigger>
              </div>
              <nav className="flex flex-col gap-4 text-sm font-medium">
                <Link
                  href="/"
                  className="transition-colors hover:text-dnx-orange"
                >
                  Home
                </Link>
                <Link
                  href="/properties"
                  className="transition-colors hover:text-dnx-orange"
                >
                  Properties
                </Link>

                {/* Mobile Locations Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Locations</span>
                  </div>
                  <div className="pl-6 flex flex-col gap-2">
                    {locations.map((location) => (
                      <Link
                        key={location.id}
                        href={`/properties?location=${location.id}`}
                        className="transition-colors hover:text-dnx-orange text-sm"
                      >
                        {location.name}
                      </Link>
                    ))}
                    {locations.length === 0 && isLoading && (
                      <div className="text-sm text-muted-foreground">
                        Loading locations...
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/blog"
                  className="transition-colors hover:text-dnx-orange"
                >
                  Blog
                </Link>

                <Link
                  href="/market-analysis"
                  className="transition-colors hover:text-dnx-orange border-t pt-4"
                >
                  Market Analysis
                </Link>

                <Link
                  href="/about"
                  className="transition-colors hover:text-dnx-orange"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-dnx-orange"
                >
                  Contact
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="transition-colors hover:text-dnx-orange"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="transition-colors hover:text-dnx-orange"
                    >
                      My Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-dnx-orange"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="transition-colors hover:text-dnx-orange"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
