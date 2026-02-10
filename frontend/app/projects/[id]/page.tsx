'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Project Details
        // (Assuming you have an endpoint for single project, if not we filter from Org)
        const projRes = await api.get(`/projects/${projectId}`);
        setProject(projRes.data);

        // 2. Get Risk Scans (The "Feed")
        // Checks your backend for GET /api/v1/risks?project_id=...
        const scansRes = await api.get(`/risks?project_id=${projectId}&limit=20`);
        setScans(scansRes.data);
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      
      {/* === TOP NAVIGATION === */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Organization
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {project.name}
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                LIVE
              </span>
            </h1>
            <a 
              href={`https://github.com/${project.repo_owner}/${project.repo_name}`}
              target="_blank"
              className="flex items-center gap-2 text-gray-500 mt-2 hover:text-blue-600 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="font-mono">{project.repo_owner}/{project.repo_name}</span>
            </a>
          </div>

          <Link
            href={`/projects/${projectId}/integrations`}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Configure Integrations
          </Link>
        </div>
      </div>

      {/* === STATS OVERVIEW === */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Scans</p>
          <p className="text-2xl font-bold text-gray-900">{scans.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">High Risks Detected</p>
          <p className="text-2xl font-bold text-red-600">
            {scans.filter(s => s.risk_score > 7).length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Avg Risk Score</p>
          <p className="text-2xl font-bold text-blue-600">
            {scans.length > 0 
              ? (scans.reduce((acc, curr) => acc + curr.risk_score, 0) / scans.length).toFixed(1) 
              : '0.0'}
          </p>
        </div>
      </div>

      {/* === THE FEED === */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Intelligence Feed
        </h2>

        {scans.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitPullRequest className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Waiting for Data...</h3>
            <p className="text-gray-500 max-w-md mx-auto mt-2">
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
  
  let borderColor = "border-gray-200";
  let badgeColor = "bg-green-100 text-green-700";
  let icon = <CheckCircle className="h-5 w-5 text-green-600" />;

  if (isHighRisk) {
    borderColor = "border-red-200 bg-red-50/30";
    badgeColor = "bg-red-100 text-red-700";
    icon = <ShieldAlert className="h-5 w-5 text-red-600" />;
  } else if (isMediumRisk) {
    borderColor = "border-yellow-200 bg-yellow-50/30";
    badgeColor = "bg-yellow-100 text-yellow-700";
    icon = <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  }

  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-6 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              PR #{scan.pr_number}: {scan.pr_title || "Untitled Pull Request"}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(scan.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="font-mono">{scan.author || "Unknown Author"}</span>
            </div>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-lg text-center ${badgeColor}`}>
          <p className="text-xs font-bold uppercase tracking-wider">Risk Score</p>
          <p className="text-2xl font-black">{scan.risk_score}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
        <p className="font-medium mb-1 text-gray-900">AI Assessment:</p>
        {scan.ai_summary || "Analysis pending..."}
      </div>

      {isHighRisk && (
        <div className="mt-4 flex gap-2">
           <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
             Jira Ticket Created
           </span>
           <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
             Slack Alert Sent
           </span>
        </div>
      )}
    </div>
  );
}