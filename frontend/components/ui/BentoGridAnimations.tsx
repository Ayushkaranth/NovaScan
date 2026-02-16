"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// --- 1. Code Sentinel Animation (Full Code Window) ---
export const CodeSentinelAnimation = () => {
    return (
        <div className="flex flex-1 w-full h-full min-h-[10rem] dark:bg-neutral-900 bg-neutral-100 rounded-lg overflow-hidden relative flex flex-col">
            {/* Mock Window Header */}
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 flex items-center px-3 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            {/* Code Content */}
            <div className="p-4 flex flex-col gap-2 font-mono text-[10px] opacity-80">
                <div className="flex gap-2">
                    <span className="text-purple-400">import</span>
                    <span className="text-blue-400">PaymentProcessor</span>
                    <span className="text-purple-400">from</span>
                    <span className="text-green-400">'./lib/payments'</span>;
                </div>
                <div className="flex gap-2 pl-4">
                    <span className="text-purple-400">const</span>
                    <span className="text-yellow-400">processOrder</span>
                    <span className="text-neutral-400">=</span>
                    <span className="text-purple-400">async</span>
                    <span className="text-neutral-400">()</span>
                    <span className="text-purple-400">=&gt;</span>
                    <span className="text-neutral-400">{`{`}</span>
                </div>
                <div className="flex gap-2 pl-8">
                    <span className="text-neutral-500">// TODO: Add validation logic here</span>
                </div>
                <div className="flex gap-2 pl-8">
                    <span className="text-purple-400">await</span>
                    <span className="text-blue-400">PaymentProcessor</span>
                    <span className="text-neutral-400">.</span>
                    <span className="text-yellow-400">charge</span>
                    <span className="text-neutral-400">();</span>
                </div>
                <div className="flex gap-2 pl-4">
                    <span className="text-neutral-400">{`}`}</span>
                </div>
            </div>

            {/* Scanning Beam */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent z-10 pointer-events-none"
                initial={{ top: "-100%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Alert Badge */}
            <motion.div
                className="absolute bottom-4 right-4 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg backdrop-blur-sm"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 1] }}
                transition={{ delay: 1, duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
                CRITICAL RISK DETECTED
            </motion.div>
        </div>
    );
};

// --- 2. Automated Docs Animation (Notion-style Page) ---
export const AutomatedDocsAnimation = () => {
    return (
        <div className="flex flex-1 w-full h-full min-h-[10rem] dark:bg-neutral-900 bg-neutral-50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 flex flex-col gap-3 overflow-hidden relative">

            {/* Cover Image Placeholder */}
            <motion.div
                className="w-full h-8 bg-neutral-200 dark:bg-neutral-800 rounded opacity-50"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1 }}
            />

            {/* Title */}
            <motion.div
                className="w-3/4 h-6 bg-neutral-300 dark:bg-neutral-700 rounded"
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ duration: 0.8, delay: 0.5 }}
            />

            {/* Tags/Properties */}
            <div className="flex gap-2">
                <motion.div className="w-16 h-4 bg-orange-200/50 dark:bg-orange-900/50 rounded" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }} />
                <motion.div className="w-24 h-4 bg-blue-200/50 dark:bg-blue-900/50 rounded" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }} />
            </div>

            {/* Paragraphs */}
            <div className="flex flex-col gap-2 mt-2">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded"
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + (i * 0.2), duration: 0.5 }}
                    />
                ))}
            </div>

            <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
        </div>
    );
}


// --- 3. Noise Free Alerts (Slack-style Notification) ---
export const NoiseFreeAlertsAnimation = () => {
    return (
        <div className="flex flex-1 w-full h-full min-h-[10rem] dark:bg-neutral-900 bg-neutral-100 rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Background Pulse */}
            <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900 z-0" />

            {/* Notification Card */}
            <motion.div
                className="relative z-10 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg rounded-lg p-3 flex gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5, repeatType: "reverse" }}
            >
                <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <div className="w-4 h-4 bg-red-500 rounded-sm" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                    <div className="h-2 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-600 rounded" />
                </div>
            </motion.div>

            {/* Stacked Cards for depth */}
            <motion.div
                className="absolute z-0 w-[90%] bottom-8 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg h-12 opacity-50"
                animate={{ scale: [0.9, 0.95, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </div>
    );
}

// --- 4. Context Sync (Network Graph) ---
export const ContextSyncAnimation = () => {
    return (
        <div className="flex flex-1 w-full h-full min-h-[10rem] dark:bg-neutral-950 bg-neutral-50 rounded-lg relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 dark:opacity-20 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            />

            {/* Linking Nodes */}
            <Node x="20%" y="30%" color="bg-blue-500" delay={0} />
            <Node x="80%" y="30%" color="bg-purple-500" delay={0.2} />
            <Node x="50%" y="70%" color="bg-emerald-500" delay={0.4} />

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.line x1="20%" y1="30%" x2="80%" y2="30%" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="1" strokeDasharray="4 4"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.line x1="80%" y1="30%" x2="50%" y2="70%" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="1" strokeDasharray="4 4"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                />
                <motion.line x1="50%" y1="70%" x2="20%" y2="30%" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="1" strokeDasharray="4 4"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
                />
            </svg>

            {/* Moving Data Packet */}
            <motion.div
                className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10"
                animate={{
                    top: ["30%", "30%", "70%", "30%"],
                    left: ["20%", "80%", "50%", "20%"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
        </div>
    )
}

const Node = ({ x, y, color, delay }: { x: string; y: string; color: string; delay: number }) => (
    <motion.div
        className={cn("absolute w-3 h-3 rounded-full z-10 shadow-lg border-2 border-white dark:border-neutral-900", color)}
        style={{ left: x, top: y }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay, type: "spring" }}
    />
)


// --- 5. Risk Heatmap (Larger, more activity) ---
export const RiskHeatmapAnimation = () => {
    // Generate a 10x5 grid
    const rows = 5;
    const cols = 8;
    const grid = Array.from({ length: rows * cols });

    return (
        <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-lg bg-neutral-950 p-3 grid grid-cols-8 gap-1 items-center justify-center overflow-hidden">
            {grid.map((_, i) => (
                <HeatmapCell key={i} index={i} />
            ))}
        </div>
    );
}

const HeatmapCell = ({ index }: { index: number }) => {
    // Determine risk level based on index to create a "pattern"
    const isHighRisk = index % 7 === 0 || index % 11 === 0;

    return (
        <motion.div
            className="w-full h-full rounded-[2px]"
            animate={{
                backgroundColor: isHighRisk
                    ? ["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.8)", "rgba(239, 68, 68, 0.1)"]
                    : ["rgba(16, 185, 129, 0.05)", "rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.05)"]
            }}
            transition={{
                duration: isHighRisk ? 2 : 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
            }}
        />
    )
}
