// "use client";

// import { useEffect, useState } from "react";
// import api, { getUserFromToken } from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { 
//   Activity, AlertCircle, ArrowUpRight, CheckCircle2, Github, 
//   LayoutDashboard, Loader2, Plus, ShieldAlert, Slack, Terminal, Zap, X, Bell, Users, ShieldCheck, Rocket
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// export default function DashboardPage() {
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState<any>(null);
//   const [projects, setProjects] = useState<any[]>([]);
//   const [currentOrg, setCurrentOrg] = useState<any>(null);
//   const [scans, setScans] = useState<any[]>([]);
//   const [notifications, setNotifications] = useState<any[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const loadDashboardData = async (orgId?: string) => {
//     try {
//       const userData = getUserFromToken();
//       setUser(userData);

//       const projectsRes = await api.get("/organizations/list/all");
//       const projectList = projectsRes.data;
//       setProjects(projectList);

//       const activeProject = orgId 
//         ? projectList.find((p: any) => p._id === orgId)
//         : projectList[projectList.length - 1];

//       if (activeProject) {
//         setCurrentOrg(activeProject);
//         const scansRes = await api.get(`/organizations/${activeProject._id}/scans`);
//         setScans(scansRes.data);
//       }

//       const notifRes = await api.get("/notifications/my-notifications");
//       setNotifications(notifRes.data);

//     } catch (e) {
//       console.error("Fetch error:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadDashboardData(); }, []);

//   if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

//   return (
//     <div className="space-y-8 p-8 max-w-7xl mx-auto">
//       <AnimatePresence>
//         {isModalOpen && (
//           <MasterOnboardingModal 
//             onClose={() => setIsModalOpen(false)} 
//             onSuccess={() => loadDashboardData()} 
//           />
//         )}
//       </AnimatePresence>

//       {/* HEADER SECTION */}
//       <div className="flex justify-between items-center">
//         <div>
//           <div className="flex items-center gap-2 mb-1">
//             <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
//               {user?.role || "user"} access
//             </span>
//           </div>
//           <h1 className="text-3xl font-bold text-slate-900">{currentOrg?.name || "Overview"}</h1>
//           <p className="text-slate-500 text-sm">Monitoring: {currentOrg?.repo_name || "No Repo"}</p>
//         </div>

//         <div className="flex items-center gap-4">
//           <NotificationBell items={notifications} />
          
//           <select 
//             className="border p-2 rounded-lg text-sm bg-white"
//             value={currentOrg?._id}
//             onChange={(e) => loadDashboardData(e.target.value)}
//           >
//             {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
//           </select>

//           {/* HR ONLY ACTION */}
//           {user?.role === "hr" && (
//             <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white shadow-lg shadow-indigo-200">
//               <Plus className="w-4 h-4 mr-2" /> New Project
//             </Button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <StatCard title="Risk Level" value={scans.length > 0 ? "Analyzing" : "Safe"} icon={<ShieldCheck className="text-emerald-500" />} />
//         <StatCard title="Team Active" value={currentOrg?.members?.length || "1"} sub="Users Assigned" icon={<Users className="text-blue-500" />} />
//         <StatCard title="Total Scans" value={scans.length.toString()} sub="PR Activity" icon={<Activity className="text-purple-500" />} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2 space-y-4">
//           <h2 className="text-lg font-bold flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> Security Feed</h2>
//           {scans.length === 0 ? (
//             <div className="p-12 text-center border-2 border-dashed rounded-2xl text-slate-400">No scans detected.</div>
//           ) : (
//             scans.map((scan) => (
//               <div key={scan._id} className="p-4 bg-white border rounded-xl flex gap-4 shadow-sm hover:border-indigo-200 transition-all">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${scan.risk_score > 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
//                   {scan.risk_score > 5 ? <ShieldAlert /> : <CheckCircle2 />}
//                 </div>
//                 <div className="flex-1 text-sm">
//                   <div className="flex justify-between font-bold">
//                     <span>PR #{scan.pr_id}</span>
//                     <span className="text-slate-400 font-normal">{new Date(scan.timestamp).toLocaleTimeString()}</span>
//                   </div>
//                   <p className="text-slate-600 mt-1">{scan.summary}</p>
//                   <a href={scan.pr_url} target="_blank" className="text-indigo-600 font-bold mt-2 block hover:underline">VIEW CODE <ArrowUpRight className="inline w-3 h-3" /></a>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
        
//         <div className="space-y-4">
//           <h2 className="text-lg font-bold">Project Context</h2>
//           <div className="bg-white p-6 border rounded-2xl space-y-4 shadow-sm">
//             <div>
//               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager</p>
//               <p className="text-sm font-semibold text-slate-900">
//                 {currentOrg?.manager_id ? `User_${currentOrg.manager_id.slice(-6)}` : "Unassigned"}
//               </p>
//             </div>
//             <hr />
//             <SetupItem label="GitHub" connected={!!currentOrg?.settings?.github_access_token} icon={<Github className="w-4 h-4" />} />
//             <SetupItem label="Slack" connected={!!currentOrg?.settings?.slack_bot_token} icon={<Slack className="w-4 h-4" />} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- MASTER MODAL: THE LAUNCHPAD ---

// function MasterOnboardingModal({ onClose, onSuccess }: any) {
//   const [step, setStep] = useState(1);
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   // 1. STATE: Full payload including Jira and Team
//   const [formData, setFormData] = useState({
//     name: "",
//     repo_owner: "",
//     repo_name: "",
//     github_token: "",
//     slack_token: "",
//     slack_channel: "", // Using Channel Name
//     jira_url: "",
//     jira_email: "",
//     jira_token: "",
//     manager_id: "",
//     employee_ids: [] as string[]
//   });

//   // 2. FETCH USERS: Populate the dropdowns for Step 3
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await api.get("/auth/users/list");
//         setUsers(res.data);
//       } catch (err) {
//         console.error("Failed to fetch users:", err);
//       }
//     };
//     fetchUsers();
//   }, []);

//   const handleLaunch = async () => {
//     // Validation: Ensure team is assigned before launching
//     if (!formData.manager_id || formData.employee_ids.length === 0) {
//       alert("Please assign a Manager and at least one Employee.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await api.post("/onboarding/master-onboard", formData);
//       alert("🚀 Infrastructure Deployed! Team notified on Slack & Dashboard.");
//       onSuccess();
//       onClose();
//     } catch (e: any) {
//       console.error("Launch Error:", e.response?.data || e.message);
//       alert("Launch failed. Check console for details.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <motion.div 
//         initial={{ opacity: 0, scale: 0.95 }} 
//         animate={{ opacity: 1, scale: 1 }} 
//         className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
//       >
//         {/* PROGRESS TRACKER */}
//         <div className="h-1.5 w-full bg-slate-100 flex">
//           <div className={`h-full bg-indigo-600 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
//         </div>

//         <div className="p-8">
//           <div className="flex justify-between items-center mb-8">
//             <div>
//               <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
//                 <Rocket className="text-indigo-600 w-6 h-6" /> Project Launchpad
//               </h2>
//               <p className="text-sm text-slate-500">Step {step} of 3: {step === 1 ? 'Repo Access' : step === 2 ? 'Integrations' : 'Team Setup'}</p>
//             </div>
//             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
//               <X className="w-5 h-5 text-slate-400" />
//             </button>
//           </div>

//           {/* STEP 1: REPOSITORY ACCESS */}
//           {step === 1 && (
//             <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
//               <div className="flex items-center gap-2 text-indigo-600 mb-2">
//                 <Github className="w-4 h-4" />
//                 <h3 className="text-xs font-bold uppercase tracking-widest">Repository Details</h3>
//               </div>
//               <input 
//                 placeholder="Project Name (e.g., NovaScan API)" 
//                 className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
//                 value={formData.name}
//                 onChange={e => setFormData({...formData, name: e.target.value})} 
//               />
//               <div className="grid grid-cols-2 gap-4">
//                 <input 
//                   placeholder="GitHub Owner" 
//                   className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
//                   value={formData.repo_owner}
//                   onChange={e => setFormData({...formData, repo_owner: e.target.value})} 
//                 />
//                 <input 
//                   placeholder="Repo Name" 
//                   className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
//                   value={formData.repo_name}
//                   onChange={e => setFormData({...formData, repo_name: e.target.value})} 
//                 />
//               </div>
//               <input 
//                 type="password" 
//                 placeholder="GitHub Personal Access Token" 
//                 className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
//                 value={formData.github_token}
//                 onChange={e => setFormData({...formData, github_token: e.target.value})} 
//               />
//             </div>
//           )}

//           {/* STEP 2: INTEGRATIONS (SLACK & JIRA) */}
//           {step === 2 && (
//             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
//               {/* Slack Section */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 text-purple-600">
//                   <Slack className="w-4 h-4" />
//                   <h3 className="text-xs font-bold uppercase tracking-widest">Slack Notifications</h3>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <input 
//                     type="password" 
//                     placeholder="Bot Token (xoxb-...)" 
//                     className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
//                     value={formData.slack_token}
//                     onChange={e => setFormData({...formData, slack_token: e.target.value})} 
//                   />
//                   <input 
//                     placeholder="Channel Name (e.g., alerts)" 
//                     className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
//                     value={formData.slack_channel}
//                     onChange={e => setFormData({...formData, slack_channel: e.target.value})} 
//                   />
//                 </div>
//               </div>

//               {/* Jira Section */}
//               <div className="space-y-3 pt-2">
//                 <div className="flex items-center gap-2 text-blue-600">
//                   <Terminal className="w-4 h-4" />
//                   <h3 className="text-xs font-bold uppercase tracking-widest">Jira Tickets</h3>
//                 </div>
//                 <input 
//                   placeholder="Jira Domain (company.atlassian.net)" 
//                   className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
//                   value={formData.jira_url}
//                   onChange={e => setFormData({...formData, jira_url: e.target.value})} 
//                 />
//                 <div className="grid grid-cols-2 gap-4">
//                   <input 
//                     placeholder="Jira Email" 
//                     className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
//                     value={formData.jira_email}
//                     onChange={e => setFormData({...formData, jira_email: e.target.value})} 
//                   />
//                   <input 
//                     type="password" 
//                     placeholder="Jira API Token" 
//                     className="p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
//                     value={formData.jira_token}
//                     onChange={e => setFormData({...formData, jira_token: e.target.value})} 
//                   />
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 3: TEAM ASSIGNMENT */}
//           {step === 3 && (
//             <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
//               <div className="flex items-center gap-2 text-emerald-600 mb-2">
//                 <Users className="w-4 h-4" />
//                 <h3 className="text-xs font-bold uppercase tracking-widest">Assign Project Team</h3>
//               </div>

//               <div>
//                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Project Manager</label>
//                 <select 
//                   className="w-full p-3 border rounded-xl bg-slate-50 text-sm mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" 
//                   value={formData.manager_id}
//                   onChange={e => setFormData({...formData, manager_id: e.target.value})}
//                 >
//                   <option value="">-- Select Manager --</option>
//                   {users.filter(u => u.role === 'manager').map(u => (
//                     <option key={u._id} value={u._id}>{u.email}</option>
//                   ))}
//                 </select>
//                 {users.filter(u => u.role === 'manager').length === 0 && (
//                   <p className="text-[10px] text-red-500 mt-1 italic">* No managers found in database.</p>
//                 )}
//               </div>

//               <div>
//                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Developers (Employees)</label>
//                 <div className="border rounded-xl p-4 mt-1 max-h-40 overflow-y-auto space-y-3 bg-slate-50">
//                   {users.filter(u => u.role === 'employee').map(u => (
//                     <label key={u._id} className="flex items-center gap-3 text-sm cursor-pointer group">
//                       <input 
//                         type="checkbox" 
//                         className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
//                         onChange={e => {
//                           const ids = e.target.checked 
//                             ? [...formData.employee_ids, u._id] 
//                             : formData.employee_ids.filter(id => id !== u._id);
//                           setFormData({...formData, employee_ids: ids});
//                         }} 
//                       /> 
//                       <span className="group-hover:text-emerald-600 transition-colors">{u.email}</span>
//                     </label>
//                   ))}
//                   {users.filter(u => u.role === 'employee').length === 0 && (
//                     <p className="text-xs text-slate-400 italic">No employees found.</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
//             <Button 
//               variant="ghost" 
//               className="text-slate-500 hover:bg-slate-50 px-6"
//               onClick={() => step > 1 ? setStep(step - 1) : onClose()}
//             >
//               {step === 1 ? 'Cancel' : 'Back'}
//             </Button>
//             <Button 
//               className="bg-indigo-600 text-white px-10 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
//               onClick={() => step < 3 ? setStep(step + 1) : handleLaunch()}
//               disabled={loading}
//             >
//               {loading ? (
//                 <Loader2 className="animate-spin w-4 h-4 mr-2" />
//               ) : (
//                 step === 3 ? 'Launch Infrastructure' : 'Continue'
//               )}
//             </Button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // --- HELPER COMPONENTS ---

// function NotificationBell({ items }: { items: any[] }) {
//   const [open, setOpen] = useState(false);
//   const unreadCount = items.filter(i => !i.is_read).length;

//   return (
//     <div className="relative">
//       <button onClick={() => setOpen(!open)} className="p-2 border rounded-full bg-white hover:bg-slate-50 relative transition-colors">
//         <Bell className="w-5 h-5 text-slate-600" />
//         {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{unreadCount}</span>}
//       </button>
//       <AnimatePresence>
//         {open && (
//           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-3 w-80 bg-white border rounded-2xl shadow-2xl z-[100] overflow-hidden">
//             <div className="p-4 bg-slate-50 border-b font-bold text-sm flex justify-between">
//               <span>Notifications</span>
//               {unreadCount > 0 && <span className="text-indigo-600 text-xs">{unreadCount} New</span>}
//             </div>
//             <div className="max-h-80 overflow-y-auto">
//               {items.length === 0 ? <div className="p-8 text-center text-xs text-slate-400 italic">No notifications</div> :
//                 items.map(item => (
//                   <div key={item._id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer text-xs">
//                     <p className="font-bold text-slate-900">{item.title}</p>
//                     <p className="text-slate-500 mt-1">{item.message}</p>
//                   </div>
//                 ))
//               }
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// function StatCard({ title, value, sub, icon }: any) {
//   return (
//     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
//       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">{icon}</div>
//       <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
//       <p className="text-sm text-slate-500 font-medium">{title}</p>
//       {sub && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{sub}</p>}
//     </div>
//   );
// }

// function SetupItem({ label, connected, icon }: any) {
//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex items-center gap-3">
//         <div className={`p-2 rounded-lg ${connected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
//         <span className={`text-sm font-semibold ${connected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
//       </div>
//       {connected ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-300" />}
//     </div>
//   );
// }




"use client";

import { useEffect, useState, useMemo } from "react";
import api, { getUserFromToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Activity, ArrowUpRight, CheckCircle2, Github, 
  LayoutDashboard, Loader2, Plus, ShieldAlert, Slack, Terminal, Zap, X, Bell, Users, ShieldCheck, Rocket, ChevronDown, Search, BarChart3, PieChart as PieChartIcon, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- DATA PROCESSING FOR GRAPHS ---
  const chartData = useMemo(() => {
    if (!scans.length) return { trend: [], distribution: [] };

    // 1. Trend Data (Reverse to show oldest to newest)
    const trend = [...scans].reverse().map((scan, i) => ({
      name: `PR #${scan.pr_id}`,
      risk: scan.risk_score,
      date: new Date(scan.timestamp).toLocaleDateString()
    }));

    // 2. Distribution Data
    const distribution = [
      { name: 'Critical', value: scans.filter(s => s.risk_score > 7).length, color: '#ef4444' }, // Red-500
      { name: 'Warning', value: scans.filter(s => s.risk_score > 4 && s.risk_score <= 7).length, color: '#f97316' }, // Orange-500
      { name: 'Safe', value: scans.filter(s => s.risk_score <= 4).length, color: '#10b981' }, // Emerald-500
    ].filter(d => d.value > 0);

    return { trend, distribution };
  }, [scans]);

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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        <AnimatePresence>
          {isModalOpen && (
            <MasterOnboardingModal 
              onClose={() => setIsModalOpen(false)} 
              onSuccess={() => loadDashboardData()} 
            />
          )}
        </AnimatePresence>

        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user?.role === 'hr' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                {user?.role === 'hr' ? 'Admin Workspace' : 'Developer Workspace'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{currentOrg?.name || "Dashboard"}</h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Github className="w-4 h-4" />
              <span>{currentOrg?.repo_name || "No Repository Linked"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <NotificationBell items={notifications} />
            
            <div className="relative group">
              <select 
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer outline-none min-w-[200px]"
                value={currentOrg?._id}
                onChange={(e) => loadDashboardData(e.target.value)}
              >
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>

            {user?.role === "hr" && (
              <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 rounded-xl px-5 transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            )}
          </div>
        </motion.div>

        {/* STATS GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Current Risk Status" 
              value={scans.length > 0 ? "Active Monitoring" : "System Idle"} 
              sub={scans.some(s => s.risk_score > 7) ? "Critical Vulnerabilities" : "System Secure"}
              status={scans.some(s => s.risk_score > 7) ? "danger" : "safe"}
              icon={<ShieldCheck className="w-6 h-6" />} 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Development Team" 
              value={currentOrg?.members?.length || "0"} 
              sub="Active Contributors" 
              status="neutral"
              icon={<Users className="w-6 h-6" />} 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Total Scans Run" 
              value={scans.length.toString()} 
              sub="Pull Requests Analyzed" 
              status="info"
              icon={<Activity className="w-6 h-6" />} 
            />
          </motion.div>
        </motion.div>

        {/* ANALYTICS ROW (NEW) */}
        {scans.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Chart 1: Risk Trend */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Risk Trend Analysis
                  </h3>
                  <p className="text-sm text-slate-500">Risk score fluctuation over the last {scans.length} scans.</p>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.trend}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="risk" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRisk)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Severity Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <PieChartIcon className="w-5 h-5 text-indigo-500" />
                Severity Breakdown
              </h3>
              <p className="text-sm text-slate-500 mb-4">Distribution of risk levels across all scans.</p>
              
              <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.distribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: 'none' }}
                       itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-900">{scans.length}</span>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-4">
                {chartData.distribution.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-medium text-slate-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SECURITY FEED */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <LayoutDashboard className="w-5 h-5" /> 
                </div>
                Live Security Feed
              </h2>
              {scans.length > 0 && (
                <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live
                </span>
              )}
            </div>

            {scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Zap className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Scans Detected</h3>
                <p className="text-slate-500 max-w-xs mt-2">Create a Pull Request in your connected repository to trigger the first security analysis.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scans.map((scan, idx) => (
                  <motion.div 
                    key={scan._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative p-5 bg-white border rounded-2xl flex flex-col md:flex-row gap-5 shadow-sm hover:shadow-md transition-all ${
                      scan.risk_score > 5 ? 'border-red-100' : 'border-slate-100'
                    }`}
                  >
                    {/* Status Indicator Stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                      scan.risk_score > 7 ? 'bg-red-500' : scan.risk_score > 4 ? 'bg-orange-400' : 'bg-emerald-500'
                    }`} />

                    <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        scan.risk_score > 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {scan.risk_score > 5 ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-slate-900">PR #{scan.pr_id}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                             scan.risk_score > 7 ? 'bg-red-100 text-red-700' : scan.risk_score > 4 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Risk Score: {scan.risk_score}/10
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{new Date(scan.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">{scan.summary}</p>
                      
                      <div className="flex items-center gap-4">
                        <a 
                          href={scan.pr_url} 
                          target="_blank" 
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline decoration-2 underline-offset-4 transition-colors"
                        >
                          VIEW CODE ANALYSIS <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* PROJECT CONTEXT SIDEBAR */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900">Project Context</h2>
            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6 sticky top-8">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
                  {currentOrg?.name?.substring(0,2).toUpperCase() || "PR"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Manager</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {currentOrg?.manager_id ? `User_${currentOrg.manager_id.slice(-6)}` : "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />
              
              <div className="space-y-4">
                <SetupItem label="GitHub Repo" connected={!!currentOrg?.settings?.github_access_token} icon={<Github className="w-4 h-4" />} />
                <SetupItem label="Slack Channel" connected={!!currentOrg?.settings?.slack_bot_token} icon={<Slack className="w-4 h-4" />} />
                <SetupItem label="Jira Board" connected={!!currentOrg?.settings?.jira_url} icon={<Terminal className="w-4 h-4" />} />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">System Status:</span> Webhooks are active. AI Analysis engine is online and monitoring pull requests.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 max-w-7xl mx-auto space-y-8">
      <div className="h-24 bg-white rounded-3xl animate-pulse" />
      <div className="grid grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse" />)}
      </div>
      <div className="h-96 bg-white rounded-3xl animate-pulse" />
    </div>
  )
}

function StatCard({ title, value, sub, status, icon }: any) {
  const statusColors = {
    safe: "bg-emerald-50 text-emerald-600 border-emerald-100",
    danger: "bg-red-50 text-red-600 border-red-100",
    neutral: "bg-blue-50 text-blue-600 border-blue-100",
    info: "bg-purple-50 text-purple-600 border-purple-100"
  };

  const currentStyle = statusColors[status as keyof typeof statusColors] || statusColors.neutral;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl border ${currentStyle} bg-opacity-50`}>
          {icon}
        </div>
        {status === 'danger' && <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-100"></span>}
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {sub && (
          <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// (Re-use your NotificationBell, SetupItem, and MasterOnboardingModal exactly as before, 
// they fit perfectly with this new style. I omitted them here for brevity but you should keep them.)

function NotificationBell({ items }: { items: any[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = items.filter(i => !i.is_read).length;

  return (
    <div className="relative z-20">
      <button 
        onClick={() => setOpen(!open)} 
        className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-96 bg-white border border-slate-100 rounded-2xl shadow-2xl ring-1 ring-black/5 z-20 overflow-hidden origin-top-right"
            >
              <div className="p-4 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 font-bold text-sm flex justify-between items-center sticky top-0">
                <span className="text-slate-900">Notifications</span>
                {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{unreadCount} New</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 opacity-20" />
                    <span className="text-xs font-medium">All caught up!</span>
                  </div>
                ) : items.map((item) => (
                  <div key={item._id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{item.title}</p>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.message}</p>
                        <p className="text-[10px] text-slate-300 mt-2 font-medium">Just now</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SetupItem({ label, connected, icon }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl transition-colors ${connected ? 'bg-slate-900 text-white shadow-md shadow-slate-200' : 'bg-slate-100 text-slate-400'}`}>
          {icon}
        </div>
        <span className={`text-sm font-bold transition-colors ${connected ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className={`transition-all duration-300 ${connected ? 'opacity-100 scale-100' : 'opacity-50 scale-90'}`}>
        {connected ? <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-sm" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-dashed" />}
      </div>
    </div>
  );
}

// ... Insert MasterOnboardingModal code here (keep it the same as before) ...
function MasterOnboardingModal({ onClose, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    repo_owner: "",
    repo_name: "",
    github_token: "",
    slack_token: "",
    slack_channel: "",
    jira_url: "",
    jira_email: "",
    jira_token: "",
    manager_id: "",
    employee_ids: [] as string[]
  });

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
    if (!formData.manager_id || formData.employee_ids.length === 0) {
      alert("Please assign a Manager and at least one Employee.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/onboarding/master-onboard", formData);
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error("Launch Error:", e.response?.data || e.message);
      alert("Launch failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Progress */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
           <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Rocket className="text-indigo-600 w-6 h-6" /> 
                Launch New Project
              </h2>
              <p className="text-sm text-slate-500 mt-1">Configure your integrations and team structure.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Custom Stepper */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${s <= step ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {s === 1 ? 'Repo' : s === 2 ? 'Integrations' : 'Team'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {/* STEP 1: REPOSITORY ACCESS */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-700 text-sm mb-6">
                <Github className="w-5 h-5 shrink-0" />
                <p>We need access to your GitHub repository to install webhooks for automated scanning.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase ml-1">Project Name</label>
                  <input 
                    placeholder="e.g. Backend API Service" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase ml-1">GitHub Owner</label>
                    <input 
                      placeholder="Username/Org" 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.repo_owner}
                      onChange={e => setFormData({...formData, repo_owner: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase ml-1">Repo Name</label>
                    <input 
                      placeholder="Repository" 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                      value={formData.repo_name}
                      onChange={e => setFormData({...formData, repo_name: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase ml-1">Personal Access Token</label>
                  <input 
                    type="password" 
                    placeholder="ghp_xxxxxxxxxxxx" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono" 
                    value={formData.github_token}
                    onChange={e => setFormData({...formData, github_token: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTEGRATIONS */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
              {/* Slack Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                    <Slack className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Slack Alerts</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="password" 
                    placeholder="Bot Token (xoxb-...)" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
                    value={formData.slack_token}
                    onChange={e => setFormData({...formData, slack_token: e.target.value})} 
                  />
                  <input 
                    placeholder="#alerts-channel" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
                    value={formData.slack_channel}
                    onChange={e => setFormData({...formData, slack_channel: e.target.value})} 
                  />
                </div>
              </div>

              {/* Jira Section */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Jira Ticket Creation</h3>
                </div>
                <div className="space-y-4">
                  <input 
                    placeholder="Jira Domain (company.atlassian.net)" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    value={formData.jira_url}
                    onChange={e => setFormData({...formData, jira_url: e.target.value})} 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Jira Account Email" 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      value={formData.jira_email}
                      onChange={e => setFormData({...formData, jira_email: e.target.value})} 
                    />
                    <input 
                      type="password" 
                      placeholder="Jira API Token" 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      value={formData.jira_token}
                      onChange={e => setFormData({...formData, jira_token: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TEAM */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-emerald-700 text-sm">
                <Users className="w-5 h-5 shrink-0" />
                <p>Assigning a team ensures alerts are routed to the right people via email and Slack.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Project Manager</label>
                <div className="relative mt-1">
                  <select 
                    className="w-full p-3.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer" 
                    value={formData.manager_id}
                    onChange={e => setFormData({...formData, manager_id: e.target.value})}
                  >
                    <option value="">Select a Manager...</option>
                    {users.filter(u => u.role === 'manager').map(u => (
                      <option key={u._id} value={u._id}>{u.email} ({u.full_name || 'User'})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase ml-1">Development Team</label>
                  <span className="text-xs text-slate-400">{formData.employee_ids.length} selected</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-2 border-b border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input placeholder="Filter developers..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-white">
                    {users.filter(u => u.role === 'employee').map(u => (
                      <label key={u._id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${formData.employee_ids.includes(u._id) ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.employee_ids.includes(u._id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                          {formData.employee_ids.includes(u._id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={formData.employee_ids.includes(u._id)}
                          onChange={e => {
                            const ids = e.target.checked 
                              ? [...formData.employee_ids, u._id] 
                              : formData.employee_ids.filter(id => id !== u._id);
                            setFormData({...formData, employee_ids: ids});
                          }} 
                        /> 
                        <span className={`text-sm ${formData.employee_ids.includes(u._id) ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>{u.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-lg shadow-indigo-200 rounded-xl transition-all"
            onClick={() => step < 3 ? setStep(step + 1) : handleLaunch()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              step === 3 ? <span className="flex items-center gap-2"><Rocket className="w-4 h-4" /> Launch Project</span> : 'Continue'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}