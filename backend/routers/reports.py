from fastapi import APIRouter, HTTPException
from models.database import get_db
from services.ollama_service import run_report_generation, check_ollama_health
import uuid, json
from datetime import datetime

router = APIRouter()

@router.post("/{incident_id}/generate")
async def generate_report(incident_id: str):
    db = get_db()
    try:
        incident = db.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if not incident:
            raise HTTPException(404, "Incident not found")

        triage_row = db.execute(
            "SELECT * FROM triage_decisions WHERE incident_id = ? ORDER BY created_at DESC LIMIT 1",
            (incident_id,)
        ).fetchone()

        triage_data = {}
        if triage_row:
            triage_data = dict(triage_row)
            for f in ["reasoning_chain", "uncertainty_flags", "missing_data", "recommended_actions"]:
                if triage_data.get(f):
                    triage_data[f] = json.loads(triage_data[f])

        ollama_ok = await check_ollama_health()
        if ollama_ok and triage_data:
            try:
                report = await run_report_generation(dict(incident), triage_data)
            except Exception:
                report = _mock_report(dict(incident), triage_data)
        else:
            report = _mock_report(dict(incident), triage_data)

        report_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        report["timestamp"] = now

        db.execute(
            """INSERT INTO situation_reports (id, incident_id, content, evidence_citations, confidence_bounds, uncertainty_notes, generated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                report_id, incident_id,
                report.get("executive_summary", ""),
                json.dumps(report.get("key_findings", [])),
                json.dumps({"overall": report.get("confidence_overall", 0.5)}),
                json.dumps(report.get("data_gaps", [])),
                now
            )
        )
        db.execute(
            "INSERT INTO audit_log (id, incident_id, action, actor, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), incident_id, "report_generated", "NadirNet-AI", f"Situation report created", now)
        )
        db.commit()
        return {**report, "report_id": report_id, "incident_id": incident_id}
    finally:
        db.close()


@router.get("/{incident_id}/latest")
async def get_latest_report(incident_id: str):
    db = get_db()
    try:
        row = db.execute(
            "SELECT * FROM situation_reports WHERE incident_id = ? ORDER BY generated_at DESC LIMIT 1",
            (incident_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "No report found")
        d = dict(row)
        for f in ["evidence_citations", "confidence_bounds", "uncertainty_notes"]:
            if d.get(f):
                d[f] = json.loads(d[f])
        return d
    finally:
        db.close()


def _mock_report(incident: dict, triage: dict) -> dict:
    severity = triage.get("severity", "UNKNOWN")
    confidence = triage.get("confidence", 0.5)
    return {
        "executive_summary": f"A {severity} severity incident has been reported at {incident.get('location', 'an unspecified location')}. "
                              f"Initial assessment indicates immediate response is required. "
                              f"AI triage confidence is {confidence:.0%} pending field verification.",
        "situation_overview": f"Incident '{incident['title']}' was reported on {incident.get('created_at', 'unknown date')}. "
                              f"[FIELD:description] {incident['description']} "
                              f"[TRIAGE:severity] AI classification: {severity} at {confidence:.0%} confidence.",
        "key_findings": [
            {
                "finding": f"Severity classified as {severity}",
                "evidence": "Based on keyword analysis of incident description and pattern matching",
                "confidence": confidence
            },
            {
                "finding": "Field verification required before escalation",
                "evidence": "Human verification not yet completed — AI decision pending confirmation",
                "confidence": 0.95
            }
        ],
        "affected_population": {
            "estimate": "Unknown — pending field assessment",
            "basis": "Insufficient data for population estimate",
            "uncertainty": "±100%"
        },
        "resource_requirements": [
            {"resource": "Emergency Response Team", "quantity": "1 unit", "priority": "IMMEDIATE"},
            {"resource": "Medical Personnel", "quantity": "Assess on arrival", "priority": "URGENT"},
            {"resource": "Communication Equipment", "quantity": "Standard kit", "priority": "NEEDED"}
        ],
        "confidence_overall": confidence * 0.85,
        "data_gaps": triage.get("missing_data", ["No triage data available"]),
    }
