"use client";

import { LucideIcon } from "lucide-react";

export const PlaceholderState = ({ title, description, icon: Icon }: { title: string, description: string, icon: LucideIcon }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card border border-dashed rounded-xl animate-in fade-in-50">
            <div className="bg-muted p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-md">{description}</p>
        </div>
    );
};
