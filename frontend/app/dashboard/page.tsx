// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import api from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { 
//   Activity, 
//   AlertCircle, 
//   ArrowUpRight, 
//   CheckCircle2, 
//   Github, 
//   LayoutDashboard, 
//   Loader2, 
//   Plus, 
//   ShieldAlert, 
//   Slack, 
//   Terminal, 
//   Zap,
//   X
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// // --- MAIN DASHBOARD COMPONENT ---
// export default function DashboardPage() {
//   const [loading, setLoading] = useState(true);
//   const [integrations, setIntegrations] = useState<any[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false); // <--- Controls the Popup

//   const fetchData = async () => {
//     try {
//       const res = await api.get("/integrations/"); // Or your endpoint for fetching orgs
//       setIntegrations(res.data);
//     } catch (e) {
//       console.error("Failed to fetch dashboard data", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex h-[80vh] items-center justify-center">
//         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
//       </div>
//     );
//   }

//   // Calculate Setup Progress
//   const hasGithub = integrations.some(i => i.platform === "github"); // Adjust based on your actual data shape
//   const hasJira = integrations.some(i => i.platform === "jira");
//   const hasSlack = integrations.some(i => i.platform === "slack");
  
//   const connectedCount = integrations.length > 0 ? 3 : 0; // Simplified for demo
//   const progress = connectedCount === 3 ? 100 : 0;

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500 relative">
      
//       {/* --- NEW PROJECT MODAL (The Popup) --- */}
//       <AnimatePresence>
//         {isModalOpen && (
//           <NewProjectModal 
//             onClose={() => setIsModalOpen(false)} 
//             onSuccess={() => {
//               setIsModalOpen(false);
//               fetchData(); // Refresh data after creating project
//             }} 
//           />
//         )}
//       </AnimatePresence>

//       {/* --- HEADER --- */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
//           <p className="text-slate-500 mt-1">System status and risk analysis.</p>
//         </div>
//         <div className="flex gap-3">
//           <Link href="/dashboard/integrations">
//             <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900">
//               <Zap className="w-4 h-4 mr-2 text-yellow-500" />
//               Manage Integrations
//             </Button>
//           </Link>
          
//           {/* <--- UPDATED BUTTON: Opens the Modal */}
//           <Button 
//             onClick={() => setIsModalOpen(true)}
//             className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
//           >
//             <Plus className="w-4 h-4 mr-2" />
//             New Project
//           </Button>
//         </div>
//       </div>

//       {/* --- STATS GRID --- */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <StatCard 
//           title="Risk Score" 
//           value="Low" 
//           sub="No critical incidents"
//           icon={<ShieldAlert className="text-emerald-500" />} 
//           trend="+2%"
//           trendUp={true}
//         />
//         <StatCard 
//           title="Active Integrations" 
//           value={`${connectedCount}/3`} 
//           sub={connectedCount === 0 ? "Setup required" : "Systems online"}
//           icon={<Zap className="text-blue-500" />} 
//         />
//         <StatCard 
//           title="Events Processed" 
//           value="0" 
//           sub="Waiting for webhooks..."
//           icon={<Activity className="text-purple-500" />} 
//         />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* --- MAIN FEED (Left 2/3) --- */}
//         <div className="lg:col-span-2 space-y-6">
//           <div className="flex items-center justify-between">
//             <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
//               <LayoutDashboard className="w-5 h-5 text-slate-400" />
//               Live Feed
//             </h2>
//           </div>

//           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[400px] p-6 relative overflow-hidden">
//             {integrations.length === 0 ? (
//               <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-[2px] z-10 p-8">
//                 <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
//                   <Terminal className="w-8 h-8 text-indigo-600" />
//                 </div>
//                 <h3 className="text-xl font-bold text-slate-900">Feed is quiet</h3>
//                 <p className="text-slate-500 max-w-sm mt-2 mb-6">
//                   Connect your tools to start ingesting data. Loop needs GitHub, Jira, or Slack to generate insights.
//                 </p>
//                 <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800">
//                   Connect Tools
//                 </Button>
//               </div>
//             ) : (
//                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
//                   <CheckCircle2 className="w-12 h-12 text-emerald-500/20" />
//                   <p>Listening for events...</p>
//                   <p className="text-xs">Trigger a webhook to see data here.</p>
//                </div>
//             )}
            
//             <div className="space-y-4 opacity-30 blur-[1px] pointer-events-none select-none">
//               <MockFeedItem />
//               <MockFeedItem />
//               <MockFeedItem />
//             </div>
//           </div>
//         </div>

//         {/* --- SETUP PROGRESS (Right 1/3) --- */}
//         <div className="space-y-6">
//            <h2 className="text-lg font-bold text-slate-900">System Health</h2>
//            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <span className="text-sm font-medium text-slate-500">Setup Progress</span>
//                 <span className="text-sm font-bold text-indigo-600">{progress}%</span>
//               </div>
//               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-8">
//                 <div 
//                   className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" 
//                   style={{ width: `${progress}%` }} 
//                 />
//               </div>
//               <div className="space-y-4">
//                 <SetupItem label="GitHub" connected={hasGithub} icon={<Github className="w-4 h-4" />} />
//                 <SetupItem label="Jira" connected={hasJira} icon={<Terminal className="w-4 h-4" />} />
//                 <SetupItem label="Slack" connected={hasSlack} icon={<Slack className="w-4 h-4" />} />
//               </div>
//            </div>
//         </div>

//       </div>
//     </div>
//   );
// }

// // --- NEW COMPONENT: THE FORM MODAL ---
// function NewProjectModal({ onClose, onSuccess }: any) {
//   const [formData, setFormData] = useState({
//     name: "My Loop Project",
//     repo_owner: "",
//     repo_name: "",
//     github_token: "",
//     jira_url: "",
//     jira_email: "",
//     jira_token: "",
//     slack_token: "",
//     slack_channel: ""
//   });
//   const [submitting, setSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       // Calls your new Backend API
//       await api.post("/onboarding/project", formData);
//       alert("✅ Project Created & Webhook Auto-Installed!");
//       onSuccess();
//     } catch (err: any) {
//       alert("❌ Setup Failed: " + (err.response?.data?.detail || err.message));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
//     >
//       <motion.div 
//         initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
//         className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
//       >
//         <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
//           <h2 className="text-xl font-bold text-slate-900">New Project Setup</h2>
//           <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
//         </div>
        
//         <form onSubmit={handleSubmit} className="p-6 space-y-6">
//           {/* GitHub Section */}
//           <div className="space-y-4">
//             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. GitHub Config</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <input 
//                 placeholder="GitHub Username (e.g. Ayushkaranth)" 
//                 className="p-2 border rounded-lg text-sm" 
//                 required 
//                 onChange={e => setFormData({...formData, repo_owner: e.target.value})}
//               />
//               <input 
//                 placeholder="Repo Name (e.g. assetflow)" 
//                 className="p-2 border rounded-lg text-sm" 
//                 required 
//                 onChange={e => setFormData({...formData, repo_name: e.target.value})}
//               />
//             </div>
//             <input 
//               placeholder="GitHub Personal Access Token (ghp_...)" 
//               type="password"
//               className="w-full p-2 border rounded-lg text-sm" 
//               required 
//               onChange={e => setFormData({...formData, github_token: e.target.value})}
//             />
//           </div>

//           <div className="h-px bg-slate-100" />

//           {/* Jira Section */}
//           <div className="space-y-4">
//             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Jira Config</h3>
//             <input 
//               placeholder="Jira URL (https://your-domain.atlassian.net)" 
//               className="w-full p-2 border rounded-lg text-sm" 
//               onChange={e => setFormData({...formData, jira_url: e.target.value})}
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <input 
//                 placeholder="Jira Email" 
//                 className="p-2 border rounded-lg text-sm" 
//                 onChange={e => setFormData({...formData, jira_email: e.target.value})}
//               />
//               <input 
//                 placeholder="Jira API Token" 
//                 type="password"
//                 className="p-2 border rounded-lg text-sm" 
//                 onChange={e => setFormData({...formData, jira_token: e.target.value})}
//               />
//             </div>
//           </div>

//           <div className="h-px bg-slate-100" />

//           {/* Slack Section */}
//           <div className="space-y-4">
//             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Slack Config</h3>
//             <div className="grid grid-cols-2 gap-4">
//                <input 
//                 placeholder="Bot Token (xoxb-...)" 
//                 type="password"
//                 className="p-2 border rounded-lg text-sm" 
//                 onChange={e => setFormData({...formData, slack_token: e.target.value})}
//               />
//               <input 
//                 placeholder="Channel Name (e.g. general)" 
//                 className="p-2 border rounded-lg text-sm" 
//                 onChange={e => setFormData({...formData, slack_channel: e.target.value})}
//               />
//             </div>
//           </div>

//           <div className="pt-4 flex justify-end gap-3">
//             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
//             <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
//               {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
//               {submitting ? "Installing..." : "Create Project & Auto-Install"}
//             </Button>
//           </div>
//         </form>
//       </motion.div>
//     </motion.div>
//   );
// }

// // --- SUBCOMPONENTS ---

// function StatCard({ title, value, sub, icon, trend, trendUp }: any) {
//   return (
//     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between mb-4">
//         <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
//           {icon}
//         </div>
//         {trend && (
//           <div className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'} bg-emerald-50 px-2 py-1 rounded-full`}>
//             {trend} <ArrowUpRight className="w-3 h-3 ml-1" />
//           </div>
//         )}
//       </div>
//       <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
//       <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
//       <p className="text-xs text-slate-400 mt-2">{sub}</p>
//     </div>
//   )
// }

// function SetupItem({ label, connected, icon }: any) {
//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <div className={`p-2 rounded-lg ${connected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
//           {icon}
//         </div>
//         {/* FIX: Changed closing tag from </div> to </span> */}
//         <span className={`text-sm font-medium ${connected ? 'text-slate-900' : 'text-slate-500'}`}>
//           {label}
//         </span>
//       </div>
//       {connected ? (
//         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
//       ) : (
//         <AlertCircle className="w-5 h-5 text-slate-300" />
//       )}
//     </div>
//   )
// }

// function MockFeedItem() {
//   return (
//     <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
//       <div className="w-10 h-10 rounded-full bg-slate-200" />
//       <div className="space-y-2 flex-1">
//         <div className="h-4 bg-slate-200 rounded w-1/3" />
//         <div className="h-3 bg-slate-200 rounded w-3/4" />
//       </div>
//     </div>
//   )
// }




"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Activity, AlertCircle, ArrowUpRight, CheckCircle2, Github, 
  LayoutDashboard, Loader2, Plus, ShieldAlert, Slack, Terminal, Zap, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboardData = async (orgId?: string) => {
    try {
      const projectsRes = await api.get("/organizations/list/all");
      const projectList = projectsRes.data;
      setProjects(projectList);

      // Select newest project if none picked
      const activeProject = orgId 
        ? projectList.find((p: any) => p._id === orgId)
        : projectList[projectList.length - 1];

      if (activeProject) {
        setCurrentOrg(activeProject);
        const scansRes = await api.get(`/organizations/${activeProject._id}/scans`);
        setScans(scansRes.data);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  const eventCount = scans.length;
  const avgRisk = eventCount > 0 ? (scans.reduce((acc, s) => acc + s.risk_score, 0) / eventCount).toFixed(1) : 0;

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 p-8">
      <AnimatePresence>
        {isModalOpen && <NewProjectModal onClose={() => setIsModalOpen(false)} onSuccess={() => loadDashboardData()} />}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{currentOrg?.name || "Overview"}</h1>
          <p className="text-slate-500">Monitoring: {currentOrg?.repo_name || "No Repo"}</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="border p-2 rounded-lg text-sm"
            value={currentOrg?._id}
            onChange={(e) => loadDashboardData(e.target.value)}
          >
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white"><Plus className="mr-2" /> New Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Risk Score" value={`${avgRisk}/10`} sub="AI Analysis" icon={<ShieldAlert className="text-red-500" />} />
        <StatCard title="Status" value="Active" sub="Engine Online" icon={<Zap className="text-blue-500" />} />
        <StatCard title="Events" value={eventCount.toString()} sub="PRs Scanned" icon={<Activity className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><LayoutDashboard /> Security Feed</h2>
          {scans.map((scan) => (
            <div key={scan._id} className="p-4 bg-white border rounded-xl flex gap-4 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scan.risk_score > 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {scan.risk_score > 5 ? <ShieldAlert /> : <CheckCircle2 />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between font-bold text-sm"><span>PR #{scan.pr_id} Analysis</span><span className="text-slate-400">{new Date(scan.timestamp).toLocaleTimeString()}</span></div>
                <p className="text-sm text-slate-600 mt-1">{scan.summary}</p>
                <div className="mt-3 flex gap-4 text-[10px] font-bold">
                  <span className="px-2 py-1 bg-slate-100 rounded">SCORE: {scan.risk_score}/10</span>
                  <a href={scan.pr_url} target="_blank" className="text-indigo-600 hover:underline">VIEW CODE <ArrowUpRight className="inline w-3 h-3" /></a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Health</h2>
          <div className="bg-white p-6 border rounded-2xl space-y-4">
            <SetupItem label="GitHub" connected={!!currentOrg?.settings?.github_access_token} icon={<Github className="w-4 h-4" />} />
            <SetupItem label="Jira" connected={!!currentOrg?.settings?.jira_api_token} icon={<Terminal className="w-4 h-4" />} />
            <SetupItem label="Slack" connected={!!currentOrg?.settings?.slack_bot_token} icon={<Slack className="w-4 h-4" />} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function StatCard({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function SetupItem({ label, connected, icon }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
        <span className={`text-sm font-medium ${connected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
      </div>
      {connected ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-300" />}
    </div>
  );
}

function NewProjectModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ name: "", repo_owner: "", repo_name: "", github_token: "", jira_url: "", jira_email: "", jira_token: "", slack_token: "", slack_channel: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Step 1: Hit Onboarding API
      await api.post("/onboarding/project", formData);
      alert("✅ Project Setup Successful! Webhook Installed.");
      onSuccess(); // Triggers close and refresh
    } catch (err: any) {
      console.error("Modal Submit Error:", err.response?.data || err.message);
      alert("❌ Setup Failed. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold">New Project Onboarding</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-600 uppercase">1. Project Info</h3>
            <input placeholder="Project Display Name" className="w-full p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="GitHub Owner" className="p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, repo_owner: e.target.value})} />
              <input placeholder="Repo Name" className="p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, repo_name: e.target.value})} />
            </div>
            <input placeholder="GitHub Token" type="password" className="w-full p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, github_token: e.target.value})} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-600 uppercase">2. Jira & Slack</h3>
            <input placeholder="Jira URL" className="w-full p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, jira_url: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Jira Email" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, jira_email: e.target.value})} />
              <input placeholder="Jira Token" type="password" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, jira_token: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Slack Bot Token" type="password" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, slack_token: e.target.value})} />
              <input placeholder="Slack Channel" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, slack_channel: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white" disabled={submitting}>
              {submitting ? "Launching..." : "Launch Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}