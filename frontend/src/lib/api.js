const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.detail || `Request failed: ${response.status}`)
    error.status = response.status
    error.detail = body.detail || ''
    throw error
  }
  return response.json()
}

export function fetchLatestSchema() {
  return request('/schema/latest').catch(() => null)
}

export function fetchHealth() {
  return request('/health').catch(async () => {
    try {
      const response = await fetch(`${API_ROOT}/health`)
      if (!response.ok) {
        return null
      }
      return response.json()
    } catch {
      return null
    }
  })
}

export function fetchDrifts() {
  return request('/drifts').catch(() => [])
}

export function fetchReports() {
  return request('/reports').catch(() => [])
}

export function triggerScan() {
  return triggerScanWithPath(null)
}

export function triggerScanWithPath(dbPath) {
  return request('/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dbPath ? { db_path: dbPath } : {}),
  })
}

export function fetchDatabasePreview(dbPath = '', table = '') {
  const params = new URLSearchParams()
  if (dbPath) params.set('db_path', dbPath)
  if (table) params.set('table', table)
  params.set('limit', '5')
  const query = params.toString()
  return request(`/database/preview${query ? `?${query}` : ''}`).catch(() => null)
}

export function fetchSettings() {
  return request('/settings').catch(() => ({ target_db_path: '' }))
}

export function saveSettings(settings) {
  return request('/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })
}

// ── New API functions ────────────────────────────────────────────────

export function fetchSnapshots() {
  return request('/snapshots').catch(() => [])
}

export function compareSnapshots(previousSnapshot, currentSnapshot) {
  return request('/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      previous_snapshot: previousSnapshot,
      current_snapshot: currentSnapshot,
    }),
  })
}

export function simulateChange(payload) {
  return request('/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function resetAllData() {
  return request('/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
