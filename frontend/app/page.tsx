"use client";

import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Slack, Activity, Terminal, Shield, Zap, Lock, BarChart3 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- NOISE TEXTURE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {/* --- FLOATING NAVBAR --- */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-full px-6 py-3 flex items-center gap-8 max-w-4xl w-full justify-between transition-all hover:border-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Loop AI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth">
              <span className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 cursor-pointer transition-colors">Log in</span>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="rounded-full px-6 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-105">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 pt-44 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white shadow-sm text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:border-slate-300 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live: Intelligence Layer v1.0
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.03em] leading-[0.95] text-slate-900">
            Ship code, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">drop the risk.</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed font-medium">
            Loop AI creates a unified nervous system for your engineering team, connecting GitHub, Jira, and Slack to predict blockers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/login">
              <Button className="h-14 px-8 rounded-full text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300">
                Start Monitoring Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-14 px-8 rounded-full text-base border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm hover:border-slate-300">
                 View Live Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* --- TRUSTED BY SECTION --- */}
        <div className="mt-20 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by engineering teams at</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-slate-800 rounded-sm"/> Acme Corp</div>
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-indigo-600 rounded-full"/> Layers</div>
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 border-2 border-slate-800 rounded-sm"/> Sisyphus</div>
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-slate-800 rotate-45 rounded-sm"/> Circool</div>
            </div>
        </div>

        {/* --- THE TERMINAL --- */}
        <div className="mt-32 max-w-5xl mx-auto relative group">
          <div className="absolute -inset-20 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-blue-500/10 blur-3xl rounded-[3rem] opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-900/5 transform transition-transform duration-500 hover:scale-[1.01]">
            <div className="bg-[#FAFAFA] border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="text-xs font-mono text-slate-400 font-medium">loop-engine — risk_analysis.ts</div>
              <div className="w-4" />
            </div>
            <div className="p-8 md:p-12 font-mono text-sm leading-8 text-slate-600 bg-white">
              <div className="flex"><span className="w-8 text-slate-300 text-right pr-4 select-none">1</span><span><span className="text-purple-600 font-semibold">import</span> <span className="text-slate-900 font-medium">{`{ monitor }`}</span> <span className="text-purple-600 font-semibold">from</span> <span className="text-emerald-600">'@loop/core'</span>;</span></div>
              <div className="flex"><span className="w-8 text-slate-300 text-right pr-4 select-none">2</span><span></span></div>
              <div className="flex"><span className="w-8 text-slate-300 text-right pr-4 select-none">3</span><span><span className="text-blue-600 font-semibold">const</span> <span className="text-amber-600">risk</span> = <span className="text-blue-600 font-semibold">await</span> monitor.analyze(<span className="text-slate-900 font-medium">PR_102</span>);</span></div>
              <div className="flex bg-red-50 -mx-12 px-12 border-l-4 border-red-500 my-2 py-1 relative">
                <span className="w-8 text-red-300 text-right pr-4 select-none">4</span>
                <span className="text-slate-800 font-medium"><span className="text-slate-400 mr-4">// 🚨 AI DETECTED BREAKING CHANGE</span></span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-sans font-bold text-red-600 bg-white px-2 py-1 rounded-md shadow-sm border border-red-100">RISK SCORE: 9.2</div>
              </div>
              <div className="flex"><span className="w-8 text-slate-300 text-right pr-4 select-none">5</span><span><span className="text-purple-600 font-semibold">if</span> (risk.score {'>'} <span className="text-blue-600 font-semibold">8.0</span>) <span className="text-slate-900 font-medium">{`{`}</span></span></div>
              <div className="flex"><span className="w-8 text-slate-300 text-right pr-4 select-none">6</span><span className="pl-6">alert.notify(<span className="text-emerald-600">'#engineering'</span>, risk.summary);</span></div>
              <div className="flex"><span className="w-8 text-slate-300 text-right pr-4 select-none">7</span><span><span className="text-slate-900 font-medium">{`}`}</span></span></div>
            </div>
          </div>
        </div>

        {/* --- HOW IT WORKS (Upgraded) --- */}
        <HowItWorksSection />

        {/* --- BENTO GRID FEATURES --- */}
        <div id="features" className="max-w-6xl mx-auto mt-40">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Intelligence at every layer.</h2>
            <p className="text-slate-500 mt-2 text-lg">Replace your daily standup with real-time signals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            {/* Large Card */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-[2rem] p-10 border border-slate-200 flex flex-col justify-between shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 group overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Github className="w-7 h-7 text-slate-900" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">GitHub Sentinel</h3>
                <p className="text-slate-500 leading-relaxed max-w-md text-lg">
                  Loop sits inside your PR workflow. It analyzes diffs, checks for hardcoded secrets, and predicts if a change will break downstream services.
                </p>
              </div>
              <div className="mt-10 bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm w-fit group-hover:-translate-y-2 transition-transform duration-500">
                <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>PR #124 blocked by 3 risky files</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
            </div>

            {/* Top Right */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-lg shadow-slate-200/20 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600 border border-blue-100">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Jira Sync</h3>
                <p className="text-slate-500 mt-2">Auto-detects scope creep.</p>
              </div>
            </div>

            {/* Bottom Right */}
            <div className="bg-indigo-600 rounded-[2rem] p-8 border border-indigo-500 text-white shadow-xl shadow-indigo-200 hover:shadow-indigo-500/30 transition-all duration-300 group relative overflow-hidden">
               <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-500/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 text-white border border-indigo-400/30">
                  <Slack className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Slack Context</h3>
                <p className="text-indigo-100 mt-2">Finds blockers in chat.</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECURITY SECTION --- */}
        <div id="security" className="mt-40 bg-slate-900 rounded-[3rem] py-24 px-6 md:px-20 text-center relative overflow-hidden mb-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
                    <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-6">Enterprise-grade security.</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    We know your code is your IP. Loop AI is designed with privacy first. 
                    We process metadata, never your source code storage. 
                    SOC2 Type II compliant.
                </p>
                <Button className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-full">
                    Read Security Whitepaper
                </Button>
            </div>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200 bg-white pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm text-slate-500">
            <p>© 2026 Loop AI Inc.</p>
            <div className="flex gap-6">
                <span className="hover:text-slate-900 cursor-pointer">Privacy</span>
                <span className="hover:text-slate-900 cursor-pointer">Terms</span>
            </div>
        </div>
      </footer>
    </div>
  );
}

// --- NEW SCROLL PROGRESS TIMELINE ---
function HowItWorksSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"]
    });

    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <div id="how-it-works" className="max-w-4xl mx-auto mt-40">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">How Loop AI Works</h2>
                <p className="text-slate-500 mt-2">Zero config. Three steps to full observability.</p>
            </div>
            
            {/* White Container for Contrast */}
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl shadow-slate-200/40 relative">
                <div ref={containerRef} className="relative space-y-12">
                    
                    {/* The Background Line (Gray) */}
                    <div className="absolute left-[23px] top-2 bottom-2 w-[2px] bg-slate-100" />
                    
                    {/* The Foreground Line (Purple) - Grows with Scroll */}
                    <motion.div 
                        style={{ height: lineHeight }}
                        className="absolute left-[23px] top-2 w-[2px] bg-indigo-600 origin-top"
                    />

                    <TimelineItem 
                        step="01" 
                        title="Connect your Vault" 
                        desc="Securely link GitHub, Jira, and Slack. API keys are encrypted at rest using AES-256." 
                        icon={<Lock className="w-5 h-5 text-indigo-600"/>}
                    />
                    <TimelineItem 
                        step="02" 
                        title="Passive Ingestion" 
                        desc="Loop silently listens to webhooks. No manual entry required. We parse diffs, tickets, and chats." 
                        icon={<Zap className="w-5 h-5 text-indigo-600"/>}
                    />
                    <TimelineItem 
                        step="03" 
                        title="Predictive Alerts" 
                        desc="When a risky pattern emerges (e.g. Code change + Slack silence), we alert the right person." 
                        icon={<BarChart3 className="w-5 h-5 text-indigo-600"/>}
                    />
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ step, title, desc, icon }: { step: string, title: string, desc: string, icon: any }) {
    return (
        <div className="flex gap-6 relative z-10 group">
            <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center shadow-sm group-hover:border-indigo-600 group-hover:scale-110 transition-all duration-300">
                    {icon}
                </div>
            </div>
            <div className="pb-2 pt-1">
                <span className="text-xs font-bold text-indigo-500 mb-1 block tracking-wider uppercase">Step {step}</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{desc}</p>
            </div>
        </div>
    )
}