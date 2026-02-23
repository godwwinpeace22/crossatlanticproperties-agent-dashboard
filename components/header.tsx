"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Menu, ChevronDown, User as UserIcon, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocations } from "@/hooks/use-locations";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notification-bell";

export function Header() {
  const { locations, isLoading } = useLocations();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Properties" },
    { href: "/property-types", label: "Estates" },
    { href: "/blog", label: "Blog" },
    { href: "/market-analysis", label: "Market Analysis" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center gap-2 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo.jpg"
            alt="Crossatlanticproperties Logo"
            width={120}
            height={40}
            className="h-auto w-[50px]"
          />
          <span className="hidden md:inline">CrossAtlantic Properties</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium ml-8 xl:ml-10">
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

          {primaryLinks.slice(3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-orange-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              <div className="relative group hidden lg:flex items-center">
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
                className="hidden lg:flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="hidden lg:flex">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}

          <div className="relative lg:hidden" ref={mobileMenuRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[min(90vw,20rem)] max-h-[70vh] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md z-[120]">
                <nav className="p-1 text-sm">
                  {primaryLinks.slice(0, 3).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="my-1 h-px bg-muted" />
                  <div className="px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Locations
                  </div>

                  {locations.map((location) => (
                    <Link
                      key={location.id}
                      href={`/properties?location=${location.id}`}
                      className="block rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={closeMobileMenu}
                    >
                      {location.name}
                    </Link>
                  ))}
                  {locations.length === 0 && isLoading && (
                    <div className="px-2 py-1.5 text-muted-foreground">
                      Loading locations...
                    </div>
                  )}

                  <div className="my-1 h-px bg-muted" />

                  {primaryLinks.slice(3).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="my-1 h-px bg-muted" />

                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="block rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          closeMobileMenu();
                          await logout();
                          window.location.href = "/";
                        }}
                        className="block w-full text-left rounded-sm px-2 py-1.5 hover:bg-accent"
                        type="button"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={closeMobileMenu}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="block rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={closeMobileMenu}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
