'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Activity, Building2, UserPlus, ArrowRight, Shield, Briefcase, User, Loader2 } from 'lucide-react';

export default function SetupOrganization() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState({ name: '', slug: '', website_url: '' });
  const [joinForm, setJoinForm] = useState({ org_id: '', role: 'employee' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/organizations/', createForm);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Creation Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const orgId = joinForm.org_id.trim();
    const derivedToken = orgId.slice(-6);
    try {
      await api.post(`/organizations/join/${orgId}`, { token: derivedToken, role: joinForm.role });
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Join Failed. Check the ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-primary">

      {/* Subtle background glow — mirrors landing page style */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-30" />
      </div>

      

      {/* Card */}
      <div className="w-full max-w-2xl bg-card border border-border rounded-[2rem] shadow-2xl shadow-primary/5 overflow-hidden">

        {/* Card header — gradient top bar like landing deployment section */}
        <div className="relative px-10 py-8 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary" />
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl opacity-50 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-2xl opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-foreground">Set Up Your Workspace</h1>
            <p className="text-muted-foreground mt-2 text-sm">Create a new organization or join an existing one.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mx-8">
          {(['create', 'join'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-colors capitalize relative ${
                activeTab === tab
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'create' ? 'Create New' : 'Join Existing'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="px-10 py-8">

          {/* === CREATE FORM === */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Create a Workspace</h3>
                <p className="text-muted-foreground text-sm mt-1">You will become the Admin of this organization.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Organization Name
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                    placeholder="e.g. Acme Corp"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setCreateForm({ ...createForm, name, slug });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Slug
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(auto-generated, editable)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                      novascan.app/
                    </span>
                    <input
                      required
                      className="w-full pl-[7.5rem] pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm font-mono"
                      placeholder="acme-corp"
                      value={createForm.slug}
                      onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Website URL
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                    placeholder="https://acmecorp.com"
                    value={createForm.website_url}
                    onChange={(e) => setCreateForm({ ...createForm, website_url: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          )}

          {/* === JOIN FORM === */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-7 w-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Join a Team</h3>
                <p className="text-muted-foreground text-sm mt-1">Enter the Organization ID provided by your Admin.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Organization ID
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm font-mono"
                    placeholder="e.g. 65d4a1b2c3d4e5f6a7b8c9d0"
                    value={joinForm.org_id}
                    onChange={(e) => setJoinForm({ ...joinForm, org_id: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    I am joining as:
                  </label>
                  <div className="grid grid-cols-3 gap-3">

                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => setJoinForm({ ...joinForm, role: 'admin' })}
                      className={`p-4 rounded-xl border text-center transition-all group ${
                        joinForm.role === 'admin'
                          ? 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30'
                          : 'border-border bg-muted/30 hover:border-border hover:bg-muted/50'
                      }`}
                    >
                      <Shield className={`h-5 w-5 mx-auto mb-2 transition-colors ${joinForm.role === 'admin' ? 'text-purple-400' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className={`text-xs font-bold block ${joinForm.role === 'admin' ? 'text-purple-400' : 'text-muted-foreground group-hover:text-foreground'}`}>Admin</span>
                    </button>

                    {/* Manager */}
                    <button
                      type="button"
                      onClick={() => setJoinForm({ ...joinForm, role: 'manager' })}
                      className={`p-4 rounded-xl border text-center transition-all group ${
                        joinForm.role === 'manager'
                          ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30'
                          : 'border-border bg-muted/30 hover:border-border hover:bg-muted/50'
                      }`}
                    >
                      <Briefcase className={`h-5 w-5 mx-auto mb-2 transition-colors ${joinForm.role === 'manager' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className={`text-xs font-bold block ${joinForm.role === 'manager' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>Manager</span>
                    </button>

                    {/* Employee */}
                    <button
                      type="button"
                      onClick={() => setJoinForm({ ...joinForm, role: 'employee' })}
                      className={`p-4 rounded-xl border text-center transition-all group ${
                        joinForm.role === 'employee'
                          ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-border bg-muted/30 hover:border-border hover:bg-muted/50'
                      }`}
                    >
                      <User className={`h-5 w-5 mx-auto mb-2 transition-colors ${joinForm.role === 'employee' ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className={`text-xs font-bold block ${joinForm.role === 'employee' ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-foreground'}`}>Employee</span>
                    </button>

                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? 'Joining...' : 'Join Workspace'}
              </button>
            </form>
          )}

        </div>

        {/* Footer hint */}
        <div className="px-10 pb-8 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
            Secured · End-to-End Encrypted
          </p>
        </div>

      </div>
    </div>
  );
}
