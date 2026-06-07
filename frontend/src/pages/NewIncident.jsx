import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

export default function NewIncident() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', location: '', reported_by: 'Field Responder'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title || !form.description) {
      setError('Title and description are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { id } = await api.incidents.create(form)
      navigate(`/incidents/${id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 680 }} className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/')}
          style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5, marginBottom: 16 }}
        >
          ← BACK
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff' }}>
          Report Incident
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: 13 }}>
          Submit incident details for AI-powered triage and situation analysis.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="INCIDENT TITLE" required>
          <input
            placeholder="e.g. Building collapse — Sector 7, Zone B"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </Field>

        <Field label="DESCRIPTION" required hint="Include any visible damage, casualties, hazards, and immediate needs.">
          <textarea
            placeholder="Describe the situation in full. More detail enables better AI triage accuracy."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            style={{ minHeight: 140 }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="LOCATION / GRID">
            <input
              placeholder="e.g. Main St & 5th Ave, Grid D4"
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
          </Field>
          <Field label="REPORTED BY">
            <input
              placeholder="e.g. Unit Alpha-3"
              value={form.reported_by}
              onChange={e => set('reported_by', e.target.value)}
            />
          </Field>
        </div>

        {error && (
          <div style={{
            background: 'var(--critical-bg)',
            border: '1px solid var(--critical)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            color: 'var(--critical)',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* AI explainability note */}
        <div style={{
          background: 'rgba(0,212,170,0.04)',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          gap: 12,
        }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>◎</div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              EXPLAINABLE AI TRIAGE
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              After submission, Gemma 4 will analyze this incident locally and provide a step-by-step reasoning chain
              showing exactly how it reached its triage decision. You can verify or override the AI classification.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              background: loading ? 'var(--bg3)' : 'var(--accent)',
              color: loading ? 'var(--text3)' : '#000',
              padding: '11px 28px',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT INCIDENT →'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text2)',
              padding: '11px 20px',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: 1,
        color: 'var(--text2)',
        marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: 'var(--critical)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}
