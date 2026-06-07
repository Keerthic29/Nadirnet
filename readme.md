# NadirNet – Disaster Intelligence Platform

## Overview

NadirNet is an offline-first disaster intelligence platform that helps emergency responders analyze incidents, prioritize response actions, and generate situation reports using local Large Language Models (LLMs).

Built using React, FastAPI, SQLite, Ollama, and Gemma 4, the platform operates without cloud connectivity, making it suitable for disaster scenarios where internet access may be unavailable.

---

## Features

* AI-powered incident triage
* Explainable reasoning chains
* Confidence scoring
* Human verification workflow
* Automated situation report generation
* Immutable audit logging
* Offline-first architecture
* Local LLM execution using Ollama and Gemma

---

## Tech Stack

### Frontend

* React
* Vite

### Backend

* FastAPI
* Python

### Database

* SQLite

### AI

* Ollama
* Gemma 4

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/NadirNet.git
cd NadirNet
```

### Install Ollama

Download and install Ollama:

https://ollama.com

### Pull Gemma Model

```bash
ollama pull gemma4:e4b
```

### Start Ollama

```bash
ollama serve
```

---

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs at:

http://localhost:8000

Swagger Documentation:

http://localhost:8000/docs

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

http://localhost:5173

---

## Usage

1. Create a new incident.
2. Enter incident details.
3. Submit for AI triage.
4. Review reasoning chain and confidence score.
5. Verify or override the AI decision.
6. Generate situation reports.
7. Review the audit trail.

---

## Project Architecture

Frontend (React)
↓
FastAPI Backend
↓
SQLite Database
↓
Ollama
↓
Gemma 4 Local LLM
---

## Future Improvements

* Multi-agent disaster coordination
* Geospatial mapping integration
* Real-time sensor ingestion
* Model fine-tuning using responder feedback

---

## License

MIT License
