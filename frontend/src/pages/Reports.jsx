import React from 'react'

export default function Reports({ reports }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
      <h2 className="text-2xl font-semibold text-white">Reports</h2>
      <p className="mt-2 text-sm text-slate-400">Generated JSON reports for each scan are available here.</p>
      <div className="mt-6 space-y-4">
        {reports.map((report, index) => (
          <article key={`${report.report_name || index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-medium text-white">{report.report_name || `Report ${index + 1}`}</h3>
              <span className="text-xs text-slate-400">{report.created_at || 'Pending'}</span>
            </div>
            <pre className="mt-3 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-slate-200">
{JSON.stringify(report, null, 2)}
            </pre>
          </article>
        ))}
        {!reports.length && <p className="text-sm text-slate-400">No reports generated yet.</p>}
      </div>
    </div>
  )
}
