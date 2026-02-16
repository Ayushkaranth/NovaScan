"use client";

import { Navbar } from "@/components/Navbar";
import HeroSection from "@/components/ui/HeroSection";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { IntegrationsBeam } from "@/components/ui/IntegrationsBeam";
import { InteractivePlayground } from "@/components/landing/InteractivePlayground";
import { RoleBasedInsights } from "@/components/landing/RoleBasedInsights";
import { Github, FileText, Slack, Terminal, Activity, BrainCircuit, Zap, Shield, Lock, Cloud, Server } from "lucide-react";
import { motion } from "framer-motion";

// --- DATA & COMPONENTS ---

import {
  CodeSentinelAnimation,
  AutomatedDocsAnimation,
  NoiseFreeAlertsAnimation,
  ContextSyncAnimation,
  RiskHeatmapAnimation
} from "@/components/ui/BentoGridAnimations";

function WorkflowStep({ step, title, desc, icon, highlight = false }: any) {
  return (
    <div className={`relative bg-card rounded-2xl p-8 border ${highlight ? 'border-primary ring-2 ring-primary/20 shadow-xl' : 'border-border shadow-sm'} flex flex-col items-center text-center z-10 transition-transform hover:-translate-y-2 duration-300`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-muted border border-border'}`}>
        {icon}
      </div>
      <div className="absolute top-6 right-6 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
        Step {step}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

const features = [
  {
    title: "Code Sentinel",
    description: "Loop detects if a PR touches critical payment logic, lacks tests, or introduces new dependencies.",
    header: <CodeSentinelAnimation />,
    icon: <Github className="w-4 h-4 text-neutral-500" />,
  },
  {
    title: "Automated Documentation",
    description: "Forget writing post-mortems manually. Loop AI automatically creates a structured Notion page for every high-risk PR.",
    header: <AutomatedDocsAnimation />,
    icon: <FileText className="w-4 h-4 text-neutral-500" />,
  },
  {
    title: "Noise-Free Alerts",
    description: "Critical risks go to Slack; minor warnings stay on the dashboard.",
    header: <NoiseFreeAlertsAnimation />,
    icon: <Slack className="w-4 h-4 text-neutral-500" />,
  },
  {
    title: "Context Sync",
    description: "Matches PRs to Jira tickets automatically to detect scope creep or missing requirements.",
    header: <ContextSyncAnimation />,
    icon: <Terminal className="w-4 h-4 text-neutral-500" />,
  },
  {
    title: "Risk Heatmap",
    description: "Visualize technical debt and risk accumulation across your entire codebase.",
    header: <RiskHeatmapAnimation />,
    icon: <Activity className="w-4 h-4 text-neutral-500" />,
  },
];

const integrations = [
  { quote: "GitHub", name: "Source Control", title: "Version Control", icon: <Github className="w-6 h-6" /> },
  { quote: "Jira", name: "Project Management", title: "Issue Tracking", icon: <Activity className="w-6 h-6" /> },
  { quote: "Linear", name: "Issue Tracking", title: "Project Management", icon: <Zap className="w-6 h-6" /> },
  { quote: "Slack", name: "Communication", title: "Chat Ops", icon: <Slack className="w-6 h-6" /> },
  { quote: "Notion", name: "Documentation", title: "Knowledge Base", icon: <FileText className="w-6 h-6" /> },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">

      <Navbar />

      <HeroSection />

      {/* --- INTEGRATIONS BEAM --- */}
      <div className="py-20 flex flex-col items-center justify-center space-y-8 bg-muted/10 border-y border-border/50">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold tracking-tight mb-2">The Central Nervous System</h2>
          <p className="text-muted-foreground">Connecting your entire engineering stack in real-time.</p>
        </div>
        <IntegrationsBeam />
      </div>


      {/* --- INTERACTIVE PLAYGROUND --- */}
      <div id="playground" className="scroll-mt-32 mb-40">
        <InteractivePlayground />
      </div>

      {/* --- WORKFLOW VISUALIZATION --- */}
      <div id="workflow" className="mb-40">
        <div className="text-center mb-20 px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">From Code to Context</h2>
          <p className="text-muted-foreground mt-4 text-xl max-w-2xl mx-auto">We handle the complexity of linking diffs to requirements so you can just ship.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative px-6">
          <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-border via-primary/20 to-border -z-10" />

          <WorkflowStep
            step="01"
            title="Ingest"
            desc="Loop silently hooks into GitHub and Jira webhooks. No manual entry required. We parse metadata instantly."
            icon={<Github className="w-6 h-6 text-foreground" />}
          />
          <WorkflowStep
            step="02"
            title="Analyze"
            desc="NovaScan AI reads the diff, understands the ticket requirements, and calculates a dynamic risk score."
            icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            highlight
          />
          <WorkflowStep
            step="03"
            title="Act"
            desc="We auto-generate Notion docs for PMs and fire Slack alerts for Devs if risk > threshold."
            icon={<Zap className="w-6 h-6 text-amber-500" />}
          />
        </div>
      </div>

      {/* --- BENTO GRID FEATURES --- */}
      <div id="features" className="py-20 bg-muted/20">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Intelligence at Every Layer</h2>
        </div>
        <BentoGrid className="max-w-6xl mx-auto px-6">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={i === 3 || i === 6 ? "md:col-span-2" : ""}
            />
          ))}
        </BentoGrid>
      </div>

      {/* --- ROLE BASED INSIGHTS --- */}
      <div id="roles" className="scroll-mt-32 py-40 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">Built for the whole team.</h2>
          <p className="text-muted-foreground mt-4 text-xl">Loop AI eliminates the "context gap" between roles.</p>
        </div>
        <RoleBasedInsights />
      </div>

      {/* --- DEPLOYMENT & PRIVACY --- */}
      <div id="deployment" className="pb-40 max-w-5xl mx-auto text-center px-6">
        <div className="bg-card rounded-[3rem] border border-border p-12 md:p-16 shadow-xl shadow-primary/5 relative overflow-hidden">

          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Deployment & Security</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
              We designed Loop AI to fit into your existing compliance framework. Choose the deployment model that matches your risk profile.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">

              {/* Option 1 */}
              <div className="p-6 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Cloud className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">Cloud Hosted</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Instant setup. We process metadata on our SOC2 compliant infrastructure. Zero maintenance required.
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-card px-2 py-1 rounded border border-border text-muted-foreground">AES-256</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-card px-2 py-1 rounded border border-border text-muted-foreground">SOC2 Type II</span>
                </div>
              </div>

              {/* Option 2 */}
              <div className="p-6 rounded-2xl bg-muted/30 border border-border hover:border-emerald-500/50 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Server className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">On-Premise</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Deploy Loop AI inside your own VPC (AWS/GCP). Your code metadata never leaves your environment.
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-card px-2 py-1 rounded border border-border text-muted-foreground">Docker</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-card px-2 py-1 rounded border border-border text-muted-foreground">K8s Ready</span>
                </div>
              </div>

            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>We never store your source code. Metadata processing only.</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-border bg-card py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">Loop AI</span>
          </div>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">Status</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
          <p>© 2026 Loop AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}