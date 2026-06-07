import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { getSeverityStyle, formatDate, formatTime } from '../utils/severity'

export default function Dashboard() {
  const [incidents, setIncidents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.incidents.list(),
      api.triage.stats().catch(() => null)
    ]).then(([inc, st]) => {
      setIncidents(inc)
      setStats(st)
    }).finally(() => setLoading(false))
  }, [])

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNCLASSIFIED: 0 }
  incidents.forEach(i => {
    if (i.severity) counts[i.severity] = (counts[i.severity] || 0) + 1
    else counts.UNCLASSIFIED++
  })

  return (
    <div style={{ padding: '28px 32px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Active Operations
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>
            Explainable AI triage · Offline-capable · Audit-logged
          </p>
        </div>
        <button
          onClick={() => navigate('/incidents/new')}
          style={{
            background: 'var(--accent)',
            color: '#000',
            padding: '9px 20px',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          + REPORT INCIDENT
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'CRITICAL', count: counts.CRITICAL, color: 'var(--critical)' },
          { label: 'HIGH', count: counts.HIGH, color: 'var(--high)' },
          { label: 'MEDIUM', count: counts.MEDIUM, color: 'var(--medium)' },
          { label: 'LOW', count: counts.LOW, color: 'var(--low)' },
          { label: 'UNCLASSIFIED', count: counts.UNCLASSIFIED, color: 'var(--text3)' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--font-display)', marginTop: 4 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* AI accuracy bar */}
      {stats && stats.total_verified > 0 && (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>AI TRIAGE ACCURACY</div>
          <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${stats.accuracy}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', minWidth: 50 }}>{stats.accuracy}%</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.total_verified} verified decisions</div>
        </div>
      )}

      {/* Incidents list */}
      {loading ? (
        <LoadingGrid />
      ) : incidents.length === 0 ? (
        <EmptyState navigate={navigate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incidents.map(inc => (
            <IncidentRow key={inc.id} incident={inc} onClick={() => navigate(`/incidents/${inc.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function IncidentRow({ incident, onClick }) {
  const sev = getSeverityStyle(incident.severity)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderLeft: incident.severity ? `3px solid ${sev.color}` : '3px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        alignItems: 'center',
        gap: 16,
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = incident.severity ? sev.color : 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = incident.severity ? sev.color : 'var(--border)'}
    >
      <div>
        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 3 }}>{incident.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          {incident.location || 'Location unknown'} · {formatDate(incident.created_at)}
        </div>
      </div>

      {incident.severity ? (
        <span style={{
          background: sev.bg, color: sev.color,
          padding: '3px 10px', borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        }}>
          {incident.severity}
        </span>
      ) : (
        <span style={{
          background: 'var(--bg3)', color: 'var(--text3)',
          padding: '3px 10px', borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-mono)', fontSize: 11,
        }}>
          PENDING
        </span>
      )}

      {incident.confidence != null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
          {Math.round(incident.confidence * 100)}%
        </span>
      )}

      {incident.human_verified ? (
        <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>✓ VERIFIED</span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>UNVERIFIED</span>
      )}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '14px 18px',
          height: 68, opacity: 0.4,
          animation: 'pulse-dot 1.5s infinite',
        }} />
      ))}
    </div>
  )
}

function EmptyState({ navigate }) {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 20px',
      border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>⬡</div>
      <div style={{ color: 'var(--text2)', marginBottom: 20 }}>No active incidents</div>
      <button
        onClick={() => navigate('/incidents/new')}
        style={{
          background: 'transparent', border: '1px solid var(--accent)',
          color: 'var(--accent)', padding: '8px 20px', borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 0.5,
        }}
      >
        REPORT FIRST INCIDENT
      </button>
    </div>
  )
}
