"use client";

import { useEffect, useState } from "react";
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    ArrowUpRight,
    GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function RisksPage() {
    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");

    useEffect(() => {
        fetchRisks();
    }, []);

    const fetchRisks = async () => {
        try {
            // Fetch relevant risks (this endpoint now supports org-wide fetch)
            const res = await api.get("/risks?limit=100");
            setRisks(res.data || []);
        } catch (err) {
            console.error("Failed to fetch risks:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRisks = risks.filter(risk => {
        const matchesSearch =
            (risk.summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (risk.repo || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSeverity = severityFilter === "all" ? true :
            (risk.risk_score > 70 ? "high" : risk.risk_score > 40 ? "medium" : "low") === severityFilter;

        return matchesSearch && matchesSeverity;
    });

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
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500 flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8" />
                    Risk Feed
                </h1>
                <p className="text-muted-foreground mt-1">
                    Real-time analysis of potential vulnerabilities across your organization's codebase.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search risks or repositories..."
                        className="pl-9 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="low">Low Risk</SelectItem>
                    </SelectContent>
                </Select>
                <div className="ml-auto text-sm text-muted-foreground hidden md:block">
                    {filteredRisks.length} Issues Found
                </div>
            </div>

            {/* Risks List */}
            <div className="space-y-4">
                {filteredRisks.map((risk) => (
                    <div
                        key={risk._id}
                        className={cn(
                            "group flex flex-col md:flex-row gap-5 p-5 bg-card border rounded-xl transition-all hover:shadow-md",
                            risk.risk_score > 70 ? "border-red-200 dark:border-red-900/50 hover:border-red-300" : "border-border"
                        )}
                    >
                        {/* Icon & Score */}
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "p-3 rounded-lg shrink-0",
                                risk.risk_score > 70 ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500" :
                                    risk.risk_score > 40 ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-500" :
                                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                                    {risk.summary || "Potential Issue Detected"}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {risk.repo && (
                                        <Badge variant="outline" className="font-mono text-xs flex items-center gap-1">
                                            <GitBranch className="w-3 h-3" />
                                            {risk.repo}
                                        </Badge>
                                    )}
                                    <Badge variant={risk.risk_score > 70 ? "destructive" : "secondary"}>
                                        Score: {risk.risk_score}
                                    </Badge>
                                </div>
                            </div>

                            <p className="text-muted-foreground text-sm line-clamp-2">
                                {risk.description || "Automated scan detected a potential anomaly in this repository. Review recommended."}
                            </p>

                            <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {new Date(risk.timestamp).toLocaleDateString()}
                                </span>
                                {risk.project_id && (
                                    <Link href={`/projects/${risk.project_id}`} className="hover:text-primary hover:underline flex items-center gap-1">
                                        View Project <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredRisks.length === 0 && (
                    <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                        <h3 className="text-lg font-semibold">Clean Slate</h3>
                        <p className="text-muted-foreground">No risks found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
