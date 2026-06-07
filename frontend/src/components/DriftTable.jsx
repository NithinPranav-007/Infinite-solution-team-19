import React from 'react'

export default function DriftTable({ drifts, selectedIndex, onSelect }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/6 shadow-glow backdrop-blur">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Event log</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Drift History</h2>
          </div>
          <p className="text-sm text-slate-400">Select an event below to inspect details</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-5 py-3 font-medium">Captured At</th>
              <th className="px-5 py-3 font-medium">Table</th>
              <th className="px-5 py-3 font-medium">Change</th>
              <th className="px-5 py-3 font-medium">Severity</th>
              <th className="px-5 py-3 font-medium">Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {drifts.length ? drifts.map((drift, index) => {
              const driftSeverity = drift.severity || drift.impact_analysis?.severity_label || 'Low'
              let severityBadge = 'border-teal-500/20 bg-teal-500/10 text-teal-300'
              if (driftSeverity === 'Critical') severityBadge = 'border-rose-500/20 bg-rose-500/10 text-rose-300'
              else if (driftSeverity === 'High') severityBadge = 'border-orange-500/20 bg-orange-500/10 text-orange-300'
              else if (driftSeverity === 'Medium') severityBadge = 'border-amber-500/20 bg-amber-500/10 text-amber-300'

              return (
                <tr
                  key={`${drift.captured_at || index}`}
                  onClick={() => onSelect && onSelect(index)}
                  className={`border-t border-white/8 text-slate-200 transition cursor-pointer ${
                    selectedIndex === index
                      ? 'bg-teal-950/20 border-l-2 border-l-teal-400'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="px-5 py-4 align-top text-slate-300">{drift.captured_at || 'Pending'}</td>
                  <td className="px-5 py-4 align-top font-medium text-white">{drift.changes?.[0]?.table || drift.table || 'N/A'}</td>
                  <td className="px-5 py-4 align-top text-slate-300">{drift.changes?.[0]?.change || drift.change || 'N/A'}</td>
                  <td className="px-5 py-4 align-top">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityBadge}`}>
                      {driftSeverity}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top font-semibold text-white">{drift.risk_score ?? drift.impact_analysis?.risk_score ?? 0}</td>
                </tr>
              )
            }) : (
              <tr>
                <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                  No drifts detected yet. Run a scan to generate the first event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

