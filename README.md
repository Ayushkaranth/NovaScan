# NovaScan: AI-Driven Enterprise Risk & SDLC Intelligence Platform

<div align="center">

![NovaScan Banner](https://img.shields.io/badge/NovaScan-AI%20Intelligence%20Platform-blue?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Privacy](https://img.shields.io/badge/Privacy-Zero%20Data%20Retention-emerald.svg?style=for-the-badge)](https://nova-scan.vercel.app)

**Bridge technical code changes, meeting discussions, and multi-platform SDLC workflows with zero data leakage.**

[Overview](#-overview) • [Key Features](#-key-features) • [Integrations](#-integrations) • [Workflow](#-end-to-end-workflow) • [Architecture](#-architecture) • [Security & Privacy](#-security--privacy-byok--zdr) • [Installation](#-installation--setup)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Software & Platform Integrations](#-integrations)
- [End-to-End Workflow](#-end-to-end-workflow)
- [System Architecture](#-architecture)
- [Security & Privacy (BYOK & ZDR)](#-security--privacy-byok--zdr)
- [Tech Stack Summary](#️-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Configuration Reference](#-configuration-reference)
- [License](#-license)

---

## 🌟 Overview

**NovaScan** is a production-grade, enterprise AI intelligence platform designed to bridge technical pull requests, team meetings, and software development lifecycle (SDLC) workflows with zero data leakage.

Traditional code scanning and security management tools operate in silos—generating excessive false positives because they lack organizational context. A critical hotfix pushed at 2 AM looks identical to a careless bug until you consider team communication and sprint meeting agreements.

NovaScan solves this by correlating **GitHub code diffs**, **Google Meet transcripts**, **Slack discussions**, and **Daily Standups** in real-time. It analyzes the human intent behind technical changes, auto-generates Meeting Minutes (MOM) in **Notion**, provisions actionable tasks in **Jira**, and alerts teams in **Slack**—all while enforcing strict **Bring Your Own Key (BYOK)** control and **Zero Data Retention (ZDR)** privacy.

---

## 🚀 Key Features

### 🧠 Contextual AI Risk & Intent Analysis
- **Intent-Aware Code Scoring**: Analyzes GitHub Pull Request diffs alongside Slack chat history and meeting agreements to distinguish between emergency hotfixes and genuine security regressions.
- **False Positive Elimination**: Reduces alert fatigue by understanding developer discussions prior to deployment.
- **Automated Triage Routing**: Automatically flags high-risk PRs for priority review and attaches actionable mitigation guidance.

### 🎥 Google Meet AI Transcription & Meeting Minutes (MOM)
- **Multi-Source Ingestion**: Ingests transcripts from free Chrome extensions, webhooks, VTT audio logs, or direct text paste.
- **Automated Notion MOM Publishing**: Formats meeting dialogue into structured Meeting Minutes (Executive Summary, Key Decisions, Risks) and auto-publishes to **Notion**.
- **Automated Jira Ticket Provisioning**: Identifies actionable technical tasks from meeting transcripts and auto-creates structured tickets in **Jira**.

### 🔐 Enterprise BYOK & BYOM Security Vault
- **Bring Your Own Key (BYOK)**: Enterprise teams configure their own API keys (**Google Gemini**, **OpenAI GPT-4o**, **Anthropic Claude**, or self-hosted **Ollama** endpoints).
- **AES-256 Envelope Encryption**: Client API keys are encrypted at rest using AES-256 (`crypto.py`). Plaintext credentials are never stored or exposed.
- **Zero-Cost System Fallback**: If a client team does not provide a custom key, NovaScan automatically falls back to our system's free Google Gemini API key as a zero-cost default.

### 🛡️ Zero Data Retention (ZDR) Privacy Guarantee
- **In-Memory Ephemeral Processing**: Code diffs and meeting transcripts are evaluated **strictly in-memory** within asynchronous server tasks.
- **Zero Corporate Data Persistence**: Source code, audio, and raw transcript text are **never saved** to NovaScan databases or logs. Only non-sensitive audit metadata (risk score, timestamp, ticket IDs) is retained.

### 📊 Role-Based Interactive Dashboard
- **Manager & Lead View**: Centralized risk heatmap, active PR feeds, and team velocity metrics.
- **Developer View**: Instant risk diagnostics, actionable fix recommendations, and automated task sync.
- **Dark Mode Support**: Modern, responsive Next.js dashboard with full dark/light theme persistence.

### 🔗 1-Click Enterprise OAuth 2.0 Connectors (No Secret Key Sharing)
- **Project-scoped connections**: Admins and project managers authorize GitHub, Slack, and Jira from an individual project. An organization can have many projects, and each project has its own independent provider connections; there is no shared organization-level integration page.
- **Zero Key Friction**: Teams connect software tools in one click without manually sharing private Personal Access Tokens (PATs) or secret credentials.
- **GitHub connector**: Installs the NovaScan GitHub App with access limited to the project’s selected repository.
- **Slack 1-Click OAuth ("Add to Slack")**: Standard OAuth 2.0 authorization (`channels:history`, `chat:write`) exchanging temporary codes for bot tokens.
- **Atlassian Jira 3LO OAuth**: 3-Legged OAuth integration with automatic background token renewal (`offline_access`).
- **AES-256 Token Vault**: All OAuth refresh tokens and credentials are encrypted at rest via envelope encryption (`oauth_token_manager.py`).

---

## 🔌 Integrations

NovaScan connects seamlessly with standard software engineering tools:

| Platform / Tool | Integration Mechanism | Functionality |
| :--- | :--- | :--- |
| **GitHub** | GitHub App / repository-scoped installation | Uses an installation token restricted to the project repository. |
| **Slack Workspace** | 1-Click OAuth 2.0 ("Add to Slack") | Real-time channel discussion context gathering and interactive visual security alerting. |
| **Atlassian Jira** | 3-Legged OAuth 2.0 (3LO) | Automated issue ticket provisioning for meeting action items and high-risk PRs with auto-refresh tokens. |
| **Google Meet** | Webhooks / Free Extensions / VTT | Meeting transcript ingestion, speaker dialogue parsing, and automated MOM extraction. |
| **Notion** | Notion REST API | Automated publishing of structured Meeting Minutes (MOM) and technical post-mortems. |
| **AI LLM Engines** | Gemini / OpenAI / Claude / Ollama | Multi-provider intelligence engine for risk scoring, intent analysis, and JSON schema enforcement. |

---

## 🔄 End-to-End Workflow

```
[1. INGESTION]          [2. BYOK & IN-MEMORY ZDR EVALUATION]         [3. AUTOMATED DISPATCH]

  GitHub Webhook ──┐                                                      ┌──> Jira Issue Tickets
                   ├──> In-Memory Payload ──> BYOK AI Engine ──> AI JSON  │
  Google Meet ─────┤    Sanitizer & Parser    (Gemini/GPT/   Analysis │──> Notion MOM Pages
                   │                          Ollama/Claude)          │
  Slack Events ────┘                                                      └──> Slack Visual Alerts
```

1. **Ingestion & Parsing**:
   - GitHub sends a webhook on PR creation/update.
   - Google Meet transcripts are received via webhook or UI upload.
   - Ingestion parsers (`github_parser.py`, `gmeet_parser.py`) extract structured text in-memory.
2. **BYOK & In-Memory ZDR Evaluation**:
   - The engine checks for customer-configured BYOK keys (or falls back to system free Gemini).
   - In-memory prompts evaluate code diffs or meeting dialogue for risks, decisions, and action items.
   - No raw code or transcript text touches permanent database storage (ZDR compliant).
3. **Automated Multi-Platform Dispatch**:
   - Action items automatically trigger Jira ticket creation (`jira_service.py`).
   - Formatted Meeting Minutes are auto-published as Notion pages (`notion_bot.py`).
   - Security alerts and risk summaries are posted to Slack channels (`slack_service.py`).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (Next.js 14)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Interactive Dashboard | GMeet Transcripts | BYOK Vault  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API / CORS
┌────────────────────────▼────────────────────────────────────────┐
│                  Backend Layer (Python FastAPI)                 │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Ingestion &   │  │ BYOK Vault   │  │ In-Memory ZDR    │    │
│  │ Webhook Engine│  │ (AES-256)    │  │ Risk Analyzer    │    │
│  └───────────────┘  └──────────────┘  └──────────────────┘    │
└─────┬──────────────────┬──────────────────┬───────────────────┘
      │                  │                  │
┌─────▼──────┐   ┌──────▼─────┐   ┌───────▼────────┐
│  GitHub &  │   │ Multi-LLM  │   │  Multi-Platform│
│ Google Meet│   │ Provider   │   │  Delivery      │
└────────────┘   └────────────┘   └────────────────┘
                       │                    │
             ┌─────────▼────────┐  ┌────────▼────────┐
             │ Gemini / OpenAI  │  │ Jira / Notion   │
             │ Anthropic / Ollama│ │ / Slack Alerts  │
             └──────────────────┘  └─────────────────┘
```

---

## 🛡️ Security & Privacy (BYOK & ZDR)

NovaScan is built from the ground up for privacy-conscious enterprise software teams:

1. **Zero Data Retention (ZDR):**
   - Transcripts, meeting dialogue, and proprietary source code diffs are held **only in transient memory** during the HTTP request lifecycle.
   - They are garbage-collected immediately after AI evaluation.
2. **Bring Your Own Key (BYOK):**
   - All AI calls run against the client company's direct cloud subscription account (Google Cloud, OpenAI, Anthropic, or local Ollama).
   - Chat context, prompts, and corporate IP remain exclusively under customer ownership.
3. **AES-256 Envelope Encryption:**
   - Any API keys configured in the BYOK settings page are encrypted at rest using AES-256-GCM envelope encryption (`crypto.py`).

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14** (App Router), **React 18** | Dashboard UI framework & SSR |
| | **Tailwind CSS** + **Shadcn/UI** | Responsive UI styling and components |
| | **Framer Motion** | Visual micro-animations & transitions |
| | **Recharts** | Risk telemetry and analytics visualization |
| **Backend** | **FastAPI** (Python 3.10+) | High-performance async ASGI web framework |
| | **Pydantic v2** & **Pydantic-Settings** | Schema validation & environment management |
| | **Motor** & **PyMongo** | Asynchronous MongoDB driver for audit logs |
| | **Redis (Upstash / Local)** | Fallback caching & rate limiting |
| | **Cryptographic Vault** | AES-256 encryption helper for client API keys |
| **AI / LLM** | **Google Gemini 1.5/2.5** | Free default & BYOK model integration |
| | **OpenAI GPT-4o / Claude 3.5 / Ollama** | Supported BYOK model providers |

---

## 📥 Installation & Setup

### Prerequisites
- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **MongoDB Atlas** or local MongoDB instance
- **Google Gemini API Key** (or custom BYOK API key)

### 1. Clone the Repository

```bash
git clone https://github.com/Ayushkaranth/NovaScan.git
cd NovaScan
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure OAuth credentials in backend/.env (create it if needed).
# In production, set FRONTEND_URL to the public frontend origin (for example,
# https://app.example.com) and BASE_URL to the public backend origin (for
# example, https://api.example.com). Do not leave FRONTEND_URL at localhost.
# Register these callback URLs in the matching provider app:
#   GitHub App user authorization callback: http://localhost:8000/api/v1/oauth/github/callback
#   Slack:    http://localhost:8000/api/v1/oauth/slack/callback
#   Atlassian:http://localhost:8000/api/v1/oauth/jira/callback
# For hosted deployments, register the matching public HTTPS backend URL
# (or set each provider's *_REDIRECT_URI to that exact registered URL).
# Configure GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY,
# GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET, and GITHUB_WEBHOOK_SECRET.
# Set GITHUB_APP_PRIVATE_KEY with newlines preserved or represented as \\n.
# In GitHub App settings, enable user authorization during installation and use
# the callback URL above; enable a webhook at
# https://api.example.com/api/v1/webhooks/github/app for pull_request events.
# Grant only Metadata: read, Contents: read, and Pull requests: read.
# Customers choose "Only select repositories" when installing the app. NovaScan
# verifies the project repository and mints tokens restricted to its repository ID.
# New connections use the GitHub App. Existing OAuth App project connections
# keep working until reconnected; then revoke the old NovaScan OAuth App grant
# under GitHub Settings > Applications > Authorized OAuth Apps.
# Also configure BASE_URL, FRONTEND_URL, SECRET_KEY, ENCRYPTION_SECRET_KEY, and
# the provider pairs SLACK_CLIENT_ID/SLACK_CLIENT_SECRET,
# JIRA_CLIENT_ID/JIRA_CLIENT_SECRET.
# Optional *_REDIRECT_URI values override the callback URL defaults above.
# Keep all secrets server-side; never add them to NEXT_PUBLIC_* variables.
# OAuth connections are authorized and managed from each project's page.
# The OAuth client credentials above configure the app; each project still
# requires its own approval in GitHub, Slack, or Atlassian.

# Start FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend will be live at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend dashboard will be live at `http://localhost:3000`.

---

## ⚙️ Configuration Reference

### Backend (`backend/.env`)

```env
PROJECT_NAME="NovaScan AI"
API_V1_STR="/api/v1"
SECRET_KEY="your_master_jwt_secret_key"

# Database Configuration
MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/novascan"
DB_NAME="novascan"
REDIS_URL="redis://localhost:6379"

# System Free Fallback AI Key
GEMINI_API_KEY="your_google_gemini_api_key"

# External Integrations
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
# Repository-scoped GitHub App integration:
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_SLUG="your-github-app-slug"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_CLIENT_ID="your_github_app_client_id"
GITHUB_APP_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_WEBHOOK_SECRET="your_github_app_webhook_secret"
# Legacy OAuth App values are only needed for older in-flight callbacks/connections:
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
JIRA_URL="https://your-domain.atlassian.net"
JIRA_EMAIL="user@company.com"
JIRA_API_TOKEN="your_jira_api_token"
NOTION_TOKEN="secret_your_notion_integration_token"
NOTION_DATABASE_ID="your_notion_database_id"
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
