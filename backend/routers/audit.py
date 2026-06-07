from fastapi import APIRouter
from models.database import get_db

router = APIRouter()

@router.get("/")
async def get_audit_log(limit: int = 50):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()

@router.get("/incident/{incident_id}")
async def get_incident_audit(incident_id: str):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM audit_log WHERE incident_id = ? ORDER BY timestamp ASC",
            (incident_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()
