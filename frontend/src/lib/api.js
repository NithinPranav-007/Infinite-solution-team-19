const API_ROOT = 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, options)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json()
}

export function fetchLatestSchema() {
  return request('/schema/latest').catch(() => null)
}

export function fetchHealth() {
  return request('/health').catch(async () => {
    try {
      const response = await fetch('http://localhost:8000/health')
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
  }).catch(() => null)
}

export function formatSeverity(value) {
  return value || 'Low'
}

export function fetchDatabasePreview(dbPath = '', table = '') {
  const params = new URLSearchParams()
  if (dbPath) params.set('db_path', dbPath)
  if (table) params.set('table', table)
  params.set('limit', '5')
  const query = params.toString()
  return request(`/database/preview${query ? `?${query}` : ''}`).catch(() => null)
}
