import React from 'react'
import KpiCard from '../components/KpiCard'
import DriftTable from '../components/DriftTable'
import AnalysisPanel from '../components/AnalysisPanel'

export default function Dashboard({ latest, drifts, reports, health, loading, onOpenDatabase }) {
  const criticalCount = drifts.filter((item) => (item.severity || item.impact_analysis?.severity_label) === 'Critical').length
  const averageRisk = drifts.length
    ? Math.round(drifts.reduce((sum, item) => sum + Number(item.risk_score ?? item.impact_analysis?.risk_score ?? 0), 0) / drifts.length)
    : 0

  const currentAnalysis = drifts[0]?.impact_analysis || null
  const currentMitigation = drifts[0]?.suggested_fixes || null

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Tables" value={latest?.table_count ?? (loading ? '...' : '0')} hint="Tables found in latest snapshot" />
        <KpiCard label="Total Drifts" value={drifts.length} hint="Recorded schema change events" />
        <KpiCard label="Critical Drifts" value={criticalCount} hint="Events requiring immediate attention" />
        <KpiCard label="Average Risk Score" value={averageRisk} hint="0 to 100 risk scale" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/6 px-5 py-4 shadow-glow backdrop-blur">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Current connection</p>
          <p className="mt-2 text-sm text-slate-300">
            {health?.database || 'No database connected'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDatabase}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Preview database
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DriftTable drifts={drifts} />
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur">
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Latest snapshot</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{latest?.schema_version || 'Waiting for first scan'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Captured</p>
                <p className="mt-2 text-sm text-white">{latest?.captured_at || 'No capture yet'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reports</p>
                <p className="mt-2 text-sm text-white">{reports.length}</p>
              </div>
            </div>
            {!latest && health?.database ? (
              <p className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
                Database connected. Run a scan to populate schema history.
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur">
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Connection hint</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use the Database tab to inspect tables and sample rows, or paste a local SQLite path in the top bar and run a scan.
            </p>
          </div>
        </div>
      </section>

      <AnalysisPanel analysis={currentAnalysis} mitigation={currentMitigation} />
    </div>
  )
}
