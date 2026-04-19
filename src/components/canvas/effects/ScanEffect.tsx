import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import scanVertGlsl from '@/shaders/scanLine.vert.glsl'
import scanFragGlsl from '@/shaders/scanLine.frag.glsl'

/**
 * ScanEffect
 * 职责：AI 指令触发时，在场景中播放纵向扫描线特效
 * 实现：一个覆盖整个场景的透明平面，使用自定义 Shader
 *   - uTime：驱动扫描线 Y 轴位置从底到顶
 *   - uActive：控制特效是否可见（0 = 隐藏，1 = 播放）
 * 配合 Bloom 后处理，扫描线会产生辉光拖尾效果
 */
export default function ScanEffect() {
  const meshRef = useRef<THREE.Mesh>(null)
  const isScanActive = useStore((s) => s.isScanActive)
  const setScanActive = useStore((s) => s.setScanActive)

  const uniforms = useRef({
    uTime: { value: 0 },
    uActive: { value: 0 },
    uColor: { value: new THREE.Color('#00d4ff') },
    uLineWidth: { value: 0.04 },
    uSpeed: { value: 0.8 },
  })

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const u = uniforms.current

    if (isScanActive) {
      u.uActive.value = 1
      u.uTime.value = clock.getElapsedTime()

      // 扫描完一次后自动关闭（约 1.5 秒）
      const cycleT = (clock.getElapsedTime() * u.uSpeed.value) % 1.5
      if (cycleT < 0.05 && clock.getElapsedTime() > 1) {
        setScanActive(false)
      }
    } else {
      u.uActive.value = Math.max(0, u.uActive.value - 0.05) // 淡出
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 覆盖整个场景的大平面 */}
      <planeGeometry args={[40, 40]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={scanVertGlsl}
        fragmentShader={scanFragGlsl}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
