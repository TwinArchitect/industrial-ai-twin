import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { useExplosion } from '@/hooks/useExplosion'
import { ALL_ZONES, ZONE_DISPLAY, type PartZone } from '@/core/PartZoning'

/**
 * StatusBar
 * 职责：顶部状态栏
 * - 左侧：项目标题 + 系统状态
 * - 中间：实时传感器核心指标（温度/压力/转速）
 * - 右侧：快捷操作按钮（爆炸图/巡检/截面）
 */
export default function StatusBar() {
  const sensorData = useStore((s) => s.sensorData)
  const isInspecting = useStore((s) => s.isInspecting)
  const setInspecting = useStore((s) => s.setInspecting)
  const triggerResetView = useStore((s) => s.triggerResetView)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const isClipping = useStore((s) => s.isClipping)
  const setClipping = useStore((s) => s.setClipping)
  const clipY = useStore((s) => s.clipY)
  const setClipY = useStore((s) => s.setClipY)
  const { explode, collapse, isExploded } = useExplosion()
  const selectedPartId = useStore((s) => s.selectedPartId)

  const temp = sensorData?.temperature?.toFixed(1) ?? '--'
  const pressure = sensorData?.pressure?.toFixed(2) ?? '--'
  const rpm = sensorData?.rpm?.toFixed(0) ?? '--'
  const isOverheat = (sensorData?.temperature ?? 0) > 80

  const healthScore = (() => {
    if (!sensorData) return 100
    const tempPenalty = Math.max(0, sensorData.temperature - 70) * 1.4
    const pressurePenalty = Math.max(0, sensorData.pressure - 4.8) * 14
    const vibrationPenalty = Math.max(0, sensorData.vibration - 2.8) * 6
    const rpmPenalty = Math.max(0, Math.abs(sensorData.rpm - 2900) - 350) * 0.015
    const score = 100 - tempPenalty - pressurePenalty - vibrationPenalty - rpmPenalty
    return Math.max(0, Math.min(100, Math.round(score)))
  })()

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 glass-panel rounded-none border-x-0 border-t-0"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
    >
      {/* ── 左侧：标题 ── */}
      <div className="flex items-center gap-4">
        <div>
          <div className="neon-text text-sm font-semibold tracking-wider">
            INDUSTRIAL AI TWIN
          </div>
          <div className="text-slate-500 text-xs tracking-widest">
            Centrifugal Pump Assembly — Unit #CPA-042
          </div>
        </div>
        {/* 系统在线状态 */}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="status-dot bg-success animate-pulse" />
          <span className="text-success text-xs font-mono">ONLINE</span>
        </div>
      </div>

      {/* ── 中间：实时数据指标 ── */}
      <div className="flex items-center gap-6">
        <Metric label="TEMP" value={`${temp}°C`} warn={isOverheat} />
        <Metric label="PRESSURE" value={`${pressure} bar`} />
        <Metric label="RPM" value={rpm} />
        <Metric label="HEALTH" value={`${healthScore}`} warn={healthScore < 70} />
      </div>

      {/* ── 右侧：快捷操作 + Zone 选择器 ── */}
      <div className="flex items-center gap-2">
        <ActionBtn
          label={isExploded ? 'COLLAPSE' : 'EXPLODE'}
          active={isExploded}
          onClick={isExploded ? collapse : explode}
        />
        <ActionBtn
          label={isInspecting ? 'STOP' : 'INSPECT'}
          active={isInspecting}
          onClick={() => setInspecting(!isInspecting)}
        />
        <ActionBtn
          label={isClipping ? 'CLIP OFF' : 'CLIP'}
          active={isClipping}
          onClick={() => {
            const next = !isClipping
            setClipping(next)
            if (next) setClipY(0.9)
          }}
        />
        <ActionBtn
          label="RESET"
          active={false}
          onClick={() => {
            setInspecting(false)
            setSelectedPart(null)
            triggerResetView()
          }}
        />
        {/* 分隔线 */}
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <ZoneDropdown
          selectedZone={selectedPartId as PartZone | null}
          onSelect={setSelectedPart}
          disabled={isInspecting}
        />
      </div>

      {/* ── 截面高度控制（仅 clipping 开启时显示） ── */}
      {isClipping && (
        <div className="absolute right-6 top-[54px] glass-panel px-3 py-2 rounded-md border border-accent/25 min-w-[240px]">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 mb-1.5">
            <span>CLIP HEIGHT</span>
            <span className="text-accent">{clipY.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={-0.2}
            max={2.2}
            step={0.02}
            value={clipY}
            onChange={(e) => setClipY(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
      )}
    </motion.div>
  )
}

// ── 子组件 ─────────────────────────────────────────────────────────────────

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-center">
      <div className="data-label">{label}</div>
      <div className={`font-mono text-sm font-semibold mt-0.5 ${warn ? 'text-danger' : 'text-accent'}`}>
        {value}
      </div>
    </div>
  )
}

function ActionBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono tracking-widest border rounded transition-all ${
        active
          ? 'border-accent text-accent bg-accent/10'
          : 'border-slate-700 text-slate-400 hover:border-accent/50 hover:text-accent/70'
      }`}
    >
      {label}
    </button>
  )
}

function ZoneDropdown({
  selectedZone,
  onSelect,
  disabled,
}: {
  selectedZone: PartZone | null
  onSelect: (id: string | null) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = selectedZone ? ZONE_DISPLAY[selectedZone] : 'Select Zone'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-widest border rounded transition-all select-none
          ${disabled ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500' : 'cursor-pointer'}
          ${selectedZone
            ? 'border-accent/50 text-accent bg-accent/8 hover:border-accent'
            : 'border-slate-700 text-slate-400 hover:border-accent/50 hover:text-accent/70'
          }`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: selectedZone ? '#00d4ff' : '#475569' }}
        />
        <span className="max-w-[110px] truncate">{label}</span>
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 rounded glass-panel border border-slate-700/60 overflow-hidden shadow-xl min-w-[160px]">
          {selectedZone && (
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-slate-500
                hover:bg-slate-700/30 hover:text-slate-300 transition-colors border-b border-slate-700/40"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
              Clear
            </button>
          )}
          {ALL_ZONES.map((zone) => {
            const isActive = zone === selectedZone
            return (
              <button
                key={zone}
                type="button"
                onClick={() => { onSelect(zone); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono
                  transition-colors hover:bg-slate-700/30
                  ${isActive ? 'text-accent bg-accent/8' : 'text-slate-300'}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isActive ? '#00d4ff' : '#64748b' }}
                />
                {ZONE_DISPLAY[zone]}
                {isActive && <span className="ml-auto text-[10px] text-accent/60">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
