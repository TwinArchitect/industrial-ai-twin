import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { useStore } from '@/store/useStore'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, Outline } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'

/**
 * PostProcessing
 * 职责：配置后处理特效
 *
 * ⚠️ 重要说明（已核对 node_modules 源码，版本：@react-three/postprocessing@2.19.1）：
 * 1) Outline 在源码里是“二选一”模式，不是叠加模式：
 *    - 有 <Selection> 上下文时：走 api.selected（来自 <Select> 注册），会忽略 selection prop
 *    - 无 <Selection> 上下文时：才会使用 selection={...} 传入的 Object3D[]
 * 2) 因此本项目使用“zone -> mesh 列表”动态收集方式时，不能包 <Selection>。
 *    一旦包裹 <Selection> 但没有用 <Select> 注册对象，描边会表现为完全不显示。
 * 3) 这里保留 autoClear={false} + xRay，避免后处理叠加和遮挡导致的可见性问题。
 */
export default function PostProcessing() {
  const { scene } = useThree()
  const selectedPartId = useStore((s) => s.selectedPartId)
  const hoveredPartId = useStore((s) => s.hoveredPartId)

  // selected 优先于 hover
  const activeZone = selectedPartId ?? hoveredPartId
  const isSelected = !!selectedPartId

  const selectedMeshes = useMemo(() => {
    if (!activeZone) return []
    const meshes: THREE.Mesh[] = []
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData?.zone === activeZone && obj.visible) {
        meshes.push(obj)
      }
    })
    return meshes
  }, [scene, activeZone])

  return (
    <EffectComposer multisampling={4} autoClear={false}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.3}
        kernelSize={KernelSize.MEDIUM}
        blendFunction={BlendFunction.ADD}
      />

      <Vignette offset={0.3} darkness={0.5} blendFunction={BlendFunction.NORMAL} />

      <Outline
        selection={selectedMeshes}
        edgeStrength={isSelected ? 10 : 8}
        pulseSpeed={isSelected ? 0.45 : 0}
        visibleEdgeColor={isSelected ? 0x00d4ff : 0xffffff}
        hiddenEdgeColor={isSelected ? 0x00a3cc : 0x555555}
        xRay
        blur={isSelected}
        blendFunction={BlendFunction.SCREEN}
      />
    </EffectComposer>
  )
}
