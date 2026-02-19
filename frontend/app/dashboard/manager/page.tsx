"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { Loader2 } from "lucide-react";

export default function ManagerPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch projects and risks for manager
                const [projectsRes, userRes] = await Promise.all([
                    api.get("/projects"),
                    api.get("/auth/me")
                ]);

                setData({
                    projects: projectsRes.data,
                    role: userRes.data.role
                });
            } catch (err) {
                console.error("Failed to fetch manager data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <ManagerDashboard orgData={data} />;
}
