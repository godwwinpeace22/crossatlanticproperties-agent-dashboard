"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  MapPin,
  ChevronDown,
  User as UserIcon,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLocations } from "@/hooks/use-locations";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notification-bell";

export function Header() {
  const { locations, isLoading } = useLocations();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* <Image
            src="/logo.png"
            alt="Crossatlanticproperties Logo"
            width={420}
            height={40}
            className="h-auto w-[150px]"
          /> */}
          CrossAtlanticProperties
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-10">
          <Link href="/" className="transition-colors hover:text-orange-500">
            Home
          </Link>
          <Link
            href="/properties"
            className="transition-colors hover:text-orange-500"
          >
            Properties
          </Link>
          <Link
            href="/property-types"
            className="transition-colors hover:text-orange-500"
          >
            Estates
          </Link>
          <div className="group relative">
            <div className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-orange-500 cursor-pointer">
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
            className="transition-colors hover:text-orange-500"
          >
            Blog
          </Link>
          <Link
            href="/market-analysis"
            className="transition-colors hover:text-orange-500"
          >
            Market Analysis
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-orange-500"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-orange-500"
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="relative group hidden md:flex items-center">
                <div className="flex items-center cursor-pointer">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover border mr-2"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-2"
                  >
                    Account
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        window.location.href = "/";
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors text-left border-t mt-1"
                      type="button"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
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
                  src="/logo.png"
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
                  className="transition-colors hover:text-orange-500"
                >
                  Home
                </Link>
                <Link
                  href="/properties"
                  className="transition-colors hover:text-orange-500"
                >
                  Properties
                </Link>
                <Link
                  href="/property-types"
                  className="transition-colors hover:text-orange-500"
                >
                  Property Types
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
                        className="transition-colors hover:text-orange-500 text-sm"
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
                  className="transition-colors hover:text-orange-500"
                >
                  Blog
                </Link>

                <Link
                  href="/market-analysis"
                  className="transition-colors hover:text-orange-500 border-t pt-4"
                >
                  Market Analysis
                </Link>

                <Link
                  href="/about"
                  className="transition-colors hover:text-orange-500"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-orange-500"
                >
                  Contact
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="transition-colors hover:text-orange-500"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="transition-colors hover:text-orange-500"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        window.location.href = "/";
                      }}
                      className="transition-colors hover:text-orange-500 text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-orange-500"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="transition-colors hover:text-orange-500"
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
