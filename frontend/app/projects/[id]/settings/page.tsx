'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { getUserFromToken } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  ChevronDown,
  CheckCircle2,
  Github,
  Loader2,
  PlugZap,
  Search,
  Save,
  FileText,
  Slack,
  Trash2,
  Trello,
  Unplug,
  UserMinus,
  UserPlus,
} from 'lucide-react';

type OAuthProvider = 'github' | 'slack' | 'jira' | 'notion';
type ProjectRecord = {
  _id: string;
  name: string;
  repo_owner: string;
  repo_name: string;
  manager_id?: string;
  employee_ids?: string[];
};
type Member = { _id: string; name?: string; full_name?: string; email?: string; role: string };
type MemberSearchResponse = { members: Member[]; has_more?: boolean };
type ProviderConnection = { status?: string; live?: boolean; workspace_name?: string; scope?: string; details?: { repository?: string; database_id?: string; database_name?: string; database_url?: string } };
type OAuthStatus = {
  configured?: Partial<Record<OAuthProvider, boolean>>;
  connections?: Partial<Record<OAuthProvider, ProviderConnection>>;
};

const providers: { id: OAuthProvider; name: string; icon: any }[] = [
  { id: 'github', name: 'GitHub', icon: Github },
  { id: 'slack', name: 'Slack', icon: Slack },
  { id: 'jira', name: 'Jira', icon: Trello },
  { id: 'notion', name: 'Notion Audit Reports', icon: FileText },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.id || '');
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ name: '', repo_owner: '', repo_name: '', manager_id: '', employee_ids: [] as string[] });
  const [oauth, setOauth] = useState<OAuthStatus>({});
  const [notionTrackerLoading, setNotionTrackerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [searchedMembers, setSearchedMembers] = useState<MemberSearchResponse | null>(null);
  const [searchingMembers, setSearchingMembers] = useState(false);
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
      const tokenUser = getUserFromToken();
      setUserRole(tokenUser?.role || null);
      setUserEmail(String(tokenUser?.sub || '').toLowerCase());
      api.get('/auth/me/profile').then(({ data }) => setUserId(String(data.id || ''))).catch(() => setUserId(null));
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
        let organizationMembers: Member[] = membersResponse.data.members || [];
        const assignedIds = (projectData.employee_ids || []).map(String);
        if (assignedIds.length) {
          const assignedResponse = await api.get('/organizations/members/list', { params: { member_ids: assignedIds.join(','), limit: assignedIds.length } });
          const merged = new Map(organizationMembers.map((member) => [String(member._id), member]));
          (assignedResponse.data.members || []).forEach((member: Member) => merged.set(String(member._id), member));
          organizationMembers = [...merged.values()];
        }
        setProject(projectData);
        setMembers(organizationMembers);
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

  useEffect(() => {
    const query = memberSearch.trim();
    if (!query) {
      setSearchedMembers(null);
      setSearchingMembers(false);
      return;
    }
    let cancelled = false;
    setSearchingMembers(true);
    const timer = window.setTimeout(() => {
      api.get('/organizations/members/list', { params: { search: query, limit: 50 } })
        .then(({ data }) => { if (!cancelled) { setSearchedMembers(data); setSearchingMembers(false); } })
        .catch(() => { if (!cancelled) { setSearchedMembers(null); setSearchingMembers(false); } });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [memberSearch]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = userRole === 'manager' ? { employee_ids: form.employee_ids } : form;
      await api.put(`/projects/${encodeURIComponent(projectId)}`, payload);
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
        params: { project_id: projectId, return_to: 'project' },
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

  const createNotionTracker = async () => {
    setNotionTrackerLoading(true);
    setError('');
    try {
      const { data } = await api.post('/oauth/notion/provision', null, { params: { project_id: projectId } });
      const message = `Your shared Notion page is now named ${data.database?.name || 'NovaScan Issues Tracker'} and contains the audit table.`;
      router.push(`/projects/${encodeURIComponent(projectId)}?status=success&provider=notion&message=${encodeURIComponent(message)}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not create the Notion audit tracker.');
    } finally {
      setNotionTrackerLoading(false);
    }
  };

  const toggleEmployee = (memberId: string) => {
    const isAssigned = form.employee_ids.map(String).includes(String(memberId));
    if (!canManageProject && !(canRemoveProjectMembers && isAssigned)) return;
    setForm((current) => ({
      ...current,
      employee_ids: isAssigned
        ? current.employee_ids.filter((id) => String(id) !== String(memberId))
        : [...current.employee_ids, memberId],
    }));
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!project) return <div className="p-10 text-center">{error || 'Project not found.'}</div>;

  const managers = members.filter((member) => ['admin', 'manager', 'hr'].includes(String(member.role || '').toLowerCase()));
  const employees = members;
  const canManageProject = userRole === 'admin' || userRole === 'hr';
  const canRemoveProjectMembers = userRole === 'manager' && String(project.manager_id || '') === String(userId || '');
  const teamChanged = JSON.stringify([...(project.employee_ids || [])].map(String).sort()) !== JSON.stringify([...form.employee_ids].map(String).sort());
  const loggedInMember = (member: Member) =>
    (userId && String(member._id) === String(userId)) ||
    (userEmail && String(member.email || '').toLowerCase() === userEmail);
  const currentTeam = [...new Set(form.employee_ids.map(String))]
    .filter((id) => id !== String(userId || ''))
    .map((id) => members.find((member) => String(member._id) === id) || { _id: id, name: 'Organization member', email: '', role: '' })
    .filter((member) => !loggedInMember(member));
  const selectedMemberIds = new Set(form.employee_ids.map(String));
  const normalizedSearch = memberSearch.trim().toLowerCase();
  const memberCandidates = searchedMembers?.members || employees;
  const availableMembers = memberCandidates.filter((member) => {
    if (loggedInMember(member) || selectedMemberIds.has(String(member._id))) return false;
    const label = `${member.name || member.full_name || ''} ${member.email || ''} ${member.role || ''}`.toLowerCase();
    return !normalizedSearch || label.includes(normalizedSearch);
  }).slice(0, 50);
  const moreSearchResults = searchedMembers?.has_more ?? memberCandidates.length > 50;

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
            <input required disabled={!canManageProject} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground disabled:opacity-60" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Repository owner</span>
              <input required disabled={!canManageProject} value={form.repo_owner} onChange={(event) => setForm({ ...form, repo_owner: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground disabled:opacity-60" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Repository name</span>
              <input required disabled={!canManageProject} value={form.repo_name} onChange={(event) => setForm({ ...form, repo_name: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground disabled:opacity-60" />
            </label>
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Team assignment</h2>
            <p className="text-sm text-muted-foreground">{canRemoveProjectMembers ? 'Project managers can remove current members. Admins and HR can add or remove any organization member.' : 'Admins and HR can add or remove any organization member from this project.'}</p>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Project manager</span>
            <select required disabled={!canManageProject} value={form.manager_id} onChange={(event) => setForm({ ...form, manager_id: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground disabled:opacity-60">
              <option value="" disabled>Select a manager</option>
              {managers.map((member) => <option key={member._id} value={member._id}>{member.name || member.full_name || member.email} ({member.role})</option>)}
            </select>
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Project members <span className="text-muted-foreground">({currentTeam.length})</span></h3>
              {canManageProject && (
                <Popover open={memberPickerOpen} onOpenChange={(open) => {
                  setMemberPickerOpen(open);
                  if (!open) {
                    setMemberSearch('');
                    setSearchedMembers(null);
                    setSearchingMembers(false);
                  }
                }}>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
                      <UserPlus className="h-4 w-4" /> Add member <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
                    <div className="border-b border-border p-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input autoFocus value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search name, email, or role…" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Already assigned members and your account are hidden.</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-1.5">
                      {searchingMembers ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">Searching organization…</p> : availableMembers.length ? availableMembers.map((member) => (
                        <button key={member._id} type="button" onClick={() => { toggleEmployee(member._id); setMemberSearch(''); setMemberPickerOpen(false); }} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{(member.name || member.full_name || member.email || 'U').trim().slice(0, 1).toUpperCase()}</span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.name || member.full_name || 'Name not set'}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">{member.role}</span>
                        </button>
                      )) : <p className="px-3 py-8 text-center text-sm text-muted-foreground">{members.length ? 'No matching members available.' : 'No organization members found.'}</p>}
                      {moreSearchResults && <p className="px-3 py-2 text-center text-xs text-muted-foreground">Showing 50 matches. Refine your search to find someone else.</p>}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {currentTeam.length ? (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {currentTeam.map((member) => (
                  <div key={member._id} className="flex items-center gap-3 bg-background/40 px-3 py-3 sm:px-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">{(member.name || member.full_name || member.email || 'U').trim().slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.name || member.full_name || 'Name not set'}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><Check className="h-3.5 w-3.5" /> Already in team</span>
                    {(canManageProject || canRemoveProjectMembers) && <button type="button" onClick={() => toggleEmployee(member._id)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"><UserMinus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Remove</span></button>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <UserPlus className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">No project members yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add people from your organization to this project.</p>
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          {(canManageProject || (canRemoveProjectMembers && teamChanged)) && <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save project settings'}
          </button>}
        </div>
      </form>

      <section className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold">Project integrations</h2>
            <p className="text-sm text-muted-foreground">These connections are exclusive to {project.name}. GitHub is installed for the configured repository ({project.repo_owner}/{project.repo_name}) with repository-scoped access.</p>
          </div>
          <button type="button" onClick={refreshOAuth} className="self-start rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50 sm:self-auto">Refresh status</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {providers.map(({ id, name, icon: Icon }) => {
            const connection = oauth.connections?.[id];
            const connected = connection?.status === 'connected';
            const configured = oauth.configured?.[id] !== false;
            const busy = activeProvider === id || (id === 'notion' && notionTrackerLoading);
            return (
              <article key={id} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0"><h3 className="font-semibold">{name}</h3><p className="truncate text-xs text-muted-foreground">{connected ? (id === 'github' ? connection?.details?.repository || project.repo_owner + '/' + project.repo_name : id === 'notion' ? connection?.details?.database_name || `${connection?.workspace_name || 'Connected'} · tracker setup needed` : connection?.workspace_name || 'Connected') : connection?.status === 'expired' ? 'Reconnect required' : 'Not connected'}</p></div>
                  {connected && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />}
                </div>
                <div className="mt-4">
                  {connected ? (
                    <div className="space-y-3">
                      {id === 'notion' && <div className="space-y-2">
                        {connection?.details?.database_url && <a href={connection?.details?.database_url} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-primary hover:underline">Open {connection?.details?.database_name || 'NovaScan Issues Tracker'} in Notion</a>}
                        <p className="text-xs text-muted-foreground">NovaScan names the page you shared for this project and embeds the risk, score, status, source PR, and detection-date table inside it.</p>
                        <button type="button" onClick={createNotionTracker} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Set up this page as the project tracker
                          </button>
                      </div>}
                      <button type="button" onClick={() => disconnectProvider(id)} disabled={busy} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-60">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />} Disconnect
                      </button>
                    </div>
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
