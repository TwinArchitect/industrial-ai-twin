import { useEffect, useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { flyTo } from '@/core/CameraDirector'
import { classifyZones, getZoneOf, type PartZone } from '@/core/PartZoning'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls } from '@react-three/drei'

const MODEL_URL = '/models/pump.glb'

/** 目标尺寸（最长轴对齐到 TARGET_SIZE 米） */
const TARGET_SIZE = 3.5

interface GLBMachineProps {
  controlsRef: React.RefObject<React.ElementRef<typeof OrbitControls>>
}

/**
 * GLBMachine
 * 职责：加载 public/models/pump.glb，自动归一化缩放 + 底部对齐地面
 *   - 自动计算 BoundingBox，将最长轴缩放到 TARGET_SIZE
 *   - 底部对齐 Y=0 地面
 *   - 增强 PBR 材质 envMapIntensity，配合 HDRI 反射效果
 *   - 支持点击选中 → 相机飞行 + 爆炸图
 */
/** 爆炸单元：每个 Mesh 一个，同 zone Mesh 方向一致 */
interface ExplodeUnit {
  node: THREE.Object3D
  originalPos: THREE.Vector3
  dir: THREE.Vector3
  zone: PartZone
}

export default function GLBMachine({ controlsRef }: GLBMachineProps) {
  const { scene } = useGLTF(MODEL_URL)
  const groupRef = useRef<THREE.Group>(null)
  const explodeUnits = useRef<ExplodeUnit[]>([])
  const clipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0))
  const clipMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([])

  const { camera, gl } = useThree()
  const explodeScale = useStore((s) => s.explodeScale)
  const isInspecting = useStore((s) => s.isInspecting)
  const isClipping = useStore((s) => s.isClipping)
  const clipY = useStore((s) => s.clipY)
  const selectedPartId = useStore((s) => s.selectedPartId)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const setHoveredPart = useStore((s) => s.setHoveredPart)
  const setLoaded = useStore((s) => s.setLoaded)

  // ── 克隆场景（避免 react strict mode 重复挂载导致的引用污染）─────────────
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true)

    // ① 计算包围盒
    const box = new THREE.Box3().setFromObject(cloned)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxAxis = Math.max(size.x, size.y, size.z)
    const scaleFactor = TARGET_SIZE / maxAxis

    // ② 等比缩放
    cloned.scale.setScalar(scaleFactor)

    // ③ 重新计算世界空间包围盒
    const box2 = new THREE.Box3().setFromObject(cloned)
    const center = new THREE.Vector3()
    box2.getCenter(center)

    // ④ 水平居中 + 底部对齐 Y=0
    cloned.position.set(-center.x, -box2.min.y, -center.z)

    // ⑤ 材质处理
    const clipMats: THREE.MeshStandardMaterial[] = []
    const clipMatSet = new Set<THREE.Material>()

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.castShadow = true
      obj.receiveShadow = true
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return

        // 清零 emissive（防止 GLB 自带的自发光过曝）
        mat.emissive.set(0, 0, 0)
        mat.emissiveIntensity = 0

        // 收集可切割材质（去重）
        if (!clipMatSet.has(mat)) {
          clipMatSet.add(mat)
          clipMats.push(mat)
        }

        // clamp metalness/roughness：防止镜面反射 HDRI 变纯白
        mat.metalness = Math.min(mat.metalness, 0.75)
        mat.roughness = Math.max(mat.roughness, 0.35)

        // 检测 GLB 原始的高饱和蓝色底座 → 改为铸铁灰
        const c = mat.color
        const isVividBlue = c.b > 0.4 && c.b > c.r * 2 && c.b > c.g * 1.5
        if (isVividBlue) {
          mat.color.set('#4a5260')
          mat.metalness = 0.5
          mat.roughness = 0.7
        }

        mat.envMapIntensity = 0.7
        mat.needsUpdate = true
      })

      // 叠加半透明蓝色线框，增强工业科技感
      const edges = new THREE.EdgesGeometry(obj.geometry, 15)
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x00c8ff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      })
      const wireLines = new THREE.LineSegments(edges, wireMat)
      wireLines.raycast = () => {} // 不参与射线拾取
      obj.add(wireLines)
    })

    clipMaterialsRef.current = clipMats

    return cloned
  }, [scene])

  // ── 启用局部裁剪（renderer 级）───────────────────────────────────────────
  useEffect(() => {
    const prev = gl.localClippingEnabled
    gl.localClippingEnabled = true
    return () => {
      gl.localClippingEnabled = prev
    }
  }, [gl])

  // ── 按 isClipping/clipY 更新材质裁剪平面 ────────────────────────────────
  useEffect(() => {
    const plane = clipPlaneRef.current
    plane.constant = clipY

    clipMaterialsRef.current.forEach((mat) => {
      mat.clippingPlanes = isClipping ? [plane] : null
      mat.clipShadows = isClipping
      mat.needsUpdate = true
    })
  }, [isClipping, clipY])

  // ── 挂载后：按 zone 分类 + 同 zone Mesh 共享爆炸方向 ─────────────────────
  useEffect(() => {
    requestAnimationFrame(() => {
      // 1) 对所有 Mesh 做语义分区
      const zoneMap = classifyZones(clonedScene)
      console.log(
        '[GLBMachine] zone 分类:',
        Array.from(zoneMap.entries()).map(([z, ms]) => `${z}:${ms.length}`).join(' '),
      )

      // 2) 计算每个 zone 的中心，作为爆炸方向起点
      const sceneBox = new THREE.Box3().setFromObject(clonedScene)
      const sceneCenter = sceneBox.getCenter(new THREE.Vector3())
      const zoneCenters = new Map<PartZone, THREE.Vector3>()
      zoneMap.forEach((meshes, zone) => {
        if (meshes.length === 0) return
        const zbox = new THREE.Box3()
        meshes.forEach((m) => zbox.expandByObject(m))
        zoneCenters.set(zone, zbox.getCenter(new THREE.Vector3()))
      })

      // 3) 同 zone 共享 dir（整块弹出），每 Mesh 记录自身原位置
      const units: ExplodeUnit[] = []
      zoneMap.forEach((meshes, zone) => {
        const zc = zoneCenters.get(zone)
        if (!zc) return
        const dir = zc.clone().sub(sceneCenter)
        if (dir.lengthSq() < 0.0001) dir.set(0, 1, 0)
        dir.normalize()
        meshes.forEach((m) => {
          units.push({
            node: m,
            originalPos: m.position.clone(),
            dir: dir.clone(),
            zone,
          })
        })
      })

      explodeUnits.current = units
      setLoaded(true)
    })
  }, [clonedScene, setLoaded])

  // ── 每帧驱动爆炸（直接操作节点 position）────────────────────────────────
  const EXPLODE_DIST = 3.5
  useFrame(() => {
    explodeUnits.current.forEach(({ node, originalPos, dir }) => {
      const target = originalPos.clone().addScaledVector(dir, explodeScale * EXPLODE_DIST)
      node.position.lerp(target, 0.12)   // lerp 产生平滑弹性感
    })
  })

  // ── 飞向 zone 工具函数 ──────────────────────────────────────────────────
  const flyToZone = (targetId: string) => {
    if (!controlsRef.current) return

    const zone: PartZone = targetId === 'impeller' ? 'pump' : (targetId as PartZone)
    const zoneBox = new THREE.Box3()
    clonedScene.traverse((o) => {
      if (o instanceof THREE.Mesh && getZoneOf(o) === zone) zoneBox.expandByObject(o)
    })
    if (zoneBox.isEmpty()) return

    const center = zoneBox.getCenter(new THREE.Vector3())
    const size = zoneBox.getSize(new THREE.Vector3())

    const isImpellerTarget = targetId === 'impeller'
    const dist = Math.max(size.x, size.y, size.z) * (isImpellerTarget ? 1.7 : 2.5) + 1.1
    const lookAt = isImpellerTarget
      ? center.clone().add(new THREE.Vector3(0, 0.15, 0.22))
      : center
    const offset = isImpellerTarget
      ? new THREE.Vector3(dist * 0.45, dist * 0.4, dist * 0.85)
      : new THREE.Vector3(dist * 0.6, dist * 0.55, dist * 0.6)

    flyTo({
      camera,
      controlsTarget: (controlsRef.current as unknown as { target: THREE.Vector3 }).target,
      destination: center.clone().add(offset),
      lookAt,
      duration: 1.0,
    })
  }

  // ── 监听 selectedPartId 变化 → 自动飞向（点击 / AI 命令都走这里）──────
  useEffect(() => {
    if (!selectedPartId) return
    if (isInspecting) return
    // 等一帧，确保 zone 分类已就绪
    const raf = requestAnimationFrame(() => {
      flyToZone(selectedPartId)
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartId, isInspecting])

  // ── 点击 Mesh → 选中其所属 zone（整块）────────────────────────────────
  const handleClick = (e: { stopPropagation?: () => void; object?: THREE.Object3D }) => {
    e.stopPropagation?.()
    const mesh = e.object as THREE.Mesh | undefined
    if (!mesh || !(mesh instanceof THREE.Mesh)) return

    const zone = getZoneOf(mesh)
    if (!zone) return

    // 再次点击同 zone → 取消选中（飞行由 useEffect 响应）
    setSelectedPart(selectedPartId === zone ? null : zone)
  }

  // ── 射线法 hover：onPointerMove 找到最近 Mesh 所属 zone ──────────────────
  const handlePointerMove = (e: { stopPropagation?: () => void; object?: THREE.Object3D }) => {
    e.stopPropagation?.()
    const mesh = e.object as THREE.Mesh | undefined
    if (!mesh || !(mesh instanceof THREE.Mesh)) return
    const zone = getZoneOf(mesh)
    document.body.style.cursor = zone ? 'pointer' : 'auto'
    setHoveredPart(zone)
  }

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto'
    setHoveredPart(null)
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
