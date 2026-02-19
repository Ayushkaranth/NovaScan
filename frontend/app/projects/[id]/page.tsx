// app/projects/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft,
  GitPullRequest,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Clock,
  Github,
  Activity
} from 'lucide-react';

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Project Details
        const projRes = await api.get(`/projects/${projectId}`);
        const projectData = projRes.data;
        setProject(projectData);

        // 2. Get Risk Scans (Fetch ALL for org, then filter client-side by Repo Name)
        // This is a temporary fix as Risks in DB missing 'project_id'
        const scansRes = await api.get(`/risks?limit=100`);

        const repoPath = `${projectData.repo_owner}/${projectData.repo_name}`;
        const filteredScans = scansRes.data.filter((scan: any) => scan.repo === repoPath);

        setScans(filteredScans);
      } catch (err) {
        console.error("Failed to fetch project data", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchData();
  }, [projectId]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Intelligence Feed...</div>;
  if (!project) return <div className="p-12 text-center">Project not found</div>;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 text-foreground">

      {/* === TOP NAVIGATION === */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Organization
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {project.name}
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                LIVE
              </span>
            </h1>
            <a
              href={`https://github.com/${project.repo_owner}/${project.repo_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground mt-2 hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="font-mono">{project.repo_owner}/{project.repo_name}</span>
            </a>
          </div>

          <Link
            href={`/projects/${projectId}/integrations`}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Configure Integrations
          </Link>
        </div>
      </div>

      {/* === STATS OVERVIEW === */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Scans</p>
          <p className="text-2xl font-bold text-foreground">{scans.length}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">High Risks Detected</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-500">
            {scans.filter(s => s.risk_score > 7).length}
          </p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">Avg Risk Score</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {scans.length > 0
              ? (scans.reduce((acc, curr) => acc + curr.risk_score, 0) / scans.length).toFixed(1)
              : '0.0'}
          </p>
        </div>
      </div>

      {/* === THE FEED === */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Intelligence Feed
        </h2>

        {scans.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
            <div className="bg-blue-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitPullRequest className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Waiting for Data...</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              NovaScan is listening. Create a Pull Request in your repo to trigger the first AI analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <ScanCard key={scan._id || scan.id} scan={scan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === SUB-COMPONENT: Scan Card ===
function ScanCard({ scan }: any) {
  // Determine color based on Risk Score (0-10)
  const isHighRisk = scan.risk_score >= 7;
  const isMediumRisk = scan.risk_score >= 4 && scan.risk_score < 7;

  let borderColor = "border-border";
  let badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  let icon = <CheckCircle className="h-5 w-5 text-emerald-500" />;

  if (isHighRisk) {
    borderColor = "border-red-500/30 bg-red-500/5";
    badgeColor = "bg-red-500/10 text-red-600 dark:text-red-400";
    icon = <ShieldAlert className="h-5 w-5 text-red-500" />;
  } else if (isMediumRisk) {
    borderColor = "border-yellow-500/30 bg-yellow-500/5";
    badgeColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }

  return (
    <div className={`bg-card rounded-xl border ${borderColor} p-6 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">{icon}</div>
          <div>
            {/* 🔴 MAPPED to Backend: pr_id instead of pr_number */}
            <h3 className="text-lg font-bold text-foreground">
              PR #{scan.pr_id}: {scan.pr_title || "Pull Request Analysis"}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {/* 🔴 MAPPED to Backend: timestamp instead of created_at */}
                {scan.timestamp ? new Date(scan.timestamp).toLocaleDateString() : "Just now"}
              </span>
              <span>•</span>
              <span className="font-mono">{scan.author || "GitHub User"}</span>
            </div>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-lg text-center ${badgeColor}`}>
          <p className="text-xs font-bold uppercase tracking-wider">Risk Score</p>
          <p className="text-2xl font-black">{scan.risk_score}</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground/80 leading-relaxed border border-border">
        <p className="font-medium mb-1 text-foreground">AI Assessment:</p>
        {/* 🔴 MAPPED to Backend: summary instead of ai_summary */}
        {scan.summary || "Analysis pending..."}
      </div>

      {/* Link to PR if available */}
      {scan.pr_url && (
        <div className="mt-4">
          <a href={scan.pr_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-semibold">
            View Pull Request &rarr;
          </a>
        </div>
      )}
    </div>
  );
}