// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import api from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { 
//   Activity, AlertCircle, ArrowUpRight, CheckCircle2, Github, 
//   LayoutDashboard, Loader2, Plus, ShieldAlert, Slack, Terminal, Zap, X 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// export default function DashboardPage() {
//   const [loading, setLoading] = useState(true);
//   const [projects, setProjects] = useState<any[]>([]);
//   const [currentOrg, setCurrentOrg] = useState<any>(null);
//   const [scans, setScans] = useState<any[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const loadDashboardData = async (orgId?: string) => {
//     try {
//       const projectsRes = await api.get("/organizations/list/all");
//       const projectList = projectsRes.data;
//       setProjects(projectList);

//       // Select newest project if none picked
//       const activeProject = orgId 
//         ? projectList.find((p: any) => p._id === orgId)
//         : projectList[projectList.length - 1];

//       if (activeProject) {
//         setCurrentOrg(activeProject);
//         const scansRes = await api.get(`/organizations/${activeProject._id}/scans`);
//         setScans(scansRes.data);
//       }
//     } catch (e) {
//       console.error("Fetch error:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadDashboardData(); }, []);

//   const eventCount = scans.length;
//   const avgRisk = eventCount > 0 ? (scans.reduce((acc, s) => acc + s.risk_score, 0) / eventCount).toFixed(1) : 0;

//   if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

//   return (
//     <div className="space-y-8 p-8">
//       <AnimatePresence>
//         {isModalOpen && <NewProjectModal onClose={() => setIsModalOpen(false)} onSuccess={() => loadDashboardData()} />}
//       </AnimatePresence>

//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">{currentOrg?.name || "Overview"}</h1>
//           <p className="text-slate-500">Monitoring: {currentOrg?.repo_name || "No Repo"}</p>
//         </div>
//         <div className="flex gap-3">
//           <select 
//             className="border p-2 rounded-lg text-sm"
//             value={currentOrg?._id}
//             onChange={(e) => loadDashboardData(e.target.value)}
//           >
//             {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
//           </select>
//           <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white"><Plus className="mr-2" /> New Project</Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-6">
//         <StatCard title="Risk Score" value={`${avgRisk}/10`} sub="AI Analysis" icon={<ShieldAlert className="text-red-500" />} />
//         <StatCard title="Status" value="Active" sub="Engine Online" icon={<Zap className="text-blue-500" />} />
//         <StatCard title="Events" value={eventCount.toString()} sub="PRs Scanned" icon={<Activity className="text-purple-500" />} />
//       </div>

//       <div className="grid grid-cols-3 gap-8">
//         <div className="col-span-2 space-y-4">
//           <h2 className="text-lg font-bold flex items-center gap-2"><LayoutDashboard /> Security Feed</h2>
//           {scans.map((scan) => (
//             <div key={scan._id} className="p-4 bg-white border rounded-xl flex gap-4 shadow-sm">
//               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scan.risk_score > 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
//                 {scan.risk_score > 5 ? <ShieldAlert /> : <CheckCircle2 />}
//               </div>
//               <div className="flex-1">
//                 <div className="flex justify-between font-bold text-sm"><span>PR #{scan.pr_id} Analysis</span><span className="text-slate-400">{new Date(scan.timestamp).toLocaleTimeString()}</span></div>
//                 <p className="text-sm text-slate-600 mt-1">{scan.summary}</p>
//                 <div className="mt-3 flex gap-4 text-[10px] font-bold">
//                   <span className="px-2 py-1 bg-slate-100 rounded">SCORE: {scan.risk_score}/10</span>
//                   <a href={scan.pr_url} target="_blank" className="text-indigo-600 hover:underline">VIEW CODE <ArrowUpRight className="inline w-3 h-3" /></a>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
        
//         <div className="space-y-4">
//           <h2 className="text-lg font-bold">Health</h2>
//           <div className="bg-white p-6 border rounded-2xl space-y-4">
//             <SetupItem label="GitHub" connected={!!currentOrg?.settings?.github_access_token} icon={<Github className="w-4 h-4" />} />
//             <SetupItem label="Jira" connected={!!currentOrg?.settings?.jira_api_token} icon={<Terminal className="w-4 h-4" />} />
//             <SetupItem label="Slack" connected={!!currentOrg?.settings?.slack_bot_token} icon={<Slack className="w-4 h-4" />} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- SUBCOMPONENTS ---

// function StatCard({ title, value, sub, icon }: any) {
//   return (
//     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
//       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">{icon}</div>
//       <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
//       <p className="text-sm text-slate-500">{title}</p>
//       <p className="text-xs text-slate-400 mt-1">{sub}</p>
//     </div>
//   );
// }

// function SetupItem({ label, connected, icon }: any) {
//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <div className={`p-2 rounded-lg ${connected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
//         <span className={`text-sm font-medium ${connected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
//       </div>
//       {connected ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-300" />}
//     </div>
//   );
// }

// function NewProjectModal({ onClose, onSuccess }: any) {
//   const [formData, setFormData] = useState({ name: "", repo_owner: "", repo_name: "", github_token: "", jira_url: "", jira_email: "", jira_token: "", slack_token: "", slack_channel: "" });
//   const [submitting, setSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       // Step 1: Hit Onboarding API
//       await api.post("/onboarding/project", formData);
//       alert("✅ Project Setup Successful! Webhook Installed.");
//       onSuccess(); // Triggers close and refresh
//     } catch (err: any) {
//       console.error("Modal Submit Error:", err.response?.data || err.message);
//       alert("❌ Setup Failed. Check console for details.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
//           <h2 className="text-xl font-bold">New Project Onboarding</h2>
//           <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
//         </div>
//         <form onSubmit={handleSubmit} className="p-6 space-y-6">
//           <div className="space-y-4">
//             <h3 className="text-xs font-bold text-indigo-600 uppercase">1. Project Info</h3>
//             <input placeholder="Project Display Name" className="w-full p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, name: e.target.value})} />
//             <div className="grid grid-cols-2 gap-4">
//               <input placeholder="GitHub Owner" className="p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, repo_owner: e.target.value})} />
//               <input placeholder="Repo Name" className="p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, repo_name: e.target.value})} />
//             </div>
//             <input placeholder="GitHub Token" type="password" className="w-full p-2 border rounded-lg text-sm" required onChange={e => setFormData({...formData, github_token: e.target.value})} />
//           </div>
//           <div className="space-y-4">
//             <h3 className="text-xs font-bold text-indigo-600 uppercase">2. Jira & Slack</h3>
//             <input placeholder="Jira URL" className="w-full p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, jira_url: e.target.value})} />
//             <div className="grid grid-cols-2 gap-4">
//               <input placeholder="Jira Email" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, jira_email: e.target.value})} />
//               <input placeholder="Jira Token" type="password" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, jira_token: e.target.value})} />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <input placeholder="Slack Bot Token" type="password" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, slack_token: e.target.value})} />
//               <input placeholder="Slack Channel" className="p-2 border rounded-lg text-sm" onChange={e => setFormData({...formData, slack_channel: e.target.value})} />
//             </div>
//           </div>
//           <div className="flex justify-end gap-3 border-t pt-6">
//             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
//             <Button type="submit" className="bg-indigo-600 text-white" disabled={submitting}>
//               {submitting ? "Launching..." : "Launch Project"}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import api, { getUserFromToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Activity, AlertCircle, ArrowUpRight, CheckCircle2, Github, 
  LayoutDashboard, Loader2, Plus, ShieldAlert, Slack, Terminal, Zap, X, Bell, Users, ShieldCheck, Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboardData = async (orgId?: string) => {
    try {
      const userData = getUserFromToken();
      setUser(userData);

      const projectsRes = await api.get("/organizations/list/all");
      const projectList = projectsRes.data;
      setProjects(projectList);

      const activeProject = orgId 
        ? projectList.find((p: any) => p._id === orgId)
        : projectList[projectList.length - 1];

      if (activeProject) {
        setCurrentOrg(activeProject);
        const scansRes = await api.get(`/organizations/${activeProject._id}/scans`);
        setScans(scansRes.data);
      }

      const notifRes = await api.get("/notifications/my-notifications");
      setNotifications(notifRes.data);

    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <AnimatePresence>
        {isModalOpen && (
          <MasterOnboardingModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => loadDashboardData()} 
          />
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
              {user?.role || "user"} access
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{currentOrg?.name || "Overview"}</h1>
          <p className="text-slate-500 text-sm">Monitoring: {currentOrg?.repo_name || "No Repo"}</p>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell items={notifications} />
          
          <select 
            className="border p-2 rounded-lg text-sm bg-white"
            value={currentOrg?._id}
            onChange={(e) => loadDashboardData(e.target.value)}
          >
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          {/* HR ONLY ACTION */}
          {user?.role === "hr" && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Risk Level" value={scans.length > 0 ? "Analyzing" : "Safe"} icon={<ShieldCheck className="text-emerald-500" />} />
        <StatCard title="Team Active" value={currentOrg?.members?.length || "1"} sub="Users Assigned" icon={<Users className="text-blue-500" />} />
        <StatCard title="Total Scans" value={scans.length.toString()} sub="PR Activity" icon={<Activity className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Security Feed</h2>
          {scans.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed rounded-2xl text-slate-400">No scans detected.</div>
          ) : (
            scans.map((scan) => (
              <div key={scan._id} className="p-4 bg-white border rounded-xl flex gap-4 shadow-sm hover:border-indigo-200 transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${scan.risk_score > 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {scan.risk_score > 5 ? <ShieldAlert /> : <CheckCircle2 />}
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex justify-between font-bold">
                    <span>PR #{scan.pr_id}</span>
                    <span className="text-slate-400 font-normal">{new Date(scan.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{scan.summary}</p>
                  <a href={scan.pr_url} target="_blank" className="text-indigo-600 font-bold mt-2 block hover:underline">VIEW CODE <ArrowUpRight className="inline w-3 h-3" /></a>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Project Context</h2>
          <div className="bg-white p-6 border rounded-2xl space-y-4 shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager</p>
              <p className="text-sm font-semibold text-slate-900">
                {currentOrg?.manager_id ? `User_${currentOrg.manager_id.slice(-6)}` : "Unassigned"}
              </p>
            </div>
            <hr />
            <SetupItem label="GitHub" connected={!!currentOrg?.settings?.github_access_token} icon={<Github className="w-4 h-4" />} />
            <SetupItem label="Slack" connected={!!currentOrg?.settings?.slack_bot_token} icon={<Slack className="w-4 h-4" />} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MASTER MODAL: THE LAUNCHPAD ---

function MasterOnboardingModal({ onClose, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 1. STATE: Full payload including Jira and Team
  const [formData, setFormData] = useState({
    name: "",
    repo_owner: "",
    repo_name: "",
    github_token: "",
    slack_token: "",
    slack_channel: "", // Using Channel Name
    jira_url: "",
    jira_email: "",
    jira_token: "",
    manager_id: "",
    employee_ids: [] as string[]
  });

  // 2. FETCH USERS: Populate the dropdowns for Step 3
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/auth/users/list");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleLaunch = async () => {
    // Validation: Ensure team is assigned before launching
    if (!formData.manager_id || formData.employee_ids.length === 0) {
      alert("Please assign a Manager and at least one Employee.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/onboarding/master-onboard", formData);
      alert("🚀 Infrastructure Deployed! Team notified on Slack & Dashboard.");
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error("Launch Error:", e.response?.data || e.message);
      alert("Launch failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* PROGRESS TRACKER */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          <div className={`h-full bg-indigo-600 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="text-indigo-600 w-6 h-6" /> Project Launchpad
              </h2>
              <p className="text-sm text-slate-500">Step {step} of 3: {step === 1 ? 'Repo Access' : step === 2 ? 'Integrations' : 'Team Setup'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* STEP 1: REPOSITORY ACCESS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Github className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Repository Details</h3>
              </div>
              <input 
                placeholder="Project Name (e.g., NovaScan API)" 
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="GitHub Owner" 
                  className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.repo_owner}
                  onChange={e => setFormData({...formData, repo_owner: e.target.value})} 
                />
                <input 
                  placeholder="Repo Name" 
                  className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.repo_name}
                  onChange={e => setFormData({...formData, repo_name: e.target.value})} 
                />
              </div>
              <input 
                type="password" 
                placeholder="GitHub Personal Access Token" 
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.github_token}
                onChange={e => setFormData({...formData, github_token: e.target.value})} 
              />
            </div>
          )}

          {/* STEP 2: INTEGRATIONS (SLACK & JIRA) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {/* Slack Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <Slack className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Slack Notifications</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="password" 
                    placeholder="Bot Token (xoxb-...)" 
                    className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                    value={formData.slack_token}
                    onChange={e => setFormData({...formData, slack_token: e.target.value})} 
                  />
                  <input 
                    placeholder="Channel Name (e.g., alerts)" 
                    className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                    value={formData.slack_channel}
                    onChange={e => setFormData({...formData, slack_channel: e.target.value})} 
                  />
                </div>
              </div>

              {/* Jira Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Terminal className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Jira Tickets</h3>
                </div>
                <input 
                  placeholder="Jira Domain (company.atlassian.net)" 
                  className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.jira_url}
                  onChange={e => setFormData({...formData, jira_url: e.target.value})} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Jira Email" 
                    className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.jira_email}
                    onChange={e => setFormData({...formData, jira_email: e.target.value})} 
                  />
                  <input 
                    type="password" 
                    placeholder="Jira API Token" 
                    className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.jira_token}
                    onChange={e => setFormData({...formData, jira_token: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TEAM ASSIGNMENT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Users className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Assign Project Team</h3>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Project Manager</label>
                <select 
                  className="w-full p-3 border rounded-xl bg-slate-50 text-sm mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={formData.manager_id}
                  onChange={e => setFormData({...formData, manager_id: e.target.value})}
                >
                  <option value="">-- Select Manager --</option>
                  {users.filter(u => u.role === 'manager').map(u => (
                    <option key={u._id} value={u._id}>{u.email}</option>
                  ))}
                </select>
                {users.filter(u => u.role === 'manager').length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1 italic">* No managers found in database.</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Developers (Employees)</label>
                <div className="border rounded-xl p-4 mt-1 max-h-40 overflow-y-auto space-y-3 bg-slate-50">
                  {users.filter(u => u.role === 'employee').map(u => (
                    <label key={u._id} className="flex items-center gap-3 text-sm cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        onChange={e => {
                          const ids = e.target.checked 
                            ? [...formData.employee_ids, u._id] 
                            : formData.employee_ids.filter(id => id !== u._id);
                          setFormData({...formData, employee_ids: ids});
                        }} 
                      /> 
                      <span className="group-hover:text-emerald-600 transition-colors">{u.email}</span>
                    </label>
                  ))}
                  {users.filter(u => u.role === 'employee').length === 0 && (
                    <p className="text-xs text-slate-400 italic">No employees found.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
            <Button 
              variant="ghost" 
              className="text-slate-500 hover:bg-slate-50 px-6"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button 
              className="bg-indigo-600 text-white px-10 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              onClick={() => step < 3 ? setStep(step + 1) : handleLaunch()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                step === 3 ? 'Launch Infrastructure' : 'Continue'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function NotificationBell({ items }: { items: any[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = items.filter(i => !i.is_read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 border rounded-full bg-white hover:bg-slate-50 relative transition-colors">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{unreadCount}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-3 w-80 bg-white border rounded-2xl shadow-2xl z-[100] overflow-hidden">
            <div className="p-4 bg-slate-50 border-b font-bold text-sm flex justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && <span className="text-indigo-600 text-xs">{unreadCount} New</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? <div className="p-8 text-center text-xs text-slate-400 italic">No notifications</div> :
                items.map(item => (
                  <div key={item._id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer text-xs">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-slate-500 mt-1">{item.message}</p>
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{sub}</p>}
    </div>
  );
}

function SetupItem({ label, connected, icon }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
        <span className={`text-sm font-semibold ${connected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
      </div>
      {connected ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-300" />}
    </div>
  );
}