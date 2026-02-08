"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, LayoutGrid, Settings, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col z-20">
        
        {/* Logo */}
       <div className="h-16 flex items-center px-6 border-b border-slate-100">
  {/* Changed <div> to <Link> and added href="/" */}
  <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/20">
      <Activity className="w-4 h-4 text-white" />
    </div>
    <span className="font-bold text-lg tracking-tight">Loop AI</span>
  </Link>
</div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            href="/dashboard" 
            icon={<LayoutGrid className="w-4 h-4" />} 
            label="Risk Feed" 
            active={pathname === "/dashboard"} 
          />
          <NavItem 
            href="/dashboard/settings" 
            icon={<Settings className="w-4 h-4" />} 
            label="Settings" 
            active={pathname === "/dashboard/settings"} 
          />
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/auth");
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
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
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}>
        {icon}
        {label}
      </div>
    </Link>
  );
}