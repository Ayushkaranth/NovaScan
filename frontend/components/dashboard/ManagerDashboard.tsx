import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FolderGit2,
    CheckCircle2,
    Clock,
    ArrowRight,
    Play,
    GitCommit,
    GitPullRequest,
    Activity,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export const ManagerDashboard = ({ orgData }: { orgData: any }) => {
    const { projects, role } = orgData;
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalRisks: 0,
        criticalRisks: 0
    });

    useEffect(() => {
        const fetchActivity = async () => {
            if (!projects || projects.length === 0) return;

            try {
                // Fetch organization risks
                const res = await api.get('/risks?limit=100');
                const allRisks = res.data || [];

                // Filter risks that belong to manager's projects
                const myProjectRepos = projects.map((p: any) => `${p.repo_owner}/${p.repo_name}`);
                const myRisks = allRisks.filter((risk: any) => myProjectRepos.includes(risk.repo));

                // Calculate Stats
                const critical = myRisks.filter((r: any) => (r.risk_score > 7) || (r.analysis && r.analysis.risk_score > 7)).length;

                setStats({
                    activeProjects: projects.length,
                    totalRisks: myRisks.length,
                    criticalRisks: critical
                });

                // Take top 5
                setRecentActivity(myRisks.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch activity", err);
            }
        };

        fetchActivity();
    }, [projects]);

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
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MiniStat icon={<FolderGit2 className="w-4 h-4 text-emerald-500" />} label="Active Projects" value={stats.activeProjects} />
                <MiniStat icon={<Activity className="w-4 h-4 text-blue-500" />} label="Total Risks" value={stats.totalRisks} />
                <MiniStat
                    icon={<ShieldAlert className={cn("w-4 h-4", stats.criticalRisks > 0 ? "text-red-500" : "text-slate-500")} />}
                    label="Critical Issues"
                    value={stats.criticalRisks}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Work Section (2/3) */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-emerald-600" />
                        Active Projects
                    </h2>

                    {(!projects || projects.length === 0) ? (
                        <EmptyState role={role} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map((project: any, idx: number) => (
                                <ProjectCard key={project._id} project={project} index={idx} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity (1/3) */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Recent Scans
                    </h2>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <ActivityItem key={idx} activity={activity} />
                            ))
                        ) : (
                            <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50">
                                <Activity className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm">No recent scans.</p>
                            </div>
                        )}
                    </div>
                </div>
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
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated 2h ago</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>24 commits</span>
                    </div>
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

const ActivityItem = ({ activity }: any) => {
    return (
        <div className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
            <div className="mt-1">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border",
                    activity.risk_score > 7
                        ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800"
                        : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700"
                )}>
                    {activity.risk_score > 7 ? <ShieldAlert className="w-4 h-4" /> : <GitPullRequest className="w-4 h-4" />}
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground truncate">{activity.pr_title || activity.summary}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{activity.repo}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Just now'}
                    </span>
                </div>
            </div>
        </div>
    )
}
