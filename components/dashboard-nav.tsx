"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Building2,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isAdmin = profile.role === "admin";

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/properties", icon: Building2, label: "Properties" },
    { href: "/dashboard/network", icon: Network, label: "My Network" },
    { href: "/dashboard/commissions", icon: DollarSign, label: "Commissions" },
    { href: "/dashboard/submissions", icon: FileText, label: "Submissions" },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/admin/agents",
            icon: Users,
            label: "Manage Agents",
          },
          {
            href: "/dashboard/admin/approvals",
            icon: FileText,
            label: "Approvals",
          },
          {
            href: "/dashboard/admin/settings",
            icon: Settings,
            label: "Settings",
          },
        ]
      : []),
  ];

  return (
    <Card className="w-64 min-h-screen rounded-none border-r">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="uppercase text-xs">Crossatlanticproperties</h1>
          <h2 className="text-xl font-bold">MLM Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {profile.full_name || profile.email}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {profile.role}
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground shadow-md"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-8">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent cursor-pointer"
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
