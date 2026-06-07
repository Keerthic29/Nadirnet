const BASE = '/api'

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  health: () => req('GET', '/health'),
  incidents: {
    list: () => req('GET', '/incidents/'),
    get: (id) => req('GET', `/incidents/${id}`),
    create: (data) => req('POST', '/incidents/', data),
    update: (id, data) => req('PATCH', `/incidents/${id}`, data),
    delete: (id) => req('DELETE', `/incidents/${id}`),
  },
  triage: {
    run: (incidentId) => req('POST', `/triage/${incidentId}`),
    latest: (incidentId) => req('GET', `/triage/${incidentId}/latest`),
    verify: (decisionId, data) => req('POST', `/triage/${decisionId}/verify`, data),
    stats: () => req('GET', '/triage/stats/accuracy'),
  },
  reports: {
    generate: (incidentId) => req('POST', `/reports/${incidentId}/generate`),
    latest: (incidentId) => req('GET', `/reports/${incidentId}/latest`),
  },
  audit: {
    list: () => req('GET', '/audit/'),
    forIncident: (id) => req('GET', `/audit/incident/${id}`),
  }
}
