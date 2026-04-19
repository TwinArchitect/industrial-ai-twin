import { useCallback } from 'react'
import { gsap } from 'gsap'
import { useStore } from '@/store/useStore'

/**
 * useExplosion
 * 职责：封装爆炸图的展开/收回逻辑
 * GSAP 驱动 Zustand 中的 explodeScale（0→1 或 1→0）
 * Scene 中的 MachineBody 每帧读取 explodeScale 并更新 Mesh 位置
 */
export function useExplosion() {
  const setExploded = useStore((s) => s.setExploded)
  const setExplodeScale = useStore((s) => s.setExplodeScale)
  const explodeScale = useStore((s) => s.explodeScale)

  const explode = useCallback(() => {
    setExploded(true)
    gsap.to(
      { scale: explodeScale },
      {
        scale: 1,
        duration: 0.9,
        ease: 'back.out(1.1)',
        onUpdate() {
          setExplodeScale(this.targets()[0].scale as number)
        },
        onComplete() {
          setExplodeScale(1)
        },
      },
    )
  }, [explodeScale, setExploded, setExplodeScale])

  const collapse = useCallback(() => {
    gsap.to(
      { scale: explodeScale },
      {
        scale: 0,
        duration: 0.7,
        ease: 'power2.inOut',
        onUpdate() {
          setExplodeScale(this.targets()[0].scale as number)
        },
        onComplete() {
          setExplodeScale(0)
          setExploded(false)
        },
      },
    )
  }, [explodeScale, setExploded, setExplodeScale])

  return { explode, collapse, isExploded: explodeScale > 0 }
}
