import React, { useEffect, useState, useCallback } from 'react'

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const COLORS = {
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    icon: 'bg-emerald-500/20 text-emerald-400',
    text: 'text-emerald-200',
    bar: 'bg-emerald-400',
  },
  error: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    icon: 'bg-rose-500/20 text-rose-400',
    text: 'text-rose-200',
    bar: 'bg-rose-400',
  },
  info: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
    icon: 'bg-sky-500/20 text-sky-400',
    text: 'text-sky-200',
    bar: 'bg-sky-400',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    icon: 'bg-amber-500/20 text-amber-400',
    text: 'text-amber-200',
    bar: 'bg-amber-400',
  },
}

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false)
  const colors = COLORS[toast.type] || COLORS.info

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }, [onDismiss, toast.id])

  useEffect(() => {
    const timer = setTimeout(dismiss, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [dismiss, toast.duration])

  return (
    <div
      className={`toast-enter ${exiting ? 'toast-exit' : ''} flex items-start gap-3 rounded-2xl border ${colors.border} ${colors.bg} px-4 py-3.5 shadow-xl backdrop-blur-md min-w-[320px] max-w-[420px] relative overflow-hidden`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.icon} text-sm font-bold`}>
        {ICONS[toast.type]}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        {toast.title && (
          <p className="text-xs font-bold text-white">{toast.title}</p>
        )}
        <p className={`text-xs ${colors.text} mt-0.5 leading-relaxed`}>
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2.5 right-3 text-slate-500 hover:text-white transition text-xs font-bold"
      >
        ✕
      </button>
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <div
          className={`h-full ${colors.bar} opacity-60 toast-progress`}
          style={{ animationDuration: `${toast.duration || 4000}ms` }}
        />
      </div>
    </div>
  )
}

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// Hook for toast management
let _toastId = 0
export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message, title = '', duration = 4000) => {
    const id = ++_toastId
    setToasts((prev) => [...prev, { id, type, message, title, duration }])
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg, title) => addToast('success', msg, title),
    error: (msg, title) => addToast('error', msg, title || 'Error'),
    info: (msg, title) => addToast('info', msg, title),
    warning: (msg, title) => addToast('warning', msg, title),
  }

  return { toasts, toast, dismissToast }
}
