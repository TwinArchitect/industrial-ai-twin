import { Environment as DreiEnvironment,Grid } from '@react-three/drei'

/**
 * Environment
 * 职责：场景光照 + 地面网格
 * HDRI：public/hdri/industrial_workshop_foundry_1k.hdr（本地文件，无 CDN 请求）
 * 补充手动灯光：解决 HDRI 阴影不足 + 增强轮廓感
 */
export default function Environment() {
  return (
    <>
      {/* HDRI 铸造车间：同时提供环境光照 + 金属反射，不需要额外灯光 */}
      <DreiEnvironment
        files="/hdri/industrial_workshop_foundry_1k.hdr"
        background={false}
        environmentIntensity={0.6}
      />

      {/* 定向光：提供主光源 + 清晰阴影（HDRI 不产生阴影，必须手动配） */}
      <directionalLight
        position={[6, 10, 4]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        color="#fff2e0"
      />

      {/* 地面（接收阴影） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a1220" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* 工业风网格地面 */}
      <Grid
        position={[0, 0, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a2840"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#00d4ff"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </>
  )
}
