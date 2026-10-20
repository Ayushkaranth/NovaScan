"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import api from "@/lib/api";

// --- AUTHENTIC BRAND SVG LOGOS ---

function GitHubLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function SlackLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M6 15a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm0 0h5a2.5 2.5 0 000-5H6v5z" fill="#E01E5A" />
      <path d="M9 6a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0zm0 0v5a2.5 2.5 0 005 0V6H9z" fill="#36C5F0" />
      <path d="M18 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 0h-5a2.5 2.5 0 000 5h5V9z" fill="#2EB67D" />
      <path d="M15 18a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0zm0 0v-5a2.5 2.5 0 00-5 0v5h5z" fill="#ECB22E" />
    </svg>
  );
}

function JiraLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M11.571 11.424H.147B.147 17.848h11.424v-6.424z" fill="#2684FF" />
      <path d="M11.571 5H.147v6.424h11.424V5z" fill="url(#jira_grad1)" />
      <path d="M23 11.424H11.576v6.424H23v-6.424z" fill="#2684FF" />
      <path d="M23 5H11.576v6.424H23V5z" fill="#0052CC" />
      <defs>
        <linearGradient id="jira_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NotionLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.43-.699c.326 0 .093-.28-.047-.373L16.29 2.155c-.467-.374-1.166-.56-2.146-.467l-9.98.699c-.653.047-.933.28-.653.653l.948 1.168zm-.14 2.801v13.535c0 .653.373.933.933.886l12.457-.746c.653-.047.886-.467.886-1.026V6.03c0-.56-.233-.886-.793-.84L5.159 5.983c-.56.047-.84.373-.84 1.026zm12.317.933c0 .28-.14.42-.42.42-.047 0-.14 0-.233-.047l-4.76-2.52c-.28-.14-.513-.187-.653.047l-3.36 4.946v-3.78c0-.42-.233-.606-.653-.56l-1.073.093c-.327.047-.42.233-.42.467v9.053c0 .327.187.513.56.467l1.213-.093c.373-.047.513-.233.607-.513l3.686-5.46v4.386c0 .467.28.606.7.56l1.073-.093c.373-.047.513-.28.513-.607V7.942z" />
    </svg>
  );
}

function GoogleMeetLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" fill="#00832F" />
      <path d="M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" fill="#00AA47" />
    </svg>
  );
}

export default function IntegrationsHubPage() {
  const [connections, setConnections] = useState<any>({
    github: { status: "not_connected" },
    slack: { status: "not_connected" },
    jira: { status: "not_connected" },
    notion: { status: "not_connected" },
    gmeet: { status: "available" }
  });
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchConnectionStatuses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/oauth/status");
      setConnections(data.connections || {});
      setConfigured(data.configured || {});
      setError("");
    } catch (err) {
      console.error("Failed to load connection status", err);
      setError("Could not load organization integrations. Check your sign in and API connection, then refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatuses();
    const refreshTimer = window.setInterval(fetchConnectionStatuses, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const handleConnect = async (provider: "github" | "slack" | "jira") => {
    setConnecting(provider);
    setError("");
    try {
      const projectId = new URLSearchParams(window.location.search).get("project_id");
      const { data } = await api.get(`/oauth/${provider}/authorize`, { params: projectId ? { project_id: projectId } : {} });
      window.location.assign(data.auth_url);
    } catch (err) {
      const message = (err as any)?.response?.data?.detail || "Could not start OAuth authorization.";
      setError(message);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: "github" | "slack" | "jira") => {
    try {
      await api.delete(`/oauth/${provider}`);
      await fetchConnectionStatuses();
    } catch (err) {
      setError((err as any)?.response?.data?.detail || `Could not disconnect ${provider}.`);
    }
  };

  const actionButton = (provider: "github" | "slack" | "jira", label: string, className?: string) => (
    <Button onClick={() => handleConnect(provider)} disabled={connecting !== null || !configured[provider]} className={className || "w-full gap-2"}>
      {connecting === provider ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
      {configured[provider] ? label : "OAuth not configured on server"}
    </Button>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Enterprise Integrations Hub</h1>
            <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 flex items-center gap-1 py-1 px-3">
              <ShieldCheck className="w-3.5 h-3.5" /> 1-Click OAuth 2.0
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Connect your software tools in one click without sharing private API keys or passwords. Powered by short-lived OAuth tokens & AES-256 encryption.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchConnectionStatuses} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </Button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. GITHUB APP CONNECTOR */}
        <Card className="border-border shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm">
                <GitHubLogo className="w-7 h-7 text-foreground" />
              </div>
              {connections.github?.status === "connected" ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">Not Connected</Badge>
              )}
            </div>
            <CardTitle className="text-xl">GitHub</CardTitle>
            <CardDescription>
              Auto-ingests pull request diffs, validates HMAC webhooks, and correlates code changes with Slack discussions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {connections.github?.status === "connected" ? (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-semibold text-foreground">{connections.github.workspace_name}</div>
                <div className="text-muted-foreground">Scope: {connections.github.scope}</div>
              </div>
            ) : actionButton("github", "Connect GitHub", "w-full bg-foreground text-background hover:bg-foreground/90 gap-2")}
            {connections.github?.status === "connected" && <Button variant="outline" size="sm" onClick={() => handleDisconnect("github")}>Disconnect</Button>}
          </CardContent>
        </Card>

        {/* 2. SLACK OAUTH CONNECTOR */}
        <Card className="border-border shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm">
                <SlackLogo className="w-7 h-7" />
              </div>
              {connections.slack?.status === "connected" ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">Not Connected</Badge>
              )}
            </div>
            <CardTitle className="text-xl">Slack Workspace</CardTitle>
            <CardDescription>
              1-Click OAuth app integration to read channel discussion context and post visual Block Kit risk alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {connections.slack?.status === "connected" ? (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-semibold text-foreground">{connections.slack.workspace_name}</div>
                <div className="text-muted-foreground">Scope: {connections.slack.scope}</div>
              </div>
            ) : actionButton("slack", "Add to Slack", "w-full bg-[#4A154B] hover:bg-[#3F103F] text-white gap-2")}
            {connections.slack?.status === "connected" && <Button variant="outline" size="sm" onClick={() => handleDisconnect("slack")}>Disconnect</Button>}
          </CardContent>
        </Card>

        {/* 3. ATLASSIAN JIRA 3LO CONNECTOR */}
        <Card className="border-border shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm">
                <JiraLogo className="w-7 h-7" />
              </div>
              {connections.jira?.status === "connected" ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">Not Connected</Badge>
              )}
            </div>
            <CardTitle className="text-xl">Atlassian Jira</CardTitle>
            <CardDescription>
              3-Legged OAuth (3LO) integration for auto-provisioning issue tickets from meeting minutes and critical risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {connections.jira?.status === "connected" ? (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-semibold text-foreground">{connections.jira.workspace_name}</div>
                <div className="text-muted-foreground">Scope: {connections.jira.scope}</div>
              </div>
            ) : actionButton("jira", "Connect Jira Workspace", "w-full bg-[#0052CC] hover:bg-[#003E99] text-white gap-2")}
            {connections.jira?.status === "connected" && <Button variant="outline" size="sm" onClick={() => handleDisconnect("jira")}>Disconnect</Button>}
          </CardContent>
        </Card>

        {/* 4. NOTION WORKSPACE */}
        <Card className="border-border shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm">
                <NotionLogo className="w-7 h-7 text-foreground" />
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10">Active</Badge>
            </div>
            <CardTitle className="text-xl">Notion Workspace</CardTitle>
            <CardDescription>
              Auto-publishes structured Meeting Minutes (MOM) and technical post-mortems directly into Notion databases.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" className="w-full gap-2">
              <NotionLogo className="w-4 h-4" /> Configured via Integration Token
            </Button>
          </CardContent>
        </Card>

        {/* 5. GOOGLE MEET */}
        <Card className="border-border shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm">
                <GoogleMeetLogo className="w-7 h-7" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">ZDR Ready</Badge>
            </div>
            <CardTitle className="text-xl">Google Meet Intelligence</CardTitle>
            <CardDescription>
              Ingest transcripts from free Chrome extensions or webhooks for Zero Data Retention AI evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <a href="/dashboard/gmeet">
              <Button variant="secondary" className="w-full gap-2">
                <GoogleMeetLogo className="w-4 h-4" /> Launch GMeet Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
