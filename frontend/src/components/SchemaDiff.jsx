import React from 'react'

export default function SchemaDiff({ drift }) {
  if (!drift) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
        Select a schema drift event to view structural diff details.
      </div>
    )
  }

  const changes = drift.changes || drift.drift_changes || []

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-glow backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Granular Schema Diff</p>
          <h3 className="mt-1 text-xl font-bold text-white">Visual Comparison</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Snapshot Version</p>
          <code className="text-xs font-mono text-teal-400">{drift.current_snapshot || drift.schema_version || 'Active'}</code>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {changes.length ? (
          changes.map((change, index) => {
            const isAdded = change.change === 'added_column' || change.change === 'added_table'
            const isRemoved = change.change === 'removed_column' || change.change === 'removed_table'
            const isRenamed = change.change === 'renamed_column'
            const isTypeChange = change.change === 'data_type_changed'

            let changeBadgeColor = 'border-teal-500/20 bg-teal-500/10 text-teal-300'
            if (isRemoved) changeBadgeColor = 'border-rose-500/20 bg-rose-500/10 text-rose-300'
            if (isRenamed) changeBadgeColor = 'border-amber-500/20 bg-amber-500/10 text-amber-300'
            if (isTypeChange) changeBadgeColor = 'border-blue-500/20 bg-blue-500/10 text-blue-300'

            return (
              <div
                key={`${change.table}-${change.column || change.from || index}`}
                className={`flex flex-col gap-3 rounded-2xl border p-4 backdrop-blur-sm transition-all hover:scale-[1.01] ${
                  isAdded ? 'border-emerald-500/20 bg-emerald-950/10' :
                  isRemoved ? 'border-rose-500/20 bg-rose-950/10' :
                  isRenamed ? 'border-amber-500/20 bg-amber-950/10' :
                  'border-blue-500/20 bg-blue-950/10'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Table:</span>
                    <span className="font-semibold text-white text-sm bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{change.table}</span>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ${changeBadgeColor}`}>
                    {change.change.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 py-1 text-sm">
                  {isAdded && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-lg font-bold">＋</span>
                      <span className="text-slate-300">Added column</span>
                      <code className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 border border-emerald-500/20">
                        {change.column}
                      </code>
                    </div>
                  )}

                  {isRemoved && (
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 text-lg font-bold">－</span>
                      <span className="text-slate-300">Removed column</span>
                      <code className="rounded bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300/80 border border-rose-500/20 line-through">
                        {change.column}
                      </code>
                    </div>
                  )}

                  {isRenamed && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-amber-400 text-lg font-bold">➔</span>
                      <span className="text-slate-300">Renamed column</span>
                      <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-slate-400 line-through border border-white/5">
                        {change.from}
                      </code>
                      <span className="text-slate-500 font-bold">to</span>
                      <code className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-amber-300 border border-amber-500/20">
                        {change.to}
                      </code>
                    </div>
                  )}

                  {isTypeChange && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-blue-400 text-lg font-bold">⚡</span>
                      <span className="text-slate-300">Modified data type of</span>
                      <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-slate-300 border border-white/5">
                        {change.column}
                      </code>
                      <span className="text-slate-500 font-bold">from</span>
                      <code className="rounded bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300/80 border border-rose-500/20">
                        {change.from}
                      </code>
                      <span className="text-slate-500 font-bold">to</span>
                      <code className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 border border-emerald-500/20">
                        {change.to}
                      </code>
                    </div>
                  )}

                  {change.change === 'added_table' && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-lg font-bold">📦</span>
                      <span className="text-slate-300">New table created:</span>
                      <code className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-300 border border-emerald-500/20">
                        {change.table}
                      </code>
                    </div>
                  )}

                  {change.change === 'removed_table' && (
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 text-lg font-bold">🗑️</span>
                      <span className="text-slate-300">Table completely dropped:</span>
                      <code className="rounded bg-rose-500/10 px-2 py-0.5 font-mono text-rose-300 border border-rose-500/20 line-through">
                        {change.table}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-teal-500/20 bg-teal-950/10 p-5 text-sm text-teal-300 flex items-center gap-3">
            <span>🛡️</span>
            <span>No structural changes detected. Schema is completely in sync with the snapshot baseline.</span>
          </div>
        )}
      </div>
    </div>
  )
}
