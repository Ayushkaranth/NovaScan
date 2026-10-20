"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const provider = searchParams.get("provider") || "integration";
  const projectId = searchParams.get("project_id");
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  useEffect(() => {
    let active = true;
    const confirmConnection = async () => {
      if (status !== "success") {
        if (active) setChecking(false);
        return;
      }
      try {
        const { data } = await api.get("/oauth/status", { params: { live: false } });
        if (active) setConnected(data.connections?.[provider]?.status === "connected");
      } catch {
        if (active) setConnected(false);
      } finally {
        if (active) setChecking(false);
      }
    };
    confirmConnection();
    return () => { active = false; };
  }, [provider, status]);

  const goToIntegrations = () => router.push(projectId ? `/dashboard/integrations?project_id=${encodeURIComponent(projectId)}` : "/dashboard/integrations");

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            {checking ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : connected ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
            {checking ? "Confirming connection" : connected ? `${provider} connected` : "Connection not completed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{checking ? "Checking the saved organization connection…" : message || (status === "success" ? "OAuth returned, but the connection could not be confirmed." : "The provider did not complete authorization. You can retry from Integrations.")}</p>
          {!checking && <Button onClick={goToIntegrations} className="gap-2">{projectId ? "Return to project integrations" : "Return to integrations"}<ArrowRight className="h-4 w-4" /></Button>}
        </CardContent>
      </Card>
    </div>
  );
}
