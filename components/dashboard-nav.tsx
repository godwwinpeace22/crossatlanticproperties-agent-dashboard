"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Home,
  Building2,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Network,
  PenTool,
  Heart,
  Bell,
  UserPlus,
  TrendingUp,
  ChevronDown,
  LayoutDashboard,
  Shield,
  Briefcase,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface DashboardNavProps {
  user: any;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: string;
  };
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [openSections, setOpenSections] = useState<string[]>([
    "overview",
    "admin",
    "mlm",
    "property",
    "system",
    "account",
  ]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isAdmin = profile.role === "admin";

  // Define navigation groups with modern structure
  const adminNavGroups = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      items: [{ href: "/dashboard", icon: Home, label: "Dashboard" }],
    },
    {
      id: "admin",
      label: "Administration",
      icon: Shield,
      items: [
        {
          href: "/dashboard/admin/listings",
          icon: Building2,
          label: "Properties",
        },
        { href: "/dashboard/admin/agents", icon: Users, label: "Agents" },
        {
          href: "/dashboard/admin/property-interests",
          icon: Heart,
          label: "Property Interests",
        },
        {
          href: "/dashboard/admin/kyc-approvals",
          icon: FileText,
          label: "KYC Approvals",
        },
        {
          href: "/dashboard/admin/application-fees",
          icon: DollarSign,
          label: "Application Fees",
        },
        { href: "/dashboard/admin/blog", icon: PenTool, label: "Blog" },
        {
          href: "/dashboard/admin/market-settings",
          icon: TrendingUp,
          label: "Market Settings",
        },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: Settings,
      items: [
        {
          href: "/dashboard/admin/settings",
          icon: Settings,
          label: "Platform Settings",
        },
        {
          href: "/dashboard/notifications",
          icon: Bell,
          label: "Notifications",
        },
        { href: "/dashboard/settings", icon: UserPlus, label: "Account" },
      ],
    },
  ];

  const buyerNavGroups = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      items: [{ href: "/dashboard", icon: Home, label: "Dashboard" }],
    },

    {
      id: "property",
      label: "Property Investment",
      icon: Briefcase,
      items: [
        { href: "/dashboard/my-interests", icon: Heart, label: "My Interests" },
        { href: "/dashboard/kyc", icon: Users, label: "KYC Status" },
      ],
    },
    {
      id: "account",
      label: "Account",
      icon: Wallet,
      items: [
        {
          href: "/dashboard/notifications",
          icon: Bell,
          label: "Notifications",
        },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const agentNavGroups = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      items: [{ href: "/dashboard", icon: Home, label: "Dashboard" }],
    },
    {
      id: "mlm",
      label: "MLM & Earnings",
      icon: Network,
      items: [
        { href: "/dashboard/network", icon: Network, label: "My Network" },
        { href: "/dashboard/referrals", icon: UserPlus, label: "Referrals" },
        {
          href: "/dashboard/commissions",
          icon: DollarSign,
          label: "Commissions",
        },
      ],
    },
    {
      id: "property",
      label: "Property Investment",
      icon: Briefcase,
      items: [
        { href: "/dashboard/my-interests", icon: Heart, label: "My Interests" },
        { href: "/dashboard/kyc", icon: Users, label: "KYC Status" },
      ],
    },
    {
      id: "account",
      label: "Account",
      icon: Wallet,
      items: [
        {
          href: "/dashboard/notifications",
          icon: Bell,
          label: "Notifications",
        },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const navGroups = isAdmin ? adminNavGroups : buyerNavGroups;

  const NavGroup = ({ group }: { group: (typeof navGroups)[0] }) => {
    const isOpen = openSections.includes(group.id);
    const hasActiveItem = group.items.some((item) => pathname === item.href);

    return (
      <div className="mb-1">
        <button
          onClick={() => toggleSection(group.id)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            "hover:bg-accent/80",
            hasActiveItem && "text-primary bg-accent/50"
          )}
        >
          <div className="flex items-center gap-3">
            <group.icon className="h-4 w-4" />
            <span>{group.label}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-0.5 pl-4">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                    "hover:bg-accent/80 border-l-2 ml-2",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-64 min-h-screen max-h-screen sticky top-0 rounded-none border-r flex flex-col overflow-hidden">
      <div className="p-6 flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="block">
            <h1 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Cross Atlantic Properties
            </h1>
            <h2 className="text-xl font-bold mt-1 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MLM Dashboard
            </h2>
          </Link>
          <div className="mt-4 p-3 bg-accent/30 rounded-lg border">
            <p className="text-sm font-medium truncate">
              {profile.full_name || profile.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-block w-2 h-2 rounded-full",
                  profile.role === "admin" ? "bg-purple-500" : "bg-green-500"
                )}
              ></span>
              {profile.role}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navGroups.map((group) => (
            <NavGroup key={group.id} group={group} />
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-6 space-y-3 pt-6 border-t">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground font-medium">
              Theme
            </span>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
}
