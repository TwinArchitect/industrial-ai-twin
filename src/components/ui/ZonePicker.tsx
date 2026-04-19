import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { ALL_ZONES, ZONE_DISPLAY, type PartZone } from '@/core/PartZoning'

/**
 * ZonePicker
 * 左上角部位选择下拉框，联动效果与点击模型完全一致：
 *   选中 zone → selectedPartId 更新 → 相机飞行 + DataPanel 展开 + 描边高亮
 */
export default function ZonePicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const isInspecting = useStore((s) => s.isInspecting)

  const current = selectedPartId as PartZone | null
  const label = current ? ZONE_DISPLAY[current] : 'Select Zone'

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (zone: PartZone | null) => {
    setSelectedPart(zone)
    setOpen(false)
  }

  return (
    <div
      ref={ref}
      className="absolute right-6 z-20"
      style={{ top: '52px' }}
    >
      {/* 触发按钮 */}
      <button
        type="button"
        disabled={isInspecting}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono
          glass-panel border transition-all select-none
          ${isInspecting ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-accent/50'}
          ${current ? 'border-accent/45 text-accent' : 'border-slate-700 text-slate-400'}
        `}
      >
        {/* 状态指示点 */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: current ? '#00d4ff' : '#475569' }}
        />
        <span className="max-w-[120px] truncate">{label}</span>
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* 下拉列表 */}
      {open && (
        <div className="mt-1 rounded glass-panel border border-slate-700/60 overflow-hidden shadow-xl">
          {/* 清除选中 */}
          {current && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-slate-500
                hover:bg-slate-700/30 hover:text-slate-300 transition-colors border-b border-slate-700/40"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
              Clear selection
            </button>
          )}
          {ALL_ZONES.map((zone) => {
            const isActive = zone === current
            return (
              <button
                key={zone}
                type="button"
                onClick={() => handleSelect(zone)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono
                  transition-colors hover:bg-slate-700/30
                  ${isActive ? 'text-accent bg-accent/8' : 'text-slate-300'}
                `}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isActive ? '#00d4ff' : '#64748b' }}
                />
                {ZONE_DISPLAY[zone]}
                {isActive && (
                  <span className="ml-auto text-[10px] text-accent/60">selected</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
