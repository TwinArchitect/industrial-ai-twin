import * as THREE from 'three'
import type { MachinePart } from '@/types'

/**
 * ModelProcessor
 * 职责：遍历场景中所有 Mesh，提取元数据，计算爆炸图所需的位移向量
 * 兼容两种模式：
 *   1. 程序化几何体（每个 Mesh 由代码创建，名称可控）
 *   2. 外部 GLB 模型（遍历 gltf.scene，提取 Mesh 名称）
 */

// ─── 位移向量计算 ────────────────────────────────────────────────────────────

/**
 * 计算场景整体包围盒中心点
 */
export function computeSceneCenter(root: THREE.Object3D): THREE.Vector3 {
  const box = new THREE.Box3().setFromObject(root)
  return box.getCenter(new THREE.Vector3())
}

/**
 * 为单个 Mesh 计算爆炸位移向量
 * 方向：从场景中心指向该 Mesh 自身包围盒中心
 * 长度归一化为 1（爆炸 scale 由外部控制）
 */
export function computeExplodeVector(
  mesh: THREE.Mesh,
  sceneCenter: THREE.Vector3,
): THREE.Vector3 {
  const meshCenter = new THREE.Box3()
    .setFromObject(mesh)
    .getCenter(new THREE.Vector3())

  const dir = meshCenter.clone().sub(sceneCenter)

  // 若 Mesh 恰好在场景中心，给一个默认向上偏移
  if (dir.lengthSq() < 0.0001) {
    return new THREE.Vector3(0, 1, 0)
  }

  return dir.normalize()
}

// ─── 批量提取零件信息 ────────────────────────────────────────────────────────

/**
 * 遍历 Object3D 树，提取所有 Mesh 并生成 MachinePart 元数据列表
 * @param root   场景根节点（程序化 Group 或 gltf.scene）
 * @param filter 可选过滤函数，排除不需要爆炸的 Mesh（如地板、环境）
 */
export function extractParts(
  root: THREE.Object3D,
  filter?: (mesh: THREE.Mesh) => boolean,
): MachinePart[] {
  const parts: MachinePart[] = []
  const sceneCenter = computeSceneCenter(root)

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    if (filter && !filter(obj)) return

    const explodeVector = computeExplodeVector(obj, sceneCenter)
    const originalPosition = obj.position.clone()

    parts.push({
      id: obj.name || obj.uuid,
      name: obj.name || obj.uuid,
      displayName: formatDisplayName(obj.name),
      status: 'running',
      explodeVector,
      originalPosition,
    })
  })

  return parts
}

// ─── GLB 专用：按顶层 Group 爆炸 ────────────────────────────────────────────

/**
 * 按 root 的直接子 Group 提取零件（适配 GLB 模型）
 * GLB 通常结构：root > Group(零件A) > Mesh(Material2_x), Mesh(Material3_x)
 * 以每个顶层 Group 为一个爆炸单元，而不是按单个 Mesh 爆炸
 *
 * 若 root 直接子节点全是 Mesh（无 Group 层），回退到逐 Mesh 模式
 */
export function extractPartsByGroup(
  root: THREE.Object3D,
): MachinePart[] {
  const sceneCenter = computeSceneCenter(root)
  const parts: MachinePart[] = []

  // 收集所有有名字且含 Mesh 的直接/次级 Group
  const candidates: THREE.Object3D[] = []
  root.traverse((obj) => {
    if (obj === root) return
    // 只取第一层含 Mesh 的 Group
    if (obj instanceof THREE.Group && obj.name) {
      let hasMesh = false
      obj.traverse((c) => { if (c instanceof THREE.Mesh) hasMesh = true })
      if (hasMesh) candidates.push(obj)
    }
  })

  // 去重：移除子 Group（只保留最浅的层级）
  const topGroups = candidates.filter((g) => {
    return !candidates.some((other) => other !== g && isAncestorOf(other, g))
  })

  if (topGroups.length >= 2) {
    // 按 Group 爆炸
    topGroups.forEach((group) => {
      const box = new THREE.Box3().setFromObject(group)
      const groupCenter = box.getCenter(new THREE.Vector3())
      const dir = groupCenter.clone().sub(sceneCenter)
      const explodeVector = dir.lengthSq() < 0.0001
        ? new THREE.Vector3(0, 1, 0)
        : dir.normalize()

      parts.push({
        id: group.uuid,
        name: group.name,
        displayName: formatDisplayName(group.name),
        status: 'running',
        explodeVector,
        originalPosition: group.position.clone(),
      })
    })
    return parts
  }

  // 回退：无合适 Group，按 Mesh 提取
  return extractParts(root)
}

function isAncestorOf(ancestor: THREE.Object3D, target: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = target.parent
  while (cur) {
    if (cur === ancestor) return true
    cur = cur.parent
  }
  return false
}

// ─── 辅助工具 ────────────────────────────────────────────────────────────────

/**
 * 将下划线/连字符命名转为可读展示名
 * e.g. "pump-body" → "Pump Body"
 */
function formatDisplayName(name: string): string {
  if (!name) return 'Unknown Part'
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * 根据 partId 在场景中找到对应的 Mesh
 */
export function findMeshById(
  root: THREE.Object3D,
  id: string,
): THREE.Mesh | null {
  let found: THREE.Mesh | null = null
  root.traverse((obj) => {
    if (found) return
    if (obj instanceof THREE.Mesh && (obj.name === id || obj.uuid === id)) {
      found = obj
    }
  })
  return found
}

/**
 * 计算所有 Mesh 的包围盒，用于相机飞向目标时确定 lookAt 点
 */
export function getMeshCenter(mesh: THREE.Mesh): THREE.Vector3 {
  return new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3())
}
