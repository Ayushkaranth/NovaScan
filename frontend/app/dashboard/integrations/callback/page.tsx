"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Exchanging OAuth code for secure credentials...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "default_org";
    const installationId = searchParams.get("installation_id");

    if (!code && !installationId) {
      setStatus("error");
      setMessage("No authorization code or installation ID received from provider.");
      return;
    }

    // Determine provider from URL or fallback
    const provider = window.location.pathname.includes("slack") ? "slack" : window.location.pathname.includes("jira") ? "jira" : "github";

    const processOAuthCallback = async () => {
      try {
        const endpoint = `${API_BASE_URL}/oauth/${provider}/callback`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code || installationId,
            installation_id: installationId,
            org_id: state
          })
        });

        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Connected successfully!");
          setTimeout(() => {
            router.push("/dashboard/integrations");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.detail || "OAuth callback failed.");
        }
      } catch (err) {
        console.error("OAuth processing exception", err);
        setStatus("error");
        setMessage("Server connection error during OAuth exchange.");
      }
    };

    processOAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            {status === "processing" && <Sparkles className="w-6 h-6 text-primary animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            {status === "error" && <AlertCircle className="w-6 h-6 text-destructive" />}
            <span>OAuth 2.0 Authorization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status === "success" && (
            <p className="text-xs text-emerald-500 font-semibold">Redirecting to Integrations Hub...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
