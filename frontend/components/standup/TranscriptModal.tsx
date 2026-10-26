"use client"

import { useState } from "react"
import api from "@/lib/api"
import { FileText, FolderOpen, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface TranscriptModalProps {
    teamId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    driveEnabled: boolean
    drivePickerConfigured: boolean
    onEnableDrive: () => void
}

interface AnalysisResult {
    tasks: { title: string; description: string; assignee_name: string; assignee_id: string }[]
    events: { title: string; date: string; time: string; description: string }[]
    blockers: { user_name: string; issue: string; user_id: string }[]
    summary: string
    source?: "manual_transcript" | "google_drive"
    source_file_id?: string
    source_name?: string
}

export function TranscriptModal({ teamId, isOpen, onClose, onSuccess, driveEnabled, drivePickerConfigured, onEnableDrive }: TranscriptModalProps) {
    const [transcript, setTranscript] = useState("")
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)

    if (!isOpen) return null

    const handleAnalyze = async () => {
        if (!transcriptFile && !transcript.trim()) return
        setIsAnalyzing(true)
        setUploadError("")
        try {
            let response
            if (transcriptFile) {
                const data = new FormData()
                data.append("file", transcriptFile)
                response = await api.post(`/standup/teams/${teamId}/analyze-upload`, data, { headers: { "Content-Type": "multipart/form-data" } })
            } else {
                response = await api.post(`/standup/teams/${teamId}/analyze`, { transcript })
            }
            setResult(response.data)
        } catch (error) {
            console.error("Analysis failed:", error)
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
            setUploadError(detail || "Failed to analyze transcript. Please try again.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleChooseFromDrive = async () => {
        if (!driveEnabled) {
            onEnableDrive()
            return
        }
        if (!drivePickerConfigured) {
            setUploadError("Google Drive Picker isn’t configured yet. Add GOOGLE_DRIVE_API_KEY and GOOGLE_CLOUD_PROJECT_NUMBER to the backend environment.")
            return
        }
        setUploadError("")
        try {
            const configResponse = await api.get("/standup/google/drive/picker-config")
            const config = configResponse.data as { access_token: string; api_key: string; app_id: string }
            const loadPicker = () => new Promise<void>((resolve, reject) => {
                const pickerWindow = window as any
                if (!pickerWindow.gapi) return reject(new Error("Google Picker could not load"))
                pickerWindow.gapi.load("picker", { callback: resolve })
            })
            const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-picker="true"]')
            if (!(window as any).gapi && !existingScript) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement("script")
                    script.src = "https://apis.google.com/js/api.js"
                    script.async = true
                    script.dataset.googlePicker = "true"
                    script.onload = () => resolve()
                    script.onerror = () => reject(new Error("Google Picker script could not be loaded"))
                    document.head.appendChild(script)
                })
            } else if (!(window as any).gapi && existingScript) {
                await new Promise<void>((resolve, reject) => {
                    existingScript.addEventListener("load", () => resolve(), { once: true })
                    existingScript.addEventListener("error", () => reject(new Error("Google Picker script could not be loaded")), { once: true })
                })
            }
            await loadPicker()
            const pickerWindow = window as any
            const picker = pickerWindow.google.picker
            const view = new picker.DocsView(picker.ViewId.DOCS)
                .setMimeTypes("application/vnd.google-apps.document")
                .setMode(picker.DocsViewMode.LIST)
            const builder = new picker.PickerBuilder()
                .setDeveloperKey(config.api_key)
                .setAppId(config.app_id)
                .setOAuthToken(config.access_token)
                .addView(view)
                .setTitle("Choose a transcript in Google Drive")
                .setCallback(async (data: any) => {
                    if (data.action !== picker.Action.PICKED || !data.docs?.[0]) return
                    setIsAnalyzing(true)
                    try {
                        const doc = data.docs[0]
                        const response = await api.post(`/standup/teams/${teamId}/drive-transcript`, { file_id: doc.id })
                        setResult({ ...response.data, source: "google_drive" })
                    } catch (error) {
                        const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                        setUploadError(detail || "Could not import that Google Docs transcript.")
                    } finally {
                        setIsAnalyzing(false)
                    }
                })
            builder.build().setVisible(true)
        } catch (error) {
            const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
            setUploadError(detail || (error instanceof Error ? error.message : "Could not open Google Drive."))
        }
    }

    const handleConfirm = async () => {
        if (!result) return
        setIsExecuting(true)
        try {
            await api.post(`/standup/teams/${teamId}/execute`, result)
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
                                <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-4">
                                    <Label htmlFor="transcript-file" className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload a transcript file</Label>
                                    <input id="transcript-file" type="file" accept=".txt,.text,.pdf,text/plain,application/pdf" onChange={(event) => {
                                        const file = event.target.files?.[0] || null
                                        if (file && file.size > 10 * 1024 * 1024) {
                                            setUploadError("Transcript files must be 10 MB or smaller.")
                                            event.target.value = ""
                                            return
                                        }
                                        setUploadError("")
                                        setTranscriptFile(file)
                                    }} className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-medium file:text-primary-foreground" />
                                    {transcriptFile && <p className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" />{transcriptFile.name}<button type="button" className="text-primary underline" onClick={() => setTranscriptFile(null)}>Remove</button></p>}
                                    <p className="text-xs text-muted-foreground">Supports .txt, .text, and text-based PDF files up to 10 MB. Scanned PDFs need OCR and aren’t supported yet.</p>
                                </div>
                                <Button type="button" variant="outline" onClick={handleChooseFromDrive} disabled={isAnalyzing}>
                                    <FolderOpen className="mr-2 h-4 w-4" />{driveEnabled ? "Choose a transcript from Google Drive" : "Enable Google Drive transcript access"}
                                </Button>
                                <Label htmlFor="transcript">Or paste transcript text</Label>
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
                            {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
                            <div className="flex justify-end">
                                <Button onClick={handleAnalyze} disabled={isAnalyzing || (!transcriptFile && !transcript.trim())}>
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
                                    <Badge variant="outline">Tasks</Badge> Proposed follow-up actions
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
                                <Badge variant="secondary">Summary</Badge> Standup notes preview
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
