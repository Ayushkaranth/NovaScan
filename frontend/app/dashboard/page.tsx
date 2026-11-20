"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, CalendarDays, FolderGit2, ListChecks, Loader2, ShieldAlert, Users } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HRDashboard } from "@/components/dashboard/HRDashboard";

type Workspace = {
  projects: any[];
  risks: any[];
  teams: any[];
  standups: any[];
  tasks: any[];
  critical_risks: number;
  health_score: number | null;
  employee_count: number | null;
};

async function loadLegacyWorkspace(orgData: any): Promise<Workspace> {
  const [projectsResult, teamsResult, risksResult] = await Promise.allSettled([
    api.get("/projects?limit=100"),
    api.get("/teams"),
    api.get("/risks?limit=100"),
  ]);
  const projects = projectsResult.status === "fulfilled" ? projectsResult.value.data || [] : orgData.projects || [];
  const teams = teamsResult.status === "fulfilled" ? teamsResult.value.data || [] : [];
  const risks = risksResult.status === "fulfilled" ? risksResult.value.data || [] : [];

  const [teamRecords, projectRecords] = await Promise.all([
    Promise.all(teams.map(async (team: any) => {
      const [summary, tasks] = await Promise.allSettled([
        api.get(`/standup/teams/${team._id}/summary`),
        api.get(`/teams/${team._id}/tasks`),
      ]);
      return {
        standups: summary.status === "fulfilled" ? summary.value.data || [] : [],
        tasks: tasks.status === "fulfilled" ? tasks.value.data || [] : [],
      };
    })),
    Promise.all(projects.map(async (project: any) => {
      try {
        const response = await api.get(`/standup/${project._id}/summary`);
        return response.data || [];
      } catch { return []; }
    })),
  ]);

  const standups = [...teamRecords.flatMap((record) => record.standups), ...projectRecords.flat()]
    .filter((record, index, all) => all.findIndex((other) => String(other._id || other.id) === String(record._id || record.id)) === index)
    .sort((a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime());
  const tasks = teamRecords.flatMap((record) => record.tasks);
  const scores = risks.map((risk: any) => Number(risk.risk_score ?? risk.analysis?.risk_score)).filter(Number.isFinite);
  const criticalRisks = scores.filter((score: number) => score >= 8).length;

  return {
    projects, teams, risks, standups, tasks,
    critical_risks: criticalRisks,
    health_score: scores.length ? Math.round(100 - (scores.reduce((total: number, score: number) => total + score, 0) / scores.length) * 10) : null,
    employee_count: orgData.stats?.total_employees ?? null,
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const orgResult = await api.get("/organizations/me");
        if (!active) return;
        if (!orgResult.data.organization) {
          router.push("/org/setup");
          return;
        }
        setOrganization(orgResult.data.organization);
        setRole((orgResult.data.role || "employee").toLowerCase());
        try {
          const workspaceResult = await api.get("/dashboard/workspace");
          if (active) setWorkspace(workspaceResult.data);
        } catch (workspaceError: any) {
          // Render may still be running an older backend deployment. Build the
          // same view from established endpoints while /dashboard/workspace
          // is unavailable there.
          if (![404, 405].includes(workspaceError?.response?.status)) throw workspaceError;
          const legacyWorkspace = await loadLegacyWorkspace(orgResult.data);
          if (active) setWorkspace(legacyWorkspace);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.response?.data?.detail || "Could not load your workspace. Please refresh and try again.");
        if (err?.response?.status === 401 || err?.response?.status === 403) router.push("/auth");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [router]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!workspace) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error || "Workspace data is unavailable."}</div>;

  const { projects, risks, teams, standups, tasks } = workspace;
  const admin = ["admin", "hr"].includes(role);

  if (admin) return <HRDashboard orgData={{ organization, stats: { total_employees: workspace.employee_count, active_projects: projects.length } }} dashboardStats={{ total_risks: workspace.critical_risks, health_score: workspace.health_score, recent_activity: risks.slice(0, 5) }} />;

  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-primary">{organization?.name || "Workspace"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{admin ? "Organization overview" : "My Workspace"}</h1><p className="mt-2 text-muted-foreground">Your assigned projects, team activity, risks, and standup follow-ups.</p></div>
      <Button asChild variant="outline"><Link href="/dashboard/projects">View projects</Link></Button>
    </header>
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<FolderGit2 className="h-4 w-4" />} label="Projects" value={projects.length} />
      <Stat icon={<Users className="h-4 w-4" />} label="Teams" value={teams.length} />
      <Stat icon={<ShieldAlert className="h-4 w-4" />} label="Critical risks" value={workspace.critical_risks} detail={`${risks.length} scans`} />
      <Stat icon={<ListChecks className="h-4 w-4" />} label="Standups" value={standups.length} detail={`${tasks.filter((task) => task.status !== "done").length} open follow-ups`} />
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><div><CardTitle>Assigned projects</CardTitle><CardDescription>Projects linked to your account</CardDescription></div><Link className="text-sm text-primary hover:underline" href="/dashboard/projects">All projects</Link></CardHeader><CardContent className="space-y-3">
        {projects.length ? projects.map((project) => <Link key={project._id} href={`/projects/${project._id}`} className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"><div className="min-w-0"><p className="truncate font-medium">{project.name}</p><p className="truncate text-sm text-muted-foreground">{project.repo_owner}/{project.repo_name}</p></div><FolderGit2 className="h-4 w-4 shrink-0 text-primary" /></Link>) : <Empty message="No projects are assigned to your account yet." />}
      </CardContent></Card>

      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><div><CardTitle>Recent risk scans</CardTitle><CardDescription>Latest findings from your projects</CardDescription></div><Link className="text-sm text-primary hover:underline" href="/dashboard/risks">Risk feed</Link></CardHeader><CardContent className="space-y-3">
        {risks.length ? risks.slice(0, 5).map((risk) => <div key={risk._id} className="flex items-start justify-between gap-4 rounded-lg border p-4"><div className="min-w-0"><p className="truncate font-medium">{risk.pr_title || risk.summary || "Pull request scan"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{risk.repo || "Repository"} · {risk.timestamp ? new Date(risk.timestamp).toLocaleDateString() : "Date unavailable"}</p></div><span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">Score {risk.risk_score ?? "—"}</span></div>) : <Empty message="No scans have been recorded for your projects yet." />}
      </CardContent></Card>

      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><div><CardTitle>Teams & standups</CardTitle><CardDescription>Team schedules and recent meeting notes</CardDescription></div><Link className="text-sm text-primary hover:underline" href="/dashboard/standup">Open standups</Link></CardHeader><CardContent className="space-y-3">
        {teams.length ? teams.map((team) => <div key={team._id} className="flex items-center justify-between gap-3 rounded-lg border p-4"><div className="min-w-0"><p className="truncate font-medium">{team.name}</p><p className="text-sm text-muted-foreground">{team.standup_schedule ? `Scheduled ${team.standup_schedule.local_time || ""} ${team.standup_schedule.timezone || ""}` : "No recurring schedule"}</p></div><CalendarDays className="h-4 w-4 shrink-0 text-primary" /></div>) : <Empty message="You are not assigned to a team yet." />}
        {standups.slice(0, 3).map((standup) => <div key={standup._id} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{standup.date ? new Date(standup.date).toLocaleString() : "Standup"}</p><p className="mt-1 line-clamp-2 text-sm">{standup.summary || "Standup notes"}</p></div>)}
        {!teams.length && !standups.length && <Link href="/dashboard/standup" className="text-sm text-primary hover:underline">View standup workspace</Link>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Follow-up tasks</CardTitle><CardDescription>Open actions from team standups</CardDescription></CardHeader><CardContent className="space-y-3">
        {tasks.filter((task) => task.status !== "done").slice(0, 6).map((task) => <div key={task._id} className="flex items-start gap-3 rounded-lg border p-3"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="font-medium">{task.title}</p><p className="text-sm text-muted-foreground">{task.assignee_name || "Unassigned"} · {(task.status || "open").replace("_", " ")}</p></div></div>)}
        {!tasks.some((task) => task.status !== "done") && <Empty message="No open standup follow-ups." />}
      </CardContent></Card>
    </section>
  </div>;
}

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail?: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p>{detail && <p className="text-xs text-muted-foreground">{detail}</p>}</div></CardContent></Card>;
}

function Empty({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{message}</div>;
}
