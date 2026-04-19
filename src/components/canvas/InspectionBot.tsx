import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail, Html } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useStore } from '@/store/useStore'
import { flyTo, type InspectionStop } from '@/core/CameraDirector'
import { ZONE_DISPLAY, type PartZone } from '@/core/PartZoning'
import type { OrbitControls } from '@react-three/drei'

/**
 * InspectionBot
 * 职责：AI "start inspection" 指令触发时，一个发光小球沿预设路径巡检所有设备零件
 * 路径：CatmullRomCurve3 定义，依次经过所有关键零件位置
 * 视觉：发光小球 + @react-three/drei Trail 拖尾
 */

interface InspectionBotProps {
  controlsRef: React.RefObject<React.ElementRef<typeof OrbitControls>>
}

// 巡检路径控制点（依次经过各零件上方）
const INSPECTION_WAYPOINTS: [number, number, number][] = [
  [0, 0.5, 0],        // 起始（底座）
  [0, 1.2, 0.8],      // 轴承端盖
  [0, 1.5, 0],        // 主泵体顶部
  [1.1, 1.5, 0],      // 进口法兰
  [-1.1, 1.5, 0],     // 出口法兰
  [0, 1.5, -1.2],     // 电机
  [0, 0.5, 0],        // 回到起点
]

const INSPECTION_STOPS: Array<InspectionStop & { zone: string | null }> = [
  {
    position: new THREE.Vector3(3.6, 1.7, 3.3),
    target: new THREE.Vector3(0, 0.4, 0),
    dwellMs: 700,
    label: 'Base inspection',
    zone: 'base',
  },
  {
    position: new THREE.Vector3(3.2, 2.1, 0.8),
    target: new THREE.Vector3(1.25, 0.95, 0),
    dwellMs: 900,
    label: 'Valve inspection',
    zone: 'valve',
  },
  {
    position: new THREE.Vector3(2.9, 1.9, 0.2),
    target: new THREE.Vector3(0.4, 0.72, 0),
    dwellMs: 900,
    label: 'Pump inspection',
    zone: 'pump',
  },
  {
    position: new THREE.Vector3(3.6, 1.6, -2.7),
    target: new THREE.Vector3(-1.3, 0.68, 0),
    dwellMs: 900,
    label: 'Motor inspection',
    zone: 'motor',
  },
  {
    position: new THREE.Vector3(3.3, 1.7, 2.7),
    target: new THREE.Vector3(0.95, 0.64, 0),
    dwellMs: 700,
    label: 'Pipe inspection',
    zone: 'pipe',
  },
]

const DRONE_VIEW_POSITION = new THREE.Vector3(4.8, 3.2, 4.8)
const DRONE_VIEW_TARGET = new THREE.Vector3(0, 0.72, 0)
const BOT_DURATION_SEC = 8
const INSPECTION_PANEL_POS = new THREE.Vector3(-0.55, 2.05, 1.05)

export default function InspectionBot({ controlsRef }: InspectionBotProps) {
  const { camera } = useThree()
  const botRef = useRef<THREE.Mesh>(null) as React.MutableRefObject<THREE.Mesh>
  const alertedStopsRef = useRef(new Set<number>())
  const sensorSnapshotRef = useRef({ temperature: 0, pressure: 0 })
  const hasInspectionSelectionRef = useRef(false)
  const stopCallsRef = useRef<gsap.core.Tween[]>([])

  const isInspecting = useStore((s) => s.isInspecting)
  const setInspecting = useStore((s) => s.setInspecting)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const setInspectingZone = useStore((s) => s.setInspectingZone)
  const sensorData = useStore((s) => s.sensorData)
  const pushChat = useStore((s) => s.pushChat)

  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null)
  const [panelVisible, setPanelVisible] = useState(true)

  // 构建巡检曲线
  const curve = new THREE.CatmullRomCurve3(
    INSPECTION_WAYPOINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    true, // 闭合
  )

  const progressRef = useRef(0)

  useEffect(() => {
    sensorSnapshotRef.current = {
      temperature: sensorData?.temperature ?? 0,
      pressure: sensorData?.pressure ?? 0,
    }
  }, [sensorData?.pressure, sensorData?.temperature])

  useEffect(() => {
    if (!isInspecting) {
      progressRef.current = 0
      alertedStopsRef.current.clear()
      setInspectingZone(null)
      if (hasInspectionSelectionRef.current) {
        setSelectedPart(null)
        hasInspectionSelectionRef.current = false
      }
      return
    }

    const controls = controlsRef.current as unknown as { target?: THREE.Vector3 } | null
    if (!controls?.target) {
      setInspecting(false)
      return
    }

    setPanelVisible(true)

    // 巡检开始时只飞到一个稳定第三视角，避免逐站晃动
    const cameraTl = flyTo({
      camera,
      controlsTarget: controls.target,
      destination: DRONE_VIEW_POSITION,
      lookAt: DRONE_VIEW_TARGET,
      duration: 0.9,
    })

    // GSAP 驱动进度从 0 → 1（完整一圈）
    const botTween = gsap.to(progressRef, {
      current: 1,
      duration: BOT_DURATION_SEC,
      ease: 'none',
      onComplete: () => {
        const abnormalIdx = Array.from(alertedStopsRef.current.values())
        const primaryZone =
          abnormalIdx.length > 0
            ? (INSPECTION_STOPS[abnormalIdx[0]]?.zone as PartZone | null)
            : null

        pushChat({
          id: crypto.randomUUID(),
          role: 'ai',
          text:
            abnormalIdx.length > 0
              ? `Inspection complete: ${abnormalIdx.length} anomalies detected. Use the quick actions below to continue.`
              : 'Inspection complete: no anomalies detected. You can ask AI to focus on a component or open detailed data.',
          timestamp: Date.now(),
          action: {
            type: 'showData',
            target: primaryZone ?? 'pump',
            payload: { alert: true },
            replyText: 'Inspection complete, AI action ready',
          },
        })

        setSelectedPart(null)
        setInspectingZone(null)
        hasInspectionSelectionRef.current = false
        setInspecting(false)
      },
    })

    // 按时间片触发巡检点位（用于高亮 + 信息面板 + 异常诊断）
    const triggerStop = (idx: number) => {
        setActiveStopIndex(idx)
        const zone = INSPECTION_STOPS[idx]?.zone as PartZone | null
        setInspectingZone(zone)
        setSelectedPart(zone)
        hasInspectionSelectionRef.current = true

        const temp = sensorSnapshotRef.current.temperature
        const pressure = sensorSnapshotRef.current.pressure
        const isMotorAbnormal = zone === 'motor' && temp > 85
        const isPumpAbnormal = zone === 'pump' && pressure > 5.2
        const isAbnormal = isMotorAbnormal || isPumpAbnormal

        if (isAbnormal && !alertedStopsRef.current.has(idx)) {
          alertedStopsRef.current.add(idx)

          const reason = isMotorAbnormal
            ? `Temperature ${temp.toFixed(1)}°C exceeded threshold 85°C`
            : `Pressure ${pressure.toFixed(2)} bar exceeded threshold 5.2 bar`

          pushChat({
            id: crypto.randomUUID(),
            role: 'ai',
            text: `[Inspection Anomaly] ${ZONE_DISPLAY[zone]} abnormal condition detected: ${reason}. Suggested actions: 1) Reduce load 2) Check lubrication and sealing 3) Re-test sensors and verify trend history.`,
            timestamp: Date.now(),
            action: {
              type: 'showData',
              target: zone ?? undefined,
              payload: { alert: true },
              replyText: 'Inspection anomaly diagnosis',
            },
          })
        }
    }

    const firstStopDelay = 0.8
    const stopStep =
      INSPECTION_STOPS.length > 1
        ? (BOT_DURATION_SEC - firstStopDelay * 2) / (INSPECTION_STOPS.length - 1)
        : 0

    stopCallsRef.current = INSPECTION_STOPS.map((_, idx) =>
      gsap.delayedCall(firstStopDelay + stopStep * idx, () => triggerStop(idx)),
    )

    return () => {
      cameraTl.kill()
      botTween.kill()
      stopCallsRef.current.forEach((tween) => tween.kill())
      stopCallsRef.current = []
    }
  }, [
    camera,
    controlsRef,
    isInspecting,
    pushChat,
    setInspecting,
    setInspectingZone,
    setSelectedPart,
  ])

  useFrame(() => {
    if (!botRef.current || !isInspecting) return
    const point = curve.getPoint(progressRef.current % 1)
    botRef.current.position.copy(point)
  })

  const activeStop = activeStopIndex !== null ? INSPECTION_STOPS[activeStopIndex] : null
  const activeZone = (activeStop?.zone ?? null) as PartZone | null
  const temp = sensorData?.temperature ?? 0
  const pressure = sensorData?.pressure ?? 0
  const isAbnormal =
    (activeZone === 'motor' && temp > 85) ||
    (activeZone === 'pump' && pressure > 5.2)

  return (
    <>
      {isInspecting && (
        <Trail
          width={0.8}
          length={6}
          color={new THREE.Color('#00d4ff')}
          attenuation={(t) => t * t}
          target={botRef}
        >
          <mesh ref={botRef} position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </Trail>
      )}

      {activeStop && panelVisible && (
        <Html
          position={INSPECTION_PANEL_POS}
          distanceFactor={3.2}
          center
          transform
          sprite
          pointerEvents="auto"
        >
          <div className="min-w-[86px] rounded-md border border-cyan-400/30 bg-slate-950/88 px-1 py-0.5 text-[7px] text-slate-100 shadow-[0_0_12px_rgba(0,212,255,0.13)]">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono tracking-wider text-cyan-300">INSPECTION NODE</span>
              <div className="flex items-center gap-1">
                <span className={`font-mono ${isAbnormal ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {isAbnormal ? 'ABNORMAL' : 'NORMAL'}
                </span>
                <button
                  type="button"
                  onClick={() => setPanelVisible(false)}
                  className="rounded border border-slate-600 px-1 text-[8px] leading-none text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="text-slate-400">
              Zone: {activeZone ? ZONE_DISPLAY[activeZone] : '--'}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5 font-mono text-[7px] text-slate-300">
              <span>TEMP</span>
              <span>{temp.toFixed(1)}°C</span>
              <span>PRESSURE</span>
              <span>{pressure.toFixed(2)} bar</span>
            </div>
          </div>
        </Html>
      )}
    </>
  )
}
