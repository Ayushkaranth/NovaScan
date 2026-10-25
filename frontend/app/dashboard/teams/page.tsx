"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Loader2, Pencil, Plus, Search, Shield, Trash2, Users } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Member = { _id: string; name: string; email: string; role: string; profile_image?: string; teams?: string[] };
type Team = { _id: string; name: string; description?: string; manager_id: string; member_ids: string[]; standup_schedule?: any };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);

  const canManage = ["admin", "hr"].includes((user?.role || "").toLowerCase());
  const membersById = useMemo(() => new Map(members.map((member) => [String(member._id), member])), [members]);
  const managers = members.filter((member) => member.role === "manager");
  const selectableMembers = members.filter((member) => ["employee", "admin", "hr"].includes(member.role));
  const filteredMembers = selectableMembers.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()));

  const load = async () => {
    setLoading(true);
    try {
      const [teamRes, rosterRes, userRes] = await Promise.all([
        api.get("/teams"),
        api.get("/organizations/members/list", { params: { limit: 2000 } }),
        api.get("/auth/me"),
      ]);
      setTeams(teamRes.data || []);
      setMembers(rosterRes.data?.members || []);
      setUser(userRes.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Could not load organization teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const assignedElsewhere = (memberId: string) => teams.some((team) => team._id && team._id !== "draft" && team.manager_id !== memberId && team.member_ids.includes(memberId));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/teams", { name, description, manager_id: managerId, member_ids: memberIds });
      setName(""); setDescription(""); setManagerId(""); setMemberIds([]); setQuery("");
      await load();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Could not create this team.");
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async (teamId: string) => {
    if (!window.confirm("Delete this team and its standup schedule? Historical standup records are retained.")) return;
    try {
      await api.delete(`/teams/${teamId}`);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Could not delete the team.");
    }
  };

  const toggleMember = (id: string) => setMemberIds((current) => current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id]);
  const toggleEditMember = (id: string) => setEditMemberIds((current) => current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id]);
  const saveTeam = async (teamId: string) => {
    setSaving(true); setError("");
    try { await api.put(`/teams/${teamId}`, { manager_id: editManagerId, member_ids: editMemberIds }); setEditingId(""); await load(); }
    catch (e: any) { setError(e.response?.data?.detail || "Could not update team membership."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-6 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Organization</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold"><Users className="h-8 w-8 text-primary" /> Teams</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Organize employees and managers into teams, then schedule each team’s recurring standup.</p>
        </div>
        <Link href="/dashboard/standup"><Button variant="outline">Open standups</Button></Link>
      </header>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your teams</h2><span className="text-sm text-muted-foreground">{teams.length} {teams.length === 1 ? "team" : "teams"}</span></div>
          {teams.length === 0 ? <Card><CardContent className="p-8 text-center"><Users className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No teams yet</p><p className="mt-1 text-sm text-muted-foreground">Create a team to schedule its standup and track actions.</p></CardContent></Card> : teams.map((team) => {
            const manager = membersById.get(String(team.manager_id));
            const roster = team.member_ids.map((id) => membersById.get(String(id))).filter(Boolean) as Member[];
            return <Card key={team._id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div><CardTitle className="flex items-center gap-2">{team.name}<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{roster.length} members</span></CardTitle><CardDescription className="mt-1">{team.description || "No team description"}</CardDescription></div>
                {canManage && <div className="flex"><Button variant="ghost" size="icon" aria-label={`Edit ${team.name}`} onClick={() => { setEditingId(editingId === team._id ? "" : team._id); setEditManagerId(team.manager_id); setEditMemberIds(team.member_ids.filter((id) => id !== team.manager_id)); }}><Pencil className="h-4 w-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${team.name}`} onClick={() => removeTeam(team._id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-primary" /><span className="text-muted-foreground">Manager</span><span className="font-medium">{manager?.name || manager?.email || "Assigned manager"}</span></div>
                <div className="flex flex-wrap gap-2">{roster.slice(0, 8).map((member) => <span key={member._id} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs">{member.name || member.email}</span>)}{roster.length > 8 && <span className="rounded-full bg-muted px-2.5 py-1 text-xs">+{roster.length - 8}</span>}</div>
                {team.standup_schedule ? <p className="text-xs text-emerald-600">Standup scheduled · {team.standup_schedule.local_time} {team.standup_schedule.timezone}</p> : <p className="text-xs text-muted-foreground">No recurring standup scheduled</p>}
                {editingId === team._id && <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Team manager</label><Select value={editManagerId} onValueChange={setEditManagerId}><SelectTrigger><SelectValue placeholder="Choose a manager" /></SelectTrigger><SelectContent>{managers.map((member) => { const busy = teams.some((other) => other._id !== team._id && (other.manager_id === member._id || other.member_ids.includes(member._id))); return <SelectItem key={member._id} value={member._id} disabled={busy}>{member.name || member.email}{busy ? " · already assigned" : ""}</SelectItem>; })}</SelectContent></Select></div>
                  <label className="block text-sm font-medium">Employees and observers</label><div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">{selectableMembers.map((member) => { const busy = ["employee", "manager"].includes(member.role) && teams.some((other) => other._id !== team._id && (other.manager_id === member._id || other.member_ids.includes(member._id))); const chosen = editMemberIds.includes(member._id); return <label key={member._id} className={`flex items-center gap-2 rounded p-2 text-sm ${busy ? "opacity-50" : "cursor-pointer hover:bg-muted"}`}><input type="checkbox" checked={chosen} disabled={busy} onChange={() => toggleEditMember(member._id)} /><span className="min-w-0 flex-1 truncate">{member.name || member.email}<span className="ml-2 text-xs capitalize text-muted-foreground">{member.role}{busy ? " · already assigned" : ""}</span></span></label>; })}</div>
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingId("")}>Cancel</Button><Button disabled={saving || !editManagerId} onClick={() => saveTeam(team._id)}>{saving ? "Saving…" : "Save team"}</Button></div>
                </div>}
              </CardContent>
            </Card>;
          })}
        </section>

        {canManage && <section>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create a team</CardTitle><CardDescription>Managers and employees can belong to one team. Admins and HR can be included in multiple teams.</CardDescription></CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-2"><label className="text-sm font-medium" htmlFor="team-name">Team name</label><Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Platform Engineering" required minLength={2} maxLength={100} /></div>
                <div className="space-y-2"><label className="text-sm font-medium" htmlFor="team-description">Description <span className="text-muted-foreground">(optional)</span></label><Input id="team-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Core platform and reliability" maxLength={500} /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Team manager</label><Select value={managerId} onValueChange={setManagerId}><SelectTrigger><SelectValue placeholder="Choose a manager" /></SelectTrigger><SelectContent>{managers.map((member) => <SelectItem key={member._id} value={String(member._id)} disabled={assignedElsewhere(String(member._id))}>{member.name || member.email}{assignedElsewhere(String(member._id)) ? " · already assigned" : ""}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team members</label>
                  <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees and HR/admin observers" /></div>
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                    {filteredMembers.map((member) => {
                      const assigned = ["employee", "manager"].includes(member.role) && assignedElsewhere(String(member._id));
                      const checked = memberIds.includes(String(member._id));
                      return <label key={member._id} className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60 ${assigned ? "cursor-not-allowed opacity-50" : ""}`}>
                        <input type="checkbox" checked={checked} disabled={assigned} onChange={() => toggleMember(String(member._id))} className="h-4 w-4 accent-primary" />
                        <span className="min-w-0 flex-1"><span className="block truncate font-medium">{member.name || "Unknown user"}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
                        <span className="text-xs capitalize text-muted-foreground">{assigned ? "Already on a team" : member.role}</span>
                      </label>;
                    })}
                    {filteredMembers.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">No matching members.</p>}
                  </div>
                  <p className="text-xs text-muted-foreground">{memberIds.length} selected. The manager is included automatically.</p>
                </div>
                <Button className="w-full" type="submit" disabled={saving || !name.trim() || !managerId}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BriefcaseBusiness className="mr-2 h-4 w-4" />}Create team</Button>
              </form>
            </CardContent>
          </Card>
        </section>}
      </div>
    </main>
  );
}
