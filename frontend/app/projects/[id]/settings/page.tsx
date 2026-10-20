'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { getUserFromToken } from '@/lib/api';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Github,
  Loader2,
  PlugZap,
  Save,
  Slack,
  Trash2,
  Trello,
  Unplug,
} from 'lucide-react';

type OAuthProvider = 'github' | 'slack' | 'jira';
type ProjectRecord = {
  _id: string;
  name: string;
  repo_owner: string;
  repo_name: string;
  manager_id?: string;
  employee_ids?: string[];
};
type Member = { _id: string; name?: string; full_name?: string; email?: string; role: string };
type ProviderConnection = { status?: string; live?: boolean; workspace_name?: string; scope?: string };
type OAuthStatus = {
  configured?: Partial<Record<OAuthProvider, boolean>>;
  connections?: Partial<Record<OAuthProvider, ProviderConnection>>;
};

const providers: { id: OAuthProvider; name: string; icon: typeof Github }[] = [
  { id: 'github', name: 'GitHub', icon: Github },
  { id: 'slack', name: 'Slack', icon: Slack },
  { id: 'jira', name: 'Jira', icon: Trello },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.id || '');
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ name: '', repo_owner: '', repo_name: '', manager_id: '', employee_ids: [] as string[] });
  const [oauth, setOauth] = useState<OAuthStatus>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshOAuth = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data } = await api.get('/oauth/status', { params: { project_id: projectId, live: true } });
      setOauth(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not load this project’s tool connections.');
    }
  }, [projectId]);

  useEffect(() => {
    setUserRole(getUserFromToken()?.role || null);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [projectResponse, membersResponse] = await Promise.all([
          api.get(`/projects/${encodeURIComponent(projectId)}`),
          api.get('/organizations/members/list'),
        ]);
        const projectData = projectResponse.data as ProjectRecord;
        setProject(projectData);
        setMembers(membersResponse.data.members || []);
        setForm({
          name: projectData.name || '',
          repo_owner: projectData.repo_owner || '',
          repo_name: projectData.repo_name || '',
          manager_id: projectData.manager_id || '',
          employee_ids: projectData.employee_ids || [],
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Could not load this project.');
      } finally {
        setLoading(false);
      }
    };
    load();

    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');
    const provider = query.get('provider');
    const message = query.get('message');
    if (status && provider) {
      setNotice(`${provider[0].toUpperCase()}${provider.slice(1)} ${status}${message ? `: ${message}` : ''}`);
      window.history.replaceState({}, '', `/projects/${encodeURIComponent(projectId)}/settings`);
    }
    refreshOAuth();
  }, [projectId, refreshOAuth]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.put(`/projects/${encodeURIComponent(projectId)}`, form);
      setProject((current) => current ? { ...current, ...form } : current);
      setNotice('Project settings saved.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not save project settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || userRole !== 'admin') return;
    if (!window.confirm(`Delete project “${project.name}”? Its project OAuth connections will also be removed.`)) return;
    const confirmation = window.prompt(`Type ${project.name} to confirm project deletion:`);
    if (confirmation !== project.name) {
      if (confirmation !== null) setError('Project name did not match. The project was not deleted.');
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await api.delete(`/projects/${encodeURIComponent(projectId)}`);
      router.replace('/dashboard/projects');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not delete this project.');
      setDeleting(false);
    }
  };

  const connectProvider = async (provider: OAuthProvider) => {
    setActiveProvider(provider);
    setError('');
    try {
      const { data } = await api.get(`/oauth/${provider}/authorize`, {
        params: { project_id: projectId, return_to: 'settings' },
      });
      if (!data.auth_url) throw new Error('The server did not return an authorization URL.');
      window.location.assign(data.auth_url);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || `Could not connect ${provider}.`);
      setActiveProvider(null);
    }
  };

  const disconnectProvider = async (provider: OAuthProvider) => {
    setActiveProvider(provider);
    setError('');
    try {
      await api.delete(`/oauth/${provider}`, { params: { project_id: projectId } });
      await refreshOAuth();
      setNotice(`${providers.find((item) => item.id === provider)?.name || provider} disconnected from this project.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Could not disconnect ${provider}.`);
    } finally {
      setActiveProvider(null);
    }
  };

  const toggleEmployee = (memberId: string) => {
    setForm((current) => ({
      ...current,
      employee_ids: current.employee_ids.includes(memberId)
        ? current.employee_ids.filter((id) => id !== memberId)
        : [...current.employee_ids, memberId],
    }));
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!project) return <div className="p-10 text-center">{error || 'Project not found.'}</div>;

  const managers = members.filter((member) => member.role === 'admin' || member.role === 'manager' || member.role === 'hr');
  const employees = members.filter((member) => member.role === 'employee');

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div>
        <Link href={`/projects/${encodeURIComponent(projectId)}`} className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {project.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Project settings</h1>
        <p className="mt-1 text-muted-foreground">Manage this project’s details, team, and provider connections.</p>
      </div>

      {notice && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Project details</h2>
            <p className="text-sm text-muted-foreground">Repository details are used for project events and GitHub webhooks.</p>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Project name</span>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Repository owner</span>
              <input required value={form.repo_owner} onChange={(event) => setForm({ ...form, repo_owner: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Repository name</span>
              <input required value={form.repo_name} onChange={(event) => setForm({ ...form, repo_name: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground" />
            </label>
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Team assignment</h2>
            <p className="text-sm text-muted-foreground">Add or remove developers from this project by selecting them below, then save your changes. Only people already in your organization are listed.</p>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Project manager</span>
            <select required value={form.manager_id} onChange={(event) => setForm({ ...form, manager_id: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground">
              <option value="" disabled>Select a manager</option>
              {managers.map((member) => <option key={member._id} value={member._id}>{member.name || member.full_name || member.email} ({member.role})</option>)}
            </select>
          </label>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Project developers ({form.employee_ids.length} selected)</h3>
            {employees.length === 0 ? <p className="text-sm text-muted-foreground">No employees are available in this organization. <Link href="/dashboard/team" className="font-medium text-primary hover:underline">Invite organization members</Link> first.</p> : (
              <div className="grid gap-2 sm:grid-cols-2">
                {employees.map((member) => (
                  <label key={member._id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-muted/40">
                    <input type="checkbox" checked={form.employee_ids.includes(member._id)} onChange={() => toggleEmployee(member._id)} className="h-4 w-4 accent-primary" />
                    <span className="min-w-0"><span className="block truncate font-medium">{member.name || member.full_name || member.email}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save project settings'}
          </button>
        </div>
      </form>

      <section className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold">Project integrations</h2>
            <p className="text-sm text-muted-foreground">These OAuth connections are exclusive to {project.name}.</p>
          </div>
          <button type="button" onClick={refreshOAuth} className="self-start rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50 sm:self-auto">Refresh status</button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {providers.map(({ id, name, icon: Icon }) => {
            const connection = oauth.connections?.[id];
            const connected = connection?.status === 'connected';
            const configured = oauth.configured?.[id] !== false;
            const busy = activeProvider === id;
            return (
              <article key={id} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0"><h3 className="font-semibold">{name}</h3><p className="truncate text-xs text-muted-foreground">{connected ? connection?.workspace_name || 'Connected' : connection?.status === 'expired' ? 'Reconnect required' : 'Not connected'}</p></div>
                  {connected && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />}
                </div>
                <div className="mt-4">
                  {connected ? (
                    <button type="button" onClick={() => disconnectProvider(id)} disabled={busy} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-60">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />} Disconnect
                    </button>
                  ) : (
                    <button type="button" onClick={() => connectProvider(id)} disabled={busy || !configured} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}{configured ? `Connect ${name}` : 'OAuth not configured'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <Link href={`/projects/${encodeURIComponent(projectId)}#project-integrations`} className="inline-block text-sm font-medium text-primary hover:underline">Open the project dashboard</Link>
      </section>

      {userRole === 'admin' && (
        <section className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <h2 className="font-semibold text-destructive">Danger zone</h2>
              <p className="mt-1 text-sm text-muted-foreground">Permanently delete this project and its OAuth connections. This action cannot be undone.</p>
            </div>
          </div>
          <button type="button" onClick={handleDeleteProject} disabled={deleting} className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deleting ? 'Deleting project…' : 'Delete project'}
          </button>
        </section>
      )}
    </div>
  );
}
