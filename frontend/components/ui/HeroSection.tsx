"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Lock } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import Link from "next/link";

export default function HeroSection() {
    return (
        <div className="relative overflow-hidden pt-[120px] pb-32 md:pt-40 md:pb-48">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10 opacity-50 dark:opacity-20" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="container px-4 md:px-6 mx-auto flex flex-col items-center text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Badge variant="outline" className="mb-6 py-1.5 px-4 backdrop-blur-sm bg-background/50 border-primary/20 hover:bg-muted/50 transition-colors cursor-pointer">
                        <span className="mr-2 text-primary">✨</span>
                        <span className="font-medium">NovaScan Engine v2.0 is now live</span>
                        <ArrowRight className="ml-2 w-3 h-3 text-muted-foreground" />
                    </Badge>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground max-w-5xl mb-8"
                >
                    The Automated <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/70">
                        Nervous System
                    </span>{" "}
                    for Engineering.
                </motion.h1>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
                >
                    Loop AI connects <strong>GitHub, Jira, and Slack</strong> to predict blockers, detect scope creep, and automate documentation. Don't let risks merge.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                >
                    <Link href="/auth">
                        <Button size="lg" className="h-12 px-8 rounded-full text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1">
                            Connect Repository <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href="#playground">
                        <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base backdrop-blur-sm bg-background/50 hover:bg-muted/50 transition-all">
                            <Github className="mr-2 w-4 h-4" />
                            Try Live Simulator
                        </Button>
                    </Link>
                </motion.div>

                {/* Floating UI Element (App Preview) */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                    className="mt-20 w-full max-w-5xl rounded-xl border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Window Controls */}
                    <div className="h-10 border-b bg-muted/30 flex items-center px-4 gap-2 justify-between">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/80" />
                            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                        </div>
                        <div className="flex bg-background/50 rounded-full px-3 py-1 text-[10px] text-muted-foreground border border-border items-center gap-2">
                            <Lock className="w-3 h-3" />
                            loop.ai/dashboard
                        </div>
                    </div>

                    {/* Dashboard Layout */}
                    <div className="flex h-[400px] md:h-[500px] bg-background">
                        {/* Sidebar */}
                        <div className="w-16 md:w-64 border-r bg-muted/10 flex flex-col p-4 gap-4 hidden md:flex">
                            <div className="h-8 w-24 bg-primary/10 rounded mb-4" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="w-4 h-4 rounded bg-muted-foreground/20" />
                                    <div className="h-2 w-24 bg-muted-foreground/10 rounded" />
                                </div>
                            ))}
                            <div className="mt-auto h-12 rounded bg-card border border-border flex items-center p-2 gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
                                <div className="flex flex-col gap-1">
                                    <div className="h-2 w-20 bg-muted-foreground/20 rounded" />
                                    <div className="h-2 w-12 bg-muted-foreground/10 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col">
                            {/* Header */}
                            <div className="h-16 border-b flex items-center justify-between px-6">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-bold text-lg">Overview</h3>
                                    <p className="text-xs text-muted-foreground">Updated just now</p>
                                </div>
                                <Button size="sm">New Scan</Button>
                            </div>

                            {/* Content Grid */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                                {/* Chart Card */}
                                <div className="col-span-2 rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm">Risk Trend</h4>
                                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Last 30 Days</div>
                                    </div>
                                    <div className="flex-1 flex items-end gap-2 h-32 md:h-48 border-b border-l border-dashed border-border p-2">
                                        {[30, 45, 20, 60, 75, 50, 80, 40, 90, 65, 55, 85].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors relative group"
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${h}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.05, duration: 1 }}
                                            >
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {h}%
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Card */}
                                <div className="col-span-1 flex flex-col gap-4">
                                    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
                                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Critical Risks</span>
                                        <div className="text-3xl font-bold flex items-baseline gap-2">
                                            12
                                            <span className="text-xs text-red-500 font-medium flex items-center">
                                                +2 <ArrowRight className="w-2 h-2 rotate-[-45deg]" />
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
                                            <div className="h-full w-3/4 bg-red-500" />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
                                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Scanned PRs</span>
                                        <div className="text-3xl font-bold flex items-baseline gap-2">
                                            1,248
                                            <span className="text-xs text-emerald-500 font-medium flex items-center">
                                                +12% <ArrowRight className="w-2 h-2 rotate-[-45deg]" />
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
                                            <div className="h-full w-full bg-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
