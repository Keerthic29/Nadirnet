import httpx
import json
import re
from typing import AsyncGenerator, Optional

OLLAMA_URL = "http://localhost:11434"
MODEL = "gemma4:e2b"  # Use gemma3:4b or gemma2:9b depending on available model

TRIAGE_SYSTEM_PROMPT = """You are NadirNet's explainable disaster triage AI.
You MUST respond ONLY in valid JSON. No preamble, no markdown.

For every incident, output:
{
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "confidence": 0.0-1.0,
  "reasoning_chain": [
    {
      "step": 1,
      "category": "Injury/Life Threat|Infrastructure|Displacement|Environmental|Resource Need",
      "finding": "brief finding (max 12 words)",
      "evidence": "specific words/phrases from the incident description that support this",
      "confidence": 0.0-1.0
    }
  ],
  "uncertainty_flags": ["list of what you could not verify or are uncertain about"],
  "missing_data": ["critical info missing that would change your assessment"],
  "recommended_actions": ["concrete next steps in priority order"]
}

Base severity on:
- CRITICAL: Immediate life threat, mass casualties, infrastructure collapse
- HIGH: Significant injuries, major displacement, critical resource shortage
- MEDIUM: Limited injuries, partial damage, manageable situation
- LOW: Property damage only, no injuries, contained situation

Be transparent about uncertainty. Never guess when data is absent — flag it."""

REPORT_SYSTEM_PROMPT = """You are NadirNet's situation report generator.
Output a structured JSON situation report with full source citations.
Every claim MUST cite the specific data it is based on.

Output:
{
  "executive_summary": "2-3 sentence summary",
  "situation_overview": "paragraph with inline citations like [FIELD:value]",
  "key_findings": [
    {"finding": "...", "evidence": "...", "confidence": 0.0-1.0}
  ],
  "affected_population": {
    "estimate": "range as string",
    "basis": "how this was estimated",
    "uncertainty": "±% or qualitative"
  },
  "resource_requirements": [
    {"resource": "...", "quantity": "...", "priority": "IMMEDIATE|URGENT|NEEDED"}
  ],
  "confidence_overall": 0.0-1.0,
  "data_gaps": ["what information is missing"],
  "timestamp": "ISO8601"
}"""


async def call_ollama(prompt: str, system: str, stream: bool = False) -> str:
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
            "num_predict": 2048
        }
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def stream_ollama(prompt: str, system: str) -> AsyncGenerator[str, None]:
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "stream": True,
        "options": {"temperature": 0.2, "num_predict": 1024}
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
            async for line in resp.aiter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if not chunk.get("done"):
                            yield chunk["message"]["content"]
                    except Exception:
                        pass


def parse_json_response(raw: str) -> dict:
    """Robustly parse JSON from LLM output, stripping markdown fences."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    return json.loads(raw)


async def run_triage(incident_title: str, incident_desc: str, location: str = "") -> dict:
    prompt = f"""Analyze this disaster incident and triage it:

TITLE: {incident_title}
LOCATION: {location or 'Unknown'}
DESCRIPTION: {incident_desc}

Apply your triage protocol and output the full JSON assessment."""

    raw = await call_ollama(prompt, TRIAGE_SYSTEM_PROMPT)
    return parse_json_response(raw)


async def run_report_generation(incident: dict, triage: dict) -> dict:
    prompt = f"""Generate a situation report for this incident:

INCIDENT: {json.dumps(incident, indent=2)}
TRIAGE ASSESSMENT: {json.dumps(triage, indent=2)}

Produce the full situation report JSON with complete citations."""

    raw = await call_ollama(prompt, REPORT_SYSTEM_PROMPT)
    return parse_json_response(raw)


async def check_ollama_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False
