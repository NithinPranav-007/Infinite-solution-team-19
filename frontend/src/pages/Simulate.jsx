import React, { useState } from 'react'
import { simulateChange } from '../lib/api'

const SIMULATION_ACTIONS = [
  {
    id: 'add_column',
    title: 'Add Column',
    description: 'Add a new column to an existing table to simulate schema expansion.',
    icon: '＋',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    bgColor: 'bg-emerald-950/10 hover:bg-emerald-950/25',
    glowColor: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]',
    fields: [
      { key: 'table', label: 'Table Name', placeholder: 'customers', defaultValue: 'customers' },
      { key: 'column', label: 'Column Name', placeholder: 'phone_number', defaultValue: 'phone_number' },
      { key: 'column_type', label: 'Column Type', placeholder: 'TEXT', defaultValue: 'TEXT' },
    ],
  },
  {
    id: 'rename_column',
    title: 'Rename Column',
    description: 'Rename a column to simulate a breaking rename drift event.',
    icon: '➔',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    bgColor: 'bg-amber-950/10 hover:bg-amber-950/25',
    glowColor: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]',
    fields: [
      { key: 'table', label: 'Table Name', placeholder: 'customers', defaultValue: 'customers' },
      { key: 'column', label: 'Current Column Name', placeholder: 'email', defaultValue: 'email' },
      { key: 'new_name', label: 'New Column Name', placeholder: 'email_address', defaultValue: 'email_address' },
    ],
  },
  {
    id: 'drop_column',
    title: 'Drop Column',
    description: 'Remove a column entirely to simulate a destructive schema change.',
    icon: '－',
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/20 hover:border-rose-500/40',
    bgColor: 'bg-rose-950/10 hover:bg-rose-950/25',
    glowColor: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]',
    fields: [
      { key: 'table', label: 'Table Name', placeholder: 'customers', defaultValue: 'customers' },
      { key: 'column', label: 'Column to Drop', placeholder: 'created_at', defaultValue: 'created_at' },
    ],
  },
  {
    id: 'add_table',
    title: 'Add Table',
    description: 'Create a new table to test table-level drift detection.',
    icon: '📦',
    iconColor: 'text-sky-400',
    borderColor: 'border-sky-500/20 hover:border-sky-500/40',
    bgColor: 'bg-sky-950/10 hover:bg-sky-950/25',
    glowColor: 'hover:shadow-[0_0_30px_rgba(14,165,233,0.1)]',
    fields: [
      { key: 'new_table', label: 'New Table Name', placeholder: 'audit_log', defaultValue: 'audit_log' },
    ],
  },
]

export default function Simulate({ onScanAfterSimulate, toast }) {
  const [formStates, setFormStates] = useState(() => {
    const initial = {}
    SIMULATION_ACTIONS.forEach((action) => {
      const fields = {}
      action.fields.forEach((field) => {
        fields[field.key] = field.defaultValue || ''
      })
      initial[action.id] = { fields, loading: false, result: null }
    })
    return initial
  })

  const handleFieldChange = (actionId, fieldKey, value) => {
    setFormStates((prev) => ({
      ...prev,
      [actionId]: {
        ...prev[actionId],
        fields: { ...prev[actionId].fields, [fieldKey]: value },
      },
    }))
  }

  const handleSimulate = async (actionConfig) => {
    const actionId = actionConfig.id
    setFormStates((prev) => ({
      ...prev,
      [actionId]: { ...prev[actionId], loading: true, result: null },
    }))

    try {
      const payload = { action: actionId, ...formStates[actionId].fields }
      const result = await simulateChange(payload)
      setFormStates((prev) => ({
        ...prev,
        [actionId]: { ...prev[actionId], loading: false, result: { type: 'success', message: result.message } },
      }))
      if (toast) toast.success(result.message, 'Simulation Applied')
    } catch (err) {
      const message = err.detail || err.message || 'Simulation failed'
      setFormStates((prev) => ({
        ...prev,
        [actionId]: { ...prev[actionId], loading: false, result: { type: 'error', message } },
      }))
      if (toast) toast.error(message, 'Simulation Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-glow backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Testing Tool</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Schema Drift Simulator</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400 max-w-2xl">
              Apply real schema changes to the target database to test drift detection. After simulating, click <strong className="text-teal-300">Connect & Scan</strong> to detect the changes.
            </p>
          </div>
          <button
            type="button"
            onClick={onScanAfterSimulate}
            className="rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 active:scale-95 shadow-lg shadow-teal-500/20"
          >
            Run Scan After Changes
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {SIMULATION_ACTIONS.map((action) => {
          const state = formStates[action.id]
          return (
            <div
              key={action.id}
              className={`rounded-3xl border ${action.borderColor} ${action.bgColor} ${action.glowColor} p-5 transition-all duration-300 backdrop-blur`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${action.iconColor}`}>{action.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{action.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {action.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-400 font-semibold block">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={state.fields[field.key]}
                      onChange={(e) => handleFieldChange(action.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-500/50 focus:outline-none font-mono"
                    />
                  </div>
                ))}
              </div>

              {state.result && (
                <div
                  className={`mt-4 rounded-xl border px-3 py-2.5 text-xs ${
                    state.result.type === 'success'
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/25 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {state.result.message}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleSimulate(action)}
                disabled={state.loading}
                className={`mt-4 w-full rounded-xl px-4 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                  action.id === 'drop_column'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/10 hover:brightness-110'
                    : action.id === 'rename_column'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md shadow-amber-500/10 hover:brightness-110'
                    : action.id === 'add_table'
                    ? 'bg-gradient-to-r from-sky-400 to-blue-400 text-slate-950 shadow-md shadow-sky-500/10 hover:brightness-110'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/10 hover:brightness-110'
                }`}
              >
                {state.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" /> Applying...
                  </span>
                ) : (
                  `Apply ${action.title}`
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-glow backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h4 className="text-sm font-bold text-white">How it works</h4>
            <ol className="mt-2 space-y-1 text-xs text-slate-400 list-decimal list-inside">
              <li>Choose a simulation action above and fill in the parameters</li>
              <li>Click the action button to apply the change to your database</li>
              <li>Navigate to Dashboard and click <strong className="text-teal-300">Connect & Scan</strong></li>
              <li>The drift detector will identify and analyze the schema change</li>
              <li>Review the impact analysis, blast radius, and migration scripts</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
