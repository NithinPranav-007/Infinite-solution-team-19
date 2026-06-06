import React from 'react'
import KpiCard from '../components/KpiCard'
import DriftTable from '../components/DriftTable'
import AnalysisPanel from '../components/AnalysisPanel'

export default function Dashboard({ latest, drifts, reports, loading }) {
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

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DriftTable drifts={drifts} />
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest Snapshot</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{latest?.schema_version || 'Waiting for first scan'}</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Database: {latest?.source_database || 'No database connected'}</p>
            <p>Captured: {latest?.captured_at || 'No capture yet'}</p>
            <p>Reports generated: {reports.length}</p>
          </div>
        </div>
      </section>

      <AnalysisPanel analysis={currentAnalysis} mitigation={currentMitigation} />
    </div>
  )
}
