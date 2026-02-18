"use client"

import { useState } from "react"
import axios from "axios"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface TranscriptModalProps {
    projectId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

interface AnalysisResult {
    tasks: { title: string; description: string; assignee_name: string; assignee_id: string }[]
    events: { title: string; date: string; time: string; description: string }[]
    blockers: { user_name: string; issue: string; user_id: string }[]
    summary: string
}

export function TranscriptModal({ projectId, isOpen, onClose, onSuccess }: TranscriptModalProps) {
    const [transcript, setTranscript] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)

    if (!isOpen) return null

    const handleAnalyze = async () => {
        if (!transcript.trim()) return
        setIsAnalyzing(true)
        try {
            const response = await axios.post(`http://localhost:8000/api/v1/standup/${projectId}/analyze`, {
                transcript
            })
            setResult(response.data)
        } catch (error) {
            console.error("Analysis failed:", error)
            alert("Failed to analyze transcript. Please try again.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleConfirm = async () => {
        if (!result) return
        setIsExecuting(true)
        try {
            await axios.post(`http://localhost:8000/api/v1/standup/${projectId}/execute`, result)
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Execution failed:", error)
            alert("Failed to execute automations.")
        } finally {
            setIsExecuting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col bg-background border-border shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                    <CardTitle>Add Standup Transcript</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {!result ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="transcript">Paste Transcript</Label>
                                <textarea
                                    id="transcript"
                                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Paste the daily standup discussion here..."
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Includes tasks, blockers, and important dates discussed in the meeting.
                                </p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleAnalyze} disabled={isAnalyzing || !transcript.trim()}>
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        "Analyze Transcript"
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Proposed Tasks */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Badge variant="outline">Tasks</Badge> Proposed Jira Tickets
                                    </h3>
                                    <div className="space-y-2">
                                        {result.tasks.map((task, i) => (
                                            <Card key={i} className="bg-muted/30">
                                                <CardContent className="p-3">
                                                    <div className="font-medium text-sm">{task.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">Assignee: {task.assignee_name}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {result.tasks.length === 0 && <span className="text-sm text-muted-foreground italic">No tasks detected</span>}
                                    </div>
                                </div>

                                {/* Proposed Events */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Badge variant="outline">Events</Badge> Calendar Updates
                                    </h3>
                                    <div className="space-y-2">
                                        {result.events.map((event, i) => (
                                            <Card key={i} className="bg-muted/30">
                                                <CardContent className="p-3">
                                                    <div className="font-medium text-sm">{event.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">{event.date} at {event.time}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {result.events.length === 0 && <span className="text-sm text-muted-foreground italic">No events detected</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Blockers */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Badge variant="destructive">Blockers</Badge> Critical Issues
                                </h3>
                                <div className="space-y-2">
                                    {result.blockers.map((blocker, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-md bg-red-500/10 border border-red-500/20">
                                            <span className="font-bold">{blocker.user_name}:</span>
                                            <span>{blocker.issue}</span>
                                        </div>
                                    ))}
                                    {result.blockers.length === 0 && <span className="text-sm text-muted-foreground italic">No blockers detected</span>}
                                </div>
                            </div>

                            {/* Summary Preview */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Badge variant="secondary">Summary</Badge> Slack Message Preview
                                </h3>
                                <div className="p-4 rounded-md border bg-muted/20 text-sm whitespace-pre-wrap font-mono h-[150px] overflow-y-auto">
                                    {result.summary}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setResult(null)}>
                                    Back to Edit
                                </Button>
                                <Button onClick={handleConfirm} disabled={isExecuting}>
                                    {isExecuting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Executing Automations...
                                        </>
                                    ) : (
                                        "Confirm & Execute"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
