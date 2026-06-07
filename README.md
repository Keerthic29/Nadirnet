# NadirNet v2 — Explainable Disaster Intelligence Platform

**Tech Stack:** React · FastAPI · SQLite · Gemma 4 · Ollama · Python

> Built for the Gemma 4 Hackathon — Safety & Trust track.
> Offline-first disaster response intelligence with transparent, verifiable AI triage.

---

## What NadirNet Does

Emergency responders in the field face two problems:

1. **Connectivity** — disasters destroy infrastructure. AI must work offline.
2. **Trust** — when lives are on the line, "the AI said so" isn't good enough.

NadirNet solves both. It runs **Gemma 4 locally via Ollama** (no internet needed) and makes every AI decision **fully transparent and verifiable** — responders see the exact reasoning chain, confidence scores, and uncertainty flags before acting on any recommendation.

---

## Core Features

### 🔍 Explainable AI Triage
- Every decision shows a step-by-step reasoning chain
- Each reasoning step: category, finding, specific evidence, confidence score
- Responders can see exactly which words triggered which classification

### ✅ Human Verification Loop
- Responders confirm or override AI decisions
- Override reasons are logged for model improvement
- Accuracy statistics tracked over time

### 📋 Source-Grounded Situation Reports
- Every claim cites its evidence
- Confidence bounds on all estimates
- Explicit data gaps and uncertainty flags

### 🔒 Immutable Audit Trail
- Every AI decision and human action is logged
- Tamper-evident incident timeline
- Full chain of custody for every classification

### 📡 Offline-First Architecture
- All computation is local (Gemma 4 via Ollama)
- SQLite — no database server needed
- Falls back to demo mode if Ollama unavailable

---

## Quick Start

### 1. Install Ollama + Gemma 4

```bash
# Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Gemma 4 (or gemma3:4b for lighter hardware)
ollama pull gemma3:4b
# For better results on capable hardware:
# ollama pull gemma2:9b
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# API runs at http://localhost:8000
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## Architecture

```
frontend/          React app (Vite)
  src/
    pages/         Dashboard, IncidentDetail, NewIncident, AuditLog
    components/    Layout
    utils/         API client, severity helpers

backend/           FastAPI server
  main.py          App entry point
  models/
    database.py    SQLite schema + connection
    schemas.py     Pydantic request/response models
  routers/
    incidents.py   Incident CRUD
    triage.py      AI triage + human verification
    reports.py     Situation report generation
    audit.py       Audit log
  services/
    ollama_service.py  Gemma 4 integration + JSON parsing

nadirnet.db        SQLite database (auto-created)
```

### Triage Decision Flow

```
Incident submitted
    ↓
Gemma 4 (local, via Ollama)
    ↓
Structured JSON reasoning chain extracted
    ↓
Decision stored with full reasoning + confidence
    ↓
Responder reviews reasoning chain
    ↓
Confirm or Override (logged to audit trail)
    ↓
Situation report generated with citations
```

---

## Safety & Trust Design Principles

1. **No black boxes** — every AI output includes the full reasoning chain
2. **Confidence is explicit** — confidence scores on every decision and sub-step
3. **Uncertainty is surfaced** — AI explicitly flags what it cannot determine
4. **Humans stay in the loop** — decisions require verification before being "final"
5. **Everything is auditable** — immutable log of all AI and human actions
6. **Override ≠ failure** — corrections improve the system, are encouraged

---

## Gemma 4 Integration

The system uses Gemma 4's instruction-following capability with structured JSON prompts to extract:
- Severity classification with confidence
- Step-by-step reasoning chains with evidence citations
- Uncertainty flags and data gap identification
- Prioritized recommended actions

Model variants supported:
- `gemma3:4b` — recommended for edge/offline deployment
- `gemma2:9b` — better reasoning quality on capable hardware
- `gemma4:latest` — highest quality when available

Switch model in `backend/services/ollama_service.py` → `MODEL` variable.

---

## Demo Mode

If Ollama is not running, NadirNet falls back to structured demo responses so the UI can be evaluated without local model setup. Look for the `ai_source: "mock_demo"` indicator in triage results.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | System health + model status |
| POST | /api/incidents/ | Create incident |
| GET | /api/incidents/ | List all incidents |
| GET | /api/incidents/{id} | Get incident |
| POST | /api/triage/{id} | Run AI triage |
| GET | /api/triage/{id}/latest | Get latest triage |
| POST | /api/triage/{id}/verify | Human verification |
| GET | /api/triage/stats/accuracy | Accuracy statistics |
| POST | /api/reports/{id}/generate | Generate situation report |
| GET | /api/audit/ | Full audit log |

Swagger docs: http://localhost:8000/docs
