export const SEVERITY = {
  CRITICAL: { color: 'var(--critical)', bg: 'var(--critical-bg)', label: 'CRITICAL', rank: 4 },
  HIGH:     { color: 'var(--high)',     bg: 'var(--high-bg)',     label: 'HIGH',     rank: 3 },
  MEDIUM:   { color: 'var(--medium)',   bg: 'var(--medium-bg)',   label: 'MEDIUM',   rank: 2 },
  LOW:      { color: 'var(--low)',      bg: 'var(--low-bg)',      label: 'LOW',      rank: 1 },
}

export function getSeverityStyle(sev) {
  return SEVERITY[sev] || SEVERITY.LOW
}

export function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function confidenceLabel(c) {
  if (c >= 0.85) return { label: 'HIGH', color: 'var(--low)' }
  if (c >= 0.60) return { label: 'MED',  color: 'var(--medium)' }
  return { label: 'LOW', color: 'var(--critical)' }
}
