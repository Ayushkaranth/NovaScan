"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, CheckCircle2, Clock3, ExternalLink, Loader2, ListChecks, Plus, RefreshCw, Video } from "lucide-react";
import { TranscriptModal } from "@/components/standup/TranscriptModal";

type Schedule = { weekdays: number[]; local_time: string; duration_minutes: number; timezone: string; meet_url?: string; calendar_url?: string; organizer_email?: string; google_event_id?: string; connected?: boolean };
type Team = { _id: string; name: string; manager_id: string; member_ids: string[]; standup_schedule?: Schedule };
type StandupRecord = { id: string; date: string; summary: string; tasks?: { title: string; assignee_name?: string }[]; blockers?: { user_name: string; issue: string }[]; source?: string };
type CalendarEvent = { id: string; title: string; start_time?: string; meet_url?: string; calendar_url?: string };
type StandupTask = { id: string; title: string; description?: string; assignee_id?: string; assignee_name?: string; status: string };
type ScheduleForm = { weekdays: number[]; local_time: string; duration_minutes: number; timezone: string; meet_url?: string; calendar_url?: string; organizer_email?: string; google_event_id?: string; connected?: boolean };
type GoogleStatus = { configured?: boolean; connected?: boolean; email?: string };
type AppUser = { id?: string; _id?: string; role?: string };
const errorDetail = (error: unknown): string | undefined => error && typeof error === "object" && "response" in error
  ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail : undefined;
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StandupPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [user, setUser] = useState<AppUser | null>(null);
  const [google, setGoogle] = useState<GoogleStatus>({ configured: false, connected: false });
  const [schedule, setSchedule] = useState<ScheduleForm>({ weekdays: [0, 1, 2, 3, 4], local_time: "10:00", duration_minutes: 15, timezone: "Asia/Kolkata" });
  const [history, setHistory] = useState<StandupRecord[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<StandupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState("history");
  const selected = useMemo(() => teams.find((team) => team._id === teamId), [teams, teamId]);
  const canManage = !!selected && (["admin", "hr"].includes((user?.role || "").toLowerCase()) || ((user?.role || "").toLowerCase() === "manager" && String(selected.manager_id) === String(user?.id || user?._id)));
  const calendarConnected = !!(google.connected || schedule.connected);

  const loadTeamData = useCallback(async (id: string) => {
    if (!id) return;
    setError("");
    const [scheduleRes, historyRes, calendarRes, taskRes] = await Promise.allSettled([
      api.get(`/teams/${id}/schedule`), api.get(`/standup/teams/${id}/summary`), api.get(`/teams/${id}/calendar`), api.get(`/teams/${id}/tasks`),
    ]);
    if (scheduleRes.status === "fulfilled" && scheduleRes.value.data) setSchedule((current) => ({ ...current, ...scheduleRes.value.data }));
    else if (scheduleRes.status === "rejected") setError(errorDetail(scheduleRes.reason) || "Could not load team schedule.");
    if (historyRes.status === "fulfilled") setHistory(historyRes.value.data || []);
    if (calendarRes.status === "fulfilled") setEvents(calendarRes.value.data || []);
    if (taskRes.status === "fulfilled") setTasks(taskRes.value.data || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, userRes, googleRes] = await Promise.all([api.get("/teams"), api.get("/auth/me"), api.get("/standup/google/status")]);
      const loadedTeams = teamRes.data || [];
      setTeams(loadedTeams); setUser(userRes.data); setGoogle(googleRes.data || {});
      const params = new URLSearchParams(window.location.search);
      if (params.get("google") === "connected") setNotice("Google Calendar connected. Your standup team is ready to schedule.");
      if (params.get("google") === "error") setError(params.get("message") || "Google Calendar connection failed.");
      const requested = params.get("team_id");
      const chosen = loadedTeams.find((team: Team) => team._id === requested)?._id || loadedTeams[0]?._id || "";
      setTeamId(chosen);
      if (chosen) await loadTeamData(chosen);
    } catch (e: unknown) { setError(errorDetail(e) || "Could not load team standups."); }
    finally { setLoading(false); }
  }, [loadTeamData]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (teamId) void loadTeamData(teamId); }, [teamId, loadTeamData]);

  const connectGoogle = async () => {
    try {
      const response = await api.get("/standup/google/authorize", { params: { team_id: teamId } });
      window.location.assign(response.data.url);
    } catch (e: unknown) { setError(errorDetail(e) || "Could not start Google Calendar authorization."); }
  };
  const saveSchedule = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await api.put(`/teams/${teamId}/schedule`, schedule);
      setSchedule(response.data); setNotice("Recurring team standup saved. Calendar invitations have been sent."); await loadTeamData(teamId);
    } catch (e: unknown) { setError(errorDetail(e) || "Could not save the team schedule."); }
    finally { setSaving(false); }
  };
  const clearSchedule = async () => {
    if (!window.confirm("Remove this recurring team standup from Google Calendar?")) return;
    try { await api.delete(`/teams/${teamId}/schedule`); setSchedule({ weekdays: [0,1,2,3,4], local_time: "10:00", duration_minutes: 15, timezone: "Asia/Kolkata" }); await loadTeamData(teamId); }
    catch (e: unknown) { setError(errorDetail(e) || "Could not remove the schedule."); }
  };
  const syncTranscripts = async () => {
    setSyncing(true); setError(""); setNotice("");
    try { const response = await api.post(`/standup/teams/${teamId}/sync-transcripts`); setNotice(`Imported ${response.data.imported?.length || 0} new transcript${response.data.imported?.length === 1 ? "" : "s"}; ${response.data.already_processed || 0} were already processed.`); await loadTeamData(teamId); }
    catch (e: unknown) { setError(errorDetail(e) || "Transcript sync failed. Check Meet transcript availability."); }
    finally { setSyncing(false); }
  };
  const toggleDay = (day: number) => setSchedule((current) => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter((d) => d !== day) : [...current.weekdays, day].sort() }));
  const updateTask = async (task: StandupTask, status: string) => { try { await api.patch(`/teams/${teamId}/tasks/${task.id}`, { status }); await loadTeamData(teamId); } catch (e: unknown) { setError(errorDetail(e) || "Could not update the task."); } };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  return <main className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Team operations</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-bold"><ListChecks className="h-8 w-8 text-primary" /> Daily Standups</h1><p className="mt-2 text-muted-foreground">Schedule team check-ins, capture blockers, and turn meeting transcripts into tracked actions.</p></div>
      <select aria-label="Select team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setSchedule({ weekdays: [0,1,2,3,4], local_time: "10:00", duration_minutes: 15, timezone: "Asia/Kolkata" }); }} className="min-w-56 rounded-lg border border-input bg-background px-4 py-3">{teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}</select>
    </header>
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{notice && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}
    {!selected ? <Card><CardContent className="p-10 text-center"><h2 className="font-semibold">No team is available for your account</h2><p className="mt-2 text-sm text-muted-foreground">Ask an organization admin or HR member to assign you to a team.</p></CardContent></Card> : <>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Recurring team schedule</CardTitle><CardDescription>Creates a repeating Google Calendar event and a Google Meet link, then invites the team roster.</CardDescription></CardHeader><CardContent className="space-y-5">
        {schedule.meet_url && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4"><Video className="h-5 w-5 text-emerald-500"/><div className="min-w-0 flex-1"><p className="font-medium">{selected.name} standup</p><p className="text-sm text-muted-foreground">{(schedule.weekdays || []).map((d: number) => weekdays[d]?.slice(0,3)).join(", ")} · {schedule.local_time} {schedule.timezone}</p></div><a className="text-sm text-primary underline" href={schedule.meet_url} target="_blank" rel="noreferrer">Join Meet</a>{schedule.calendar_url && <a className="text-sm text-primary underline" href={schedule.calendar_url} target="_blank" rel="noreferrer">Open Calendar</a>}</div>}
        {canManage ? <>
        {!calendarConnected ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"><div><p className="font-medium">Connect the organizer’s Google Calendar</p><p className="text-sm text-muted-foreground">The account that connects owns the recurring event and Meet link.</p></div><Button onClick={connectGoogle} disabled={!google.configured}>Connect Google Calendar</Button>{!google.configured && <p className="w-full text-xs text-muted-foreground">Google OAuth credentials are not configured on the server.</p>}</div> : <p className="text-sm text-emerald-600"><CheckCircle2 className="mr-2 inline h-4 w-4"/>Connected as {schedule.organizer_email || google.email || "Google account"}</p>}
          <div className="flex flex-wrap gap-2">{weekdays.map((day, index) => <button key={day} type="button" onClick={() => toggleDay(index)} className={`rounded-full border px-3 py-1.5 text-sm ${schedule.weekdays.includes(index) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{day.slice(0,3)}</button>)}</div>
          <div className="grid gap-4 sm:grid-cols-3"><label className="space-y-1 text-sm"><span>Local time</span><Input type="time" value={schedule.local_time} onChange={(e) => setSchedule({...schedule, local_time:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Duration (minutes)</span><Input type="number" min={5} max={180} value={schedule.duration_minutes} onChange={(e) => setSchedule({...schedule, duration_minutes:Number(e.target.value)})}/></label><label className="space-y-1 text-sm"><span>Timezone</span><Input value={schedule.timezone} onChange={(e) => setSchedule({...schedule, timezone:e.target.value})} placeholder="Asia/Kolkata"/></label></div>
          <div className="flex flex-wrap gap-2"><Button onClick={saveSchedule} disabled={saving || !calendarConnected || !schedule.weekdays.length}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Clock3 className="mr-2 h-4 w-4"/>}{schedule.google_event_id ? "Update schedule" : "Create recurring standup"}</Button>{schedule.google_event_id && <Button variant="outline" onClick={clearSchedule}>Remove schedule</Button>}</div>
        </> : <p className="text-sm text-muted-foreground">Only this team’s manager, an organization admin, or HR can change the schedule.</p>}
      </CardContent></Card>
      <div className="flex flex-wrap gap-2">{canManage && <><Button onClick={() => setModal(true)}><Plus className="mr-2 h-4 w-4"/>Add transcript</Button><Button variant="outline" onClick={syncTranscripts} disabled={syncing || !schedule.meet_url}>{syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}Sync Meet transcripts</Button></>}</div>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="history">Overview & history</TabsTrigger><TabsTrigger value="calendar">Team calendar</TabsTrigger><TabsTrigger value="tasks">Tasks & blockers</TabsTrigger></TabsList>
        <TabsContent value="history" className="space-y-4">{history.length ? history.map((item) => <Card key={item.id}><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base"><span>{new Date(item.date).toLocaleString()}</span><span className="text-sm font-normal text-muted-foreground">{item.source === "google_meet" ? "Google Meet transcript" : "Standup notes"} · {item.blockers?.length || 0} blockers</span></CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><div><h3 className="mb-2 font-medium">Summary</h3><p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.summary || "No summary"}</p></div><div><h3 className="mb-2 font-medium">Actions</h3><ul className="space-y-2">{(item.tasks || []).map((task, i) => <li key={i} className="rounded-md border p-2 text-sm">{task.title}<span className="ml-2 text-xs text-muted-foreground">{task.assignee_name || "Unassigned"}</span></li>)}{!(item.tasks || []).length && <li className="text-sm text-muted-foreground">No tasks identified</li>}</ul>{item.blockers && item.blockers.length > 0 && <div className="mt-3 space-y-1">{item.blockers.map((b,i)=><p key={i} className="text-sm text-destructive">{b.user_name}: {b.issue}</p>)}</div>}</div></CardContent></Card>) : <Card><CardContent className="p-8 text-center text-muted-foreground">No standup history yet. Add notes or sync a completed Meet transcript.</CardContent></Card>}</TabsContent>
        <TabsContent value="calendar" className="space-y-3">{events.length ? events.map((event) => <Card key={event.id}><CardContent className="flex flex-wrap items-center gap-4 p-4"><CalendarDays className="h-5 w-5 text-primary"/><div className="min-w-0 flex-1"><p className="font-medium">{event.title}</p><p className="text-sm text-muted-foreground">{event.start_time ? new Date(event.start_time).toLocaleString() : "Scheduled"}</p></div>{event.meet_url && <a className="inline-flex items-center gap-1 text-sm text-primary" href={event.meet_url} target="_blank" rel="noreferrer">Meet <ExternalLink className="h-3 w-3"/></a>}{event.calendar_url && <a className="text-sm text-muted-foreground" href={event.calendar_url} target="_blank" rel="noreferrer">Calendar</a>}</CardContent></Card>) : <Card><CardContent className="p-8 text-center text-muted-foreground">No calendar events yet. Create a recurring schedule or add events from transcript analysis.</CardContent></Card>}</TabsContent>
        <TabsContent value="tasks" className="space-y-3">{tasks.length ? tasks.map((task) => <Card key={task.id}><CardContent className="flex flex-wrap items-center gap-3 p-4"><ListChecks className="h-4 w-4 text-primary"/><div className="min-w-0 flex-1"><p className="font-medium">{task.title}</p><p className="text-sm text-muted-foreground">{task.assignee_name || "Unassigned"}{task.description ? ` · ${task.description}` : ""}</p></div><select value={task.status} onChange={(e) => updateTask(task,e.target.value)} disabled={!canManage && String(task.assignee_id) !== String(user?.id || user?._id)} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></select></CardContent></Card>) : <Card><CardContent className="p-8 text-center text-muted-foreground">No follow-up tasks yet.</CardContent></Card>}</TabsContent>
      </Tabs>
      <TranscriptModal teamId={teamId} isOpen={modal} onClose={() => setModal(false)} onSuccess={() => { void loadTeamData(teamId); setTab("history"); }}/>
    </>}</main>;
}
