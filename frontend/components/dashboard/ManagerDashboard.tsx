"use client";

import { motion } from "framer-motion";
import {
    FolderGit2,
    CheckCircle2,
    Clock,
    ArrowRight,
    Play,
    GitCommit,
    GitPullRequest
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const ManagerDashboard = ({ orgData }: { orgData: any }) => {
    const { projects, role } = orgData;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Workspace</h1>
                    <p className="text-muted-foreground mt-1">
                        Let's get to work. You have <span className="font-semibold text-foreground">{projects?.length || 0} active projects</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Clock className="w-4 h-4" />
                        Time Log
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Play className="w-4 h-4 fill-current" />
                        Start Session
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStat icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} label="Tasks Done" value="12" />
                <MiniStat icon={<GitPullRequest className="w-4 h-4 text-purple-500" />} label="PRs Open" value="3" />
                <MiniStat icon={<GitCommit className="w-4 h-4 text-blue-500" />} label="Commits" value="45" />
                <MiniStat icon={<Clock className="w-4 h-4 text-orange-500" />} label="Hours" value="6.5" />
            </div>

            {/* Active Work Section */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-emerald-600" />
                    Active Projects
                </h2>

                {(!projects || projects.length === 0) ? (
                    <EmptyState role={role} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project: any, idx: number) => (
                            <ProjectCard key={project._id} project={project} index={idx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub Components ---

const MiniStat = ({ icon, label, value }: any) => (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
        <div className="p-2 bg-muted rounded-md">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
)

const ProjectCard = ({ project, index }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-card hover:bg-muted/30 border border-border rounded-xl p-5 flex flex-col h-full transition-all hover:shadow-lg hover:border-emerald-500/30"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50">
                    <FolderGit2 className="w-6 h-6" />
                </div>
                <div className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    In Progress
                </div>
            </div>

            <h3 className="text-lg font-bold tracking-tight mb-1 group-hover:text-emerald-500 transition-colors">
                {project.name}
            </h3>
            <p className="text-sm text-muted-foreground font-mono mb-4 truncate">
                {project.repo_owner}/{project.repo_name}
            </p>

            <div className="mt-auto space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Completion</span>
                        <span>{(Math.random() * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.random() * 100} className="h-1.5 bg-muted" indicatorClassName="bg-emerald-500" />
                </div>

                <div className="flex gap-2">
                    <Button asChild size="sm" className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900">
                        <Link href={`/projects/${project._id}`}>
                            View Details
                        </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="px-2">
                        <Link href={`/projects/${project._id}/settings`}>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}

const EmptyState = ({ role }: { role: string }) => (
    <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
        <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderGit2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold">No active projects</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto mt-2">
            You haven't been assigned to any projects yet.
            {role === 'manager' ? " Create one to get started." : " Contact your manager."}
        </p>
    </div>
)
