import React, { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import DatabasePreview from './pages/DatabasePreview'
import History from './pages/History'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Simulate from './pages/Simulate'
import Toast, { useToast } from './components/Toast'
import {
  fetchDatabasePreview,
  fetchDrifts,
  fetchReports,
  fetchLatestSchema,
  fetchHealth,
  triggerScanWithPath,
  fetchSettings,
  fetchSnapshots,
} from './lib/api'

const tabs = ['Dashboard', 'Database', 'Simulate', 'History', 'Reports', 'Settings']

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [state, setState] = useState({
    latest: null,
    drifts: [],
    reports: [],
    snapshots: [],
    health: { status: 'ok', database: '' },
    loading: true,
    scanTarget: '',
    databasePreview: null,
    selectedTable: '',
  })
  const [isScanning, setIsScanning] = useState(false)
  const { toasts, toast, dismissToast } = useToast()

  const refreshData = async (targetPath) => {
    const activePath = targetPath || state.scanTarget
    const [health, latest, drifts, reports, databasePreview, snapshots] = await Promise.all([
      fetchHealth(),
      fetchLatestSchema(),
      fetchDrifts(),
      fetchReports(),
      fetchDatabasePreview(activePath, state.selectedTable),
      fetchSnapshots(),
    ])
    return { health, latest, drifts, reports, databasePreview, snapshots }
  }

  const runScan = async (dbPath) => {
    setIsScanning(true)
    try {
      const result = await triggerScanWithPath(dbPath || null)
      const refreshed = await refreshData(dbPath)
      if (!refreshed.selectedTable && refreshed.databasePreview?.tables?.length) {
        refreshed.selectedTable = refreshed.databasePreview.tables[0].name
      }
      setState((current) => ({
        ...current,
        ...refreshed,
        loading: false,
        scanTarget: dbPath || current.scanTarget || refreshed.health?.database || '',
      }))

      // Show toast with scan results
      const changeCount = result?.drift_changes?.length || 0
      const severity = result?.impact_analysis?.severity_label || 'Low'
      if (changeCount > 0) {
        toast.warning(
          `${changeCount} schema change(s) detected — Severity: ${severity}`,
          'Drift Detected'
        )
      } else {
        toast.success('No schema changes detected. Everything is in sync.', 'Scan Complete')
      }
    } catch (err) {
      toast.error(err.detail || err.message || 'Scan failed. Check backend connection.', 'Scan Failed')
    } finally {
      setIsScanning(false)
    }
  }

  const loadInitialData = async () => {
    try {
      const settingsData = await fetchSettings()
      const configuredPath = settingsData.target_db_path || ''

      const refreshed = await refreshData(configuredPath)
      const resolvedHealth = refreshed.health || { status: 'ok', database: configuredPath }
      const resolvedPath = configuredPath || resolvedHealth.database || ''
      const databasePreview = resolvedPath
        ? await fetchDatabasePreview(resolvedPath)
        : null

      setState({
        latest: refreshed.latest,
        drifts: refreshed.drifts,
        reports: refreshed.reports,
        snapshots: refreshed.snapshots || [],
        health: { ...resolvedHealth, database: resolvedPath || resolvedHealth.database },
        loading: false,
        scanTarget: resolvedPath,
        databasePreview,
        selectedTable: databasePreview?.tables?.[0]?.name || '',
      })

      if (resolvedPath && !refreshed.latest) {
        await runScan(resolvedPath)
      }
    } catch {
      setState({
        latest: null,
        drifts: [],
        reports: [],
        snapshots: [],
        health: { status: 'ok', database: '' },
        loading: false,
        scanTarget: '',
        databasePreview: null,
        selectedTable: '',
      })
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  const handleConnect = async (dbPath) => {
    await runScan(dbPath || state.scanTarget)
  }

  const handleRefresh = async () => {
    const refreshed = await refreshData()
    setState((current) => ({
      ...current,
      ...refreshed,
      loading: false,
      health: refreshed.health || { status: 'ok', database: current.scanTarget || '' },
      scanTarget: refreshed.health?.database || refreshed.latest?.source_database || current.scanTarget || '',
      selectedTable: refreshed.databasePreview?.tables?.[0]?.name || current.selectedTable,
    }))
    toast.info('Dashboard data refreshed', 'Refreshed')
  }

  const handleSettingsChange = async () => {
    setState((current) => ({ ...current, loading: true }))
    await loadInitialData()
    toast.success('Settings applied and data reloaded', 'Settings Updated')
  }

  const handleScanAfterSimulate = async () => {
    setActiveTab('Dashboard')
    await runScan(state.scanTarget)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(244,63,94,0.06),_transparent_26%),linear-gradient(180deg,#040812_0%,#060c18_100%)] text-slate-100">
      <div className="absolute inset-0 -z-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/45 shadow-glow backdrop-blur-md">
          <div className="p-6 xl:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.45em] text-teal-400 font-semibold">Schema Evolution Guardian</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
                  Make database drift visible before it <span className="gradient-text-rose font-extrabold">breaks production.</span>
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base font-light">
                  Connect SQLite, scan for schema changes, and review AI-driven impact analysis and migration guidance.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleConnect(state.scanTarget)}
                  disabled={isScanning}
                  className="rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 active:scale-95 shadow-lg shadow-teal-500/20 disabled:opacity-70"
                >
                  {isScanning ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner" /> Scanning...
                    </span>
                  ) : (
                    'Connect & Scan'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20 active:scale-95 bg-white/5"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Database')}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20 active:scale-95 bg-white/5"
                >
                  Database preview
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-teal-500/20 bg-teal-950/30 px-3 py-1.5 text-teal-300 font-medium flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-amber-400 scan-active' : 'bg-teal-400 animate-pulse'}`} />
                {isScanning ? 'Scanning...' : state.health?.status === 'ok' ? 'Database Connected' : 'Database Offline'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
                Path: <code className="text-teal-300 font-mono text-xs">{state.health?.database || 'No database selected'}</code>
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 font-medium">
                {state.reports.length} Reports Generated
              </span>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-t border-white/10 bg-slate-950/20 px-6 py-4 xl:px-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-teal-400/90 to-teal-400 text-slate-950 shadow-md shadow-teal-400/15'
                    : 'border border-white/5 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <main className="grid flex-1 gap-6">
          {state.loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-8 text-center text-slate-400 flex flex-col items-center gap-4">
              <span className="spinner spinner-lg text-teal-400" />
              Loading configuration state...
            </div>
          ) : (
            <>
              {activeTab === 'Dashboard' && (
                <Dashboard
                  latest={state.latest}
                  drifts={state.drifts}
                  reports={state.reports}
                  snapshots={state.snapshots}
                  health={state.health}
                  loading={state.loading}
                  onOpenDatabase={() => setActiveTab('Database')}
                  toast={toast}
                />
              )}
              {activeTab === 'Database' && (
                <DatabasePreview
                  preview={state.databasePreview}
                  selectedTable={state.selectedTable}
                  scanTarget={state.scanTarget}
                  onTableChange={async (value) => {
                    const preview = state.scanTarget
                      ? await fetchDatabasePreview(state.scanTarget, value)
                      : state.databasePreview
                    setState((current) => ({
                      ...current,
                      selectedTable: value,
                      databasePreview: preview || current.databasePreview,
                    }))
                  }}
                  onRefresh={handleRefresh}
                />
              )}
              {activeTab === 'Simulate' && (
                <Simulate
                  onScanAfterSimulate={handleScanAfterSimulate}
                  toast={toast}
                />
              )}
              {activeTab === 'History' && <History drifts={state.drifts} />}
              {activeTab === 'Reports' && <Reports reports={state.reports} toast={toast} />}
              {activeTab === 'Settings' && (
                <Settings
                  onSettingsChange={handleSettingsChange}
                  currentDbPath={state.scanTarget}
                  toast={toast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
