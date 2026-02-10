'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  ArrowLeft, Github, Slack, Database, Trello, 
  Check, User as UserIcon, Shield 
} from 'lucide-react';

export default function MasterOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]); // All Org Members
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    repo_owner: '',
    repo_name: '',
    github_token: '',
    manager_id: '',
    employee_ids: [] as string[], // Array for Multi-Select
    slack_token: '',
    slack_channel: '',
    jira_url: '',
    jira_email: '',
    jira_token: '',
    notion_token: '',
    notion_database_id: ''
  });

  // 1. Fetch Members on Load
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/organizations/members/list');
        setMembers(res.data.members);
      } catch (err) {
        console.error("Failed to fetch team members", err);
      }
    };
    fetchMembers();
  }, []);

  // --- 🔴 FIXED FILTERING LOGIC ---
  // Managers List: Includes 'manager' AND 'admin' (HR)
  const managersList = members.filter(m => m.role === 'manager' || m.role === 'admin');
  
  // Employees List: Strictly includes ONLY 'employee' role
  const employeesList = members.filter(m => m.role === 'employee'); 
  // --------------------------------

  // Handle Text Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Employee Checkbox Toggle
  const toggleEmployee = (id: string) => {
    setFormData(prev => {
      const exists = prev.employee_ids.includes(id);
      return {
        ...prev,
        employee_ids: exists 
          ? prev.employee_ids.filter(e => e !== id) 
          : [...prev.employee_ids, id]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/onboarding/master-onboard', formData);
      alert('Project Onboarded Successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Onboarding Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">🚀 New Project Onboarding</h1>
            <p className="text-blue-100 mt-2">Configure repo, assign team, and link integrations.</p>
          </div>

          <div className="p-8 space-y-10">
            
            {/* === 1. PROJECT DETAILS === */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 h-6 w-6 rounded-full flex items-center justify-center text-sm mr-2">1</span>
                Project & GitHub
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input name="name" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. AI Mobile App" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repo Owner</label>
                    <input name="repo_owner" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="github-username" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repo Name</label>
                    <input name="repo_name" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="repo-name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GitHub Token</label>
                  <input name="github_token" type="password" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="ghp_..." />
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* === 2. TEAM ASSIGNMENT (Checkboxes) === */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 h-6 w-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
                Assign Team
              </h3>
              
              {/* Manager Selection (Radio) */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-800 mb-3 bg-yellow-50 p-2 rounded border border-yellow-200 inline-block">
                  Select Project Manager (Admins & Managers)
                </label>
                
                {managersList.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No managers found. Invite a manager from the settings.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {managersList.map((user) => (
                      <div 
                        key={user._id}
                        onClick={() => setFormData({...formData, manager_id: user._id})}
                        className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${
                          formData.manager_id === user._id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Shield className={`h-5 w-5 ${formData.manager_id === user._id ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                        {formData.manager_id === user._id && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Employee Selection (Checkbox) */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 bg-green-50 p-2 rounded border border-green-200 inline-block">
                  Select Employees (Developers)
                </label>
                
                {employeesList.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No employees found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {employeesList.map((user) => (
                      <div 
                        key={user._id}
                        onClick={() => toggleEmployee(user._id)}
                        className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${
                          formData.employee_ids.includes(user._id) ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <UserIcon className={`h-5 w-5 ${formData.employee_ids.includes(user._id) ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="truncate">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {formData.employee_ids.includes(user._id) && <Check className="ml-auto h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* === 3. INTEGRATIONS === */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 h-6 w-6 rounded-full flex items-center justify-center text-sm mr-2">3</span>
                Connect Tools
              </h3>
              
              <div className="space-y-6">
                {/* Slack */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Slack className="h-5 w-5 text-gray-700" />
                    <h4 className="font-semibold">Slack</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="slack_token" type="password" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="Bot Token (xoxb-...)" />
                    <input name="slack_channel" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="Channel ID" />
                  </div>
                </div>

                {/* Jira */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trello className="h-5 w-5 text-blue-600" /> {/* Jira Icon substitute */}
                    <h4 className="font-semibold">Jira</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input name="jira_url" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="domain.atlassian.net" />
                    <input name="jira_email" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="Email" />
                    <input name="jira_token" type="password" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="API Token" />
                  </div>
                </div>

                {/* Notion */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-5 w-5 text-gray-700" />
                    <h4 className="font-semibold">Notion</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="notion_token" type="password" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="Integration Secret" />
                    <input name="notion_database_id" onChange={handleChange} className="border rounded p-2 text-sm" placeholder="Database ID" />
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? 'Deploying Infrastructure...' : 'Launch Project 🚀'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}