import React from 'react'

export default function DriftTable({ drifts }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glow">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">Drift History</h2>
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
            {drifts.length ? drifts.map((drift, index) => (
              <tr key={`${drift.captured_at || index}`} className="border-t border-white/8 text-slate-200">
                <td className="px-5 py-3">{drift.captured_at || 'Pending'}</td>
                <td className="px-5 py-3">{drift.changes?.[0]?.table || drift.table || 'N/A'}</td>
                <td className="px-5 py-3">{drift.changes?.[0]?.change || drift.change || 'N/A'}</td>
                <td className="px-5 py-3">{drift.severity || drift.impact_analysis?.severity_label || 'Low'}</td>
                <td className="px-5 py-3">{drift.risk_score ?? drift.impact_analysis?.risk_score ?? 0}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                  No drifts detected yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
