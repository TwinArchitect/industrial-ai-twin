import { Suspense } from 'react'
import GLBMachine from './GLBMachine'
import StatusLights from './StatusLights'
import ZoneAnnotations from './ZoneAnnotations'
import type { OrbitControls } from '@react-three/drei'

interface MachineProps {
  controlsRef: React.RefObject<React.ElementRef<typeof OrbitControls>>
}

/**
 * Machine — 顶层设备组件
 *
 * 当前模式：GLB 真实模型（public/models/pump.glb）
 *   下载模型后放入 public/models/pump.glb 即可自动加载
 *   推荐来源见 RESOURCES.md
 *
 * GLBMachine 内部处理：
 *   - 模型加载 + 材质增强（envMapIntensity）
 *   - 射线拾取 + 相机飞行
 *   - 爆炸图位置插值
 */
export default function Machine({ controlsRef }: MachineProps) {
  return (
    <group>
      {/* GLB 模型（Suspense 内部，加载中不阻塞其他渲染） */}
      <Suspense fallback={null}>
        <GLBMachine controlsRef={controlsRef} />
      </Suspense>

      {/* 状态指示灯（独立于模型，始终可见） */}
      <StatusLights />

      {/* 3D 浮动标注（zone 名称 + 状态灯） */}
      <ZoneAnnotations />
    </group>
  )
}
