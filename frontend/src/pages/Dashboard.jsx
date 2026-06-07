import React, { useState } from 'react'
import KpiCard from '../components/KpiCard'
import DriftTable from '../components/DriftTable'
import AnalysisPanel from '../components/AnalysisPanel'
import SchemaDiff from '../components/SchemaDiff'
import BlastRadiusMap from '../components/BlastRadiusMap'

function RiskGauge({ score, severity }) {
  const radius = 40
  const strokeWidth = 7
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  let strokeColor = '#2dd4bf'
  if (severity === 'Critical') strokeColor = '#f43f5e'
  else if (severity === 'High') strokeColor = '#f97316'
  else if (severity === 'Medium') strokeColor = '#fbbf24'

  return (
    <div className="gauge-container w-24 h-24">
      <svg className="gauge-svg w-24 h-24" viewBox="0 0 100 100">
        <circle className="gauge-bg" cx="50" cy="50" r={radius} strokeWidth={strokeWidth} />
        <circle
          className="gauge-fill"
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-white leading-none">{score}</span>
        <span className="text-[0.55rem] text-slate-400 font-bold tracking-wider uppercase mt-1">{severity}</span>
      </div>
    </div>
  )
}

export default function Dashboard({ latest, drifts, reports, health, loading, onOpenDatabase }) {
  const [selectedDriftIndex, setSelectedDriftIndex] = useState(0)

  const criticalCount = drifts.filter((item) => (item.severity || item.impact_analysis?.severity_label) === 'Critical').length
  const averageRisk = drifts.length
    ? Math.round(drifts.reduce((sum, item) => sum + Number(item.risk_score ?? item.impact_analysis?.risk_score ?? 0), 0) / drifts.length)
    : 0

  const selectedDrift = drifts[selectedDriftIndex] || drifts[0] || null
  const selectedAnalysis = selectedDrift?.impact_analysis || selectedDrift?.analysis || null
  const selectedMitigation = selectedDrift?.suggested_fixes || selectedDrift?.mitigation || null

  const selectedSeverity = selectedDrift?.severity || selectedAnalysis?.severity_label || 'Low'
  const selectedRiskScore = selectedDrift?.risk_score ?? selectedAnalysis?.risk_score ?? 0
  const selectedSystems = selectedAnalysis?.systems_potentially_affected || selectedAnalysis?.blast_radius || []
  const selectedTable = selectedDrift?.changes?.[0]?.table || selectedDrift?.table || 'All Tables'

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
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Active Database Target</p>
          <p className="mt-1.5 text-sm text-slate-300 font-mono">
            {health?.database || 'No database connected'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDatabase}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-95"
        >
          Preview Database Tables
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DriftTable drifts={drifts} selectedIndex={selectedDriftIndex} onSelect={setSelectedDriftIndex} />

        <div className="space-y-4">
          {selectedDrift ? (
            <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Active Review Target</p>
                <h2 className="mt-2 text-lg font-bold text-white truncate max-w-[150px]">{selectedTable}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Drift captured at:<br />
                  <span className="text-teal-300 font-mono">{selectedDrift.captured_at?.split('T')[0] || 'Pending'}</span>
                </p>
              </div>
              <RiskGauge score={selectedRiskScore} severity={selectedSeverity} />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur text-center text-slate-400 text-xs">
              No active drift target selected.
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur">
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Latest Snapshot metadata</p>
            <h2 className="mt-2 text-md font-bold text-white">{latest?.schema_version || 'Waiting for first scan'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Captured</p>
                <p className="mt-2 text-[0.68rem] text-white truncate">{latest?.captured_at ? latest.captured_at.split('T')[0] : 'No capture yet'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reports</p>
                <p className="mt-2 text-sm text-white font-semibold">{reports.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedDrift && (
        <BlastRadiusMap
          severity={selectedSeverity}
          systems={selectedSystems}
          tablesAffected={selectedTable}
        />
      )}

      {selectedDrift && <SchemaDiff drift={selectedDrift} />}

      <AnalysisPanel analysis={selectedAnalysis} mitigation={selectedMitigation} />
    </div>
  )
}
