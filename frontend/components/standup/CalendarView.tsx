"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

interface Event {
    id: string;
    title: string;
    start_time: string;
    description: string;
    attendees: string[];
}

interface CalendarViewProps {
    projectId: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchEvents();
        }
    }, [projectId]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Assuming API Base URL is configured in axios or we used a relative path
            // Next.js rewrites might handle /api proxying, or we use full URL
            // For now, assuming relative path to Next.js API route which proxies to Backend
            // Or if calling backend directly: 
            const token = localStorage.getItem("token"); // Basic auth assumption
            const response = await axios.get(`http://localhost:8000/api/v1/standup/${projectId}/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(response.data);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading calendar...</div>;
    }

    if (events.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    No upcoming events found for this project.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="bg-background">
                                {new Date(event.start_time).toLocaleDateString()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="flex items-start gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 mt-1 text-primary" />
                            <CardTitle className="text-sm font-medium leading-tight">
                                {event.title}
                            </CardTitle>
                        </div>
                        {event.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                                {event.description}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
