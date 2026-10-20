"use client";

import { useEffect, useState } from "react";
import {
    Shield,
    Save,
    Trash2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [org, setOrg] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    
    const [activeTab, setActiveTab] = useState("general");

    const [formData, setFormData] = useState({
        name: ""
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

            setFormData({ name: currentOrg?.name || "" });

        } catch (err) {
            console.error("Failed to load settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!org) return;
        setSaving(true);
        try {
            await api.put(`/organizations/${org._id}`, { name: formData.name });
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
                {activeTab === "general" && <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                    <TabsTrigger value="general">General</TabsTrigger>
                    {/* <TabsTrigger value="billing">Billing</TabsTrigger> */}
                    <TabsTrigger value="danger" className="text-red-500 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 dark:data-[state=active]:bg-red-900/20">Danger Zone</TabsTrigger>
                </TabsList>

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
