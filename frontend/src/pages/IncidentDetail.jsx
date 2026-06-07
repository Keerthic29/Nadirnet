import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { getSeverityStyle, formatDate, formatTime, confidenceLabel } from '../utils/severity'

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incident, setIncident] = useState(null)
  const [triage, setTriage] = useState(null)
  const [report, setReport] = useState(null)
  const [audit, setAudit] = useState([])
  const [triaging, setTriaging] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [verifyMode, setVerifyMode] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('triage')

  const load = async () => {
    try {
      const [inc, aud] = await Promise.all([
        api.incidents.get(id),
        api.audit.forIncident(id)
      ])
      setIncident(inc)
      setAudit(aud)
      try { setTriage(await api.triage.latest(id)) } catch {}
      try { setReport(await api.reports.latest(id)) } catch {}
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [id])

  const runTriage = async () => {
    setTriaging(true)
    setError(null)
    try {
      const result = await api.triage.run(id)
      setTriage(result)
      setActiveTab('triage')
      const aud = await api.audit.forIncident(id)
      setAudit(aud)
    } catch (e) {
      setError(e.message)
    } finally {
      setTriaging(false)
    }
  }

  const genReport = async () => {
    setReporting(true)
    setError(null)
    try {
      const result = await api.reports.generate(id)
      setReport(result)
      setActiveTab('report')
    } catch (e) {
      setError(e.message)
    } finally {
      setReporting(false)
    }
  }

  if (error && !incident) {
    return (
      <div style={{ padding: 40, color: 'var(--critical)' }}>
        Error: {error}
        <br />
        <button onClick={() => navigate('/')} style={{ color: 'var(--accent)', marginTop: 12 }}>← Back</button>
      </div>
    )
  }

  if (!incident) return <Spinner />

  const sev = triage ? getSeverityStyle(triage.severity) : null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left panel: incident info + controls */}
      <div style={{
        width: 320,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        flexShrink: 0,
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => navigate('/')}
            style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, marginBottom: 14 }}
          >
            ← DASHBOARD
          </button>

          {/* Severity badge */}
          {triage && (
            <div style={{
              background: sev.bg,
              border: `1px solid ${sev.color}`,
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: sev.color, letterSpacing: 1, marginBottom: 2 }}>
                  SEVERITY
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: sev.color }}>
                  {triage.severity}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>CONFIDENCE</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: confidenceLabel(triage.confidence).color,
                }}>
                  {Math.round(triage.confidence * 100)}%
                </div>
              </div>
            </div>
          )}

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
            {incident.title}
          </h2>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
            {incident.location || 'Location unknown'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {formatDate(incident.created_at)} · {formatTime(incident.created_at)}
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 8 }}>
            FIELD REPORT
          </div>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
            {incident.description}
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={runTriage}
            disabled={triaging}
            style={{
              background: triaging ? 'var(--bg3)' : 'var(--accent)',
              color: triaging ? 'var(--text3)' : '#000',
              padding: '10px 0',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {triaging && <Spin />}
            {triaging ? 'ANALYZING...' : triage ? '↻ RE-RUN TRIAGE' : '▶ RUN AI TRIAGE'}
          </button>

          {triage && (
            <button
              onClick={genReport}
              disabled={reporting}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-bright)',
                color: reporting ? 'var(--text3)' : 'var(--text)',
                padding: '10px 0',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 0.5,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {reporting && <Spin />}
              {reporting ? 'GENERATING...' : '◎ GENERATE SITREP'}
            </button>
          )}
        </div>

        {/* Verification status */}
        {triage && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>
              HUMAN VERIFICATION
            </div>
            {triage.human_verified ? (
              <div style={{ fontSize: 12, color: 'var(--accent)' }}>
                ✓ Decision verified
                {triage.human_override && (
                  <div style={{ color: 'var(--high)', marginTop: 4 }}>
                    Overridden → {triage.human_override}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <VerifyBtn
                  label="✓ CONFIRM"
                  color="var(--accent)"
                  bg="rgba(0,212,170,0.1)"
                  onClick={() => handleVerify(true)}
                />
                <VerifyBtn
                  label="✗ OVERRIDE"
                  color="var(--high)"
                  bg="rgba(255,140,0,0.1)"
                  onClick={() => setVerifyMode(true)}
                />
              </div>
            )}
          </div>
        )}

        {/* Audit mini-log */}
        <div style={{ padding: '14px 20px', flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>
            AUDIT TRAIL
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {audit.slice().reverse().map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 5, height: 5, background: 'var(--accent)',
                  borderRadius: '50%', flexShrink: 0, marginTop: 5,
                }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text)' }}>{a.details}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {a.actor} · {formatTime(a.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {audit.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel: triage reasoning / report */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
        }}>
          {[
            { key: 'triage', label: 'AI REASONING' },
            { key: 'report', label: 'SITUATION REPORT' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '14px 0',
                marginRight: 28,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: 1,
                color: activeTab === t.key ? 'var(--accent)' : 'var(--text3)',
                borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'triage' && (
            <TriagePanel triage={triage} triaging={triaging} runTriage={runTriage} />
          )}
          {activeTab === 'report' && (
            <ReportPanel report={report} reporting={reporting} genReport={genReport} />
          )}
        </div>
      </div>

      {/* Override modal */}
      {verifyMode && (
        <OverrideModal
          triage={triage}
          onClose={() => setVerifyMode(false)}
          onSubmit={handleOverride}
        />
      )}
    </div>
  )

  async function handleVerify(correct) {
    try {
      await api.triage.verify(triage.id || triage.decision_id, {
        decision_id: triage.id || triage.decision_id,
        is_correct: correct,
        verifier: 'Field Responder'
      })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleOverride({ severity, reason }) {
    try {
      await api.triage.verify(triage.id || triage.decision_id, {
        decision_id: triage.id || triage.decision_id,
        is_correct: false,
        corrected_severity: severity,
        correction_reason: reason,
        verifier: 'Field Responder'
      })
      setVerifyMode(false)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }
}

/* ─── Triage Reasoning Panel ─── */
function TriagePanel({ triage, triaging, runTriage }) {
  if (triaging) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: 1 }}>
          GEMMA 4 ANALYZING...
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Processing incident data locally</div>
      </div>
    )
  }

  if (!triage) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 16 }}>◎</div>
        <div style={{ color: 'var(--text2)', marginBottom: 8 }}>No triage analysis yet</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
          Run the AI triage to see a step-by-step reasoning chain
        </div>
        <button
          onClick={runTriage}
          style={{
            background: 'var(--accent)', color: '#000',
            padding: '10px 24px', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          }}
        >
          ▶ RUN AI TRIAGE
        </button>
      </div>
    )
  }

  const chain = triage.reasoning_chain || []
  const uncertainties = triage.uncertainty_flags || []
  const missing = triage.missing_data || []
  const actions = triage.recommended_actions || []

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      {/* Reasoning chain */}
      <Section title="REASONING CHAIN" subtitle="Every step Gemma 4 took to reach this decision">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chain.map((step, i) => (
            <ReasoningStep key={i} step={step} index={i} />
          ))}
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        {/* Uncertainty flags */}
        <Section title="UNCERTAINTY FLAGS" subtitle="What the AI cannot confirm">
          {uncertainties.length === 0
            ? <EmptyNote>No uncertainties flagged</EmptyNote>
            : uncertainties.map((u, i) => (
              <FlagItem key={i} color="var(--high)" text={u} />
            ))
          }
        </Section>

        {/* Missing data */}
        <Section title="MISSING DATA" subtitle="Info that would improve accuracy">
          {missing.length === 0
            ? <EmptyNote>No data gaps identified</EmptyNote>
            : missing.map((m, i) => (
              <FlagItem key={i} color="var(--medium)" text={m} />
            ))
          }
        </Section>
      </div>

      {/* Recommended actions */}
      <Section title="RECOMMENDED ACTIONS" subtitle="AI-generated priority response steps" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{
                background: 'var(--accent)', color: '#000',
                width: 20, height: 20, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                flexShrink: 0, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{a}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* AI source note */}
      <div style={{
        marginTop: 20,
        padding: '10px 14px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 11,
        color: 'var(--text3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ color: triage.ai_source === 'gemma4' ? 'var(--accent)' : 'var(--high)' }}>◉</span>
        {triage.ai_source === 'gemma4'
          ? 'Analyzed by Gemma 4 running locally via Ollama'
          : 'Running in demo mode — connect Ollama for full Gemma 4 inference'}
        <span style={{ marginLeft: 'auto' }}>
          {formatTime(triage.created_at)}
        </span>
      </div>
    </div>
  )
}

function ReasoningStep({ step, index }) {
  const conf = step.confidence || 0
  const confStyle = confidenceLabel(conf)

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Step header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg3)',
      }}>
        <div style={{
          width: 22, height: 22,
          background: 'rgba(0,212,170,0.1)',
          border: '1px solid rgba(0,212,170,0.3)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--accent)', fontWeight: 700, flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 0.5 }}>
          {step.category}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 60, height: 3,
            background: 'var(--bg)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              width: `${conf * 100}%`,
              height: '100%',
              background: confStyle.color,
              borderRadius: 2,
              transition: 'width 0.5s',
            }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: confStyle.color }}>
            {Math.round(conf * 100)}%
          </span>
        </div>
      </div>

      {/* Finding */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ fontWeight: 600, color: '#fff', fontSize: 13, marginBottom: 8 }}>
          {step.finding}
        </div>
        {/* Evidence */}
        <div style={{
          background: 'var(--bg3)',
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
          borderLeft: '2px solid rgba(0,212,170,0.3)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: 0.5 }}>
            EVIDENCE
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            {step.evidence}
          </div>
        </div>
      </div>
      <div style={{ height: 12 }} />
    </div>
  )
}

/* ─── Situation Report Panel ─── */
function ReportPanel({ report, reporting, genReport }) {
  if (reporting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: 1 }}>
          GENERATING SITREP...
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 16 }}>◎</div>
        <div style={{ color: 'var(--text2)', marginBottom: 8 }}>No situation report generated</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Run triage first, then generate a grounded SITREP</div>
      </div>
    )
  }

  const conf = report.confidence_overall || 0
  const findings = report.key_findings || (report.evidence_citations ? JSON.parse(report.evidence_citations) : [])
  const gaps = report.data_gaps || (report.uncertainty_notes ? JSON.parse(report.uncertainty_notes) : [])

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>
            SITUATION REPORT · {formatTime(report.generated_at)}
          </div>
        </div>
        <div style={{
          background: `rgba(0,212,170,${conf * 0.15})`,
          border: '1px solid rgba(0,212,170,0.3)',
          padding: '4px 12px',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--accent)',
        }}>
          OVERALL CONF. {Math.round(conf * 100)}%
        </div>
      </div>

      {/* Executive summary */}
      <Section title="EXECUTIVE SUMMARY">
        <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', borderLeft: '2px solid var(--accent)', paddingLeft: 14 }}>
          {report.executive_summary || report.content}
        </p>
      </Section>

      {/* Key findings */}
      {findings.length > 0 && (
        <Section title="KEY FINDINGS" subtitle="AI-identified facts with confidence scores" style={{ marginTop: 20 }}>
          {findings.map((f, i) => (
            <div key={i} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{f.finding}</div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: confidenceLabel(f.confidence).color,
                  flexShrink: 0,
                }}>
                  {Math.round((f.confidence || 0) * 100)}%
                </span>
              </div>
              {f.evidence && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, fontStyle: 'italic' }}>
                  Source: {f.evidence}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Resources */}
      {report.resource_requirements && (
        <Section title="RESOURCE REQUIREMENTS" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {report.resource_requirements.map((r, i) => {
              const pColor = r.priority === 'IMMEDIATE' ? 'var(--critical)' : r.priority === 'URGENT' ? 'var(--high)' : 'var(--medium)'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 0.5,
                    color: pColor, background: `${pColor}18`,
                    padding: '2px 6px', borderRadius: 'var(--radius)', flexShrink: 0,
                  }}>{r.priority}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{r.resource}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{r.quantity}</span>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Data gaps */}
      {gaps.length > 0 && (
        <Section title="DATA GAPS" subtitle="Missing information that reduces report confidence" style={{ marginTop: 20 }}>
          {gaps.map((g, i) => <FlagItem key={i} color="var(--high)" text={g} />)}
        </Section>
      )}
    </div>
  )
}

/* ─── Override Modal ─── */
function OverrideModal({ triage, onClose, onSubmit }) {
  const [severity, setSeverity] = useState(triage?.severity || 'HIGH')
  const [reason, setReason] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius-lg)', padding: 28,
        width: 420, maxWidth: '90vw',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          Override AI Decision
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
          Your field assessment will be logged and used to improve future triage accuracy.
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
            CORRECTED SEVERITY
          </label>
          <select value={severity} onChange={e => setSeverity(e.target.value)}>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
            REASON FOR OVERRIDE
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe what you observed in the field that contradicts the AI assessment..."
            style={{ minHeight: 80 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onSubmit({ severity, reason })}
            style={{
              background: 'var(--high)', color: '#000',
              padding: '10px 20px', borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            }}
          >
            CONFIRM OVERRIDE
          </button>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--border)', color: 'var(--text2)',
              padding: '10px 20px', borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */
function Section({ title, subtitle, children, style }) {
  return (
    <div style={style}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--text3)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

function FlagItem({ color, text }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ color, marginTop: 1, flexShrink: 0 }}>▸</span>
      <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

function EmptyNote({ children }) {
  return <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>{children}</div>
}

function VerifyBtn({ label, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '8px 0',
        background: bg, border: `1px solid ${color}`,
        color, borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.5,
      }}
    >
      {label}
    </button>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Spin() {
  return (
    <div style={{ width: 12, height: 12, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
  )
}
