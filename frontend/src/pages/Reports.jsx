import React from 'react'

export default function Reports({ reports }) {
  const latestReport = reports[0]

  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-glow backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Artifacts</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Reports</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Human-readable summaries and full JSON output from each scan.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Generated reports</p>
          <p className="mt-2 text-2xl font-semibold text-white">{reports.length}</p>
        </div>
      </div>

      {latestReport ? (
        <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/10 p-5 text-sm text-slate-100">
          <p className="text-xs uppercase tracking-[0.3em] text-accent/80">Latest report</p>
          <p className="mt-2 text-lg font-semibold text-white">{latestReport.report_name}</p>
          <p className="mt-2 text-slate-200">Severity {latestReport.impact_analysis?.severity_label || 'Low'} with risk score {latestReport.impact_analysis?.risk_score ?? 0}.</p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-slate-400">
          No reports generated yet. Run a scan to create the first report.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {reports.map((report, index) => (
          <article key={`${report.report_name || index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-accent/30 hover:bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Report file</p>
                <h3 className="mt-2 text-lg font-medium text-white">{report.report_name || `Report ${index + 1}`}</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{report.created_at || 'Pending'}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Severity</p>
                <p className="mt-2 text-lg font-semibold text-white">{report.impact_analysis?.severity_label || 'Low'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Risk score</p>
                <p className="mt-2 text-lg font-semibold text-white">{report.impact_analysis?.risk_score ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Changes</p>
                <p className="mt-2 text-lg font-semibold text-white">{report.drift_changes?.length || 0}</p>
              </div>
            </div>
            <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-200">View full JSON</summary>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/30 p-3 text-xs text-slate-200">
{JSON.stringify(report, null, 2)}
              </pre>
            </details>
          </article>
        ))}
      </div>
    </div>
  )
}
