from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class IncidentCreate(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    coordinates: Optional[str] = None
    reported_by: Optional[str] = "Field Responder"

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None

class ReasoningStep(BaseModel):
    step: int
    category: str
    finding: str
    evidence: str
    confidence: float

class TriageDecision(BaseModel):
    incident_id: str
    severity: str
    confidence: float
    reasoning_chain: List[ReasoningStep]
    uncertainty_flags: List[str]
    missing_data: List[str]
    recommended_actions: List[str]

class VerificationRequest(BaseModel):
    decision_id: str
    is_correct: bool
    corrected_severity: Optional[str] = None
    correction_reason: Optional[str] = None
    verifier: Optional[str] = "Field Responder"

class ReportRequest(BaseModel):
    incident_id: str

class AuditEntry(BaseModel):
    incident_id: Optional[str]
    action: str
    actor: Optional[str]
    details: Optional[str]
