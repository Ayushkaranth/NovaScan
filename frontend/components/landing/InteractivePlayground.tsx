"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Loader2, Slack } from "lucide-react";
import { cn } from "@/lib/utils";

export function InteractivePlayground() {
    const [activeScenario, setActiveScenario] = useState<"safe" | "risky" | "critical">("risky");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setIsAnalyzing(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setIsAnalyzing(false);
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);
        return () => clearInterval(interval);
    }, [activeScenario]);

    const scenarios = {
        safe: {
            label: "Frontend UI Update",
            color: "bg-emerald-500",
            file: "Button.tsx",
            diff: `+  <button className="bg-blue-500 text-white">\n-  <button className="bg-gray-500 text-black">`,
            analysis: "No logic changes detected. CSS only.",
            risk: 1.2,
            output: "✅ PR Approved automatically."
        },
        risky: {
            label: "Database Schema Change",
            color: "bg-amber-500",
            file: "schema.prisma",
            diff: `   model User {\n+    password_hash String\n-    password String // Plaintext removal`,
            analysis: "Database schema change detected. Affects 2 downstream services.",
            risk: 6.5,
            output: "⚠️ Warning: Requires Tech Lead approval."
        },
        critical: {
            label: "Payment Logic Modification",
            color: "bg-red-500",
            file: "stripe_service.ts",
            diff: `   const processPayment = async (amount) => {\n+    console.log(process.env.STRIPE_KEY); // DEBUG\n     return stripe.charges.create(...)`,
            analysis: "CRITICAL: Potential secret exposure in logs. PII risk.",
            risk: 9.8,
            output: "🚨 BLOCKING: Secret detected. Slack Alert Sent."
        }
    };

    const current = scenarios[activeScenario];

    return (
        <div className="max-w-6xl mx-auto mt-32 px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground">See Loop AI in Action</h2>
                <p className="text-muted-foreground mt-2 text-lg">Select a scenario to see how NovaScan analyzes context in real-time.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-card rounded-[2rem] border border-border shadow-2xl shadow-primary/5 p-2 overflow-hidden">

                {/* LEFT: CONTROLS */}
                <div className="lg:col-span-4 bg-muted/30 rounded-2xl p-6 flex flex-col justify-between border border-border/50">
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">Select Pull Request</h3>
                        <div className="space-y-3">
                            {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveScenario(key)}
                                    className={cn(
                                        "w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 flex items-center justify-between",
                                        activeScenario === key
                                            ? "bg-background border-primary/20 shadow-md ring-1 ring-primary/10"
                                            : "bg-transparent border-transparent hover:bg-muted"
                                    )}
                                >
                                    <span className="font-medium text-foreground text-sm">{scenarios[key].label}</span>
                                    <div className={`w-2.5 h-2.5 rounded-full ${scenarios[key].color}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary uppercase">Engine Status</span>
                        </div>
                        <div className="text-sm text-foreground flex items-center gap-2">
                            {isAnalyzing ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Processing AST & Diff...</>
                            ) : (
                                <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Analysis Complete</>
                            )}
                        </div>
                    </div>
                </div>

                {/* MIDDLE: THE CODE */}
                <div className="lg:col-span-5 bg-[#0F172A] rounded-2xl p-6 font-mono text-sm relative overflow-hidden flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-4 text-slate-400 border-b border-slate-700/50 pb-2">
                        <span>{current.file}</span>
                        <span className="text-xs opacity-50">Diff View</span>
                    </div>

                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ top: 0 }}
                                animate={{ top: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10"
                            />
                        )}
                    </AnimatePresence>

                    <div className="text-slate-300 whitespace-pre-wrap leading-7 relative z-0">
                        {current.diff.split('\n').map((line, i) => (
                            <div key={i} className={`${line.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : line.startsWith('-') ? 'bg-red-500/10 text-red-400' : ''}`}>
                                {line}
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-6">
                        <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">AI Reasoning Log</div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="mt-2 text-indigo-300 text-xs h-4">
                            {progress < 100 ? "Scanning patterns..." : current.analysis}
                        </div>
                    </div>
                </div>

                {/* RIGHT: THE OUTCOME */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className={cn(
                        "flex-1 rounded-2xl p-6 border flex flex-col justify-center items-center text-center transition-colors duration-500",
                        isAnalyzing ? "bg-muted/30 border-border opacity-50" :
                            current.risk > 8 ? "bg-red-500/10 border-red-500/20" :
                                current.risk > 5 ? "bg-amber-500/10 border-amber-500/20" :
                                    "bg-emerald-500/10 border-emerald-500/20"
                    )}>
                        {isAnalyzing ? (
                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                        ) : (
                            <>
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-500",
                                    current.risk > 8 ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 scale-110" :
                                        current.risk > 5 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                                            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                )}>
                                    {current.risk > 8 ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                                </div>
                                <div className="text-4xl font-bold text-foreground mb-1">{current.risk}<span className="text-lg text-muted-foreground">/10</span></div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Score</div>
                            </>
                        )}
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 border-b border-border pb-2">
                            <Slack className="w-4 h-4 text-foreground" />
                            <span className="text-xs font-bold text-foreground">#engineering-alerts</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 w-3/4 bg-muted rounded animate-pulse" />
                            <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
                            {!isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-foreground mt-2 font-medium bg-muted/50 p-2 rounded border border-border"
                                >
                                    {current.output}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
