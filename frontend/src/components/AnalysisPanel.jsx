import React from 'react'

export default function AnalysisPanel({ analysis, mitigation }) {
  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow lg:grid-cols-2">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Analysis</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Impact Assessment</h3>
        <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-slate-950/60 p-4 text-xs text-slate-200">
{JSON.stringify(analysis || {}, null, 2)}
        </pre>
      </section>
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Mitigation</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Migration Suggestions</h3>
        <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-slate-950/60 p-4 text-xs text-slate-200">
{JSON.stringify(mitigation || {}, null, 2)}
        </pre>
      </section>
    </div>
  )
}
