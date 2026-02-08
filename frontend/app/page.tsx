// "use client";

// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { 
//   ArrowRight, Github, Slack, Activity, Terminal, Shield, Zap, 
//   FileText, CheckCircle2, AlertTriangle, Workflow, BrainCircuit 
// } from "lucide-react";
// import { motion } from "framer-motion";

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
//       {/* --- BACKGROUND EFFECTS --- */}
//       <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
//       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

//       {/* --- NAVBAR --- */}
//       <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
//         <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-full px-5 py-2.5 flex items-center gap-8 max-w-3xl w-full justify-between transition-all hover:border-slate-300">
//           <div className="flex items-center gap-2.5">
//             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/20">
//               <Activity className="w-4 h-4 text-white" />
//             </div>
//             <span className="font-bold text-slate-900 tracking-tight">Loop AI</span>
//           </div>
          
//           <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
//             <a href="#workflow" className="hover:text-slate-900 transition-colors">How it Works</a>
//             <a href="#features" className="hover:text-slate-900 transition-colors">Intelligence</a>
//             <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
//           </div>

//           <div className="flex items-center gap-3">
//             <Link href="/auth">
//               <span className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer transition-colors">Log in</span>
//             </Link>
//             <Link href="/auth">
//               <Button size="sm" className="rounded-full px-5 bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20">
//                 Get Started
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </nav>

//       {/* --- HERO SECTION --- */}
//       <main className="relative z-10 pt-32 pb-20 px-6">
//         <div className="max-w-5xl mx-auto text-center space-y-8">
          
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-4"
//           >
//             <span className="relative flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
//             </span>
//             NovaScan Engine v2.0 Live
//           </motion.div>

//           <motion.h1 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900"
//           >
//             The Automated Nervous System <br/>
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">for Engineering Teams.</span>
//           </motion.h1>

//           <motion.p 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
//           >
//             Loop AI connects <strong>GitHub, Jira, Slack, and Notion</strong> to predict risks before they merge. 
//             We turn silent pull requests into actionable intelligence.
//           </motion.p>

//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3 }}
//             className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
//           >
//             <Link href="/auth">
//               <Button className="h-12 px-8 rounded-full text-base bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
//                 Connect Repository <ArrowRight className="ml-2 w-4 h-4" />
//               </Button>
//             </Link>
//             <Link href="#features">
//               <Button variant="outline" className="h-12 px-8 rounded-full text-base border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
//                  See How It Works
//               </Button>
//             </Link>
//           </motion.div>
//         </div>

//         {/* --- TERMINAL PREVIEW --- */}
//         <motion.div 
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5, duration: 0.8 }}
//           className="mt-20 max-w-4xl mx-auto relative group"
//         >
//           <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
//           <div className="relative bg-[#0f172a] rounded-xl ring-1 ring-white/10 shadow-2xl overflow-hidden">
//             <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
//               <div className="flex gap-2">
//                 <div className="w-3 h-3 rounded-full bg-red-500/80" />
//                 <div className="w-3 h-3 rounded-full bg-amber-500/80" />
//                 <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
//               </div>
//               <div className="text-xs font-mono text-slate-400">nova_scan_engine.py</div>
//             </div>
//             <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
//               <div className="text-slate-400"># AI Analysis of Pull Request #42</div>
//               <div className="mt-2">
//                 <span className="text-purple-400">async def</span> <span className="text-blue-400">analyze_risk</span>(pr_diff, jira_context):
//               </div>
//               <div className="pl-4">
//                 <span className="text-slate-300">risk_score = 0</span>
//               </div>
//               <div className="pl-4 mt-1">
//                 <span className="text-slate-500"># 1. Detect hardcoded secrets or breaking changes</span>
//               </div>
//               <div className="pl-4">
//                 <span className="text-purple-400">if</span> <span className="text-green-400">"AWS_KEY"</span> <span className="text-purple-400">in</span> pr_diff:
//               </div>
//               <div className="pl-8">
//                 <span className="text-slate-300">risk_score += </span><span className="text-orange-400">9.5</span>
//               </div>
//               <div className="pl-4 mt-2">
//                 <span className="text-purple-400">if</span> risk_score {">"} <span className="text-orange-400">7.0</span>:
//               </div>
//               <div className="pl-8">
//                 <span className="text-blue-400">await</span> notion.create_report(<span className="text-green-400">"Risk Alert: PR #42"</span>)
//               </div>
//               <div className="pl-8">
//                 <span className="text-blue-400">await</span> slack.alert(<span className="text-green-400">"#engineering"</span>, risk_score)
//               </div>
//               <div className="mt-4 border-t border-white/10 pt-4 text-emerald-400 animate-pulse">
//                 {">"} Loop AI: High Risk Detected (9.5/10). Notion Doc Created. Alert Sent.
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* --- WORKFLOW VISUALIZATION --- */}
//         <div id="workflow" className="mt-40 mb-20">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-slate-900">From Code to Context</h2>
//             <p className="text-slate-500 mt-2 text-lg">We handle the complexity so you can just ship.</p>
//           </div>

//           <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
//             {/* Connector Lines (Desktop) */}
//             <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200 -z-10" />

//             <WorkflowStep 
//               step="01" 
//               title="Ingest" 
//               desc="Loop silently hooks into GitHub and Jira. No manual entry needed."
//               icon={<Github className="w-6 h-6 text-slate-700"/>} 
//             />
//             <WorkflowStep 
//               step="02" 
//               title="Analyze" 
//               desc="NovaScan AI reads the diff, understands the context, and calculates risk."
//               icon={<BrainCircuit className="w-6 h-6 text-indigo-600"/>} 
//               highlight
//             />
//             <WorkflowStep 
//               step="03" 
//               title="Act" 
//               desc="We auto-generate Notion docs for PMs and Slack alerts for Devs."
//               icon={<Zap className="w-6 h-6 text-amber-500"/>} 
//             />
//           </div>
//         </div>

//         {/* --- BENTO GRID FEATURES --- */}
//         <div id="features" className="max-w-6xl mx-auto mt-32">
//           <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
            
//             {/* CARD 1: GitHub (Tall) */}
//             <div className="md:row-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
//               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -mr-20 -mt-20 pointer-events-none" />
//               <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-slate-900/20">
//                 <Github className="w-6 h-6" />
//               </div>
//               <h3 className="text-xl font-bold text-slate-900 mb-2">Code Sentinel</h3>
//               <p className="text-slate-500 leading-relaxed mb-8">
//                 We don't just look at syntax. We understand the *impact*. Loop detects if a PR touches critical payment logic, lacks tests, or introduces new dependencies.
//               </p>
//               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-slate-600">analysis.py</span>
//                   <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded-md">Critical</span>
//                 </div>
//                 <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
//                   <div className="h-full w-[85%] bg-red-500 rounded-full" />
//                 </div>
//               </div>
//             </div>

//             {/* CARD 2: Notion (Wide) */}
//             <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
//               <div className="absolute top-0 right-0 p-8 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-500">
//                 <FileText className="w-32 h-32 text-slate-900" />
//               </div>
//               <div className="flex items-start gap-4">
//                 <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-6 text-slate-900 shadow-sm">
//                   <span className="font-bold text-lg">N</span>
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-slate-900">Automated Documentation</h3>
//                   <p className="text-slate-500 mt-2 max-w-md">
//                     Forget writing post-mortems manually. Loop AI automatically creates a structured Notion page for every high-risk PR, detailing *why* it was risky and *who* approved it.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* CARD 3: Slack */}
//             <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
//               <div className="w-12 h-12 bg-[#4A154B] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-900/20">
//                 <Slack className="w-6 h-6" />
//               </div>
//               <h3 className="text-xl font-bold text-slate-900 mb-2">Noise-Free Alerts</h3>
//               <p className="text-slate-500 text-sm">
//                 We only ping you when it matters. Critical risks go to Slack; minor warnings stay on the dashboard.
//               </p>
//             </div>

//             {/* CARD 4: Jira */}
//             <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
//               <div className="w-12 h-12 bg-[#0052CC] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-900/20">
//                 <Terminal className="w-6 h-6" />
//               </div>
//               <h3 className="text-xl font-bold text-slate-900 mb-2">Context Sync</h3>
//               <p className="text-slate-500 text-sm">
//                 Matches PRs to Jira tickets automatically to detect scope creep or missing requirements.
//               </p>
//             </div>

//           </div>
//         </div>

//         {/* --- SECURITY --- */}
//         <div id="security" className="mt-32 max-w-4xl mx-auto text-center bg-slate-900 rounded-[3rem] py-16 px-8 relative overflow-hidden">
//           <div className="relative z-10">
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
//               <Shield className="w-3 h-3" /> Enterprise Grade
//             </div>
//             <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Your IP never leaves your vault.</h2>
//             <p className="text-slate-400 max-w-xl mx-auto mb-8">
//               We process metadata transiently. We do not store your source code. 
//               SOC2 Type II Compliant and AES-256 Encrypted.
//             </p>
//             <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-slate-300">
//               <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Read-only Access</span>
//               <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Retention</span>
//               <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> On-Premise Option</span>
//             </div>
//           </div>
//         </div>

//       </main>

//       {/* --- FOOTER --- */}
//       <footer className="border-t border-slate-200 bg-white py-12">
//         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
//           <div className="flex items-center gap-2">
//             <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center">
//               <Activity className="w-3 h-3 text-slate-500" />
//             </div>
//             <span className="font-semibold text-slate-700">Loop AI Inc.</span>
//           </div>
//           <div className="flex gap-8">
//             <a href="#" className="hover:text-slate-900">Documentation</a>
//             <a href="#" className="hover:text-slate-900">Privacy</a>
//             <a href="#" className="hover:text-slate-900">Status</a>
//           </div>
//           <p>© 2026 Loop AI. All rights reserved.</p>
//         </div>
//       </footer>
//     </div>
//   );
// }

// // --- SUBCOMPONENTS ---

// function WorkflowStep({ step, title, desc, icon, highlight = false }: any) {
//   return (
//     <div className={`relative bg-white rounded-2xl p-6 border ${highlight ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-xl' : 'border-slate-200 shadow-sm'} flex flex-col items-center text-center z-10 transition-transform hover:-translate-y-1 duration-300`}>
//       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
//         {icon}
//       </div>
//       <div className="absolute top-6 right-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
//         Step {step}
//       </div>
//       <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
//       <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
//     </div>
//   )
// }



"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Github, Slack, Activity, Terminal, Shield, Zap, 
  FileText, CheckCircle2, AlertTriangle, BrainCircuit, Loader2,
  Code2, Trello, LineChart, Server, Cloud, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* --- NAVBAR --- */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-full px-5 py-2.5 flex items-center gap-8 max-w-4xl w-full justify-between transition-all hover:border-slate-300">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Loop AI</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#playground" className="hover:text-slate-900 transition-colors">Live Demo</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">For Teams</a>
            <a href="#deployment" className="hover:text-slate-900 transition-colors">Deployment</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth">
              <span className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer transition-colors">Log in</span>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="rounded-full px-5 bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-all hover:scale-105">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-6 cursor-default hover:bg-indigo-50 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            NovaScan Engine v2.0 Live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[0.95] text-slate-900"
          >
            The Automated <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">Nervous System</span> <br />
            for Engineering.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Don't let risks merge. Loop AI connects <strong>GitHub, Jira, and Slack</strong> to predict blockers, detect scope creep, and automate documentation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link href="/auth">
              <Button className="h-14 px-8 rounded-full text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 transition-all duration-300 hover:-translate-y-1">
                Connect Repository <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#playground">
              <Button variant="outline" className="h-14 px-8 rounded-full text-lg font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300 transition-all">
                 Try Live Simulator
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* --- INTERACTIVE PLAYGROUND --- */}
        <div id="playground" className="scroll-mt-32">
           <InteractivePlayground />
        </div>

        {/* --- WORKFLOW VISUALIZATION --- */}
        <div id="workflow" className="mt-40 mb-20">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">From Code to Context</h2>
            <p className="text-slate-500 mt-4 text-xl max-w-2xl mx-auto">We handle the complexity of linking diffs to requirements so you can just ship.</p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative px-6">
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200 -z-10" />

            <WorkflowStep 
              step="01" 
              title="Ingest" 
              desc="Loop silently hooks into GitHub and Jira webhooks. No manual entry required. We parse metadata instantly."
              icon={<Github className="w-6 h-6 text-slate-700"/>} 
            />
            <WorkflowStep 
              step="02" 
              title="Analyze" 
              desc="NovaScan AI reads the diff, understands the ticket requirements, and calculates a dynamic risk score."
              icon={<BrainCircuit className="w-6 h-6 text-indigo-600"/>} 
              highlight
            />
            <WorkflowStep 
              step="03" 
              title="Act" 
              desc="We auto-generate Notion docs for PMs and fire Slack alerts for Devs if risk > threshold."
              icon={<Zap className="w-6 h-6 text-amber-500"/>} 
            />
          </div>
        </div>

        {/* --- BENTO GRID FEATURES --- */}
        <div id="features" className="max-w-6xl mx-auto mt-40 px-6">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Intelligence at Every Layer</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
            
            {/* CARD 1: GitHub */}
            <div className="md:row-span-2 bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -mr-20 -mt-20 pointer-events-none" />
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 text-white shadow-xl shadow-slate-900/20 group-hover:scale-110 transition-transform duration-300">
                <Github className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Code Sentinel</h3>
              <p className="text-slate-500 leading-relaxed mb-8 text-lg">
                We don't just look at syntax. We understand the *impact*. Loop detects if a PR touches critical payment logic, lacks tests, or introduces new dependencies.
              </p>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-mono font-medium">stripe_api.ts</span>
                  <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-md border border-red-200">Critical</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-red-500 rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Logic change in payment gateway detected.</p>
              </div>
            </div>

            {/* CARD 2: Notion */}
            <div className="md:col-span-2 bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-500">
                <FileText className="w-64 h-64 text-slate-900" />
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shrink-0">
                  <span className="font-bold text-2xl">N</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Automated Documentation</h3>
                  <p className="text-slate-500 text-lg max-w-lg leading-relaxed">
                    Forget writing post-mortems manually. Loop AI automatically creates a structured Notion page for every high-risk PR, detailing *why* it was risky and *who* approved it.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 3: Slack */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-500 group">
              <div className="w-12 h-12 bg-[#4A154B] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-900/20 group-hover:rotate-12 transition-transform">
                <Slack className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Noise-Free Alerts</h3>
              <p className="text-slate-500">
                We only ping you when it matters. Critical risks go to Slack; minor warnings stay on the dashboard.
              </p>
            </div>

            {/* CARD 4: Jira */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group">
              <div className="w-12 h-12 bg-[#0052CC] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-900/20 group-hover:-rotate-12 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Context Sync</h3>
              <p className="text-slate-500">
                Matches PRs to Jira tickets automatically to detect scope creep or missing requirements.
              </p>
            </div>

          </div>
        </div>

        {/* --- ROLE BASED INSIGHTS (Replaces ROI Calculator) --- */}
        <div id="roles" className="scroll-mt-32 mt-40 max-w-6xl mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-slate-900">Built for the whole team.</h2>
             <p className="text-slate-500 mt-4 text-xl">Loop AI eliminates the "context gap" between roles.</p>
           </div>
           <RoleBasedInsights />
        </div>

        {/* --- DEPLOYMENT & PRIVACY (Replaces Security Section) --- */}
        <div id="deployment" className="mt-40 max-w-5xl mx-auto text-center px-6">
          <div className="bg-white rounded-[3rem] border border-slate-200 p-12 md:p-16 shadow-xl shadow-slate-200/40 relative overflow-hidden">
             
             {/* Subtle background decoration */}
             <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
             <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
             <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />

             <div className="relative z-10">
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Deployment & Security</h2>
               <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-12">
                 We designed Loop AI to fit into your existing compliance framework. Choose the deployment model that matches your risk profile.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                 
                 {/* Option 1 */}
                 <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                     <Cloud className="w-5 h-5 text-indigo-600" />
                   </div>
                   <h3 className="font-bold text-slate-900 text-lg mb-2">Cloud Hosted</h3>
                   <p className="text-sm text-slate-500 leading-relaxed mb-4">
                     Instant setup. We process metadata on our SOC2 compliant infrastructure. Zero maintenance required.
                   </p>
                   <div className="flex gap-2">
                     <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">AES-256</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">SOC2 Type II</span>
                   </div>
                 </div>

                 {/* Option 2 */}
                 <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                     <Server className="w-5 h-5 text-emerald-600" />
                   </div>
                   <h3 className="font-bold text-slate-900 text-lg mb-2">On-Premise</h3>
                   <p className="text-sm text-slate-500 leading-relaxed mb-4">
                     Deploy Loop AI inside your own VPC (AWS/GCP). Your code metadata never leaves your environment.
                   </p>
                   <div className="flex gap-2">
                     <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">Docker</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">K8s Ready</span>
                   </div>
                 </div>

               </div>

               <div className="mt-12 flex items-center justify-center gap-2 text-sm text-slate-400">
                 <Lock className="w-4 h-4" /> 
                 <span>We never store your source code. Metadata processing only.</span>
               </div>
             </div>
          </div>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Loop AI</span>
          </div>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Status</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
          </div>
          <p>© 2026 Loop AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function WorkflowStep({ step, title, desc, icon, highlight = false }: any) {
  return (
    <div className={`relative bg-white rounded-2xl p-8 border ${highlight ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-xl' : 'border-slate-200 shadow-sm'} flex flex-col items-center text-center z-10 transition-transform hover:-translate-y-2 duration-300`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
        {icon}
      </div>
      <div className="absolute top-6 right-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Step {step}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function InteractivePlayground() {
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
        <h2 className="text-3xl font-bold text-slate-900">See Loop AI in Action</h2>
        <p className="text-slate-500 mt-2 text-lg">Select a scenario to see how NovaScan analyzes context in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-2 overflow-hidden">
        
        {/* LEFT: CONTROLS */}
        <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 flex flex-col justify-between border border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Select Pull Request</h3>
            <div className="space-y-3">
              {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveScenario(key)}
                  className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    activeScenario === key 
                      ? "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50" 
                      : "bg-transparent border-transparent hover:bg-slate-200/50"
                  }`}
                >
                  <span className="font-bold text-slate-700 text-sm">{scenarios[key].label}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${scenarios[key].color}`} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900 uppercase">Engine Status</span>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              {isAnalyzing ? (
                <><Loader2 className="w-3 h-3 animate-spin"/> Processing AST & Diff...</>
              ) : (
                <><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Analysis Complete</>
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
          <div className={`flex-1 rounded-2xl p-6 border flex flex-col justify-center items-center text-center transition-colors duration-500 ${
            isAnalyzing ? "bg-slate-50 border-slate-100 opacity-50" : 
            current.risk > 8 ? "bg-red-50 border-red-100" :
            current.risk > 5 ? "bg-amber-50 border-amber-100" :
            "bg-emerald-50 border-emerald-100"
          }`}>
             {isAnalyzing ? (
               <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
             ) : (
               <>
                 <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 ${
                   current.risk > 8 ? "bg-red-100 text-red-600 scale-110" :
                   current.risk > 5 ? "bg-amber-100 text-amber-600" :
                   "bg-emerald-100 text-emerald-600"
                 }`}>
                   {current.risk > 8 ? <AlertTriangle className="w-7 h-7"/> : <CheckCircle2 className="w-7 h-7"/>}
                 </div>
                 <div className="text-4xl font-bold text-slate-900 mb-1">{current.risk}<span className="text-lg text-slate-400">/10</span></div>
                 <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Score</div>
               </>
             )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
               <Slack className="w-4 h-4 text-slate-700" />
               <span className="text-xs font-bold text-slate-700">#engineering-alerts</span>
             </div>
             <div className="space-y-2">
               <div className="h-2 w-3/4 bg-slate-100 rounded animate-pulse" />
               <div className="h-2 w-1/2 bg-slate-100 rounded animate-pulse" />
               {!isAnalyzing && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-xs text-slate-600 mt-2 font-medium bg-slate-50 p-2 rounded border border-slate-100"
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

// --- NEW COMPONENT: ROLE BASED INSIGHTS (Replaces ROI Calculator) ---
function RoleBasedInsights() {
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
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group ${
              role === key ? "bg-white shadow-lg ring-1 ring-slate-200" : "hover:bg-slate-100"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              role === key ? data[key].color : "bg-slate-200 group-hover:bg-slate-300"
            }`}>
              {data[key].icon}
            </div>
            <div>
              <h4 className={`font-bold text-lg ${role === key ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`}>
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
          className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl h-full flex flex-col justify-center relative overflow-hidden"
        >
          {/* Decorative Blob */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10 ${selected.color.replace('bg-', 'bg-')}`} />

          <h3 className="text-3xl font-bold text-slate-900 mb-4 relative z-10">{selected.headline}</h3>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed relative z-10">{selected.desc}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            {selected.points.map((point, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm font-semibold text-slate-700 flex items-center gap-2">
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