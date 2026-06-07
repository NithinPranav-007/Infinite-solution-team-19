import React from 'react'

export default function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-glow backdrop-blur transition hover:-translate-y-0.5 hover:border-accent/30">
      <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{hint}</p>
    </div>
  )
}
