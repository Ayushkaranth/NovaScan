================================================================================
                      SOFTWARE COPYRIGHT REGISTRATION DRAFT
                      GOVERNMENT OF INDIA - COPYRIGHT OFFICE
================================================================================
PROJECT NAME : NovaScan (AI-Driven Project Intelligence Platform)
APPLICATION TYPE : Computer Software Work
DOCUMENT TYPE  : Source Code PDF Compilation (First 10 & Last 10 Pages Rule)
SANITISED FOR  : IPR Filing (All local paths & secrets stripped)
================================================================================


--------------------------------------------------------------------------------
PAGE 1 — COVER PAGE (SECTION 1: GENERAL PARTICULARS)
--------------------------------------------------------------------------------
1. Title of the Work: 
   NovaScan: AI-Driven Project Intelligence Platform

2. Nature / Description of the Work:
   An enterprise software system providing automated risk analysis, PR intent classification, 
   and workflow triage by correlating GitHub pull request diffs with Slack context using Google Gemini.

3. Name, Address & Nationality of Applicants / Authors:
   [Insert Applicant Name(s)]
   [Insert Organization / University Name]
   Nationality: Indian

4. Date of Creation / Completion:
   2026

5. Language of the Software Work:
   Python 3.10+, TypeScript, JavaScript (HTML5/CSS3)

6. Environment & Operating Platform:
   Cross-platform (Linux, Windows, macOS, Node.js runtime, FastAPI ASGI engine)


--------------------------------------------------------------------------------
PAGE 2 — THIRD-PARTY MATERIAL REGISTER (SECTION 3)
--------------------------------------------------------------------------------

3A. OPEN-SOURCE SOFTWARE REGISTER:
+-----------------------+-----------------------------------------------+---------------+-------------------+---------------------------------------------------+
| Component             | Source / Repository                           | Licence       | As-Is / Modified  | Attribution / Action Taken                        |
+-----------------------+-----------------------------------------------+---------------+-------------------+---------------------------------------------------+
| FastAPI               | PyPI / fastapi/fastapi                        | MIT           | As-Is             | Core backend REST API framework                   |
| Next.js Framework     | npm / vercel/next.js                          | MIT           | As-Is             | Full-stack React dashboard UI framework           |
| React & React DOM     | npm / facebook/react                          | MIT           | As-Is             | Frontend component architecture                   |
| Motor (Async Driver)  | PyPI / mongodb/motor                          | Apache 2.0    | As-Is             | Async driver for MongoDB database                 |
| PyMongo               | PyPI / mongodb/mongo-python-driver            | Apache 2.0    | As-Is             | MongoDB connectivity library                      |
| Uvicorn               | PyPI / encode/uvicorn                         | BSD 3-Clause  | As-Is             | ASGI web server implementation                    |
| Pydantic & Settings   | PyPI / pydantic/pydantic                      | MIT           | As-Is             | Data validation & schema enforcement              |
| Google GenAI SDK      | PyPI / google-gemini/generative-ai-python     | Apache 2.0    | As-Is             | Google Gemini AI model client library             |
| Slack Python SDK      | PyPI / slackapi/python-slack-sdk              | MIT           | As-Is             | Slack API integration library                     |
| Jira Python SDK       | PyPI / pytqa/jira                             | BSD 2-Clause  | As-Is             | Jira ticket triage API integration                |
| HTTPX                 | PyPI / encode/httpx                           | BSD 3-Clause  | As-Is             | Async HTTP client library                         |
| Python-JOSE & Bcrypt  | PyPI / mpdavis/python-jose                    | MIT           | As-Is             | JWT token encoding & password hashing             |
| Tailwind CSS          | npm / tailwindlabs/tailwindcss                | MIT           | As-Is             | Utility CSS styling library                       |
| Framer Motion         | npm / framer/motion                           | MIT           | As-Is             | UI animation & transition library                 |
| Radix UI Primitives   | npm / radix-ui/primitives                     | MIT           | As-Is             | Accessible unstyled UI components                 |
| Recharts              | npm / recharts/recharts                       | MIT           | As-Is             | Dashboard charting & analytics                     |
| Lucide React          | npm / lucide-icons/lucide                     | ISC           | As-Is             | Vector icon system                                |
| Axios                 | npm / axios/axios                             | MIT           | As-Is             | Client HTTP request library                       |
+-----------------------+-----------------------------------------------+---------------+-------------------+---------------------------------------------------+

3B. THIRD-PARTY & COMMERCIAL SERVICES / PRETRAINED MODELS REGISTER:
+-------------------------------+---------------------------------------+-----------------------------------+-------------------+---------------------------------------------------+
| Component                     | Source / Provider                     | Licence / Terms of Service        | As-Is / Modified  | Attribution / Action Taken                        |
+-------------------------------+---------------------------------------+-----------------------------------+-------------------+---------------------------------------------------+
| Google Gemini 1.5 Flash Model | Google AI Studio / Google Cloud       | Google Cloud AI Terms of Service  | As-Is             | Pretrained LLM queried for PR risk analysis       |
| GitHub REST API & Webhooks    | GitHub / Microsoft                    | GitHub API Terms of Service       | As-Is             | Ingestion source for Pull Request diff metadata   |
| Slack Web API                 | Slack Technologies / Salesforce       | Slack Developer Terms             | As-Is             | Communication integration & alerting service      |
| Atlassian Jira REST API       | Atlassian                             | Atlassian Developer Terms         | As-Is             | Issue tracking & automated ticket creation        |
| MongoDB Atlas                 | MongoDB Inc.                          | MongoDB Cloud Services Agreement  | As-Is             | Cloud database hosting project risk records       |
+-------------------------------+---------------------------------------+-----------------------------------+-------------------+---------------------------------------------------+


--------------------------------------------------------------------------------
PAGES 3–12: FIRST 10 PAGES OF SOURCE CODE
--------------------------------------------------------------------------------

=== [PAGE 3] FILE: backend/main.py ===
"""
NovaScan Backend - Main Application Server Entry Point
"""
from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, connect_to_redis, close_redis_connection
from app.api.v1.api import api_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Databases
    await connect_to_mongo()
    await connect_to_redis()
    yield
    # Shutdown: Close Database Connections
    await close_mongo_connection()
    await close_redis_connection()

# --- INITIALIZE APP ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- CONFIGURE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTE INCLUSION ---
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "NovaScan AI Backend is Running 🚀"}


=== [PAGE 4–6] FILE: backend/app/services/intelligence/risk_analyzer.py ===
"""
NovaScan AI Risk Analyzer - Rule & Persona Orchestration Engine
"""
from app.services.intelligence.llm_engine import generate_insight

async def analyze_risk(event: dict) -> dict:
    """
    Analyzes an incoming event (GitHub PR, Jira Ticket, Slack Msg) using Gemini
    to determine if it poses a risk to the project.
    """
    
    # 1. Select Persona based on Event Source
    if event["source"] == "github":
        persona = "You are a Senior Staff Engineer. Look for breaking API changes, security flaws, risky dependencies, or lack of tests."
    elif event["source"] == "jira":
        persona = "You are a Technical Product Manager. Look for vague requirements, scope creep, sudden priority spikes, or unrealistic deadlines."
    elif event["source"] == "slack":
        persona = "You are an Agile Delivery Lead. Look for signs of team blocking, miscommunication, delays, or frustration."
    else:
        persona = "You are a Project Risk Analyst."

    # 2. Construct System Prompt
    system_instruction = f"""
    {persona}
    
    Your task is to analyze the following project event and determine if it requires attention.
    
    Output strictly in this JSON format:
    {{
        "is_risky": boolean,
        "risk_score": integer (1-10),
        "reason": "A concise, one-sentence explanation of the risk.",
        "action_needed": "A short, actionable recommendation for the team."
    }}
    
    Rules:
    - If risk_score < 4, set is_risky to false.
    - If code changes involve database schemas, authentication, or payments, risk_score must be at least 8.
    - Be concise.
    """

    # 3. Construct Data Payload
    user_content = f"""
    Event Source: {event['source']}
    Action: {event['action']}
    Actor: {event['actor']}
    Summary: {event['summary']}
    
    Full Content/Diff/Message:
    {event['content']}
    """

    # 4. Invoke LLM Engine
    try:
        analysis = await generate_insight(system_instruction, user_content)
        return analysis

    except Exception as e:
        # Fallback Safe Return
        return {
            "is_risky": False,
            "risk_score": 0,
            "reason": "AI Analysis temporarily unavailable",
            "action_needed": "Manual review recommended"
        }


=== [PAGE 7–9] FILE: backend/app/services/intelligence/llm_engine.py ===
"""
NovaScan LLM Engine - Google Gemini API Integration Layer
"""
import google.generativeai as genai
import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "[REDACTED_API_KEY]")
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-1.5-flash" 

async def analyze_code(diff: str, pr_details: dict):
    """
    Analyzes a code diff for technical risks using Google Gemini model.
    """
    if not diff or len(diff) < 10:
        return {"risk_score": 0, "summary": "No significant code changes detected.", "is_risky": False}

    prompt = f"""
    You are a Senior Staff Engineer. Analyze this Pull Request.
    
    PR Title: {pr_details.get('title')}
    PR Description: {pr_details.get('body')}
    
    Code Diff:
    {diff[:15000]}

    Identify 1 major risk (Security, Performance, or Reliability).
    If no major risk, say "Low Risk".

    Respond ONLY in this JSON format:
    {{
        "risk_score": <number 1-10>,
        "reason": "<short explanation>",
        "is_risky": <boolean true/false>
    }}
    """

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        
        text_response = response.text.strip()
        if text_response.startswith("```"):
            text_response = text_response.strip("`").replace("json", "").strip()

        return json.loads(text_response)

    except Exception as e:
        logger.error(f"LLM Engine Exception: {str(e)}")
        return {
            "risk_score": 5, 
            "reason": "AI Analysis temporarily unavailable. Manual review recommended.", 
            "is_risky": True 
        }


=== [PAGE 10–12] FILE: backend/app/api/v1/endpoints/webhooks.py ===
"""
NovaScan GitHub Webhook Ingestion & Automated Alert Routing Route
"""
from fastapi import APIRouter, Request, HTTPException, Header
import hmac
import hashlib
import os

router = APIRouter()
WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "[REDACTED_SECRET]")

@router.post("/github")
async def github_webhook(request: Request, x_hub_signature_256: str = Header(None)):
    payload_body = await request.body()
    
    if WEBHOOK_SECRET != "[REDACTED_SECRET]" and x_hub_signature_256:
        signature = "sha256=" + hmac.new(WEBHOOK_SECRET.encode(), payload_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, x_hub_signature_256):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
            
    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event")
    
    if event_type == "pull_request":
        action = payload.get("action")
        if action in ["opened", "synchronize"]:
            pr_data = payload.get("pull_request", {})
            return {
                "status": "success",
                "message": "PR Webhook processed for NovaScan Risk Evaluation",
                "pr_id": pr_data.get("number")
            }

    return {"status": "ignored", "reason": "Event type not monitored"}


--------------------------------------------------------------------------------
PAGES 13–22: LAST 10 PAGES OF SOURCE CODE
--------------------------------------------------------------------------------

=== [PAGE 13–15] FILE: frontend/app/layout.tsx ===
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovaScan AI - Intelligence Platform",
  description: "AI-Driven Project Risk & Communication Intelligence Layer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}


=== [PAGE 16–22] FILE: frontend/app/page.tsx ===
"use client";

import { Navbar } from "@/components/Navbar";
import HeroSection from "@/components/ui/HeroSection";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { IntegrationsBeam } from "@/components/ui/IntegrationsBeam";
import { InteractivePlayground } from "@/components/landing/InteractivePlayground";
import { RoleBasedInsights } from "@/components/landing/RoleBasedInsights";
import { Github, FileText, Slack, Terminal, Activity, BrainCircuit, Zap, Lock, Cloud, Server } from "lucide-react";

function WorkflowStep({ step, title, desc, icon, highlight = false }: any) {
  return (
    <div className={`relative bg-card rounded-2xl p-8 border ${highlight ? 'border-primary ring-2 ring-primary/20 shadow-xl' : 'border-border shadow-sm'} flex flex-col items-center text-center z-10 transition-transform hover:-translate-y-2 duration-300`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-muted border border-border'}`}>
        {icon}
      </div>
      <div className="absolute top-6 right-6 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
        Step {step}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <Navbar />
      <HeroSection />

      {/* --- INTEGRATIONS BEAM --- */}
      <div className="py-20 flex flex-col items-center justify-center space-y-8 bg-muted/10 border-y border-border/50">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold tracking-tight mb-2">The Central Intelligence Layer</h2>
          <p className="text-muted-foreground">Connecting code changes with team communication in real-time.</p>
        </div>
        <IntegrationsBeam />
      </div>

      {/* --- INTERACTIVE PLAYGROUND --- */}
      <div id="playground" className="scroll-mt-32 mb-40">
        <InteractivePlayground />
      </div>

      {/* --- WORKFLOW VISUALIZATION --- */}
      <div id="workflow" className="mb-40">
        <div className="text-center mb-20 px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">From Code to Context</h2>
          <p className="text-muted-foreground mt-4 text-xl max-w-2xl mx-auto">Connecting pull requests to Jira tickets and Slack discussions.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative px-6">
          <WorkflowStep
            step="01"
            title="Ingest"
            desc="NovaScan receives webhooks from GitHub and Slack automatically upon code push or channel discussion."
            icon={<Github className="w-6 h-6 text-foreground" />}
          />
          <WorkflowStep
            step="02"
            title="Analyze"
            desc="NovaScan AI parses the code diff, assesses architectural impact, and computes a risk score."
            icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            highlight
          />
          <WorkflowStep
            step="03"
            title="Act"
            desc="Automated alert dispatch to Slack and Jira issue creation for high-risk changes."
            icon={<Zap className="w-6 h-6 text-amber-500" />}
          />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-border bg-card py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">NovaScan AI</span>
          </div>
          <p>© 2026 NovaScan Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
================================================================================
                              END OF SOURCE CODE PDF COMPILATION
================================================================================
