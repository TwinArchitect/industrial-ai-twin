import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { useStore } from '@/store/useStore'

const SHOWCASE_TIMELINE = [
  { delay: 500, label: 'AI scan initialized' },
  { delay: 1800, label: 'Pump body selected' },
  { delay: 3200, label: 'Exploded assembly preview' },
  { delay: 5900, label: 'Autonomous inspection route' },
]

/**
 * Runs a short first-visit product demo so the first screen shows the twin's
 * main capabilities instead of waiting as a static model viewer.
 */
export default function IntroShowcase() {
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const setScanActive = useStore((s) => s.setScanActive)
  const setInspecting = useStore((s) => s.setInspecting)
  const setClipping = useStore((s) => s.setClipping)
  const setClipY = useStore((s) => s.setClipY)
  const setExploded = useStore((s) => s.setExploded)
  const setExplodeScale = useStore((s) => s.setExplodeScale)

  const [activeStep, setActiveStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const cancelledRef = useRef(false)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const animateExplosion = (targetScale: number) => {
      if (targetScale > 0) setExploded(true)
      gsap.to(
        { scale: useStore.getState().explodeScale },
        {
          scale: targetScale,
          duration: targetScale > 0 ? 0.9 : 0.7,
          ease: targetScale > 0 ? 'back.out(1.1)' : 'power2.inOut',
          onUpdate() {
            setExplodeScale(this.targets()[0].scale as number)
          },
          onComplete() {
            setExplodeScale(targetScale)
            if (targetScale === 0) setExploded(false)
          },
        },
      )
    }

    const clearShowcase = () => {
      cancelledRef.current = true
      timersRef.current.forEach(window.clearTimeout)
      timersRef.current = []
      setVisible(false)
    }

    const runUnlessCancelled = (fn: () => void) => {
      if (cancelledRef.current) return
      fn()
    }

    timersRef.current = [
      window.setTimeout(() => runUnlessCancelled(() => {
        setActiveStep(0)
        setScanActive(true)
      }), 500),
      window.setTimeout(() => runUnlessCancelled(() => {
        setActiveStep(1)
        setSelectedPart('pump')
      }), 1300),
      window.setTimeout(() => runUnlessCancelled(() => {
        setActiveStep(2)
        animateExplosion(1)
      }), 3000),
      window.setTimeout(() => runUnlessCancelled(() => {
        setClipping(true)
        setClipY(0.92)
      }), 4300),
      window.setTimeout(() => runUnlessCancelled(() => {
        animateExplosion(0)
        setClipping(false)
      }), 5600),
      window.setTimeout(() => runUnlessCancelled(() => {
        setActiveStep(3)
        setInspecting(true)
      }), 6400),
      window.setTimeout(() => runUnlessCancelled(() => {
        setVisible(false)
      }), 10600),
      window.setTimeout(() => runUnlessCancelled(() => {
        setSelectedPart('pump')
      }), 15200),
    ]

    const userEvents: Array<keyof WindowEventMap> = ['pointerdown', 'wheel', 'keydown']
    userEvents.forEach((eventName) => {
      window.addEventListener(eventName, clearShowcase, { once: true, passive: true })
    })

    return () => {
      timersRef.current.forEach(window.clearTimeout)
      userEvents.forEach((eventName) => {
        window.removeEventListener(eventName, clearShowcase)
      })
    }
  }, [
    setClipping,
    setClipY,
    setExploded,
    setExplodeScale,
    setInspecting,
    setScanActive,
    setSelectedPart,
  ])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute left-6 top-24 z-10 hidden w-72 glass-panel border-accent/25 px-4 py-3 md:block"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="data-label text-[10px]">LIVE SHOWCASE</div>
              <div className="mt-1 text-sm font-semibold text-white">
                Digital twin capabilities online
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_14px_rgba(0,212,255,0.9)]" />
          </div>

          <div className="mt-3 space-y-2">
            {SHOWCASE_TIMELINE.map((step, index) => (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    index <= activeStep ? 'bg-accent' : 'bg-slate-700'
                  }`}
                />
                <div
                  className={`text-[11px] font-mono ${
                    index <= activeStep ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
