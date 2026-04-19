import * as THREE from 'three'
import { gsap } from 'gsap'
import type { MachinePart } from '@/types'

/**
 * ExplodedLogic
 * 职责：驱动爆炸图动画
 * 公式：P = P₀ + V_dir × (scale × explodeFactor)
 *   - P₀         零件原始位置
 *   - V_dir      爆炸方向向量（由 ModelProcessor 计算，已归一化）
 *   - scale      全局爆炸系数（0 = 收回，1 = 完全展开）
 *   - explodeFactor  每个零件的个体系数（可差异化展开距离）
 */

const DEFAULT_EXPLODE_DISTANCE = 2.5  // 基准爆炸距离（Three.js 单位）

// ─── 单帧位置计算（直接调用，无动画） ─────────────────────────────────────

/**
 * 根据当前 scale 计算零件目标位置
 * 在 useFrame 中每帧调用，实现平滑爆炸
 */
export function calcExplodedPosition(
  part: MachinePart,
  scale: number,
  explodeFactor = 1.0,
): THREE.Vector3 {
  return part.originalPosition
    .clone()
    .addScaledVector(part.explodeVector, scale * DEFAULT_EXPLODE_DISTANCE * explodeFactor)
}

// ─── GSAP 驱动动画版本 ────────────────────────────────────────────────────

interface ExplodeAnimOptions {
  parts: MachinePart[]
  meshRefs: Map<string, THREE.Mesh>  // partId → Mesh 引用
  targetScale: number                 // 0 = 收回，1 = 展开
  duration?: number
  stagger?: number                    // 零件依次弹出的时间间隔
  onComplete?: () => void
}

/**
 * GSAP 驱动的爆炸/收回动画
 * stagger 产生零件依次弹出的层次感
 */
export function animateExplode({
  parts,
  meshRefs,
  targetScale,
  duration = 0.8,
  stagger = 0.03,
  onComplete,
}: ExplodeAnimOptions): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete })

  parts.forEach((part, i) => {
    const mesh = meshRefs.get(part.id)
    if (!mesh) return

    const target = calcExplodedPosition(part, targetScale)

    tl.to(
      mesh.position,
      {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease: targetScale > 0 ? 'back.out(1.2)' : 'power2.inOut',
      },
      i * stagger, // 依次错开
    )
  })

  return tl
}

// ─── 实时插值版本（在 useFrame 中使用） ────────────────────────────────────

/**
 * 将所有零件位置插值到当前 explodeScale 对应的目标位置
 * 在 R3F useFrame 中每帧调用，配合 Zustand explodeScale 的 GSAP 动画
 */
export function applyExplodePositions(
  parts: MachinePart[],
  meshRefs: Map<string, THREE.Mesh>,
  scale: number,
): void {
  parts.forEach((part) => {
    const mesh = meshRefs.get(part.id)
    if (!mesh) return
    const target = calcExplodedPosition(part, scale)
    mesh.position.copy(target)
  })
}
