"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Building2,
  Users,
  DollarSign,
  FileText,
  Settings,
  Network,
  PenTool,
  Heart,
  Bell,
  UserPlus,
  TrendingUp,
  LayoutDashboard,
  Shield,
  Briefcase,
  Wallet,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { isAdminRole } from "@/lib/roles";
import { useRouter } from "next/navigation";

interface AppSidebarProps {
  user: any;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: string;
  };
}

export function AppSidebar({ user, profile }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { state } = useSidebar();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isAdmin = isAdminRole(profile.role);
  const isManager = profile.role === "manager";
  const isAdminOrManager = isAdmin || isManager;

  // Define navigation groups
  const adminNavGroups = [
    // {
    //   label: "Dashboard",
    //   icon: Home,
    //   items: [{ href: "/dashboard", icon: Home, label: "Dashboard" }],
    // },
    {
      label: "Administration",
      icon: Shield,
      items: [
        {
          href: "/dashboard/admin/listings",
          icon: Building2,
          label: "Properties",
        },
        {
          href: "/dashboard/admin/users",
          icon: Users,
          label: "Users Management",
        },
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

  const managerNavGroups = [
    {
      label: "Administration",
      icon: Shield,
      items: adminNavGroups[0].items.filter(
        (item) => item.href !== "/dashboard/admin/users",
      ),
    },
    {
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

  const buyerNavGroups = [
    {
      label: "Property Investment",
      icon: Briefcase,
      items: [
        { href: "/dashboard", icon: Home, label: "Home" },
        { href: "/dashboard/kyc", icon: Users, label: "KYC Status" },
        { href: "/dashboard/documents", icon: FileText, label: "My Documents" },
        {
          href: "/dashboard/my-interests",
          icon: Building2,
          label: "Interests & Investments",
        },
      ],
    },
    {
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
    // {
    //   label: "Overview",
    //   icon: LayoutDashboard,
    //   items: [{ href: "/dashboard", icon: Home, label: "Dashboard" }],
    // },
    {
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
      label: "Property Investment",
      icon: Briefcase,
      items: [
        { href: "/dashboard/my-interests", icon: Heart, label: "My Interests" },
        { href: "/dashboard/kyc", icon: Users, label: "KYC Status" },
        { href: "/dashboard/documents", icon: FileText, label: "My Documents" },
      ],
    },
    {
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

  const navGroups = isAdmin
    ? adminNavGroups
    : isManager
      ? managerNavGroups
      : buyerNavGroups;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Cross Atlantic</span>
                  <span className="text-xs">Properties</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile */}

        <SidebarGroup>
          <SidebarGroupContent>
            <div
              className={cn(
                "rounded-lg border bg-accent/30 transition-all",
                state === "collapsed" ? "p-2" : "p-3",
              )}
            >
              {state === "expanded" ? (
                <>
                  <p className="text-sm font-medium truncate">
                    {profile.full_name || profile.email}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full",
                        profile.role === "admin"
                          ? "bg-purple-500"
                          : "bg-green-500",
                      )}
                    ></span>
                    {profile.role}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <span
                    className={cn(
                      "inline-block w-2 h-2 rounded-full",
                      profile.role === "admin"
                        ? "bg-purple-500"
                        : "bg-green-500",
                    )}
                  ></span>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.role === "admin" && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <Home className="size-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        {/* Navigation Groups */}
        {navGroups.map((group) => {
          const firstItem = group.items[0];
          const hasMultipleItems = group.items.length > 1;

          return (
            <SidebarGroup key={group.label} className="py-0">
              {!hasMultipleItems && (
                <SidebarGroupLabel>
                  <group.icon className="size-4" />
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {!hasMultipleItems ? (
                    // Single item - render directly without submenu
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === firstItem.href}
                        tooltip={firstItem.label}
                      >
                        <Link href={firstItem.href}>
                          <firstItem.icon className="size-4" />
                          <span>{firstItem.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    // Multiple items - render as collapsible submenu
                    <Collapsible defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={group.label}>
                            <group.icon className="size-4" />
                            <span>{group.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <SidebarMenuSubItem key={item.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive}
                                  >
                                    <Link href={item.href}>
                                      <item.icon className="size-4" />
                                      <span>{item.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center justify-between w-full cursor-default">
                <span className="text-sm">Theme</span>
                <ThemeToggle />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
