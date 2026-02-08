"use client";

import { useEffect, useState } from "react";
import api, { getUserFromToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Save, Trash2, Github, Slack, Terminal, Users, ShieldAlert, 
  Loader2, Key, Building2, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("integrations");
  
  const [projects, setProjects] = useState<any[]>([]);
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    github_token: "",
    slack_token: "",
    slack_channel: "",
    jira_url: "",
    jira_email: "",
    jira_token: "",
    notion_token: "",       // <--- NEW
    notion_database_id: ""  // <--- NEW
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userData = getUserFromToken();
      setUser(userData);

      const res = await api.get("/organizations/list/all");
      setProjects(res.data);

      if (res.data.length > 0) {
        selectProjectToEdit(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectProjectToEdit = (org: any) => {
    setCurrentOrg(org);
    setFormData({
      name: org.name,
      github_token: org.settings?.github_access_token || "",
      slack_token: org.settings?.slack_bot_token || "",
      slack_channel: org.settings?.slack_channel || "",
      jira_url: org.settings?.jira_url || "",
      jira_email: org.settings?.jira_email || "",
      jira_token: org.settings?.jira_api_token || "",
      notion_token: org.settings?.notion_token || "",             // <--- NEW
      notion_database_id: org.settings?.notion_database_id || ""  // <--- NEW
    });
  };

  const handleSave = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      await api.put(`/organizations/${currentOrg._id}/settings`, formData);
      alert("Settings saved successfully!");
      loadSettings();
    } catch (e) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (orgId: string, orgName: string) => {
    const confirm = window.confirm(`⚠️ DANGER: Are you sure you want to delete "${orgName}"?\n\nThis action cannot be undone.`);
    if (confirm) {
      try {
        await api.delete(`/organizations/${orgId}`);
        setProjects(projects.filter(p => p._id !== orgId));
        if (currentOrg?._id === orgId) setCurrentOrg(null);
        alert(`Project "${orgName}" deleted.`);
      } catch (e) {
        alert("Failed to delete project.");
      }
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage configurations for <span className="font-bold text-slate-900">{currentOrg?.name || "your projects"}</span></p>
        </div>
        
        {activeTab !== 'danger' && currentOrg && (
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-6">
            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {['integrations', 'team', 'danger'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 ${
              activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'danger' ? 'Danger Zone' : `${tab}`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {activeTab === 'integrations' && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                <Building2 className="text-slate-400 w-5 h-5" />
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Editing Integrations For:</label>
                  <select 
                    className="w-full bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                    value={currentOrg?._id || ""}
                    onChange={(e) => {
                      const selected = projects.find(p => p._id === e.target.value);
                      if (selected) selectProjectToEdit(selected);
                    }}
                  >
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* GitHub */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-slate-100 rounded-lg"><Github className="w-5 h-5" /></div>
                  <h3 className="font-bold">GitHub Configuration</h3>
                </div>
                <div className="pl-12">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Personal Access Token</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="password" className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono" value={formData.github_token} onChange={(e) => setFormData({...formData, github_token: e.target.value})} />
                      </div>
                   </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Slack */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Slack className="w-5 h-5" /></div>
                  <h3 className="font-bold">Slack Alerts</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-12">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Bot User OAuth Token</label>
                      <input type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-mono" value={formData.slack_token} onChange={(e) => setFormData({...formData, slack_token: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Target Channel</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" value={formData.slack_channel} onChange={(e) => setFormData({...formData, slack_channel: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Jira */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Terminal className="w-5 h-5" /></div>
                  <h3 className="font-bold">Jira Integration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-12">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Jira Domain URL</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={formData.jira_url} onChange={(e) => setFormData({...formData, jira_url: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">API Token</label>
                      <input type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono" value={formData.jira_token} onChange={(e) => setFormData({...formData, jira_token: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Notion (NEW) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                  <h3 className="font-bold">Notion Integration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-12">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Integration Token</label>
                      <input type="password" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-500/20 outline-none transition-all font-mono" placeholder="secret_..." value={formData.notion_token} onChange={(e) => setFormData({...formData, notion_token: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Database ID</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-500/20 outline-none transition-all font-mono" placeholder="32-char ID" value={formData.notion_database_id} onChange={(e) => setFormData({...formData, notion_database_id: e.target.value})} />
                   </div>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm">
                <Users className="w-5 h-5 shrink-0" />
                <p>Team management is handled via the Master Onboarding flow. View-only mode active.</p>
              </div>
              {currentOrg ? (
                <div className="space-y-4">
                   <div className="flex justify-between items-center"><h3 className="font-bold text-slate-900">Members of {currentOrg.name}</h3><span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{currentOrg.members.length} Users</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentOrg.members.map((memberId: string) => (
                      <div key={memberId} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">U</div>
                        <div><p className="text-sm font-bold text-slate-900">User_{memberId.slice(-6)}</p><p className="text-xs text-slate-500 font-mono">ID: {memberId}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-center text-slate-400">No project selected.</p>}
            </motion.div>
          )}

          {activeTab === 'danger' && (
             <motion.div key="danger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-xl">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Global Project Management</h3>
                <p className="text-sm text-red-700/80 mt-1">Actions here are irreversible.</p>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Active Projects</h3>
                <div className="grid grid-cols-1 gap-4">
                  {projects.map((proj) => (
                    <div key={proj._id} className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white hover:border-red-200 transition-all group">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{proj.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500"><span className="flex items-center gap-1"><Github className="w-3 h-3" /> {proj.repo_name}</span></div>
                      </div>
                      <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all" onClick={() => handleDeleteProject(proj._id, proj.name)}><Trash2 className="w-4 h-4 mr-2" /> Delete Project</Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}