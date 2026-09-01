# NovaScan: AI-Driven Enterprise Risk & SDLC Intelligence Platform

<div align="center">

![NovaScan Banner](https://img.shields.io/badge/NovaScan-SaaS%20Intelligence-blue?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Privacy](https://img.shields.io/badge/Privacy-Zero%20Data%20Retention-emerald.svg?style=for-the-badge)](https://nova-scan.vercel.app)

**Bridge technical code changes, meeting discussions, and multi-platform SDLC workflows with zero data leakage.**

[Features](#-features) • [Architecture](#-architecture) • [Security & Privacy](#-security--privacy) • [Installation](#-installation) • [Usage](#-usage)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Security & Privacy (BYOK & ZDR)](#-security--privacy)
- [Architecture](#-architecture)
- [Tech Stack](#️-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [License](#-license)

---

## 🌟 Overview

**NovaScan** is a production-grade enterprise intelligence platform designed to bridge technical pull requests, Google Meet discussions, and team communications with automated SDLC workflow triage.

Unlike traditional static scanners or isolated tools, NovaScan analyzes code intent alongside team interactions to eliminate false positives, auto-generate Meeting Minutes (MOM) in Notion, provision Jira action tickets, and maintain an auditable risk record without storing corporate data.

---

## 🚀 Key Features

### 🎥 Google Meet AI Transcription & MOM Automation
- **Multi-Format Ingestion**: Accepts transcripts from free Chrome extensions, webhooks, VTT files, or direct text paste.
- **Automated MOM Publishing**: Generates structured Meeting Minutes (MOM) and auto-publishes them to **Notion**.
- **Jira Action Provisioning**: Extracts actionable technical tasks and automatically creates tickets in **Jira**.

### 🧠 Contextual AI Risk & Intent Analysis
- **Intent-Aware Risk Scoring**: Leverages LLMs to evaluate PR diffs alongside Slack context and meeting dialogue.
- **False Positive Elimination**: Differentiates between deliberate, developer-explained hotfixes and unmonitored architectural risks.
- **Multi-Channel Fan-Out**: Dispatches alerts to Slack and tracks real-time risk heatmaps.

### 🔐 Enterprise BYOK & BYOM Security Vault
- **Bring Your Own Key (BYOK)**: Teams supply their own API keys (**Google Gemini**, **OpenAI**, **Anthropic**, or **Ollama**). All chat context remains strictly within customer accounts.
- **AES-256 Encryption**: Client credentials are encrypted at rest using AES-256 envelope encryption (`crypto.py`).
- **Free System Fallback**: Automatically falls back to our system's free Google Gemini API key if no custom key is provided.

### 🛡️ Zero Data Retention (ZDR) Privacy
- **In-Memory Execution**: Code diffs and full transcript text are evaluated strictly in-memory within ephemeral tasks.
- **Zero Raw Data Persistence**: Corporate source code and meeting audio/text are **never stored** on NovaScan servers or databases.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 Dashboard (GMeet, BYOK Vault, Risk Feed)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────────┐
│                   Backend Layer (FastAPI)                       │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ GMeet Ingestion│  │ BYOK Router  │  │ ZDR In-Memory    │    │
│  │ & PR Parser   │  │ & AES Vault  │  │ Risk Analyzer    │    │
│  └───────────────┘  └──────────────┘  └──────────────────┘    │
└─────┬──────────────────┬──────────────────┬───────────────────┘
      │                  │                  │
┌─────▼──────┐   ┌──────▼─────┐   ┌───────▼────────┐
│  GitHub /  │   │   BYOK     │   │   Delivery     │
│ Google Meet│   │ AI Engine  │   │   Services     │
└────────────┘   └────────────┘   └────────────────┘
                       │                    │
             ┌─────────▼────────┐  ┌────────▼────────┐
             │ Gemini / OpenAI  │  │ Jira / Notion   │
             │ Anthropic / Ollama│ │ / Slack Alerts  │
             └──────────────────┘  └─────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | **Next.js 14** (App Router) | Full-stack React UI & SSR |
| | **TailwindCSS** + **Shadcn/UI** | Responsive Styling & UI Components |
| | **Framer Motion** | Visual Micro-animations |
| **Backend** | **FastAPI** (Python 3.10) | High-performance Async ASGI Engine |
| | **AES-256 Vault** (`crypto.py`) | Encrypted Key Management |
| | **Motor / PyMongo** | Async Database Client for Metadata Logs |
| **AI Engine** | **Google Gemini / OpenAI / Anthropic / Ollama** | Multi-Provider BYOK Engine |
| **Integrations**| **Google Meet**, **Notion API**, **Jira Cloud API**, **Slack API**, **GitHub API** | End-to-end SDLC Automation |

---

## 📥 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas URI
- Google Gemini API Key (or custom BYOK key)

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## ⚙️ Configuration (`backend/.env`)

```env
PROJECT_NAME="NovaScan AI"
API_V1_STR="/api/v1"
SECRET_KEY="your_master_jwt_secret_key"

# Database
MONGODB_URL="mongodb+srv://..."
DB_NAME="novascan"
REDIS_URL="redis://localhost:6379"

# System Free Fallback AI Key
GEMINI_API_KEY="AIzaSy..."

# Integrations
SLACK_BOT_TOKEN="xoxb-..."
GITHUB_ACCESS_TOKEN="ghp_..."
JIRA_URL="https://your-domain.atlassian.net"
JIRA_API_TOKEN="..."
NOTION_TOKEN="secret_..."
NOTION_DATABASE_ID="..."
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
