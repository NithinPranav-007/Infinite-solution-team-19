import React, { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Reports from './pages/Reports'
import { fetchDrifts, fetchReports, fetchLatestSchema } from './lib/api'

const tabs = ['Dashboard', 'History', 'Reports']

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [state, setState] = useState({ latest: null, drifts: [], reports: [], loading: true })

  useEffect(() => {
    let mounted = true
    Promise.all([fetchLatestSchema(), fetchDrifts(), fetchReports()])
      .then(([latest, drifts, reports]) => {
        if (!mounted) return
        setState({ latest, drifts, reports, loading: false })
      })
      .catch(() => {
        if (!mounted) return
        setState({ latest: null, drifts: [], reports: [], loading: false })
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(55,199,173,0.16),_transparent_28%),linear-gradient(180deg,#08111f_0%,#0b1324_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent/80">Schema Evolution Guardian</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Schema Drift Detection and Impact Analysis</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Monitor schema drift, assess blast radius with AI, and generate mitigation plans in one workflow.
            </p>
          </div>
          <nav className="flex gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <main className="grid flex-1 gap-6">
          {activeTab === 'Dashboard' && <Dashboard latest={state.latest} drifts={state.drifts} reports={state.reports} loading={state.loading} />}
          {activeTab === 'History' && <History drifts={state.drifts} />}
          {activeTab === 'Reports' && <Reports reports={state.reports} />}
        </main>
      </div>
    </div>
  )
}
