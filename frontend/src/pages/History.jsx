import React from 'react'

export default function History({ drifts }) {
  const driftsCount = drifts.length

  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-glow backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">History</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Track schema changes over time, review impact, and identify repeat offenders.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Events recorded</p>
          <p className="mt-2 text-2xl font-semibold text-white">{driftsCount}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {drifts.map((drift, index) => (
          <article key={`${drift.captured_at || index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-accent/30 hover:bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{drift.captured_at || 'Pending capture'}</p>
                <h3 className="mt-2 text-lg font-medium text-white">{drift.changes?.[0]?.table || drift.table || 'Schema event'}</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{drift.severity || 'Low'}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{drift.analysis?.executive_summary || drift.impact_analysis?.executive_summary || drift.executive_summary || 'No summary available.'}</p>
          </article>
        ))}
        {!drifts.length && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-slate-400">
            No history yet. Run a scan to create the first timeline entry.
          </div>
        )}
      </div>
    </div>
  )
}
