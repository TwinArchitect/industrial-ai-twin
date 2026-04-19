import * as THREE from 'three'
import { gsap } from 'gsap'

/**
 * CameraDirector
 * 职责：控制相机的所有动画行为
 * - 飞向指定目标（Bezier 曲线路径）
 * - 巡检路径播放
 * - 视角预设切换
 */

// ─── 视角预设 ───────────────────────────────────────────────────────────────

export const CAMERA_PRESETS = {
  /** 整体鸟瞰 */
  overview: {
    position: new THREE.Vector3(8, 6, 8),
    target: new THREE.Vector3(0, 0, 0),
  },
  /** 前视角 */
  front: {
    position: new THREE.Vector3(0, 2, 10),
    target: new THREE.Vector3(0, 0, 0),
  },
  /** 顶视角 */
  top: {
    position: new THREE.Vector3(0, 12, 0.01),
    target: new THREE.Vector3(0, 0, 0),
  },
  /** 侧视角 */
  side: {
    position: new THREE.Vector3(10, 2, 0),
    target: new THREE.Vector3(0, 0, 0),
  },
} as const

export type CameraPreset = keyof typeof CAMERA_PRESETS

// ─── 飞向目标 ───────────────────────────────────────────────────────────────

interface FlyToOptions {
  camera: THREE.Camera
  /** OrbitControls 的 target 引用（需要同步更新） */
  controlsTarget: THREE.Vector3
  destination: THREE.Vector3
  lookAt: THREE.Vector3
  duration?: number
  onComplete?: () => void
}

/**
 * 相机沿二次贝塞尔曲线飞向目标
 * 贝塞尔中间控制点自动抬高，产生自然弧形轨迹
 */
export function flyTo({
  camera,
  controlsTarget,
  destination,
  lookAt,
  duration = 1.4,
  onComplete,
}: FlyToOptions): gsap.core.Timeline {
  const startPos = camera.position.clone()

  // 计算贝塞尔中间控制点（起点与终点连线的中点，再向上偏移）
  const mid = new THREE.Vector3()
    .addVectors(startPos, destination)
    .multiplyScalar(0.5)
  mid.y += 3 // 弧形高度

  const tl = gsap.timeline({ onComplete })

  // 沿贝塞尔曲线插值相机位置
  tl.to(
    { t: 0 },
    {
      t: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate() {
        const t: number = this.targets()[0].t
        // 二次贝塞尔：B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const invT = 1 - t
        camera.position.set(
          invT * invT * startPos.x + 2 * invT * t * mid.x + t * t * destination.x,
          invT * invT * startPos.y + 2 * invT * t * mid.y + t * t * destination.y,
          invT * invT * startPos.z + 2 * invT * t * mid.z + t * t * destination.z,
        )
      },
    },
    0,
  )

  // 同步更新 OrbitControls lookAt 目标
  tl.to(
    controlsTarget,
    {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z,
      duration,
      ease: 'power2.inOut',
    },
    0,
  )

  return tl
}

// ─── 飞向视角预设 ───────────────────────────────────────────────────────────

interface FlyToPresetOptions {
  camera: THREE.Camera
  controlsTarget: THREE.Vector3
  preset: CameraPreset
  duration?: number
  onComplete?: () => void
}

export function flyToPreset({
  camera,
  controlsTarget,
  preset,
  duration = 1.2,
  onComplete,
}: FlyToPresetOptions): gsap.core.Timeline {
  const { position, target } = CAMERA_PRESETS[preset]
  return flyTo({
    camera,
    controlsTarget,
    destination: position.clone(),
    lookAt: target.clone(),
    duration,
    onComplete,
  })
}

// ─── 巡检路径播放 ───────────────────────────────────────────────────────────

export interface InspectionStop {
  position: THREE.Vector3   // 相机停靠位置
  target: THREE.Vector3     // 注视目标
  dwellMs: number           // 停留时长（ms）
  label?: string            // 停靠点标签（用于 UI 显示）
}

interface PlayInspectionOptions {
  camera: THREE.Camera
  controlsTarget: THREE.Vector3
  stops: InspectionStop[]
  onStopReached?: (index: number, stop: InspectionStop) => void
  onComplete?: () => void
}

/**
 * 依次飞向巡检路径的每个停靠点
 * 每到一个点停留 dwellMs 毫秒后自动飞向下一个
 */
export function playInspection({
  camera,
  controlsTarget,
  stops,
  onStopReached,
  onComplete,
}: PlayInspectionOptions): gsap.core.Timeline {
  const masterTl = gsap.timeline({ onComplete })
  let accDelay = 0

  stops.forEach((stop, i) => {
    const isLast = i === stops.length - 1
    masterTl.add(
      gsap.delayedCall(accDelay / 1000, () => {
        flyTo({
          camera,
          controlsTarget,
          destination: stop.position,
          lookAt: stop.target,
          duration: 1.2,
          onComplete: () => {
            onStopReached?.(i, stop)
            if (isLast) onComplete?.()
          },
        })
      }),
    )
    accDelay += 1200 + stop.dwellMs
  })

  return masterTl
}
