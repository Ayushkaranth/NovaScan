"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    CreditCard,
    Shield,
    Save,
    Trash2,
    Github,
    Slack,
    Terminal,
    FileText,
    Key,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [org, setOrg] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    
    const [activeTab, setActiveTab] = useState("integrations");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");

    const [formData, setFormData] = useState({
        name: "",
        github_token: "",
        slack_token: "",
        slack_channel: "",
        jira_url: "",
        jira_email: "",
        jira_token: "",
        notion_token: "",
        notion_database_id: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 1. Fetch Current Org
            const orgRes = await api.get("/organizations/me");
            const currentOrg = orgRes.data.organization;

            // 2. Fetch Projects
            const projRes = await api.get("/projects?limit=100");
            const fetchedProjects = projRes.data || [];
            
            setOrg(currentOrg);
            setProjects(fetchedProjects);

            let initialFormData = {
                name: currentOrg?.name || "",
                github_token: "",
                slack_token: "",
                slack_channel: "",
                jira_url: "",
                jira_email: "",
                jira_token: "",
                notion_token: "",
                notion_database_id: ""
            };

            const urlParams = new URLSearchParams(window.location.search);
            const projectIdFromUrl = urlParams.get('project');
            
            let initialProject = null;
            if (projectIdFromUrl && fetchedProjects.find((p: any) => p._id === projectIdFromUrl)) {
                initialProject = fetchedProjects.find((p: any) => p._id === projectIdFromUrl);
                setSelectedProjectId(projectIdFromUrl);
            } else if (fetchedProjects.length > 0) {
                initialProject = fetchedProjects[0];
                setSelectedProjectId(fetchedProjects[0]._id);
            }

            if (initialProject && initialProject.settings) {
                initialFormData = {
                    ...initialFormData,
                    github_token: initialProject.settings.github_access_token || "",
                    slack_token: initialProject.settings.slack_bot_token || "",
                    slack_channel: initialProject.settings.slack_channel || "",
                    jira_url: initialProject.settings.jira_url || "",
                    jira_email: initialProject.settings.jira_email || "",
                    jira_token: initialProject.settings.jira_api_token || "",
                    notion_token: initialProject.settings.notion_token || "",
                    notion_database_id: initialProject.settings.notion_database_id || ""
                };
            }

            setFormData(initialFormData);

        } catch (err) {
            console.error("Failed to load settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        const project = projects.find(p => p._id === projectId);
        if (project) {
            setFormData(prev => ({
                ...prev,
                github_token: project.settings?.github_access_token || "",
                slack_token: project.settings?.slack_bot_token || "",
                slack_channel: project.settings?.slack_channel || "",
                jira_url: project.settings?.jira_url || "",
                jira_email: project.settings?.jira_email || "",
                jira_token: project.settings?.jira_api_token || "",
                notion_token: project.settings?.notion_token || "",
                notion_database_id: project.settings?.notion_database_id || ""
            }));
        }
    };

    const handleSave = async () => {
        if (!org) return;
        setSaving(true);
        try {
            if (activeTab === "general") {
                await api.put(`/organizations/${org._id}`, { name: formData.name });
            } else if (activeTab === "integrations") {
                if (!selectedProjectId) {
                    alert("Please select a project to save integrations.");
                    setSaving(false);
                    return;
                }
                await api.put(`/projects/${selectedProjectId}/settings`, {
                    github_access_token: formData.github_token,
                    slack_bot_token: formData.slack_token,
                    slack_channel: formData.slack_channel,
                    jira_url: formData.jira_url,
                    jira_email: formData.jira_email,
                    jira_api_token: formData.jira_token,
                    notion_token: formData.notion_token,
                    notion_database_id: formData.notion_database_id
                });
                
                // Update local state
                setProjects(prev => prev.map(p => {
                    if (p._id === selectedProjectId) {
                        return {
                            ...p,
                            settings: {
                                ...p.settings,
                                github_access_token: formData.github_token,
                                slack_bot_token: formData.slack_token,
                                slack_channel: formData.slack_channel,
                                jira_url: formData.jira_url,
                                jira_email: formData.jira_email,
                                jira_api_token: formData.jira_token,
                                notion_token: formData.notion_token,
                                notion_database_id: formData.notion_database_id
                            }
                        };
                    }
                    return p;
                }));
            }
            alert("Settings saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async (projectId: string, projectName: string) => {
        if (!confirm(`Are you sure you want to delete the project "${projectName}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/projects/${projectId}`);
            setProjects(prev => prev.filter(p => p._id !== projectId));
        } catch (e) {
            alert("Failed to delete project.");
        }
    };

    const handleDeleteOrg = async () => {
        if (!org) return;
        const confirmName = prompt(`To confirm deletion, type "${org.name}" below:`);
        if (confirmName !== org.name) {
            if (confirmName) alert("Organization name does not match.");
            return;
        }

        try {
            await api.delete(`/organizations/delete/${org._id}`);
            window.location.href = "/"; // Redirect to home/login
        } catch (e) {
            alert("Failed to delete organization.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage configurations for <span className="font-semibold text-foreground">{org?.name}</span>.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                    {/* <TabsTrigger value="billing">Billing</TabsTrigger> */}
                    <TabsTrigger value="danger" className="text-red-500 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 dark:data-[state=active]:bg-red-900/20">Danger Zone</TabsTrigger>
                </TabsList>

                {/* === INTEGRATIONS TAB === */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Selection</CardTitle>
                            <CardDescription>Select a project to configure its integrations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md">
                                <Label>Project</Label>
                                <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedProjectId ? (
                        <>
                            {/* GitHub */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Github className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">GitHub Configuration</CardTitle>
                                <CardDescription>Access token for repository scanning.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Personal Access Token</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        className="pl-9 font-mono"
                                        value={formData.github_token}
                                        onChange={e => setFormData({ ...formData, github_token: e.target.value })}
                                        placeholder="ghp_..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Slack */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                <Slack className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Slack Alerts</CardTitle>
                                <CardDescription>Configure where to send real-time risk alerts.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Bot User OAuth Token</Label>
                                <Input
                                    type="password"
                                    className="font-mono"
                                    value={formData.slack_token}
                                    onChange={e => setFormData({ ...formData, slack_token: e.target.value })}
                                    placeholder="xoxb-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Channel ID</Label>
                                <Input
                                    value={formData.slack_channel}
                                    onChange={e => setFormData({ ...formData, slack_channel: e.target.value })}
                                    placeholder="C0123456789"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Jira */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Jira Integration</CardTitle>
                                <CardDescription>Sync issues and tasks with Jira.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Jira Domain URL</Label>
                                <Input
                                    value={formData.jira_url}
                                    onChange={e => setFormData({ ...formData, jira_url: e.target.value })}
                                    placeholder="https://your-org.atlassian.net"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.jira_email}
                                    onChange={e => setFormData({ ...formData, jira_email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>API Token</Label>
                                <Input
                                    type="password"
                                    className="font-mono"
                                    value={formData.jira_token}
                                    onChange={e => setFormData({ ...formData, jira_token: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notion */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Notion Integration</CardTitle>
                                <CardDescription>Sync documentation and notes.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Integration Token</Label>
                                <Input
                                    type="password"
                                    className="font-mono"
                                    value={formData.notion_token}
                                    onChange={e => setFormData({ ...formData, notion_token: e.target.value })}
                                    placeholder="secret_..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Database ID</Label>
                                <Input
                                    className="font-mono"
                                    value={formData.notion_database_id}
                                    onChange={e => setFormData({ ...formData, notion_database_id: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                        </>
                    ) : (
                        <Alert>
                            <AlertTitle>No project selected</AlertTitle>
                            <AlertDescription>Please select a project above to configure integrations.</AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                {/* === GENERAL TAB === */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Profile</CardTitle>
                            <CardDescription>
                                Update your organization's public information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Organization ID</Label>
                                <Input value={org?._id} disabled className="bg-muted font-mono" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* === DANGER ZONE TAB === */}
                <TabsContent value="danger" className="space-y-6">
                    <Alert variant="destructive">
                        <Shield className="h-4 w-4" />
                        <AlertTitle>Danger Zone</AlertTitle>
                        <AlertDescription>
                            Actions here are irreversible. Please proceed with caution.
                        </AlertDescription>
                    </Alert>

                    {/* Delete Projects */}
                    <Card className="border-red-200 dark:border-red-900/50">
                        <CardHeader>
                            <CardTitle className="text-red-600 dark:text-red-500">Manage Projects</CardTitle>
                            <CardDescription>Delete specific engineering projects and their data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No projects to delete.</p>
                            ) : (
                                projects.map(proj => (
                                    <div key={proj._id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div>
                                            <p className="font-medium">{proj.name}</p>
                                            <p className="text-xs text-muted-foreground">{proj.repo_owner}/{proj.repo_name}</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProject(proj._id, proj.name)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Delete Organization */}
                    <Card className="border-red-500 bg-red-50 dark:bg-red-950/10">
                        <CardHeader>
                            <CardTitle className="text-red-700 dark:text-red-400">Delete Organization</CardTitle>
                            <CardDescription className="text-red-600/80 dark:text-red-400/80">
                                Permanently remove this organization and all its data.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="destructive" className="w-full" onClick={handleDeleteOrg}>
                                Delete {org?.name}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
