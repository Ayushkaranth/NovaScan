"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  LayoutGrid,
  Settings,
  LogOut,
  Users,
  ShieldAlert,
  Home,
  Menu,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Protect the Route: If no token, kick them out.
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20 selection:text-primary">

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex w-64 bg-card/50 backdrop-blur-xl border-r border-border fixed h-full flex-col z-30">

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Loop AI</span>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NavItem
            href="/dashboard"
            icon={<Home className="w-4 h-4" />}
            label="Overview"
            active={pathname === "/dashboard"}
          />
          <NavItem
            href="/dashboard/projects"
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Projects"
            active={pathname.includes("/dashboard/projects")}
          />
          <NavItem
            href="/dashboard/risks"
            icon={<ShieldAlert className="w-4 h-4" />}
            label="Risk Feed"
            active={pathname.includes("/dashboard/risks")}
          />
          <NavItem
            href="/dashboard/team"
            icon={<Users className="w-4 h-4" />}
            label="Team"
            active={pathname.includes("/dashboard/team")}
          />
          <NavItem
            href="/dashboard/standup"
            icon={<ListChecks className="w-4 h-4" />}
            label="Standups"
            active={pathname.includes("/dashboard/standup")}
          />
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border/50 space-y-4">
          <NavItem
            href="/dashboard/settings"
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
            active={pathname === "/dashboard/settings"}
          />

          <div className="flex items-center justify-between pt-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/auth");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE NAVBAR --- */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Loop AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden p-4 pt-20 animate-in slide-in-from-top-10">
          <nav className="space-y-2">
            <NavItem href="/dashboard" icon={<Home className="w-4 h-4" />} label="Overview" active={pathname === "/dashboard"} />
            <NavItem href="/dashboard/projects" icon={<LayoutGrid className="w-4 h-4" />} label="Projects" active={pathname.includes("/projects")} />
            <NavItem href="/dashboard/risks" icon={<ShieldAlert className="w-4 h-4" />} label="Risk Feed" active={pathname.includes("/risks")} />
            <NavItem href="/dashboard/standup" icon={<ListChecks className="w-4 h-4" />} label="Standups" active={pathname.includes("/standup")} />
            <NavItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" active={pathname === "/dashboard/settings"} />
            <Button
              variant="destructive"
              className="w-full mt-8"
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/auth");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </nav>
          <Button variant="ghost" className="absolute top-4 right-4" onClick={() => setIsMobileMenuOpen(false)}>Close</Button>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "md:pl-64", // Offset for sidebar desktop
        "pt-16 md:pt-0" // Offset for navbar mobile
      )}>
        <div className="h-full p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
          {children}
        </div>
      </main>

    </div>
  );
}

// Helper for Sidebar Links
function NavItem({ href, icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}>
        {icon}
        {label}
      </div>
    </Link>
  );
}