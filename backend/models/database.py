import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "nadirnet.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT,
            coordinates TEXT,
            image_path TEXT,
            reported_by TEXT,
            status TEXT DEFAULT 'open',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS triage_decisions (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            severity TEXT NOT NULL,
            confidence REAL NOT NULL,
            reasoning_chain TEXT NOT NULL,
            uncertainty_flags TEXT,
            missing_data TEXT,
            recommended_actions TEXT,
            ai_version TEXT,
            human_verified INTEGER DEFAULT 0,
            human_override TEXT,
            override_reason TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );

        CREATE TABLE IF NOT EXISTS situation_reports (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            content TEXT NOT NULL,
            evidence_citations TEXT,
            confidence_bounds TEXT,
            uncertainty_notes TEXT,
            generated_at TEXT NOT NULL,
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            incident_id TEXT,
            action TEXT NOT NULL,
            actor TEXT,
            details TEXT,
            timestamp TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS verification_feedback (
            id TEXT PRIMARY KEY,
            decision_id TEXT NOT NULL,
            verifier TEXT,
            is_correct INTEGER,
            corrected_severity TEXT,
            correction_reason TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (decision_id) REFERENCES triage_decisions(id)
        );
    """)
    conn.commit()
    conn.close()
    print("✅ NadirNet database initialized")
