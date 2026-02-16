"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";
import { Github, Slack, FileText, Activity, Zap, ArrowRight, BrainCircuit } from "lucide-react";

export const IntegrationsBeam = () => {
    return (
        <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-background">
            {/* Background Grid */}
            <div className="absolute inset-0 dark:opacity-20 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none" />

            {/* Central Node (Loop AI) */}
            <motion.div
                className="z-20 w-24 h-24 bg-background border-2 border-primary/50 rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
                <BrainCircuit className="w-10 h-10 text-primary" />
                <div className="absolute -bottom-8 font-bold text-sm tracking-widest text-primary">LOOP AI</div>
            </motion.div>

            {/* Satellites */}
            <Satellite icon={<Github className="w-6 h-6" />} label="GitHub" angle={0} delay={0} />
            <Satellite icon={<Zap className="w-6 h-6" />} label="Linear" angle={72} delay={0.2} />
            <Satellite icon={<Activity className="w-6 h-6" />} label="Jira" angle={144} delay={0.4} />
            <Satellite icon={<Slack className="w-6 h-6" />} label="Slack" angle={216} delay={0.6} />
            <Satellite icon={<FileText className="w-6 h-6" />} label="Notion" angle={288} delay={0.8} />

            {/* Beams */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                        <stop offset="100%" stopColor="rgba(168, 85, 247, 0.5)" />
                    </linearGradient>
                </defs>
                <Beam angle={0} delay={0} />
                <Beam angle={72} delay={0.2} />
                <Beam angle={144} delay={0.4} />
                <Beam angle={216} delay={0.6} />
                <Beam angle={288} delay={0.8} />
            </svg>
        </div>
    );
};

const Satellite = ({ icon, label, angle, delay }: { icon: React.ReactNode, label: string, angle: number, delay: number }) => {
    // Calculate position on a circle
    const radius = 160; // Distance from center
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return (
        <motion.div
            className="absolute z-10 flex flex-col items-center gap-2"
            style={{
                x,
                y,
                left: "50%",
                top: "50%",
                marginLeft: "-24px", // Half of width (w-12)
                marginTop: "-24px"  // Half of height (h-12)
            }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay, type: "spring" }}
        >
            <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer group">
                <div className="text-foreground group-hover:text-primary transition-colors">
                    {icon}
                </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border/50 backdrop-blur-sm">
                {label}
            </span>
        </motion.div>
    );
};

const Beam = ({ angle, delay }: { angle: number, delay: number }) => {
    const radius = 160;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    // Start point (Satellite) relative to center
    // End point (Center) is 0,0 relative to center
    // But SVG needs absolute coordinates. Let's assume 500x500 box? 
    // Simpler: use 50% + offset.

    return (
        <>
            <motion.line
                x1="50%"
                y1="50%"
                x2={`calc(50% + ${x}px)`}
                y2={`calc(50% + ${y}px)`}
                stroke="url(#beam-gradient)"
                strokeWidth="1.5"
                className="opacity-20"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.3 }}
                viewport={{ once: true }}
                transition={{ delay, duration: 1 }}
            />
            <motion.circle
                cx="50%"
                cy="50%"
                r="3"
                className="fill-primary filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            >
                <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={`M ${x} ${y} L 0 0`}
                />
            </motion.circle>
        </>
    );
};
