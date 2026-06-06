import React from 'react'

export default function History({ drifts }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow">
      <h2 className="text-2xl font-semibold text-white">History</h2>
      <p className="mt-2 text-sm text-slate-400">Track schema changes over time and review the blast radius of each drift.</p>
      <div className="mt-6 grid gap-4">
        {drifts.map((drift, index) => (
          <article key={`${drift.captured_at || index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-medium text-white">{drift.changes?.[0]?.table || drift.table || 'Schema event'}</h3>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">{drift.severity || 'Low'}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{drift.executive_summary || drift.impact_analysis?.executive_summary || 'No summary available.'}</p>
          </article>
        ))}
        {!drifts.length && <p className="text-sm text-slate-400">No history yet.</p>}
      </div>
    </div>
  )
}
