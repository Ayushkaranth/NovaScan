// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Building2, 
  Users, 
  FolderGit2, 
  Plus, 
  Settings,
  ShieldAlert,
  Copy, 
  Check,
  Briefcase
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false); // State for copy feedback

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/organizations/me');
      
      // If user is not part of an org, redirect to setup
      if (!res.data.organization) {
        router.push('/org/setup'); 
        return;
      }

      setOrgData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      // Optional: Redirect to login if unauthorized
    } finally {
      setLoading(false);
    }
  };

  const copyOrgId = () => {
    if (!orgData?.organization?._id) return;
    navigator.clipboard.writeText(orgData.organization._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset icon after 2s
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // Safety check to prevent crashing if data is missing
  if (!orgData || !orgData.organization) return null;

  const { organization, stats, projects, role } = orgData;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      
      {/* === HEADER SECTION === */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:justify-between md:items-start gap-6 border-b border-gray-200 pb-8">
        
        {/* Org Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {organization.name}
            </h1>
            
            {/* COPY ID BADGE */}
            <button 
              onClick={copyOrgId}
              className="group flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-mono text-gray-600 transition-all ml-2 border border-gray-200"
              title="Click to copy Organization ID"
            >
              <span className="font-semibold text-gray-500 group-hover:text-gray-800">ID:</span> 
              {organization._id.slice(-6)}...
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />}
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm ml-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
              role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
              role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {role}
            </span>
            <span className="text-gray-500">Workspace Dashboard</span>
          </div>
        </div>
        
        {/* Actions (RBAC Restricted) */}
        <div className="flex gap-3">
          {/* Only Admins can Manage Team */}
          {role === 'admin' && (
            <Link 
              href="/settings/team" 
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all shadow-sm"
            >
              <Users className="h-4 w-4 text-gray-500" />
              Manage Team
            </Link>
          )}
          
          {/* Only Admins can Create Projects */}
          {role === 'admin' && (
            <Link 
              href="/projects/new" 
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg font-medium transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* === STATS GRID === */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Active Projects" 
          value={stats?.active_projects || 0} 
          icon={FolderGit2} 
          color="blue" 
        />
        <StatCard 
          title="Total Team" 
          value={(stats?.total_employees || 0) + (stats?.total_managers || 0) + (stats?.total_admins || 0)} 
          icon={Users} 
          color="green" 
        />
        <StatCard 
          title="Managers" 
          value={stats?.total_managers || 0} 
          icon={Briefcase} 
          color="purple" 
        />
        <StatCard 
          title="Critical Risks" 
          value="0" 
          icon={ShieldAlert} 
          color="red" 
        />
      </div>

      {/* === PROJECTS LIST === */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-gray-500" />
            Your Projects
          </h2>
          <span className="text-sm text-gray-500">
            {projects?.length || 0} Total
          </span>
        </div>
        
        {(!projects || projects.length === 0) ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderGit2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto mt-2">
              {role === 'admin' 
                ? "You haven't created any projects yet. Start by onboarding your first repository." 
                : "You haven't been assigned to any projects yet. Contact your manager."}
            </p>
            
            {role === 'admin' && (
              <Link 
                href="/projects/new" 
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                Start Master Onboarding &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Components ---

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: any) {
  return (
    <div className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all cursor-default flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 font-mono flex items-center gap-1 mt-1 truncate max-w-[200px]">
            <span className="opacity-50">git/</span>
            {project.repo_owner}/{project.repo_name}
          </p>
        </div>
        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
          ACTIVE
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg mt-auto">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{Object.keys(project.settings || {}).length}</span>
          <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Integrations</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 flex justify-between items-center mt-auto">
        <Link 
          href={`/projects/${project._id}/integrations`} 
          className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors hover:bg-gray-50 px-3 py-1.5 rounded-md -ml-2"
        >
          Configure
        </Link>
        <Link 
          href={`/projects/${project._id}`} 
          className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md"
        >
          View Dashboard <span className="text-xs">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}