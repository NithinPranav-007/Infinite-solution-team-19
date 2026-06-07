import React from 'react'

export default function DatabasePreview({ preview, selectedTable, onTableChange, onRefresh, scanTarget }) {
  const tables = preview?.tables || []
  const activeTable = tables.find((table) => table.name === selectedTable) || tables[0] || null

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-glow backdrop-blur xl:grid-cols-[0.34fr_0.66fr]">
      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Database preview</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{preview?.database || scanTarget || 'No database selected'}</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tables</p>
            <p className="mt-2 text-2xl font-semibold text-white">{preview?.table_count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Selected table</p>
            <p className="mt-2 break-all text-sm font-medium text-white">{activeTable?.name || 'None'}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
          >
            Refresh preview
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tables</p>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {tables.length ? tables.map((table) => (
              <button
                key={table.name}
                type="button"
                onClick={() => onTableChange(table.name)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  table.name === activeTable?.name
                    ? 'border-accent/40 bg-accent/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{table.name}</span>
                  <span className="text-xs text-slate-400">{table.row_count} rows</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{table.columns.length} columns</p>
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-5 text-sm text-slate-400">
                No tables available to preview.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">Table contents</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{activeTable?.name || 'Select a table'}</h3>
          </div>
          {activeTable ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {activeTable.row_count} rows
            </div>
          ) : null}
        </div>

        {activeTable ? (
          <>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    {activeTable.columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTable.sample_rows.length ? activeTable.sample_rows.map((row, index) => (
                    <tr key={`${activeTable.name}-${index}`} className="border-t border-white/8 text-slate-200">
                      {activeTable.columns.map((column) => (
                        <td key={column} className="px-4 py-3 align-top text-slate-300">
                          {String(row[column] ?? '-')}
                        </td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-400" colSpan={activeTable.columns.length}>
                        No sample rows available for this table.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Columns</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{activeTable.columns.join(', ')}</p>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-slate-400">
            Choose a table on the left to preview its data.
          </div>
        )}
      </section>
    </div>
  )
}