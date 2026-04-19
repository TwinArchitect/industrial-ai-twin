import * as THREE from 'three'

/**
 * PartZoning
 * 职责：将 GLB 模型中 58 个扁平的 MaterialN_x Mesh 按空间位置划分为语义 zone
 *
 * 分区规则（基于 bbox 相对坐标）：
 *   - valve    上部 1/3（Y 高于 0.55）→ 顶部阀门
 *   - base     底部 12%（Y 低于 0.12）→ 底座 / 地脚螺栓
 *   - motor    左侧 1/3（X < 0.33）→ 电机 + 联轴器罩
 *   - pipe     右侧 1/3（X > 0.67）→ 进出口管路 + 法兰
 *   - pump     中间区域 → 泵体（蜗壳、叶轮、轴承座）
 */

export type PartZone = 'motor' | 'pump' | 'pipe' | 'valve' | 'base'

/** zone 显示名称（用于 UI 标题） */
export const ZONE_DISPLAY: Record<PartZone, string> = {
  motor: 'Motor Assembly',
  pump:  'Pump Body',
  pipe:  'Pipe & Flange',
  valve: 'Valve Assembly',
  base:  'Base & Foundation',
}

/** zone 默认代表色（可用于 minimap 或图例） */
export const ZONE_COLOR: Record<PartZone, number> = {
  motor: 0x3498db,
  pump:  0x2ecc71,
  pipe:  0xf39c12,
  valve: 0xe74c3c,
  base:  0x95a5a6,
}

/**
 * 扫描 root 下所有 Mesh，根据世界坐标将其标记到 userData.zone
 * @returns zone → Mesh[] 映射
 */
export function classifyZones(root: THREE.Object3D): Map<PartZone, THREE.Mesh[]> {
  const zoneMap = new Map<PartZone, THREE.Mesh[]>([
    ['motor', []],
    ['pump',  []],
    ['pipe',  []],
    ['valve', []],
    ['base',  []],
  ])

  const bbox = new THREE.Box3().setFromObject(root)
  const sizeX = bbox.max.x - bbox.min.x
  const sizeY = bbox.max.y - bbox.min.y
  const sizeZ = bbox.max.z - bbox.min.z

  // 设备横向长轴（X 或 Z 取较大者），沿此轴从一端到另一端：motor → pump → pipe
  const useXAsLong = sizeX >= sizeZ
  const longAxis: 'x' | 'z' = useXAsLong ? 'x' : 'z'
  const longSize = useXAsLong ? sizeX : sizeZ
  const longMin  = useXAsLong ? bbox.min.x : bbox.min.z

  console.log('[Zoning] 模型包围盒:', {
    size: [sizeX.toFixed(2), sizeY.toFixed(2), sizeZ.toFixed(2)],
    longAxis,
  })

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return

    const meshBox = new THREE.Box3().setFromObject(obj)
    const center = new THREE.Vector3()
    meshBox.getCenter(center)

    const longVal = longAxis === 'x' ? center.x : center.z
    const rl = (longVal - longMin) / longSize    // 沿长轴归一化
    const ry = (center.y - bbox.min.y) / sizeY   // 沿 Y 归一化

    let zone: PartZone
    if      (ry > 0.6)            zone = 'valve'   // 顶部阀门
    else if (ry < 0.1)            zone = 'base'    // 底部底座
    else if (rl < 0.3)            zone = 'motor'   // 长轴一端
    else if (rl > 0.65)           zone = 'pipe'    // 长轴另一端
    else                          zone = 'pump'    // 中间

    obj.userData.zone = zone
    zoneMap.get(zone)!.push(obj)
  })

  // 详细日志：每个 zone 的代表点，方便验证
  zoneMap.forEach((meshes, zone) => {
    if (meshes.length === 0) return
    const zbox = new THREE.Box3()
    meshes.forEach((m) => zbox.expandByObject(m))
    const zc = zbox.getCenter(new THREE.Vector3())
    console.log(
      `[Zoning] ${zone.padEnd(6)} mesh=${meshes.length}  center=(${zc.x.toFixed(2)}, ${zc.y.toFixed(2)}, ${zc.z.toFixed(2)})  size=(${(zbox.max.x - zbox.min.x).toFixed(2)} × ${(zbox.max.y - zbox.min.y).toFixed(2)} × ${(zbox.max.z - zbox.min.z).toFixed(2)})`,
    )
  })

  return zoneMap
}

/** 从 Mesh 读取 zone（若未分类则返回 null） */
export function getZoneOf(mesh: THREE.Object3D): PartZone | null {
  return (mesh.userData?.zone as PartZone) ?? null
}

/** 所有 zone 列表（按默认展示顺序） */
export const ALL_ZONES: PartZone[] = ['motor', 'pump', 'pipe', 'valve', 'base']
