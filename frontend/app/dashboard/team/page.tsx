"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Search,
    Shield,
    Briefcase,
    MoreVertical,
    Mail,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function TeamPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get("/organizations/members/list");
            setMembers(res.data.members || []);
        } catch (err) {
            console.error("Failed to fetch members:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(member =>
        (member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email || "").toLowerCase().includes(searchQuery.toLowerCase())
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
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage users, roles, and access permissions for your organization.
                    </p>
                </div>
                {/* Invite Member button removed as per user request */}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                    Showing {filteredMembers.length} members
                </div>
            </div>

            {/* Members List */}
            <div className="grid gap-4">
                {filteredMembers.map((member) => (
                    <div
                        key={member._id}
                        className="flex flex-col md:flex-row items-center gap-4 p-4 bg-card border border-border rounded-xl transition-all hover:shadow-md hover:border-primary/20 group"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                            {(member.name || "User").charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-semibold text-lg">{member.name}</h3>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mt-0.5">
                                <Mail className="w-3 h-3" />
                                {member.email}
                            </div>
                        </div>

                        {/* Role Badge */}
                        <div className="min-w-[100px] flex justify-center">
                            <Badge variant="secondary" className={cn(
                                "capitalize px-3 py-1",
                                member.role === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
                                    member.role === 'manager' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            )}>
                                {member.role === 'admin' && <Shield className="w-3 h-3 mr-1.5" />}
                                {member.role === 'manager' && <Briefcase className="w-3 h-3 mr-1.5" />}
                                {member.role}
                            </Badge>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600">Remove User</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                {filteredMembers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No members found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
