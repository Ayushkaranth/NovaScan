'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, UserPlus, ArrowRight, Shield, Briefcase, User } from 'lucide-react';

export default function SetupOrganization() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);

  // --- Form State ---
  const [createForm, setCreateForm] = useState({ name: '', slug: '', website_url: '' });
  
  // 🟢 FIXED: Added 'role' to the Join State
  const [joinForm, setJoinForm] = useState({ 
    org_id: '', 
    role: 'employee' // Default, but user can change it now
  });

  // --- Handler: Create Org ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/organizations/', createForm);
      alert('Workspace Created!');
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Creation Failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Handler: Join Org ---
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const orgId = joinForm.org_id.trim();
    const derivedToken = orgId.slice(-6); 

    try {
      // 🟢 FIXED: Sending the user-selected role instead of hardcoded 'employee'
      await api.post(`/organizations/join/${orgId}`, {
        token: derivedToken, 
        role: joinForm.role 
      });
      
      alert(`Joined Successfully as ${joinForm.role}!`);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Join Failed. Check the ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Welcome to NovaScan</h1>
          <p className="text-blue-100 mt-2 text-sm">Get started by setting up your workspace.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'create' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'join' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Join Existing
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          {/* === CREATE FORM === */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="text-center mb-6">
                <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-gray-900">Create a Workspace</h3>
                <p className="text-gray-500 text-sm">You will become the Admin.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Organization Name</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Acme Corp"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="acme-corp"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
              >
                {loading ? 'Creating...' : 'Create Workspace'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* === JOIN FORM === */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-5">
              <div className="text-center mb-6">
                <UserPlus className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-gray-900">Join a Team</h3>
                <p className="text-gray-500 text-sm">Enter the ID provided by your Admin.</p>
              </div>

              {/* Input 1: Org ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Organization ID</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                  placeholder="e.g. 65d4a1b2c3d4e5f6g7h8i9j0"
                  value={joinForm.org_id}
                  onChange={(e) => setJoinForm({ ...joinForm, org_id: e.target.value })}
                />
              </div>

              {/* Input 2: Role Selection (NEW) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">I am joining as:</label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Admin Option */}
                  <button
                    type="button"
                    onClick={() => setJoinForm({...joinForm, role: 'admin'})}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      joinForm.role === 'admin' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className={`h-5 w-5 mx-auto mb-1 ${joinForm.role === 'admin' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold block">Admin</span>
                  </button>

                  {/* Manager Option */}
                  <button
                    type="button"
                    onClick={() => setJoinForm({...joinForm, role: 'manager'})}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      joinForm.role === 'manager' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Briefcase className={`h-5 w-5 mx-auto mb-1 ${joinForm.role === 'manager' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold block">Manager</span>
                  </button>

                  {/* Employee Option */}
                  <button
                    type="button"
                    onClick={() => setJoinForm({...joinForm, role: 'employee'})}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      joinForm.role === 'employee' 
                        ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <User className={`h-5 w-5 mx-auto mb-1 ${joinForm.role === 'employee' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold block">Employee</span>
                  </button>

                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all flex justify-center items-center gap-2"
              >
                {loading ? 'Joining...' : 'Join Workspace'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}