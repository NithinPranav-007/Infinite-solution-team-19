const API_ROOT = '/api'

async function request(path) {
  const response = await fetch(`${API_ROOT}${path}`)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json()
}

export function fetchLatestSchema() {
  return request('/schema/latest').catch(() => null)
}

export function fetchDrifts() {
  return request('/drifts').catch(() => [])
}

export function fetchReports() {
  return request('/reports').catch(() => [])
}
