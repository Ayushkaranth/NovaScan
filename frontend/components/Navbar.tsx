"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
            <div className="bg-background/80 backdrop-blur-xl border border-border shadow-lg shadow-black/5 dark:shadow-white/5 rounded-full px-5 py-2.5 flex items-center gap-8 max-w-5xl w-full justify-between transition-all hover:border-foreground/20">
                <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                        <Activity className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-foreground tracking-tight">Loop AI</span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <a href="#playground" className="hover:text-foreground transition-colors">Live Demo</a>
                    <a href="#features" className="hover:text-foreground transition-colors">Capabilities</a>
                    <a href="#roles" className="hover:text-foreground transition-colors">For Teams</a>
                    <a href="#deployment" className="hover:text-foreground transition-colors">Deployment</a>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/auth">
                        <span className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 cursor-pointer transition-colors hidden sm:block">Log in</span>
                    </Link>
                    <Link href="/auth">
                        <Button size="sm" className="rounded-full px-5 shadow-md hover:scale-105 transition-all">
                            Sign Up
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
