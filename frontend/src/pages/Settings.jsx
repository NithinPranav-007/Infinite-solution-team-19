import React, { useState, useEffect } from 'react'
import { fetchSettings, saveSettings } from '../lib/api'

export default function Settings({ onSettingsChange, currentDbPath }) {
  const [settings, setSettings] = useState({ target_db_path: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchSettings().then((data) => {
      if (!mounted) return
      setSettings(data)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)
    const res = await saveSettings(settings)
    setSaving(false)
    if (res && res.status === 'success') {
      setStatusMessage({ type: 'success', text: 'Settings updated successfully!' })
      if (onSettingsChange) {
        onSettingsChange()
      }
    } else {
      setStatusMessage({ type: 'error', text: res?.message || 'Failed to update settings.' })
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/6 p-8 shadow-glow backdrop-blur text-center text-slate-400">
        Loading settings configuration...
      </div>
    )
  }

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-glow backdrop-blur xl:grid-cols-[0.55fr_0.45fr]">
      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Configuration</p>
        <h2 className="mt-1 text-2xl font-bold text-white">System Settings</h2>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          Configure the SQLite database file path to monitor for schema drift.
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.15em] text-slate-300 font-semibold block">Target SQLite Database Path</label>
            <input
              type="text"
              value={settings.target_db_path}
              onChange={(e) => setSettings({ ...settings, target_db_path: e.target.value })}
              placeholder="e.g. D:\Infinite solutions\backend\sample.db"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none font-mono"
            />
            <p className="text-[0.65rem] text-slate-500">
              Provide the absolute path to your local SQLite database file.
            </p>
          </div>

          {statusMessage && (
            <div className={`rounded-xl border px-4 py-3 text-xs transition ${
              statusMessage.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/25 bg-rose-500/10 text-rose-300'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-3 text-xs font-bold text-slate-950 transition hover:brightness-110 active:scale-95 disabled:opacity-50 shadow-md shadow-teal-500/10"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">Status</p>
        <h3 className="text-xl font-bold text-white mt-1">Database Connection</h3>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">Active path</p>
            <code className="text-[0.68rem] text-slate-300 font-mono block mt-1 break-all">{currentDbPath || settings.target_db_path || 'sample.db'}</code>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>
        </div>

        <p className="mt-6 text-[0.62rem] text-slate-500 leading-relaxed">
          Settings are persisted locally in the metadata store. Use Connect &amp; Scan on the Dashboard after changing the database path.
        </p>
      </section>
    </div>
  )
}
