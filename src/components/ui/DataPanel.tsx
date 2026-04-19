import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import { useStore } from '@/store/useStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ZONE_DISPLAY, type PartZone } from '@/core/PartZoning'

/**
 * DataPanel
 * 职责：右侧可滑出的设备数据抽屉
 * - 选中零件时自动展开
 * - 显示实时传感器曲线图（ECharts）
 * - WebSocket 实时推送数据
 */
export default function DataPanel() {
  // 启动 WebSocket 连接（在此组件挂载后建立，因为它是常驻组件）
  useWebSocket()

  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const sensorHistory = useStore((s) => s.sensorHistory)
  const sensorData = useStore((s) => s.sensorData)

  const isOpen = !!selectedPartId

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 12, bottom: 24, left: 40 },
    xAxis: {
      type: 'category' as const,
      data: sensorHistory.timestamps.map((t) =>
        new Date(t).toLocaleTimeString('en', { hour12: false }),
      ),
      axisLine: { lineStyle: { color: '#1a2840' } },
      axisLabel: { color: '#4a6080', fontSize: 10, interval: 9 },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { lineStyle: { color: '#1a2840' } },
      splitLine: { lineStyle: { color: '#0d1a2d' } },
      axisLabel: { color: '#4a6080', fontSize: 10 },
    },
    series: [
      {
        name: 'Temperature',
        type: 'line' as const,
        data: sensorHistory.temperature,
        smooth: true,
        lineStyle: { color: '#ff6b35', width: 2 },
        areaStyle: { color: 'rgba(255,107,53,0.08)' },
        showSymbol: false,
      },
      {
        name: 'Pressure',
        type: 'line' as const,
        data: sensorHistory.pressure,
        smooth: true,
        lineStyle: { color: '#00d4ff', width: 2 },
        areaStyle: { color: 'rgba(0,212,255,0.06)' },
        showSymbol: false,
      },
    ],
    legend: {
      textStyle: { color: '#4a6080', fontSize: 10 },
      top: 0,
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(12,18,35,0.95)',
      borderColor: '#00d4ff22',
      textStyle: { color: '#e2e8f0', fontSize: 11 },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-20 right-0 bottom-0 w-72 glass-panel rounded-none border-r-0 overflow-y-auto z-10"
          initial={{ x: 288, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 288, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* 头部 */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="neon-text text-xs tracking-widest uppercase">
                Component Details
              </div>
              <button
                type="button"
                className="text-slate-400 text-sm leading-none hover:text-slate-200 transition-colors"
                onClick={() => setSelectedPart(null)}
                aria-label="Close data panel"
              >
                ×
              </button>
            </div>
            <div className="text-white text-sm font-semibold mt-1">
              {ZONE_DISPLAY[selectedPartId as PartZone] ?? selectedPartId}
            </div>
          </div>

          {/* 实时指标 */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <DataCard label="Temperature" value={`${sensorData?.temperature?.toFixed(1) ?? '--'}°C`} warn={(sensorData?.temperature ?? 0) > 80} />
            <DataCard label="Pressure" value={`${sensorData?.pressure?.toFixed(2) ?? '--'} bar`} />
            <DataCard label="RPM" value={sensorData?.rpm?.toFixed(0) ?? '--'} />
            <DataCard label="Vibration" value={`${sensorData?.vibration?.toFixed(2) ?? '--'} mm/s`} />
            <DataCard label="Flow Rate" value={`${sensorData?.flowRate?.toFixed(1) ?? '--'} m³/h`} />
          </div>

          {/* 实时曲线图 */}
          <div className="px-2 pb-4">
            <div className="data-label px-2 mb-2">Real-time Sensor Trend</div>
            <ReactECharts
              option={chartOption}
              style={{ height: 180 }}
              theme="dark"
            />
          </div>

          {/* 维护记录占位 */}
          <div className="p-4 border-t border-border">
            <div className="data-label mb-2">Maintenance Log</div>
            {[
              { date: '2025-04-10', note: 'Bearing lubrication' },
              { date: '2025-03-22', note: 'Seal replacement' },
              { date: '2025-02-15', note: 'Full inspection' },
            ].map((item) => (
              <div key={item.date} className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">{item.date}</span>
                <span className="text-slate-300">{item.note}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DataCard({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="bg-black/20 rounded p-2 border border-slate-800">
      <div className="data-label text-[10px]">{label}</div>
      <div className={`font-mono text-sm font-semibold mt-0.5 ${warn ? 'text-danger' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
