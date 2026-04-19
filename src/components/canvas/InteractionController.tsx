import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { useExplosion } from '@/hooks/useExplosion'
import { flyToPreset } from '@/core/CameraDirector'

interface InteractionControllerProps {
  controlsRef: React.RefObject<React.ElementRef<typeof OrbitControls>>
}

/**
 * InteractionController
 * 职责：
 * - 响应 resetViewTick 执行相机复位
 * - 处理全局快捷键（E / I / C / Esc / R）
 */
export default function InteractionController({ controlsRef }: InteractionControllerProps) {
  const { camera } = useThree()
  const { explode, collapse, isExploded } = useExplosion()

  const isInspecting = useStore((s) => s.isInspecting)
  const setInspecting = useStore((s) => s.setInspecting)
  const isClipping = useStore((s) => s.isClipping)
  const setClipping = useStore((s) => s.setClipping)
  const setClipY = useStore((s) => s.setClipY)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const resetViewTick = useStore((s) => s.resetViewTick)
  const triggerResetView = useStore((s) => s.triggerResetView)

  const runResetView = () => {
    if (!controlsRef.current) return
    flyToPreset({
      camera,
      controlsTarget: (controlsRef.current as unknown as { target: THREE.Vector3 }).target,
      preset: 'overview',
      duration: 1.1,
    })
  }

  useEffect(() => {
    runResetView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetViewTick])

  useEffect(() => {
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || target.isContentEditable
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInput(e.target)) return

      const key = e.key.toLowerCase()
      if (key === 'e') {
        if (isExploded) collapse()
        else explode()
      }
      if (key === 'i') {
        setInspecting(!isInspecting)
      }
      if (key === 'c') {
        const next = !isClipping
        setClipping(next)
        if (next) setClipY(0.9)
      }
      if (key === 'escape') {
        setSelectedPart(null)
      }
      if (key === 'r') {
        setInspecting(false)
        setSelectedPart(null)
        triggerResetView()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    collapse,
    explode,
    isExploded,
    isInspecting,
    isClipping,
    setInspecting,
    setClipping,
    setClipY,
    setSelectedPart,
    triggerResetView,
  ])

  return null
}
