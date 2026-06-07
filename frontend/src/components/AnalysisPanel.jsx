import React from 'react'

export default function AnalysisPanel({ analysis, mitigation }) {
  const severity = analysis?.severity_label || 'Low'
  const riskScore = analysis?.risk_score ?? 0
  const systems = analysis?.systems_potentially_affected || []
  const actions = analysis?.recommended_actions || []
  const blastRadius = analysis?.blast_radius || []

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-glow backdrop-blur lg:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">AI analysis</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Impact Assessment</h3>
          </div>
          <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent">
            Risk {riskScore}/100
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Severity</p>
            <p className="mt-2 text-lg font-semibold text-white">{severity}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Blast radius</p>
            <p className="mt-2 text-lg font-semibold text-white">{blastRadius.length || 0} systems</p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
          <p>{analysis?.executive_summary || 'No AI summary is available yet. Run a scan to generate one.'}</p>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Systems potentially affected</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(systems.length ? systems : ['Run a scan to see impacted systems']).map((system) => (
                <span key={system} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {system}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Business impact</p>
            <p className="mt-2">{analysis?.business_impact || 'Business impact will appear after the first AI analysis.'}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Technical impact</p>
            <p className="mt-2">{analysis?.technical_impact || 'Technical impact will appear after the first AI analysis.'}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recommended actions</p>
            <ul className="mt-2 space-y-2">
              {(actions.length ? actions : ['Run a scan to receive recommended actions']).map((action) => (
                <li key={action} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-accent" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Mitigation</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Migration Suggestions</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Generated output
          </div>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">SQL migration script</p>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 text-xs text-slate-200">
{mitigation?.sql_migration_script || '-- No migration generated yet'}
            </pre>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Compatibility views</p>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 text-xs text-slate-200">
{mitigation?.compatibility_views || '-- No compatibility view generated yet'}
            </pre>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rollback script</p>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 text-xs text-slate-200">
{mitigation?.rollback_script || '-- No rollback generated yet'}
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
