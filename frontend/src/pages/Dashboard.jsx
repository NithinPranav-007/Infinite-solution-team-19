import React, { useState } from 'react'
import KpiCard from '../components/KpiCard'
import DriftTable from '../components/DriftTable'
import AnalysisPanel from '../components/AnalysisPanel'
import SchemaDiff from '../components/SchemaDiff'
import BlastRadiusMap from '../components/BlastRadiusMap'
import { compareSnapshots } from '../lib/api'

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

export default function Dashboard({ latest, drifts, reports, snapshots, health, loading, onOpenDatabase, toast }) {
  const [selectedDriftIndex, setSelectedDriftIndex] = useState(0)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [compPrevious, setCompPrevious] = useState('')
  const [compCurrent, setCompCurrent] = useState('')
  const [compResult, setCompResult] = useState(null)
  const [comparing, setComparing] = useState(false)

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

  // Comparison data overrides
  const activeDrift = compResult
    ? {
        ...compResult,
        changes: compResult.drift_changes,
        severity: compResult.impact_analysis?.severity_label || 'Low',
        risk_score: compResult.impact_analysis?.risk_score ?? 0,
      }
    : selectedDrift
  const activeAnalysis = compResult ? compResult.impact_analysis : selectedAnalysis
  const activeMitigation = compResult ? compResult.suggested_fixes : selectedMitigation
  const activeSeverity = compResult
    ? compResult.impact_analysis?.severity_label || 'Low'
    : selectedSeverity
  const activeRiskScore = compResult
    ? compResult.impact_analysis?.risk_score ?? 0
    : selectedRiskScore
  const activeSystems = compResult
    ? compResult.impact_analysis?.systems_potentially_affected || compResult.impact_analysis?.blast_radius || []
    : selectedSystems
  const activeTable = compResult
    ? compResult.drift_changes?.[0]?.table || 'All Tables'
    : selectedTable

  const handleCompare = async () => {
    if (!compPrevious || !compCurrent) {
      if (toast) toast.warning('Please select both snapshots to compare')
      return
    }
    if (compPrevious === compCurrent) {
      if (toast) toast.warning('Please select two different snapshots')
      return
    }
    setComparing(true)
    try {
      const result = await compareSnapshots(compPrevious, compCurrent)
      setCompResult(result)
      const changes = result.drift_changes?.length || 0
      if (changes > 0) {
        if (toast) toast.info(`Found ${changes} change(s) between snapshots`, 'Comparison Complete')
      } else {
        if (toast) toast.success('No changes between selected snapshots', 'Schemas Match')
      }
    } catch (err) {
      if (toast) toast.error(err.detail || err.message || 'Comparison failed')
    } finally {
      setComparing(false)
    }
  }

  const snapshotList = snapshots || []

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Tables" value={latest?.table_count ?? (loading ? '...' : '0')} hint="Tables found in latest snapshot" />
        <KpiCard label="Total Drifts" value={drifts.length} hint="Recorded schema change events" />
        <KpiCard label="Critical Drifts" value={criticalCount} hint="Events requiring immediate attention" />
        <KpiCard label="Average Risk Score" value={averageRisk} hint="0 to 100 risk scale" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-glow backdrop-blur">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Active Database Target</p>
          <p className="mt-1.5 text-sm text-slate-300 font-mono">
            {health?.database || 'No database connected'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setComparisonMode(!comparisonMode)
              if (comparisonMode) setCompResult(null)
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
              comparisonMode
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            {comparisonMode ? '✕ Close Compare' : '⇄ Compare Snapshots'}
          </button>
          <button
            type="button"
            onClick={onOpenDatabase}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-95"
          >
            Preview Database Tables
          </button>
        </div>
      </div>

      {/* Snapshot Comparison Selector */}
      {comparisonMode && (
        <div className="rounded-3xl border border-teal-500/20 bg-teal-950/10 p-5 shadow-glow backdrop-blur">
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-teal-400 font-semibold">Snapshot Comparison</p>
          <p className="mt-1 text-xs text-slate-400">Select two snapshots to compare and analyze the difference.</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-400 font-semibold block mb-1.5">Previous Snapshot</label>
              <select
                value={compPrevious}
                onChange={(e) => setCompPrevious(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white focus:border-teal-500/50 focus:outline-none font-mono"
              >
                <option value="">Select snapshot...</option>
                {snapshotList.map((snap) => (
                  <option key={snap.snapshot_name} value={snap.snapshot_name.replace('.json', '')}>
                    {snap.snapshot_name} — {snap.captured_at?.split('T')[0] || ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-400 font-semibold block mb-1.5">Current Snapshot</label>
              <select
                value={compCurrent}
                onChange={(e) => setCompCurrent(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-white focus:border-teal-500/50 focus:outline-none font-mono"
              >
                <option value="">Select snapshot...</option>
                {snapshotList.map((snap) => (
                  <option key={snap.snapshot_name} value={snap.snapshot_name.replace('.json', '')}>
                    {snap.snapshot_name} — {snap.captured_at?.split('T')[0] || ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCompare}
              disabled={comparing || !compPrevious || !compCurrent}
              className="rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110 active:scale-95 disabled:opacity-50 shadow-md shadow-teal-500/10"
            >
              {comparing ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" /> Comparing...
                </span>
              ) : (
                'Compare Snapshots'
              )}
            </button>
          </div>

          {compResult && (
            <div className="mt-4 rounded-xl border border-teal-500/15 bg-teal-950/20 px-4 py-3 text-xs text-teal-200">
              Comparing <code className="font-mono text-white">{compResult.previous_snapshot}</code> → <code className="font-mono text-white">{compResult.current_snapshot}</code>: {compResult.drift_changes?.length || 0} change(s) found
            </div>
          )}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <DriftTable drifts={drifts} selectedIndex={selectedDriftIndex} onSelect={(idx) => { setSelectedDriftIndex(idx); setCompResult(null) }} />

        <div className="space-y-4">
          {activeDrift ? (
            <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Active Review Target</p>
                <h2 className="mt-2 text-lg font-bold text-white truncate max-w-[150px]">{activeTable}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {compResult ? 'Comparison result' : 'Drift captured at:'}<br />
                  <span className="text-teal-300 font-mono">
                    {compResult
                      ? `${compResult.previous_snapshot} → ${compResult.current_snapshot}`
                      : activeDrift.captured_at?.split('T')[0] || 'Pending'}
                  </span>
                </p>
              </div>
              <RiskGauge score={activeRiskScore} severity={activeSeverity} />
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

      {activeDrift && (
        <BlastRadiusMap
          severity={activeSeverity}
          systems={activeSystems}
          tablesAffected={activeTable}
        />
      )}

      {activeDrift && <SchemaDiff drift={activeDrift} />}

      <AnalysisPanel analysis={activeAnalysis} mitigation={activeMitigation} />
    </div>
  )
}
