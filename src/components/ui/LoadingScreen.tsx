import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

/**
 * LoadingScreen
 * 职责：3D 资源加载期间的全屏加载动画
 * 使用 @react-three/drei useProgress 获取真实加载进度
 */
export default function LoadingScreen() {
  const { progress, active } = useProgress()
  const setLoadProgress = useStore((s) => s.setLoadProgress)
  const setLoaded = useStore((s) => s.setLoaded)

  useEffect(() => {
    setLoadProgress(progress)
    if (!active && progress === 100) {
      // 加载完毕后短暂延迟再隐藏（视觉缓冲）
      setTimeout(() => setLoaded(true), 600)
    }
  }, [progress, active, setLoadProgress, setLoaded])

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo / 标题 */}
        <motion.div
          className="mb-8 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-accent text-xs tracking-[0.4em] uppercase mb-2 font-mono">
            Industrial AI Twin
          </div>
          <div className="text-slate-400 text-xs tracking-widest uppercase">
            Digital Twin Platform v1.0
          </div>
        </motion.div>

        {/* 进度条 */}
        <div className="w-64 h-px bg-slate-800 relative overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-y-0 left-0 bg-accent rounded-full"
            style={{ boxShadow: '0 0 8px #00d4ff' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        {/* 进度数字 */}
        <div className="mt-4 text-accent font-mono text-sm neon-text">
          {Math.round(progress)}%
        </div>

        {/* 状态文字 */}
        <div className="mt-2 text-slate-500 text-xs tracking-widest">
          {progress < 30 && 'Initializing renderer...'}
          {progress >= 30 && progress < 70 && 'Loading 3D assets...'}
          {progress >= 70 && progress < 100 && 'Compiling shaders...'}
          {progress === 100 && 'Ready'}
        </div>

        {/* 扫描线装饰 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-accent"
              style={{ top: `${i * 5}%` }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
