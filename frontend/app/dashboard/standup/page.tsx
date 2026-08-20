"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CalendarView } from "@/components/standup/CalendarView";
import { TranscriptModal } from "@/components/standup/TranscriptModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, ListChecks, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StandupPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [summaries, setSummaries] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchSummaries(selectedProjectId);
        }
    }, [selectedProjectId]);

    const fetchData = async () => {
        try {
            const [projectsRes, userRes] = await Promise.all([
                api.get("/projects?limit=50"),
                api.get("/auth/me"),
            ]);
            console.log("Fetched Projects:", projectsRes.data);
            const projs = projectsRes.data || [];
            setProjects(projs);
            setUser(userRes.data);

            if (projs.length > 0) {
                setSelectedProjectId(projs[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch initial data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummaries = async (projectId: string) => {
        try {
            const res = await api.get(`/standup/${projectId}/summary`);
            setSummaries(res.data || []);
        } catch (err) {
            console.error("Failed to fetch summaries:", err);
        }
    };

    const selectedProject = projects.find((p) => p._id === selectedProjectId);

    // RBAC Check
    const canAddTranscript = user && selectedProject && (
        user.role === 'hr' ||
        (user.role === 'manager' && selectedProject.manager_id === user._id)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ListChecks className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        Daily Standups
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Automate task tracking, identify blockers, and sync calendars.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Select
                        value={selectedProjectId || ""}
                        onValueChange={setSelectedProjectId}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project._id} value={project._id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {canAddTranscript && (
                        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Transcript
                        </Button>
                    )}
                </div>
            </div>

            {!selectedProjectId ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    {projects.length === 0 ? (
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-muted-foreground">No projects found</h3>
                            <p className="text-sm text-muted-foreground">You need to look at or create a project to view standups.</p>
                        </div>
                    ) : (
                        <h3 className="text-lg font-medium text-muted-foreground">Select a project to view standups</h3>
                    )}
                </div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <History className="w-4 h-4" /> Overview & History
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Team Calendar
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Recent Summaries */}
                        <div className="grid gap-4">
                            {summaries.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        No standup history found. Add a transcript to get started.
                                    </CardContent>
                                </Card>
                            ) : (
                                summaries.map((summary) => (
                                    <Card key={summary.id}>
                                        <CardHeader className="bg-muted/30 pb-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">{new Date(summary.date).toLocaleDateString()}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(summary.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <Badge variant={summary.blockers.length > 0 ? "destructive" : "secondary"}>
                                                    {summary.blockers.length} Blockers
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Tasks Identified</h4>
                                                <ul className="space-y-2">
                                                    {summary.tasks.map((t: any, idx: number) => (
                                                        <li key={idx} className="text-sm p-2 bg-background rounded border border-border flex justify-between">
                                                            <span>{t.title}</span>
                                                            <Badge variant="secondary" className="text-[10px]">{t.assignee_name}</Badge>
                                                        </li>
                                                    ))}
                                                    {summary.tasks.length === 0 && <li className="text-sm text-muted-foreground italic">None</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Summary</h4>
                                                <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                                                    {summary.summary}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar">
                        <CalendarView projectId={selectedProjectId} />
                    </TabsContent>
                </Tabs>
            )}

            {selectedProjectId && (
                <TranscriptModal
                    projectId={selectedProjectId}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchSummaries(selectedProjectId);
                        // Also trigger calendar refresh if possible, or just let page reload do it
                    }}
                />
            )}
        </div>
    );
}
