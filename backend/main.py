from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from routers import incidents, triage, reports, audit
from models.database import init_db

app = FastAPI(
    title="NadirNet API",
    description="Offline-first disaster intelligence platform with explainable AI triage",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(triage.router, prefix="/api/triage", tags=["Triage"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])

@app.get("/api/health")
async def health():
    return {"status": "online", "mode": "offline-capable", "model": "gemma4:latest"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
