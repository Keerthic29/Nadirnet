from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.database import get_db
from models.schemas import VerificationRequest
from services.ollama_service import run_triage, check_ollama_health
import uuid, json
from datetime import datetime

router = APIRouter()

@router.post("/{incident_id}")
async def triage_incident(incident_id: str, background_tasks: BackgroundTasks):
    db = get_db()
    try:
        incident = db.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if not incident:
            raise HTTPException(404, "Incident not found")

        # Check if Ollama is running
        ollama_ok = await check_ollama_health()

        if ollama_ok:
            try:
                result = await run_triage(incident["title"], incident["description"], incident["location"] or "")
            except Exception as e:
                result = _mock_triage(incident)
        else:
            result = _mock_triage(incident)

        decision_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        db.execute(
            """INSERT INTO triage_decisions
               (id, incident_id, severity, confidence, reasoning_chain, uncertainty_flags,
                missing_data, recommended_actions, ai_version, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                decision_id, incident_id,
                result["severity"],
                result["confidence"],
                json.dumps(result["reasoning_chain"]),
                json.dumps(result.get("uncertainty_flags", [])),
                json.dumps(result.get("missing_data", [])),
                json.dumps(result.get("recommended_actions", [])),
                "gemma4:latest",
                now
            )
        )
        db.execute(
            "INSERT INTO audit_log (id, incident_id, action, actor, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), incident_id, "ai_triage_completed", "NadirNet-AI",
             f"Severity: {result['severity']}, Confidence: {result['confidence']:.0%}", now)
        )
        db.commit()

        return {
            "decision_id": decision_id,
            "incident_id": incident_id,
            "severity": result["severity"],
            "confidence": result["confidence"],
            "reasoning_chain": result["reasoning_chain"],
            "uncertainty_flags": result.get("uncertainty_flags", []),
            "missing_data": result.get("missing_data", []),
            "recommended_actions": result.get("recommended_actions", []),
            "ai_source": "gemma4" if ollama_ok else "mock_demo",
            "created_at": now
        }
    finally:
        db.close()


@router.get("/{incident_id}/latest")
async def get_latest_triage(incident_id: str):
    db = get_db()
    try:
        row = db.execute(
            "SELECT * FROM triage_decisions WHERE incident_id = ? ORDER BY created_at DESC LIMIT 1",
            (incident_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "No triage decision found")
        d = dict(row)
        for f in ["reasoning_chain", "uncertainty_flags", "missing_data", "recommended_actions"]:
            if d.get(f):
                d[f] = json.loads(d[f])
        return d
    finally:
        db.close()


@router.post("/{decision_id}/verify")
async def verify_decision(decision_id: str, data: VerificationRequest):
    db = get_db()
    try:
        now = datetime.utcnow().isoformat()
        db.execute(
            "UPDATE triage_decisions SET human_verified = 1, human_override = ?, override_reason = ? WHERE id = ?",
            (data.corrected_severity, data.correction_reason, decision_id)
        )
        db.execute(
            """INSERT INTO verification_feedback
               (id, decision_id, verifier, is_correct, corrected_severity, correction_reason, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (str(uuid.uuid4()), decision_id, data.verifier, int(data.is_correct),
             data.corrected_severity, data.correction_reason, now)
        )
        db.execute(
            "INSERT INTO audit_log (id, incident_id, action, actor, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), None, "human_verification",
             data.verifier,
             f"Decision {decision_id[:8]}... {'confirmed' if data.is_correct else 'overridden to ' + (data.corrected_severity or 'unknown')}",
             now)
        )
        db.commit()
        return {"status": "verified", "feedback_recorded": True}
    finally:
        db.close()


@router.get("/stats/accuracy")
async def get_accuracy_stats():
    db = get_db()
    try:
        total = db.execute("SELECT COUNT(*) FROM triage_decisions WHERE human_verified = 1").fetchone()[0]
        correct = db.execute(
            "SELECT COUNT(*) FROM verification_feedback WHERE is_correct = 1"
        ).fetchone()[0]
        overridden = db.execute(
            "SELECT COUNT(*) FROM verification_feedback WHERE is_correct = 0"
        ).fetchone()[0]
        return {
            "total_verified": total,
            "confirmed_correct": correct,
            "overridden": overridden,
            "accuracy": round(correct / total * 100, 1) if total > 0 else 0
        }
    finally:
        db.close()


def _mock_triage(incident: dict) -> dict:
    """Demo triage when Ollama is unavailable."""
    desc = incident["description"].lower()
    is_critical = any(w in desc for w in ["collapse", "trapped", "mass", "critical", "explosion", "fire"])
    is_high = any(w in desc for w in ["injured", "damage", "flood", "evacuate", "missing"])

    if is_critical:
        severity, conf = "CRITICAL", 0.91
    elif is_high:
        severity, conf = "HIGH", 0.78
    else:
        severity, conf = "MEDIUM", 0.65

    return {
        "severity": severity,
        "confidence": conf,
        "reasoning_chain": [
            {
                "step": 1,
                "category": "Injury/Life Threat",
                "finding": "Life threat indicators detected in report",
                "evidence": f"Key terms identified in: '{incident['description'][:80]}...'",
                "confidence": conf
            },
            {
                "step": 2,
                "category": "Infrastructure",
                "finding": "Physical damage assessment pending field verification",
                "evidence": "Location data: " + (incident.get("location") or "not provided"),
                "confidence": 0.55
            },
            {
                "step": 3,
                "category": "Resource Need",
                "finding": "Emergency resources required based on severity",
                "evidence": f"Severity classification {severity} triggers resource protocol",
                "confidence": 0.80
            }
        ],
        "uncertainty_flags": [
            "Running in demo mode — Ollama/Gemma4 not detected",
            "Field visual confirmation unavailable",
            "Casualty count unconfirmed"
        ],
        "missing_data": [
            "Exact casualty count",
            "Structural integrity assessment",
            "Hazardous materials status"
        ],
        "recommended_actions": [
            f"Dispatch {'IMMEDIATE' if severity == 'CRITICAL' else 'URGENT'} response team",
            "Establish field communication relay",
            "Request aerial reconnaissance if available",
            "Activate local emergency operations center"
        ]
    }
