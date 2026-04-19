import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import * as THREE from 'three'
import Machine from './Machine'
import Environment from './Environment'
import InspectionBot from './InspectionBot'
import InteractionController from './InteractionController'
import PostProcessing from './effects/PostProcessing'
import ScanEffect from './effects/ScanEffect'

/**
 * Scene
 * 职责：R3F Canvas 根组件，挂载所有 3D 子系统
 * 相机、渲染器、后处理均在此配置
 */
export default function Scene() {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null)

  return (
    <Canvas
      className="absolute inset-0"
      camera={{
        position: [8, 6, 8],
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.75,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      shadows
      dpr={[1, 2]}
    >
      {/* 轨道控制器 */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 + 0.1}
        target={[0, 0, 0]}
      />

      {/* 全局交互控制：快捷键 + reset 视角复位 */}
      <InteractionController controlsRef={controlsRef} />

      {/* 环境光照 + HDRI */}
      <Environment />

      {/* 工业设备主体 */}
      <Machine controlsRef={controlsRef} />

      {/* 巡检机器人（发光小球） */}
      <InspectionBot controlsRef={controlsRef} />

      {/* 扫描线特效（AI 指令触发时播放） */}
      <ScanEffect />

      {/* 后处理：Bloom + Outline + Vignette */}
      <PostProcessing />

      {/* 开发阶段性能监控（生产构建时移除） */}
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  )
}
