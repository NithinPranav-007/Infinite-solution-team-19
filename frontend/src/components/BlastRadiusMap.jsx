import React from 'react'

export default function BlastRadiusMap({ severity, systems, tablesAffected }) {
  const isCritical = severity === 'Critical'
  const isHigh = severity === 'High'
  const isMedium = severity === 'Medium'
  const isLow = severity === 'Low' || !severity

  // Determine colors based on severity
  let severityColor = 'text-teal-400 border-teal-500/20 bg-teal-950/20'
  let severityDot = 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]'
  let pulseColor = 'bg-teal-400'
  let textColor = 'text-teal-300'
  let pathStyle = 'border-teal-500/30'

  if (isCritical) {
    severityColor = 'text-rose-400 border-rose-500/40 bg-rose-950/35'
    severityDot = 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
    pulseColor = 'bg-rose-500'
    textColor = 'text-rose-300'
    pathStyle = 'border-rose-500/50'
  } else if (isHigh) {
    severityColor = 'text-orange-400 border-orange-500/40 bg-orange-950/30'
    severityDot = 'bg-orange-500 shadow-[0_0_10px_#f97316]'
    pulseColor = 'bg-orange-500'
    textColor = 'text-orange-300'
    pathStyle = 'border-orange-500/40'
  } else if (isMedium) {
    severityColor = 'text-amber-400 border-amber-500/40 bg-amber-950/25'
    severityDot = 'bg-amber-500 shadow-[0_0_8px_#fbbf24]'
    pulseColor = 'bg-amber-500'
    textColor = 'text-amber-300'
    pathStyle = 'border-amber-500/30'
  }

  const defaultSystems = ['BI Dashboards', 'ETL Sync Jobs', 'Client APIs', 'Notification Service']
  const affectedSystemsSet = new Set(
    (systems || []).map((s) => s.toLowerCase().trim())
  )

  const activeSystems = defaultSystems.map((sys) => {
    let affected = false
    affectedSystemsSet.forEach((aff) => {
      if (sys.toLowerCase().includes(aff) || aff.includes(sys.toLowerCase())) {
        affected = true
      }
    })
    // Special heuristic: if drift is critical/high, some systems must be marked affected
    if ((isCritical || isHigh) && (sys === 'BI Dashboards' || sys === 'ETL Sync Jobs')) {
      affected = true
    }
    return { name: sys, affected }
  })

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-glow backdrop-blur relative overflow-hidden">
      <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400 font-semibold">AI Blast Radius Map</p>
      <h3 className="mt-1 text-xl font-bold text-white">Downstream Impact Flow</h3>

      <div className="mt-8 flex flex-col items-center justify-between gap-6 md:flex-row relative">
        {/* Core Database Node */}
        <div className="flex flex-col items-center z-10 w-full md:w-auto">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-white/15 bg-slate-900 shadow-lg relative">
            <span className="text-3xl">🗄️</span>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500"></span>
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-white tracking-wider uppercase">SQLite Source</p>
          <code className="mt-1 text-[0.68rem] text-slate-500 font-mono">active_db</code>
        </div>

        {/* Path line 1 */}
        <div className={`hidden md:block flex-1 border-t-2 border-dashed ${pathStyle} mx-2`} />

        {/* Affected Table Node */}
        <div className="flex flex-col items-center z-10 w-full md:w-auto">
          <div className={`flex flex-col items-center justify-center px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${severityColor}`}>
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs font-bold font-mono tracking-wide">{tablesAffected || 'All Tables'}</span>
          </div>
          <p className="mt-3 text-xs font-semibold text-white tracking-wider uppercase">Target Schema</p>
          <span className={`mt-1 text-[0.68rem] font-bold ${textColor}`}>{severity || 'Low'} Severity</span>
        </div>

        {/* Path line 2 */}
        <div className={`hidden md:block flex-1 border-t-2 border-dashed ${pathStyle} mx-2`} />

        {/* Downstream Integrations Grid */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-[42%] z-10">
          {activeSystems.map((sys) => {
            const systemAffected = sys.affected && !isLow
            return (
              <div
                key={sys.name}
                className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  systemAffected
                    ? isCritical
                      ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
                      : isHigh
                      ? 'border-orange-500/30 bg-orange-950/20 text-orange-300'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                    : 'border-white/5 bg-white/5 text-slate-400'
                }`}
              >
                {/* Visual Status Ring indicator */}
                <div className="relative flex h-3 w-3 items-center justify-center">
                  {systemAffected ? (
                    <>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${severityDot}`} />
                    </>
                  ) : (
                    <span className="inline-flex rounded-full h-2 w-2 bg-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-white">{sys.name}</p>
                  <p className="text-[0.62rem] text-slate-500 uppercase tracking-wider">
                    {systemAffected ? '⚠️ Damaged Contract' : '✓ Healthy Contract'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Decorative background grids */}
      <div className="absolute inset-0 bg-radial-gradient -z-10 pointer-events-none opacity-40" />
    </div>
  )
}
