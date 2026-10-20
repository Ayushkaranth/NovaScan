'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Github, Slack, Trello, Check, User as UserIcon, Shield, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';

type OAuthProvider = 'github' | 'slack' | 'jira';
type OAuthStatus = {
  configured?: Partial<Record<OAuthProvider, boolean>>;
  connections?: Partial<Record<OAuthProvider, { status?: string; workspace_name?: string }>>;
};

const providers: { id: OAuthProvider; name: string; icon: typeof Github }[] = [
  { id: 'github', name: 'GitHub', icon: Github },
  { id: 'slack', name: 'Slack', icon: Slack },
  { id: 'jira', name: 'Jira', icon: Trello },
];

export default function MasterOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]); // All Org Members
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus>({});
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);
  const [integrationError, setIntegrationError] = useState('');
  const [integrationNotice, setIntegrationNotice] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const createProjectPromise = useRef<Promise<string> | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    repo_owner: '',
    repo_name: '',
    manager_id: '',
    employee_ids: [] as string[], // Array for Multi-Select
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
    api.get('/oauth/status', { params: { live: false } })
      .then(({ data }) => setOauthStatus(data))
      .catch((err) => console.error('Failed to fetch OAuth setup status', err));
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

  const ensureProjectCreated = async () => {
    if (createdProjectId) return createdProjectId;
    if (createProjectPromise.current) return createProjectPromise.current;

    const pending = (async () => {
      if (!formRef.current?.reportValidity()) {
        throw new Error('Complete the required project and repository details first.');
      }
      if (!formData.manager_id) throw new Error('Select a project manager before continuing.');
      const { data } = await api.post('/onboarding/master-onboard', formData);
      if (!data.project_id) throw new Error('The server did not return the new project ID.');
      setCreatedProjectId(data.project_id);
      return data.project_id as string;
    })();

    createProjectPromise.current = pending;
    try {
      return await pending;
    } finally {
      createProjectPromise.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIntegrationError('');
    setIntegrationNotice('');
    setLoading(true);
    try {
      const projectId = await ensureProjectCreated();
      router.push(`/dashboard/integrations?project_id=${encodeURIComponent(projectId)}`);
    } catch (err: any) {
      setIntegrationError(err.response?.data?.detail || err.message || 'Project creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderConnect = async (provider: OAuthProvider) => {
    setIntegrationError('');
    setIntegrationNotice('');
    setActiveProvider(provider);
    try {
      // Check server configuration first so a missing OAuth client does not
      // create a project that the user cannot connect yet.
      const { data: currentStatus } = await api.get('/oauth/status', { params: { live: false } });
      setOauthStatus(currentStatus);
      const providerName = providers.find((item) => item.id === provider)?.name || provider;

      if (!currentStatus.configured?.[provider]) {
        throw new Error(`${providerName} OAuth is not configured on the NovaScan server yet.`);
      }
      if (currentStatus.connections?.[provider]?.status === 'connected') {
        setIntegrationNotice(`${providerName} is already connected to your organization. It will be linked to this project when you create it.`);
        setActiveProvider(null);
        return;
      }

      const projectId = await ensureProjectCreated();
      const { data } = await api.get(`/oauth/${provider}/authorize`, { params: { project_id: projectId } });
      if (!data.auth_url) throw new Error('The server did not return an authorization URL.');
      window.location.assign(data.auth_url);
    } catch (err: any) {
      setIntegrationError(err.response?.data?.detail || err.message || 'Could not start OAuth authorization.');
      setActiveProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 text-foreground">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </button>

        <form ref={formRef} onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
          <div className="bg-primary px-8 py-6">
            <h1 className="text-2xl font-bold text-primary-foreground">🚀 New Project Onboarding</h1>
            <p className="text-primary-foreground/80 mt-2">Configure repo, assign team, and link integrations.</p>
          </div>

          <div className="p-8 space-y-10">

            {/* === 1. PROJECT DETAILS === */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center text-sm mr-2 border border-primary/20">1</span>
                Project & GitHub
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Project Name</label>
                  <input name="name" required onChange={handleChange} className="mt-1 block w-full bg-background border border-input text-foreground rounded-md p-2 focus:ring-primary focus:border-primary" placeholder="e.g. AI Mobile App" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Repo Owner</label>
                    <input name="repo_owner" required onChange={handleChange} className="mt-1 block w-full bg-background border border-input text-foreground rounded-md p-2" placeholder="github-username" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Repo Name</label>
                    <input name="repo_name" required onChange={handleChange} className="mt-1 block w-full bg-background border border-input text-foreground rounded-md p-2" placeholder="repo-name" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Connect GitHub with OAuth after creating the project. No personal access token is stored in the project form.</p>
              </div>
            </section>

            <hr className="border-border" />

            {/* === 2. TEAM ASSIGNMENT (Checkboxes) === */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center text-sm mr-2 border border-primary/20">2</span>
                Assign Team
              </h3>

              {/* Manager Selection (Radio) */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-foreground mb-3 bg-yellow-500/10 p-2 rounded border border-yellow-500/20 inline-block text-yellow-700 dark:text-yellow-400">
                  Select Project Manager (Admins & Managers)
                </label>

                {managersList.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No managers found. Invite a manager from the settings.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {managersList.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => setFormData({ ...formData, manager_id: user._id })}
                        className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${formData.manager_id === user._id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted/50 border-border'
                          }`}
                      >
                        <Shield className={`h-5 w-5 ${formData.manager_id === user._id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-bold text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                        {formData.manager_id === user._id && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Employee Selection (Checkbox) */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 inline-block text-emerald-700 dark:text-emerald-400">
                  Select Employees (Developers)
                </label>

                {employeesList.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No employees found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {employeesList.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => toggleEmployee(user._id)}
                        className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${formData.employee_ids.includes(user._id) ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500' : 'hover:bg-muted/50 border-border'
                          }`}
                      >
                        <UserIcon className={`h-5 w-5 ${formData.employee_ids.includes(user._id) ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <div className="truncate">
                          <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {formData.employee_ids.includes(user._id) && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <hr className="border-border" />

            {/* === 3. INTEGRATIONS === */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center text-sm mr-2 border border-primary/20">3</span>
                Connect Tools
              </h3>

              <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Click a tool to authorize it for this project. NovaScan creates the project first so OAuth is linked to the right project. Existing organization connections are linked automatically when you create the project.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {providers.map(({ id, name, icon: Icon }) => {
                    const connected = oauthStatus.connections?.[id]?.status === 'connected';
                    const unavailable = oauthStatus.configured?.[id] === false;
                    const busy = activeProvider === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleProviderConnect(id)}
                        disabled={activeProvider !== null || loading}
                        className={`flex min-h-14 items-center gap-2 rounded-md border p-3 text-left text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${connected ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'}`}
                        aria-label={connected ? `${name} connected to organization` : `Connect ${name} to project`}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : connected ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Icon className="h-4 w-4" />}
                        <span>{busy ? 'Starting…' : connected ? `${name} connected` : unavailable ? `${name} setup required` : `Connect ${name}`}</span>
                      </button>
                    );
                  })}
                </div>
                {integrationError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{integrationError}</p>}
                {integrationNotice && <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">{integrationNotice}</p>}
                {createdProjectId && <button type="button" onClick={() => router.push(`/dashboard/integrations?project_id=${encodeURIComponent(createdProjectId)}`)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Continue to this project’s integrations</button>}
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" />After approving one tool, you’ll return to NovaScan. Connect remaining tools from this project’s Integrations page.</p>
              </div>
            </section>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || activeProvider !== null}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
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
