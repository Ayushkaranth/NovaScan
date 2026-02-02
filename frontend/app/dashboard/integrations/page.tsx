"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Github, 
  Slack, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Lock,
  ExternalLink
} from "lucide-react";

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any[]>([]);
  
  // Loading states for individual buttons
  const [connecting, setConnecting] = useState<string | null>(null);

  // Form States
  const [jira, setJira] = useState({ domain: "", email: "", api_token: "" });
  const [slack, setSlack] = useState({ bot_token: "" });
  const [github, setGithub] = useState({ access_token: "" });

  // 1. Fetch Existing Connections on Load
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get("/integrations/");
      setIntegrations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (platform: string) => integrations.some(i => i.platform === platform);

const handleConnect = async (platform: string, credentials: any) => {
    setConnecting(platform);
    try {
      // 1. Log the payload to see exactly what we are sending
      const payload = {
        platform: platform,
        credentials,
        config: {},
      };
      console.log("Sending Payload:", JSON.stringify(payload, null, 2));

      await api.post(`/integrations/${platform}`, payload);
      
      toast({ 
        title: "Connection Successful", 
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} is now linked.` 
      });
      
      await fetchIntegrations();

    } catch (error: any) {
      console.error("Full Error Object:", error.response?.data);

      const detail = error.response?.data?.detail;
      let errorMessage = "Invalid credentials.";

      // --- IMPROVED ERROR PARSING ---
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // This is the key fix: It prints "location: message"
        // Example output: "body.credentials.access_token: Field required"
        errorMessage = detail.map((e: any) => `${e.loc.join(".")}: ${e.msg}`).join("\n");
      } else if (typeof detail === "object" && detail !== null) {
        errorMessage = JSON.stringify(detail);
      }
      // -----------------------------

      toast({ 
        variant: "destructive",
        title: "Connection Failed", 
        description: errorMessage,
      });
    } finally {
      setConnecting(null);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrations Vault</h1>
          <p className="text-slate-500 mt-1">Manage your secure connections to external tools.</p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* --- GITHUB CARD --- */}
        <IntegrationCard 
          title="GitHub" 
          desc="Syncs pull requests, commit history, and code diffs."
          icon={<Github className="w-6 h-6" />}
          connected={isConnected("github")}
          color="bg-slate-900"
        >
          <div className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label>Personal Access Token</Label>
                <Input 
                  type="password" 
                  placeholder="ghp_xxxxxxxxxxxx" 
                  value={github.access_token}
                  onChange={(e) => setGithub({...github, access_token: e.target.value})}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-400">
                  Required scopes: <span className="font-mono bg-slate-100 px-1 rounded">repo</span>, <span className="font-mono bg-slate-100 px-1 rounded">user</span>
                </p>
             </div>
             <Button 
                onClick={() => handleConnect("github", github)}
                disabled={connecting === "github" || isConnected("github")}
                className="w-full bg-slate-900 hover:bg-slate-800"
             >
                {connecting === "github" ? <Loader2 className="w-4 h-4 animate-spin"/> : (isConnected("github") ? "Connected" : "Connect GitHub")}
             </Button>
          </div>
        </IntegrationCard>

        {/* --- JIRA CARD --- */}
        <IntegrationCard 
          title="Jira Software" 
          desc="Syncs tickets, sprints, and project timelines."
          icon={<Terminal className="w-6 h-6 text-blue-600" />}
          connected={isConnected("jira")}
          color="bg-blue-600"
        >
          <div className="space-y-4 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Atlassian Domain</Label>
                    <Input 
                      placeholder="company.atlassian.net" 
                      value={jira.domain}
                      onChange={(e) => setJira({...jira, domain: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      placeholder="you@company.com" 
                      value={jira.email}
                      onChange={(e) => setJira({...jira, email: e.target.value})}
                    />
                </div>
             </div>
             <div className="space-y-2">
                <Label>API Token</Label>
                <Input 
                  type="password" 
                  placeholder="ATATT3xFfGF0..." 
                  value={jira.api_token}
                  onChange={(e) => setJira({...jira, api_token: e.target.value})}
                  className="font-mono text-sm"
                />
             </div>
             <Button 
                onClick={() => handleConnect("jira", jira)}
                disabled={connecting === "jira" || isConnected("jira")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
             >
                {connecting === "jira" ? <Loader2 className="w-4 h-4 animate-spin"/> : (isConnected("jira") ? "Connected" : "Connect Jira")}
             </Button>
          </div>
        </IntegrationCard>

        {/* --- SLACK CARD --- */}
        <IntegrationCard 
          title="Slack" 
          desc="Sends alerts and analyzes team communication patterns."
          icon={<Slack className="w-6 h-6 text-purple-600" />}
          connected={isConnected("slack")}
          color="bg-purple-600"
        >
          <div className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label>Bot User OAuth Token</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password" 
                      placeholder="xoxb-xxxxxxxxxxxx-..." 
                      className="pl-9 font-mono text-sm"
                      value={slack.bot_token}
                      onChange={(e) => setSlack({...slack, bot_token: e.target.value})}
                    />
                </div>
                <p className="text-xs text-slate-400">
                  Must have <span className="font-mono bg-slate-100 px-1 rounded">channels:history</span> scope.
                </p>
             </div>
             <Button 
                onClick={() => handleConnect("slack", slack)}
                disabled={connecting === "slack" || isConnected("slack")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
             >
                {connecting === "slack" ? <Loader2 className="w-4 h-4 animate-spin"/> : (isConnected("slack") ? "Connected" : "Connect Slack")}
             </Button>
          </div>
        </IntegrationCard>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function IntegrationCard({ title, desc, icon, children, connected, color }: any) {
  return (
    <div className={`rounded-2xl border ${connected ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'} p-6 transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? 'bg-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{desc}</p>
          </div>
        </div>
        {connected ? (
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Connected
           </div>
        ) : (
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <XCircle className="w-4 h-4" /> Not Linked
           </div>
        )}
      </div>
      
      {/* If connected, hide the form to keep it clean */}
      <div className={`mt-4 transition-all ${connected ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
         {children}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{children}</label>
}