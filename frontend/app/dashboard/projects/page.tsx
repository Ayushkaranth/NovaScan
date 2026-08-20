"use client";

import { useEffect, useState } from "react";
import {
    LayoutGrid,
    Plus,
    Search,
    GitBranch,
    MoreHorizontal,
    FolderGit2,
    Calendar,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get("/projects?limit=50");
            setProjects(res.data || []);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.repo_name || "").toLowerCase().includes(searchQuery.toLowerCase())
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <LayoutGrid className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                        Projects
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of all active engineering projects and their integration status.
                    </p>
                </div>
                {/* New Project button removed as per user request */}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects by name or repo..."
                        className="pl-9 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                    Showing {filteredProjects.length} projects
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, idx) => (
                    <div
                        key={project._id}
                        className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-500/30 transition-all duration-300"
                    >
                        {/* Card Header */}
                        <div className="p-6 pb-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <FolderGit2 className="w-6 h-6" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/projects/${project._id}/settings`}>Settings</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                                {project.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                                <GitBranch className="w-3 h-3" />
                                {project.repo_owner}/{project.repo_name}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="px-6 py-4 flex-1 border-t border-border bg-muted/50 dark:bg-muted/10 space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</span>
                                    <Badge variant="outline" className="text-[10px] font-normal border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                                        On Track
                                    </Badge>
                                </div>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                            {["JD", "MK", "AL"][i - 1]}
                                        </div>
                                    ))}
                                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                        +2
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {(project.integrations || ['github', 'slack']).map((integ: string) => (
                                    <Badge key={integ} variant="secondary" className="text-[10px] uppercase tracking-wider px-2 py-0.5 border-border bg-background">
                                        {integ}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 border-t border-border flex items-center justify-between bg-card">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Updated recently
                            </span>
                            <Button asChild size="sm" variant="ghost" className="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-0 h-auto font-medium">
                                <Link href={`/projects/${project._id}`} className="flex items-center gap-1 px-3 py-1.5">
                                    View Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))}

                {filteredProjects.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
                        <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <h3 className="text-lg font-semibold text-foreground">No projects found</h3>
                        <p className="mb-6">Get started by creating your first project.</p>
                        <Button asChild>
                            <Link href="/projects/new">Create Project</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
