'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { ArrowUpRight, Building2, Camera, FolderGit2, GitBranch, Hash, Loader2, Save, ShieldCheck, X } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  profile_image?: string | null;
};

type AssignedProject = {
  _id: string;
  name: string;
  repo_owner?: string;
  repo_name?: string;
  manager_id?: string;
  employee_ids?: string[];
  status?: string;
};

const MAX_IMAGE_SIZE = 1024 * 1024;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [projectsError, setProjectsError] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/auth/me/profile');
        setProfile(data);
        setName(data.full_name || '');
        setImage(data.profile_image || null);
        try {
          const organizationResponse = await api.get('/organizations/me');
          setOrganizationName(organizationResponse.data.organization?.name || 'No organization');
        } catch {
          setOrganizationName('Organization unavailable');
        }
        try {
          const projectResponse = await api.get('/projects?limit=100');
          const assigned = (projectResponse.data || []).filter((project: AssignedProject) =>
            String(project.manager_id || '') === String(data.id) ||
            (project.employee_ids || []).some((memberId) => String(memberId) === String(data.id))
          );
          setProjects(assigned);
        } catch (err: any) {
          setProjectsError(err.response?.data?.detail || 'Could not load your assigned projects.');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Could not load your profile.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setNotice('');
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Profile images must be 1 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setImageChanged(true);
      } else {
        setError('Could not read that image. Please try another file.');
      }
    };
    reader.onerror = () => setError('Could not read that image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setError('');
    setNotice('');
    if (!name.trim()) {
      setError('Enter your name before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload: { full_name: string; profile_image?: string } = { full_name: name.trim() };
      if (imageChanged) payload.profile_image = image || '';
      const { data } = await api.put('/auth/me/profile', payload);
      setProfile(data);
      setName(data.full_name || '');
      setImage(data.profile_image || null);
      setImageChanged(false);
      setNotice('Your profile has been updated.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  const initials = (name || profile?.email || 'U').trim().slice(0, 1).toUpperCase();
  const role = (profile?.role || 'member').toLowerCase();
  const roleLabel = role === 'hr' ? 'HR' : role.charAt(0).toUpperCase() + role.slice(1);
  const roleTone = ['admin', 'hr'].includes(role)
    ? 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300'
    : role === 'manager'
      ? 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300'
      : role === 'employee'
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : 'border-border bg-muted text-muted-foreground';
  const employeeId = profile?.id ? `#${profile.id.slice(-6).toUpperCase()}` : 'Not available';

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My profile</h1>
        <p className="mt-1 text-muted-foreground">Update your name and the image shown on your account.</p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}

      <section className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5 rounded-lg bg-gradient-to-br from-primary/10 via-card to-muted/40 p-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted text-3xl font-semibold text-muted-foreground shadow-md">
            {image ? <img src={image} alt="Your profile" className="h-full w-full object-cover" /> : <span>{initials}</span>}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="max-w-full truncate text-xl font-bold tracking-tight">{name || 'Your profile'}</h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleTone}`}>
                <ShieldCheck className="h-3.5 w-3.5" />{roleLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/80 px-3 py-1.5">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Employee ID</span>
                <span className="font-mono text-sm font-semibold tracking-wide">{employeeId}</span>
              </div>
              <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-border/70 bg-background/80 px-3 py-1.5">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">Organization</span>
                <span className="truncate text-sm font-semibold">{organizationName || 'Loading...'}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:max-w-48">
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP up to 1 MB.</p>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted/50">
                <Camera className="h-4 w-4" /> Change photo
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
              </label>
              {image && <Button type="button" variant="ghost" size="sm" onClick={() => { setImage(null); setImageChanged(true); setNotice(''); }}>
                <X className="mr-1 h-4 w-4" /> Remove
              </Button>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-name" className="text-sm font-medium">Name</label>
          <input id="profile-name" autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-email" className="text-sm font-medium">Email</label>
          <input id="profile-email" type="email" value={profile?.email || ''} readOnly disabled className="w-full cursor-not-allowed rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Your account email is read-only and cannot be changed here.</p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">Email and employee ID are account identifiers.</p>
          <Button type="button" onClick={saveProfile} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save profile
          </Button>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">My projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">Projects where you are the manager or a team member.</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{projects.length}</span>
        </div>

        {projectsError ? (
          <p role="alert" className="text-sm text-destructive">{projectsError}</p>
        ) : projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">You are not assigned to any projects yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {projects.map((project) => {
              const isManager = String(project.manager_id || '') === String(profile?.id || '');
              const isMember = (project.employee_ids || []).some((memberId) => String(memberId) === String(profile?.id || ''));
              const assignment = [isManager ? 'Project manager' : '', isMember ? 'Team member' : ''].filter(Boolean).join(' | ');
              return (
                <div key={project._id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary"><FolderGit2 className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{project.name}</h3>
                      <p className="mt-1 flex items-center gap-1 truncate font-mono text-xs text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5 shrink-0" />
                        {project.repo_owner && project.repo_name ? `${project.repo_owner}/${project.repo_name}` : 'Repository not set'}
                      </p>
                      <p className="mt-2 text-xs font-medium text-muted-foreground">{assignment}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={`/projects/${encodeURIComponent(project._id)}`}>
                      Open project <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
