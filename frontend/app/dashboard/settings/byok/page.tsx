"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, Shield, Sparkles, CheckCircle2, Lock, Cpu, Server } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

export default function BYOKSettingsPage() {
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [zdrEnabled, setZdrEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/settings/byok`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider,
          api_key: apiKey || null,
          zero_data_retention: zdrEnabled
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        setStatusMessage(`Security configuration updated! Provider: ${data.provider.toUpperCase()} (${data.fallback_to_free_gemini ? "Using System Free Gemini Key" : "Encrypted BYOK Key Active"})`);
      }
    } catch (err) {
      console.error("Failed to save BYOK settings", err);
      setStatusMessage("Failed to connect to backend settings endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Enterprise BYOK & Privacy Security Vault</h1>
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" /> AES-256 Encrypted
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Bring Your Own Key (BYOK) & Model (BYOM). All AI evaluation runs on your subscription account so your chat context and corporate knowledge stay 100% private.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Key className="w-5 h-5 text-amber-500" /> Dynamic LLM Provider Selection
            </CardTitle>
            <CardDescription>
              Select your organization's preferred AI provider or use the free default system key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: "gemini", name: "Google Gemini", tag: "Free Default / BYOK", icon: <Sparkles className="w-4 h-4 text-blue-500" /> },
                { id: "openai", name: "OpenAI GPT-4o", tag: "BYOK Key Required", icon: <Cpu className="w-4 h-4 text-emerald-500" /> },
                { id: "anthropic", name: "Anthropic Claude", tag: "BYOK Key Required", icon: <Shield className="w-4 h-4 text-purple-500" /> },
                { id: "ollama", name: "Local Ollama", tag: "On-Prem / Zero Leakage", icon: <Server className="w-4 h-4 text-amber-500" /> },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setProvider(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    provider === item.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/60 bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{item.tag}</span>
                </div>
              ))}
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>{provider.toUpperCase()} API Key (BYOK)</span>
                <span className="text-emerald-500 font-normal lowercase">If blank, defaults to our free system Gemini API key</span>
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === "ollama" ? "http://localhost:11434 (No key required for local Ollama)" : "Paste your proprietary API key here..."}
              />
              <p className="text-xs text-muted-foreground">
                Keys are encrypted at rest using AES-256 envelope encryption. Plaintext keys are never stored or logged.
              </p>
            </div>

            {/* Zero Data Retention Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" /> Zero Data Retention (ZDR) Enforcement
                </div>
                <p className="text-xs text-muted-foreground">
                  Process PR code diffs and meeting transcripts strictly in-memory. Zero raw payload stored to database.
                </p>
              </div>
              <Switch checked={zdrEnabled} onCheckedChange={setZdrEnabled} />
            </div>

            {statusMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <Button onClick={handleSaveSettings} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? "Encrypting & Validating..." : "Save BYOK Security Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
