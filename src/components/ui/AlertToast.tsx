import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { type AlertEntry } from '@/types'
import { useEffect } from 'react'

/**
 * AlertToast
 * 职责：右上角实时告警通知
 * - 自动显示最新告警
 * - 点击可聚焦到对应 zone
 * - 支持手动关闭
 */
export default function AlertToast() {
  const alerts = useStore((s) => s.alerts)
  const dismissAlert = useStore((s) => s.dismissAlert)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const isDataPanelOpen = !!selectedPartId

  useEffect(() => {
    if (alerts.length === 0) return
    const timers = alerts.map((a) =>
      window.setTimeout(() => {
        dismissAlert(a.id)
      }, a.severity === 'critical' ? 9000 : 6500),
    )

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [alerts, dismissAlert])

  const colorBySeverity: Record<AlertEntry['severity'], string> = {
    info: 'border-cyan-400/40 text-cyan-200',
    warn: 'border-amber-400/45 text-amber-200',
    critical: 'border-rose-400/50 text-rose-200',
  }

  return (
    <div
      className={`absolute z-20 w-80 pointer-events-none transition-all duration-250 ${
        isDataPanelOpen ? 'top-16 right-80' : 'top-16 right-6'
      }`}
    >
      <AnimatePresence>
        {alerts.map((a) => (
          <motion.div
            key={a.id}
            className={`glass-panel mb-2 p-3 border pointer-events-auto ${colorBySeverity[a.severity]}`}
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-mono tracking-wider uppercase">
                  {a.severity}
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {a.title}
                </div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {a.detail}
                </div>
                {a.zone && (
                  <button
                    type="button"
                    className="mt-2 text-[10px] font-mono tracking-widest uppercase border border-cyan-400/35 text-cyan-300 rounded px-2 py-0.5 hover:bg-cyan-500/10 transition-colors"
                    onClick={() => {
                      setSelectedPart(null)
                      requestAnimationFrame(() => setSelectedPart(a.zone ?? null))
                    }}
                  >
                    Focus {a.zone}
                  </button>
                )}
              </div>

              <button
                type="button"
                className="text-slate-400 hover:text-white transition-colors text-sm leading-none"
                onClick={() => dismissAlert(a.id)}
                aria-label="Dismiss alert"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
