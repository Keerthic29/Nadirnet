import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { formatDate, formatTime } from '../utils/severity'

const ACTION_COLORS = {
  incident_created: 'var(--low)',
  ai_triage_completed: 'var(--accent)',
  human_verification: 'var(--high)',
  report_generated: 'var(--medium)',
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.audit.list().then(setLogs).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '28px 32px' }} className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>
          Audit Trail
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>
          Immutable log of all AI decisions and human interventions
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>LOADING...</div>
      ) : logs.length === 0 ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 80 }}>No audit entries yet</div>
      ) : (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 180px 1fr 120px',
            padding: '10px 20px',
            background: 'var(--bg3)',
            borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text3)', letterSpacing: 0.5,
          }}>
            <span>TIMESTAMP</span>
            <span>ACTION</span>
            <span>DETAILS</span>
            <span>ACTOR</span>
          </div>

          {logs.map((log, i) => {
            const color = ACTION_COLORS[log.action] || 'var(--text3)'
            return (
              <div key={log.id} style={{
                display: 'grid',
                gridTemplateColumns: '140px 180px 1fr 120px',
                padding: '11px 20px',
                borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
                  {formatTime(log.timestamp)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color, background: `${color}18`,
                  padding: '2px 8px', borderRadius: 'var(--radius)',
                  display: 'inline-flex', width: 'fit-content', letterSpacing: 0.3,
                }}>
                  {log.action.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', paddingRight: 16 }}>
                  {log.details}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
                  {log.actor}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
