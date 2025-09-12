import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import { getCurrentUser } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = null; // await getCurrentUser();

  return (
    <>
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
                  <Link
                    href="/virtual-tours"
                    className="transition-colors hover:text-dnx-orange"
                  >
                    Virtual Tours
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
      <main className="flex-1">{children}</main>
      <Toaster />
      <footer className="border-t py-6 md:py-0 bg-blue-400 text-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Crossatlanticproperties Logo"
              width={420}
              height={40}
              className="h-24 w-auto mr-2"
            />
            <p className="text-center text-sm leading-loose md:text-left">
              © 2025 Crossatlanticproperties. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/terms"
              className="transition-colors hover:text-dnx-orange"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-dnx-orange"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-dnx-orange"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
