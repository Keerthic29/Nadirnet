from fastapi import APIRouter, HTTPException
from models.database import get_db
from models.schemas import IncidentCreate, IncidentUpdate, AuditEntry
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/")
async def create_incident(data: IncidentCreate):
    incident_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    db = get_db()
    try:
        db.execute(
            """INSERT INTO incidents (id, title, description, location, coordinates, reported_by, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)""",
            (incident_id, data.title, data.description, data.location, data.coordinates, data.reported_by, now, now)
        )
        db.execute(
            "INSERT INTO audit_log (id, incident_id, action, actor, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), incident_id, "incident_created", data.reported_by, f"New incident: {data.title}", now)
        )
        db.commit()
        return {"id": incident_id, "status": "created", "created_at": now}
    finally:
        db.close()

@router.get("/")
async def list_incidents():
    db = get_db()
    try:
        rows = db.execute(
            """SELECT i.*, t.severity, t.confidence, t.human_verified
               FROM incidents i
               LEFT JOIN triage_decisions t ON t.incident_id = i.id
               ORDER BY i.created_at DESC"""
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Incident not found")
        return dict(row)
    finally:
        db.close()

@router.patch("/{incident_id}")
async def update_incident(incident_id: str, data: IncidentUpdate):
    db = get_db()
    try:
        now = datetime.utcnow().isoformat()
        if data.status:
            db.execute("UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?",
                       (data.status, now, incident_id))
        db.commit()
        return {"status": "updated"}
    finally:
        db.close()

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str):
    db = get_db()
    try:
        db.execute("DELETE FROM incidents WHERE id = ?", (incident_id,))
        db.commit()
        return {"status": "deleted"}
    finally:
        db.close()
