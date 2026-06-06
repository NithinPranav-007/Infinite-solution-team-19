import React from 'react'

export default function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-glow backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  )
}
