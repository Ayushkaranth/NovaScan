"use client";

import { motion } from "framer-motion";
import {
    Building2,
    Users,
    ShieldAlert,
    Activity,
    ArrowUpRight,
    Briefcase,
    Plus,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export const HRDashboard = ({ orgData, dashboardStats }: { orgData: any, dashboardStats: any }) => {
    const { organization, stats } = orgData;
    const { total_risks } = dashboardStats || {};
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await api.get('/risks?limit=5');
                setRecentActivity(res.data || []);
            } catch (err) {
                console.error("Failed to fetch recent activity", err);
            }
        };
        fetchActivity();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, Admin. Here's what's happening at <span className="font-semibold text-foreground">{organization.name}</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Manage Team button removed as per user request */}
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Employees"
                    value={stats?.total_employees || 0}
                    icon={<Users className="w-5 h-5 text-indigo-600" />}
                    trend="+12% from last month"
                    color="indigo"
                />
                <StatCard
                    title="Active Projects"
                    value={stats?.active_projects || 0}
                    icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                    trend="Stable"
                    color="blue"
                />
                <StatCard
                    title="Critical Risks"
                    value={total_risks || 0}
                    icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
                    trend="Requires Attention"
                    color="red"
                    alert={total_risks > 0}
                />
                <StatCard
                    title="Health Score"
                    value="98%"
                    icon={<Activity className="w-5 h-5 text-emerald-600" />}
                    trend="Excellent"
                    color="emerald"
                />
            </div>

            {/* Split View: Recent Activity & Risk Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Activity (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">View All</Button>
                    </div>

                    <div className="space-y-4">
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.map((activity: any, idx: number) => (
                                <ActivityItem key={idx} activity={activity} />
                            ))
                        ) : (
                            <div className="p-12 border border-dashed rounded-xl flex flex-col items-center justify-center text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50">
                                <Activity className="w-10 h-10 mb-3 opacity-20" />
                                <p>No recent activity requiring attention.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Notices (1/3 width) */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold tracking-tight">System Status</h2>
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-medium">All Systems Operational</span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Database</span>
                                <span className="text-emerald-600 font-medium">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">API Gateway</span>
                                <span className="text-emerald-600 font-medium">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Risk Engine</span>
                                <span className="text-emerald-600 font-medium">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const StatCard = ({ title, value, icon, trend, color, alert }: any) => {
    const colorStyles: any = {
        indigo: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50",
        blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50",
        red: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50",
        emerald: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-5 rounded-xl border transition-all duration-200 hover:shadow-md",
                "bg-card text-card-foreground",
                alert && "border-red-500/50 ring-1 ring-red-500/20"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg", colorStyles[color])}>
                    {icon}
                </div>
                {alert && <Badge variant="destructive" className="animate-pulse">Action Required</Badge>}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-3xl font-bold tracking-tight mt-1">{value}</h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    {color === "red" && alert ? (
                        <span className="text-red-500 font-medium flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            {trend}
                        </span>
                    ) : (
                        <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                            {trend !== "Stable" && <ArrowUpRight className="w-3 h-3" />}
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}


const ActivityItem = ({ activity }: any) => {
    return (
        <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
            <div className="mt-1">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border",
                    activity.risk_score > 50
                        ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800"
                        : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700"
                )}>
                    {activity.risk_score > 50 ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground">{activity.summary}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">Just now</span>
                </div>
                {activity.risk_score > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={activity.risk_score > 70 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                            Risk Score: {activity.risk_score}
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    )
}
