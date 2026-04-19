import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

/**
 * StatusLights
 * 职责：根据传感器数据对 zone 内所有 Mesh 做 emissive 呼吸/闪烁告警
 *   - 温度 > 85°C → 电机整组橙色缓慢呼吸
 *   - 温度 > 95°C → 电机整组红色高频闪烁
 *   - 压力 > 5.2 bar → 泵体整组橙色呼吸
 */

export default function StatusLights() {
  const { scene } = useThree()
  const sensorData = useStore((s) => s.sensorData)
  const pushAlert = useStore((s) => s.pushAlert)

  // 收集属于 motor / pump zone 的所有 Mesh，告警时整组同步呼吸
  const motorMeshesRef = useRef<THREE.Mesh[]>([])
  const pumpMeshesRef  = useRef<THREE.Mesh[]>([])
  const readyRef       = useRef(false)
  const lastMotorLevelRef = useRef<'normal' | 'warn' | 'critical'>('normal')
  const lastPumpWarnRef = useRef(false)
  const pumpAlertCooldownRef = useRef(0) // 压力告警冷却，单位 ms

  // 使用 ref 级别的 Map 避免跨挂载污染（模块级 Map 在 StrictMode 下会残留旧值）
  const originalsRef = useRef(new Map<string, { emissiveColor: THREE.Color; emissiveIntensity: number }>())

  // ── 初始化：轮询等待 zone 分类就绪，记录原始 emissive 状态 ──────────
  useEffect(() => {
    readyRef.current = false
    originalsRef.current.clear()
    motorMeshesRef.current = []
    pumpMeshesRef.current  = []

    let attempt = 0
    const interval = setInterval(() => {
      attempt++
      const motor: THREE.Mesh[] = []
      const pump:  THREE.Mesh[] = []

      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        const zone = obj.userData?.zone
        if (zone === 'motor') motor.push(obj)
        else if (zone === 'pump') pump.push(obj)
      })

      if (motor.length > 0 || pump.length > 0 || attempt > 20) {
        // 记录原始 emissive（此时 GLBMachine 已把 emissive 归零）
        const originals = originalsRef.current
        ;[...motor, ...pump].forEach((mesh) => {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((mat, idx) => {
            if (!(mat instanceof THREE.MeshStandardMaterial)) return
            const key = `${mesh.uuid}-${idx}`
            if (!originals.has(key)) {
              originals.set(key, {
                emissiveColor:     mat.emissive.clone(),
                emissiveIntensity: 0,   // GLBMachine 已将其归零，直接记 0
              })
            }
          })
        })

        motorMeshesRef.current = motor
        pumpMeshesRef.current  = pump
        readyRef.current       = true
        console.log(`[StatusLights] 就绪 motor=${motor.length} pump=${pump.length}`)
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [scene])

  // ── 每帧：根据传感器阈值对整组 Mesh 同步应用呼吸/闪烁 ──────────────────
  useFrame(({ clock }) => {
    // 未就绪时完全跳过，防止 applyGlow 在 zone 未赋值时乱写 emissive
    if (!readyRef.current) return

    const t        = clock.getElapsedTime()
    const temp     = sensorData?.temperature ?? 60
    const pressure = sensorData?.pressure    ?? 3.5
    const originals = originalsRef.current

    const applyGlow = (meshes: THREE.Mesh[], severity: 'warn' | 'critical') => {
      const freq  = severity === 'critical' ? 4.0 : 1.8
      const hex   = severity === 'critical' ? 0xff1500 : 0xff7700
      const peak  = severity === 'critical' ? 1.6 : 0.8
      const breath = (Math.sin(t * Math.PI * freq) + 1) / 2
      meshes.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat) => {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return
          mat.emissive.setHex(hex)
          mat.emissiveIntensity = 0.15 + breath * peak
        })
      })
    }

    const restore = (meshes: THREE.Mesh[]) => {
      meshes.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat, idx) => {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return
          const orig = originals.get(`${mesh.uuid}-${idx}`)
          mat.emissive.set(0, 0, 0)
          mat.emissiveIntensity = orig?.emissiveIntensity ?? 0
        })
      })
    }

    if      (temp > 95)  applyGlow(motorMeshesRef.current, 'critical')
    else if (temp > 85)  applyGlow(motorMeshesRef.current, 'warn')
    else                 restore(motorMeshesRef.current)

    if (pressure > 5.2)  applyGlow(pumpMeshesRef.current, 'warn')
    else                 restore(pumpMeshesRef.current)

    const motorLevel: 'normal' | 'warn' | 'critical' =
      temp > 95 ? 'critical' : temp > 85 ? 'warn' : 'normal'
    if (motorLevel !== lastMotorLevelRef.current) {
      if (motorLevel === 'warn') {
        pushAlert({
          id: crypto.randomUUID(),
          severity: 'warn',
          title: 'Motor Temperature Warning',
          detail: `Temperature reached ${temp.toFixed(1)}°C (threshold 85°C).`,
          zone: 'motor',
          timestamp: Date.now(),
        })
      }
      if (motorLevel === 'critical') {
        pushAlert({
          id: crypto.randomUUID(),
          severity: 'critical',
          title: 'Motor Temperature Critical',
          detail: `Temperature reached ${temp.toFixed(1)}°C (critical threshold 95°C).`,
          zone: 'motor',
          timestamp: Date.now(),
        })
      }
      lastMotorLevelRef.current = motorLevel
    }

    const now = Date.now()
    const isPumpWarn = pressure > 5.2
    if (isPumpWarn && !lastPumpWarnRef.current && now > pumpAlertCooldownRef.current) {
      pushAlert({
        id: crypto.randomUUID(),
        severity: 'warn',
        title: 'Pump Pressure Warning',
        detail: `Pressure reached ${pressure.toFixed(2)} bar (threshold 5.2 bar).`,
        zone: 'pump',
        timestamp: now,
      })
      pumpAlertCooldownRef.current = now + 30_000 // 30 秒内不重复
    }
    lastPumpWarnRef.current = isPumpWarn
  })

  return null
}
