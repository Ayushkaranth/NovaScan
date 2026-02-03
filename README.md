# NovaScan: AI-Driven Project Intelligence Platform

<div align="center">

![NovaScan Banner](https://img.shields.io/badge/NovaScan-AI%20Intelligence-blue?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)

**Bridge the gap between code changes and team communication with intelligent risk assessment**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#️-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**NovaScan** is a production-grade AI-driven project intelligence platform designed to bridge the gap between technical code changes and team communication. By correlating GitHub pull requests with real-time Slack conversation history, NovaScan provides high-accuracy risk assessments that understand the human intent behind code pushes.

### The Problem

Traditional security scanning tools generate excessive false positives because they lack context. A critical hotfix pushed at 2 AM during an outage looks identical to a careless mistake—until you consider the surrounding team discussions.

### The Solution

NovaScan analyzes code changes alongside Slack conversations to differentiate between:
- **Deliberate emergency fixes** during high-pressure incidents
- **Careless mistakes** that require immediate attention
- **Routine changes** that pose minimal risk

This contextual awareness enables engineering teams to focus on genuine security issues while maintaining velocity during critical situations.

---

## 🚀 Key Features

### 🧠 Contextual AI Analysis
- **Intent-Aware Risk Scoring**: Leverages Google Gemini to analyze PR diffs alongside real-time Slack discussions
- **False Positive Reduction**: Understands developer intent by correlating code changes with team communication
- **Multi-Source Intelligence**: Combines technical analysis with organizational context

### ⚡ Automated Triage Loop
- **Smart Jira Integration**: Automatically generates detailed tickets for high-risk changes
- **Real-time Slack Alerts**: Sends formatted security reports with risk scores to designated channels
- **Multi-Platform Coordination**: Connects developers, managers, and security leads seamlessly

### 🔧 Zero-Config Onboarding
- **One-Click Setup**: Automatically installs GitHub webhooks and configures integrations
- **Secure Credential Storage**: Safely stores API tokens and secrets in MongoDB Atlas
- **Multi-Tenant Support**: Manage multiple projects and teams from a unified dashboard

### 📊 Interactive Dashboard
- **Real-time Monitoring**: Modern Next.js interface for tracking security feeds
- **Project Management**: Centralized view of all monitored repositories
- **Historical Analysis**: Long-term trend analysis and audit trail capabilities

### 🔒 Enterprise Security
- **Role-Based Access Control (RBAC)**: Employees access only assigned projects
- **Audit Logging**: Permanent historical record of all AI decisions and risk assessments
- **Compliance Ready**: Structured intelligence for presentations and security audits

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 Dashboard + TailwindCSS + Framer Motion     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Backend Layer (FastAPI)                     │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Webhook      │  │  AI Risk     │  │  Integration     │    │
│  │  Handler      │  │  Analyzer    │  │  Orchestrator    │    │
│  └───────────────┘  └──────────────┘  └──────────────────┘    │
└─────┬──────────────────┬──────────────────┬───────────────────┘
      │                  │                  │
      │                  │                  │
┌─────▼──────┐   ┌──────▼─────┐   ┌───────▼────────┐
│  GitHub    │   │   Google   │   │   MongoDB      │
│  API       │   │   Gemini   │   │   Atlas        │
└────────────┘   └────────────┘   └────────────────┘
      │                                      │
┌─────▼──────┐                      ┌───────▼────────┐
│  Slack     │                      │  Stored Data:  │
│  API       │                      │  - Projects    │
└────────────┘                      │  - Credentials │
      │                             │  - Risk Logs   │
┌─────▼──────┐                      │  - RBAC Rules  │
│  Jira      │                      └────────────────┘
│  API       │
└────────────┘
```

### Workflow

1. **PR Creation**: Developer opens a pull request on GitHub
2. **Webhook Trigger**: GitHub sends webhook event to NovaScan backend
3. **Context Gathering**: System retrieves PR diff and recent Slack conversations
4. **AI Analysis**: Google Gemini analyzes combined context for risk assessment
5. **Automated Response**:
   - High Risk: Creates Jira ticket + Sends Slack alert
   - Medium Risk: Sends Slack notification
   - Low Risk: Logs to database for trend analysis
6. **Dashboard Update**: Real-time feed updates in Next.js interface

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 14 | Modern React framework with SSR |
| | TailwindCSS | Utility-first styling |
| | Framer Motion | Animation and transitions |
| **Backend** | FastAPI | High-performance Python web framework |
| | Motor | Async MongoDB driver |
| | httpx | Async HTTP client for API calls |
| **AI Engine** | Google Gemini | gemini-1.5-flash for contextual analysis |
| **Integrations** | GitHub REST API | PR data and webhook management |
| | Slack SDK | Message retrieval and alerts |
| | Jira API | Automated ticket creation |
| **Database** | MongoDB Atlas | Multi-tenant data storage |
| **DevOps** | ngrok (dev) | Local webhook testing |

---

## 📥 Installation

### Prerequisites

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- **ngrok** or similar tunneling tool for local development ([Download](https://ngrok.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/Ayushkaranth/NovaScan.git
cd NovaScan
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn motor httpx google-generativeai slack_sdk jira python-dotenv

# Alternative: Use requirements.txt (if available)
# pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Or use yarn
# yarn install
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the **root directory**:

```env
# ===================
# Core Configuration
# ===================
BASE_URL="https://your-ngrok-url.ngrok.io"
MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/loop?retryWrites=true&w=majority"

# ===================
# AI Configuration
# ===================
GEMINI_API_KEY="your_google_gemini_api_key"

# ===================
# GitHub Integration
# ===================
GITHUB_TOKEN="ghp_your_github_personal_access_token"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"

# ===================
# Slack Integration
# ===================
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
SLACK_APP_TOKEN="xapp-your-slack-app-token"
SLACK_SIGNING_SECRET="your_slack_signing_secret"

# ===================
# Jira Integration
# ===================
JIRA_URL="https://your-domain.atlassian.net"
JIRA_EMAIL="your-email@company.com"
JIRA_API_TOKEN="your_jira_api_token"
JIRA_PROJECT_KEY="PROJ"

# ===================
# Security
# ===================
JWT_SECRET_KEY="your_jwt_secret_for_authentication"
ENCRYPTION_KEY="your_encryption_key_for_credentials"
```

### MongoDB Setup

1. Create a MongoDB Atlas cluster
2. Create a database named `loop`
3. Configure network access to allow connections
4. Copy the connection string to `MONGODB_URL`

### API Keys Setup

#### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate API key
3. Add to `.env` as `GEMINI_API_KEY`

#### GitHub
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate token with `repo`, `admin:repo_hook` permissions
3. Add to `.env` as `GITHUB_TOKEN`

#### Slack
1. Create app at [Slack API](https://api.slack.com/apps)
2. Enable OAuth scopes: `chat:write`, `channels:history`, `channels:read`
3. Install app to workspace
4. Add tokens to `.env`

#### Jira
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create API token
3. Add credentials to `.env`

---

## 🚀 Usage

### Starting the Backend

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

### Starting the Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Setting Up ngrok (Development)

```bash
# Start ngrok tunnel
ngrok http 8000

```

### Onboarding a Project

1. Navigate to dashboard at `http://localhost:3000`
2. Click "Add New Project"
3. Provide:
   - GitHub repository URL
   - Slack channel ID
   - Jira project key
4. Click "Connect" - NovaScan will:
   - Install GitHub webhook automatically
   - Verify Slack channel access
   - Test Jira connection
   - Store encrypted credentials in MongoDB

### Testing the System

1. Create a pull request in your connected repository
2. Watch the NovaScan dashboard for real-time updates
3. Check Slack for risk notifications
4. Verify Jira tickets for high-risk changes

---

## 📚 API Documentation

### Webhook Endpoints

#### GitHub Webhook
```
POST /webhooks/github
Content-Type: application/json
X-Hub-Signature-256: <signature>

Payload: GitHub webhook event
```

### Project Management

#### Create Project
```
POST /api/projects
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Project Name",
  "github_repo": "owner/repo",
  "slack_channel": "C01234567",
  "jira_project": "PROJ"
}
```

#### List Projects
```
GET /api/projects
Authorization: Bearer <token>
```

### Risk Analysis

#### Get Risk History
```
GET /api/risks?project_id={id}&limit=50
Authorization: Bearer <token>
```

---
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

[⬆ Back to Top](#novascan-ai-driven-project-intelligence-platform)

</div>
