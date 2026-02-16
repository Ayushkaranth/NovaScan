"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Trello, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleBasedInsights() {
    const [role, setRole] = useState<"dev" | "pm" | "techlead">("dev");

    const data = {
        dev: {
            title: "Developers",
            icon: <Code2 className="w-6 h-6 text-white" />,
            color: "bg-indigo-600",
            headline: "Stay in flow. Forget the busywork.",
            desc: "Loop handles the administrative burden of PRs. No more writing manual Jira updates or context switching to explain technical risks to PMs.",
            points: ["Auto-linked Jira tickets", "Context-aware Slack alerts", "Silent background monitoring"]
        },
        pm: {
            title: "Product Managers",
            icon: <Trello className="w-6 h-6 text-white" />,
            color: "bg-purple-600",
            headline: "Know the 'Why' behind every delay.",
            desc: "Get plain-english explanations of technical blockers. Understand if a PR is risky before it delays your launch timeline.",
            points: ["Automated Notion documentation", "Risk summaries in plain text", "Timeline impact prediction"]
        },
        techlead: {
            title: "Tech Leads",
            icon: <LineChart className="w-6 h-6 text-white" />,
            color: "bg-emerald-600",
            headline: "Architecture-level visibility.",
            desc: "See the forest, not just the trees. Loop identifies patterns of risky behavior and potential architectural debt before it merges.",
            points: ["System-wide risk heatmap", "Velocity vs Quality metrics", "Scope creep detection"]
        }
    };

    const selected = data[role];

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Role Selectors */}
            <div className="md:col-span-4 flex flex-col gap-3">
                {(Object.keys(data) as Array<keyof typeof data>).map((key) => (
                    <button
                        key={key}
                        onClick={() => setRole(key)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group",
                            role === key
                                ? "bg-card shadow-lg ring-1 ring-border"
                                : "hover:bg-muted/50"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            role === key ? data[key].color : "bg-muted group-hover:bg-muted-foreground/20"
                        )}>
                            {data[key].icon}
                        </div>
                        <div>
                            <h4 className={cn(
                                "font-bold text-lg",
                                role === key ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {data[key].title}
                            </h4>
                        </div>
                    </button>
                ))}
            </div>

            {/* Content Display */}
            <div className="md:col-span-8">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card rounded-[2.5rem] p-10 border border-border shadow-xl h-full flex flex-col justify-center relative overflow-hidden"
                >
                    {/* Decorative Blob */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10 ${selected.color.replace('bg-', 'bg-')}`} />

                    <h3 className="text-3xl font-bold text-foreground mb-4 relative z-10">{selected.headline}</h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed relative z-10">{selected.desc}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                        {selected.points.map((point, i) => (
                            <div key={i} className="bg-muted/50 rounded-xl p-4 border border-border text-sm font-semibold text-foreground flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${selected.color}`} />
                                {point}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

        </div>
    );
}
