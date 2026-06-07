import React, { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import DatabasePreview from './pages/DatabasePreview'
import History from './pages/History'
import Reports from './pages/Reports'
import { fetchDatabasePreview, fetchDrifts, fetchReports, fetchLatestSchema, fetchHealth, triggerScanWithPath } from './lib/api'

const tabs = ['Dashboard', 'Database', 'History', 'Reports']
const DEMO_DATABASE_PATH = 'D:\\Infinite solutions\\backend\\sample.db'

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [state, setState] = useState({
    latest: null,
    drifts: [],
    reports: [],
    health: { status: 'ok', database: DEMO_DATABASE_PATH },
    loading: true,
    scanTarget: DEMO_DATABASE_PATH,
    databasePreview: null,
    selectedTable: '',
  })
  const [isScanning, setIsScanning] = useState(false)

  const refreshData = async () => {
    const [health, latest, drifts, reports, databasePreview] = await Promise.all([
      fetchHealth(),
      fetchLatestSchema(),
      fetchDrifts(),
      fetchReports(),
      fetchDatabasePreview(state.scanTarget, state.selectedTable),
    ])
    return { health, latest, drifts, reports, databasePreview }
  }

  const runScan = async (dbPath) => {
    setIsScanning(true)
    try {
      await triggerScanWithPath(dbPath || null)
      const refreshed = await refreshData()
      if (!dbPath && !state.scanTarget && refreshed.health?.database) {
        refreshed.scanTarget = refreshed.health.database
      }
      if (!refreshed.selectedTable && refreshed.databasePreview?.tables?.length) {
        refreshed.selectedTable = refreshed.databasePreview.tables[0].name
      }
      setState((current) => ({
        ...current,
        ...refreshed,
        loading: false,
        scanTarget: dbPath || current.scanTarget || refreshed.health?.database || '',
      }))
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    let mounted = true
    refreshData()
      .then(async ({ health, latest, drifts, reports }) => {
        if (!mounted) return
        const scanTarget = health?.database || latest?.source_database || DEMO_DATABASE_PATH
        const databasePreview = await fetchDatabasePreview(scanTarget)
        const resolvedHealth = health || { status: 'ok', database: scanTarget }
        setState({
          latest,
          drifts,
          reports,
          health: resolvedHealth,
          loading: false,
          scanTarget,
          databasePreview,
          selectedTable: databasePreview?.tables?.[0]?.name || '',
        })

        if (scanTarget && !latest) {
          await runScan(scanTarget)
        }
      })
      .catch(() => {
        if (!mounted) return
        setState({
          latest: null,
          drifts: [],
          reports: [],
          health: { status: 'ok', database: DEMO_DATABASE_PATH },
          loading: false,
          scanTarget: DEMO_DATABASE_PATH,
          databasePreview: null,
          selectedTable: '',
        })
      })
    return () => {
      mounted = false
    }
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
      health: refreshed.health || { status: 'ok', database: current.scanTarget || DEMO_DATABASE_PATH },
      scanTarget: refreshed.health?.database || refreshed.latest?.source_database || current.scanTarget || DEMO_DATABASE_PATH,
      selectedTable: refreshed.databasePreview?.tables?.[0]?.name || current.selectedTable,
    }))
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(55,199,173,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.10),_transparent_24%),linear-gradient(180deg,#08111f_0%,#0b1324_100%)] text-slate-100">
      <div className="absolute inset-0 -z-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-glow backdrop-blur">
          <div className="p-6 xl:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.45em] text-accent/80">Schema Evolution Guardian</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Make database drift visible before it breaks production.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                  A focused workspace to connect SQLite, inspect schema changes, and generate impact analysis without extra noise.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleConnect(state.scanTarget)}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  {isScanning ? 'Scanning...' : 'Connect & Scan'}
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Database')}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Open database preview
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                {state.health?.status === 'ok' ? 'Database connected' : 'Database offline'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                {state.health?.database || 'No database selected'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                {state.reports.length} reports
              </span>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-t border-white/10 bg-slate-950/30 px-6 py-4 xl:px-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab ? 'bg-accent text-slate-950' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <main className="grid flex-1 gap-6">
          {activeTab === 'Dashboard' && (
            <Dashboard
              latest={state.latest}
              drifts={state.drifts}
              reports={state.reports}
              health={state.health}
              loading={state.loading}
              scanTarget={state.scanTarget}
              isScanning={isScanning}
              onConnect={handleConnect}
              onRefresh={handleRefresh}
              onScanTargetChange={(value) => setState((current) => ({ ...current, scanTarget: value }))}
              onOpenDatabase={() => setActiveTab('Database')}
            />
          )}
          {activeTab === 'Database' && (
            <DatabasePreview
              preview={state.databasePreview}
              selectedTable={state.selectedTable}
              scanTarget={state.scanTarget}
              onTableChange={(value) => setState((current) => ({ ...current, selectedTable: value }))}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === 'History' && <History drifts={state.drifts} />}
          {activeTab === 'Reports' && <Reports reports={state.reports} />}
        </main>
      </div>
    </div>
  )
}
