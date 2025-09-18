import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  user?: any; // You can define a proper User type later
}

export function Header({ user }: HeaderProps) {
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
