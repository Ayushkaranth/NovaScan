"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Video, FileText, CheckCircle2, Ticket, AlertTriangle, Sparkles, Lock } from "lucide-react";

export default function GMeetDashboardPage() {
  const [meetingTitle, setMeetingTitle] = useState("Google Meet Sprint Sync");
  const [transcriptText, setTranscriptText] = useState(
`[00:01] Sarah (Product Manager): Let's review the API deployment for payment gateway integration.
[00:03] Alex (Lead Dev): We noticed high latency on the auth endpoint. We need to add Redis caching before public release.
[00:05] Sarah: Great. Alex, please create a Jira task for Redis caching and update the Notion architecture doc.
[00:07] Dave (DevOps): I will prepare the Docker deployment pipeline for the staging environment.`
  );

  const [jiraUrl, setJiraUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [notionToken, setNotionToken] = useState("");
  const [notionDbId, setNotionDbId] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyzeMeeting = async () => {
    if (!transcriptText.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/gmeet/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle,
          transcript: transcriptText,
          jira_url: jiraUrl || undefined,
          jira_email: jiraEmail || undefined,
          jira_token: jiraToken || undefined,
          notion_token: notionToken || undefined,
          notion_database_id: notionDbId || undefined
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Failed to analyze Google Meet transcript", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Google Meet AI Intelligence</h1>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10 flex items-center gap-1.5 py-1 px-3">
              <Lock className="w-3.5 h-3.5" /> Zero Data Retention (ZDR)
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Ingest meeting transcripts via free third-party extensions, webhooks, or direct paste to auto-generate Notion MOMs & Jira tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transcript Ingestion Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Video className="w-5 h-5 text-primary" /> Meeting Transcript Ingestion
              </CardTitle>
              <CardDescription>
                Paste dialogue from Google Meet recording, Chrome transcript extension, or free third-party transcript tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Session Title</label>
                <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="e.g. Sprint Architecture Sync" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Transcript Content</label>
                <Textarea
                  rows={8}
                  className="font-mono text-sm"
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste meeting transcript here..."
                />
              </div>

              {/* Optional Connections */}
              <div className="border-t border-border/50 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Optional SDLC Integration Dispatch</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Jira Domain URL</label>
                    <Input className="h-8 text-xs" value={jiraUrl} onChange={(e) => setJiraUrl(e.target.value)} placeholder="https://yourdomain.atlassian.net" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Jira User Email</label>
                    <Input className="h-8 text-xs" value={jiraEmail} onChange={(e) => setJiraEmail(e.target.value)} placeholder="user@company.com" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Jira API Token</label>
                    <Input type="password" className="h-8 text-xs" value={jiraToken} onChange={(e) => setJiraToken(e.target.value)} placeholder="API Token" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notion Integration Token</label>
                    <Input type="password" className="h-8 text-xs" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder="secret_..." />
                  </div>
                </div>
              </div>

              <Button onClick={handleAnalyzeMeeting} disabled={loading} className="w-full mt-4 bg-primary hover:bg-primary/90">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Processing In-Memory (ZDR)...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Evaluate Meeting & Dispatch Actions
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: In-Memory Results Output */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Evaluation Complete
                  </CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    ZDR Compliant
                  </Badge>
                </div>
                <CardDescription>{result.meeting_title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-foreground mb-1">Executive Summary</h4>
                  <p className="text-muted-foreground leading-relaxed bg-card/60 p-3 rounded-lg border border-border/50">{result.executive_summary}</p>
                </div>

                {result.key_decisions && result.key_decisions.length > 0 && (
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Key Decisions</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {result.key_decisions.map((dec: string, idx: number) => (
                        <li key={idx}>{dec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-primary" /> Auto-Dispatched Jira Action Items
                  </h4>
                  {result.created_jira_tickets && result.created_jira_tickets.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.created_jira_tickets.map((tKey: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="font-mono text-xs bg-primary/20 text-primary border-primary/30">
                          Ticket: {tKey}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {result.action_items_count} action item(s) identified. Provide Jira credentials to auto-create tickets.
                    </p>
                  )}
                </div>

                <div className="border-t border-border/50 pt-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Notion MOM Status: <strong className="text-foreground">{result.notion_mom_status}</strong></span>
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-500" /> Zero Raw Data Saved</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border bg-card/40 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-foreground text-lg">Zero Data Retention Vault</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Your transcript text will be analyzed strictly in-memory using your BYOK key (or free system key fallback) without saving transcript bytes.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
