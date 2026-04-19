import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
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
  const [showComplete, setShowComplete] = useState(false)

  useEffect(() => {
    setLoadProgress(progress)
    if (!active && progress === 100) {
      setShowComplete(true)
      setTimeout(() => setLoaded(true), 1200)
    }
  }, [progress, active, setLoadProgress, setLoaded])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="loader"
        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #0a0e1a 100%)' 
        }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 背景网格 */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* 中心 Logo 动画 */}
        <motion.div
          className="relative mb-12"
          initial={{ scale: 0.8, opacity: 0, rotateY: -15 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.8, type: 'spring' }}
        >
          {/* 外圈光环 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #00d4ff20, transparent)',
              filter: 'blur(20px)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* 内圈 */}
          <div className="relative w-24 h-24 rounded-full border border-slate-700/50 bg-slate-900/50 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-12 h-12">
              <path d="M16 6L26 24H6L16 6Z" fill="#00d4ff" opacity="0.3"/>
              <path d="M16 10L22 22H10L16 10Z" fill="#00d4ff"/>
              <circle cx="16" cy="22" r="2" fill="#00d4ff"/>
            </svg>
          </div>
        </motion.div>

        {/* 标题 */}
        <motion.div
          className="text-center mb-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Industrial <span className="text-accent">AI</span> Twin
          </h1>
          <p className="text-slate-500 text-xs tracking-[0.3em] uppercase">
            Next-Generation Digital Twin Platform
          </p>
        </motion.div>

        {/* 进度区域 */}
        <motion.div
          className="w-72"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* 进度条背景 */}
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative">
            {/* 进度填充 */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ 
                background: 'linear-gradient(90deg, #00d4ff, #22d3ee)',
                boxShadow: '0 0 12px rgba(0,212,255,0.5)'
              }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
            {/* 闪光效果 */}
            <motion.div
              className="absolute inset-y-0 w-20"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
              }}
              animate={{ x: ['-100%', '400%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* 进度信息 */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-slate-500 text-xs font-mono">
              {showComplete ? 'SYSTEM READY' : progress < 30 ? 'INITIALIZING' : progress < 70 ? 'LOADING ASSETS' : 'COMPILING'}
            </span>
            <span className="text-accent text-xs font-mono font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
        </motion.div>

        {/* 完成提示 */}
        <AnimatePresence>
          {showComplete && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-400 text-sm font-medium tracking-wider">READY</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部装饰线 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-accent"
              animate={{ 
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
