import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { useAICommand } from '@/hooks/useAICommand'
import { getSuggestions } from '@/core/CommandProcessor'

/**
 * AITerminal
 * 职责：右下角 AI 自然语言命令台
 * 视觉：Glassmorphism 玻璃拟态面板
 * 功能：
 *   - 输入框 + 发送按钮
 *   - 打字机效果输出 AI 回复
 *   - 指令建议提示
 *   - 对话历史滚动显示
 */
export default function AITerminal() {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isTerminalVisible, setIsTerminalVisible] = useState(true)
  const [displayedAIText, setDisplayedAIText] = useState('')
  const [isAlertPulse, setIsAlertPulse] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const chatHistory = useStore((s) => s.chatHistory)
  const isAIProcessing = useStore((s) => s.isAIProcessing)
  const { execute } = useAICommand()
  const suggestions = getSuggestions()

  // 滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // 打字机效果：AI 最新回复逐字符显示
  useEffect(() => {
    const lastAI = [...chatHistory].reverse().find((e) => e.role === 'ai')
    if (!lastAI) return

    let i = 0
    setDisplayedAIText('')
    const interval = setInterval(() => {
      setDisplayedAIText(lastAI.text.slice(0, i + 1))
      i++
      if (i >= lastAI.text.length) clearInterval(interval)
    }, 18) // 约 18ms/字符 ≈ 55 字/秒

    return () => clearInterval(interval)
  }, [chatHistory])

  useEffect(() => {
    const lastAlert = [...chatHistory]
      .reverse()
      .find((e) => e.role === 'ai' && e.action?.payload?.alert)
    if (!lastAlert) return

    setIsAlertPulse(true)
    const timer = setTimeout(() => setIsAlertPulse(false), 2200)
    return () => clearTimeout(timer)
  }, [chatHistory])

  const handleSubmit = () => {
    if (!input.trim() || isAIProcessing) return
    execute(input)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setIsOpen(false)
  }

  if (!isTerminalVisible) {
    return (
      <button
        type="button"
        className="absolute bottom-6 left-6 z-10 glass-panel px-3 py-2 text-accent text-xs font-mono hover:opacity-80 transition-opacity"
        onClick={() => setIsTerminalVisible(true)}
      >
        AI›
      </button>
    )
  }

  return (
    <div className="absolute bottom-6 left-6 z-10 w-80">
      {/* ── 对话历史（展开状态） ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="glass-panel mb-2 p-3 max-h-64 overflow-y-auto"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {chatHistory.length === 0 && (
              <div className="text-slate-500 text-xs text-center py-4">
                Type a command to control the scene
              </div>
            )}

            {chatHistory.map((entry, i) => {
              const isLatestAI = entry.role === 'ai' && i === chatHistory.length - 1
              const target = entry.action?.target
              return (
                <div key={entry.id} className={`mb-2 ${entry.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block text-xs px-2 py-1 rounded max-w-[90%] break-words ${
                    entry.role === 'user'
                      ? 'bg-accent/15 text-accent border border-accent/20'
                      : 'bg-slate-800/60 text-slate-200'
                  }`}>
                    {entry.role === 'user' ? entry.text : (isLatestAI ? displayedAIText : entry.text)}
                    {isLatestAI && displayedAIText.length < entry.text.length && (
                      <span className="cursor-blink text-accent ml-0.5">▋</span>
                    )}
                  </span>

                  {entry.role === 'ai' && target && (
                    <div className="mt-1 flex gap-1 justify-start">
                      <button
                        className="text-[10px] text-cyan-300 border border-cyan-400/35 rounded px-2 py-0.5 hover:bg-cyan-500/10 transition-colors"
                        onClick={() => execute(`fly to ${target}`)}
                        disabled={isAIProcessing}
                      >
                        Focus Abnormal Part
                      </button>
                      <button
                        className="text-[10px] text-slate-300 border border-slate-600 rounded px-2 py-0.5 hover:border-cyan-400/35 hover:text-cyan-300 transition-colors"
                        onClick={() => execute(`show data ${target}`)}
                        disabled={isAIProcessing}
                      >
                        View Part Data
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {isAIProcessing && (
              <div className="text-left mb-2">
                <span className="inline-block text-xs px-2 py-1 rounded bg-slate-800/60 text-slate-400">
                  <span className="cursor-blink">processing...</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 建议指令（未输入时展示） ── */}
      <AnimatePresence>
        {isOpen && !input && (
          <motion.div
            className="glass-panel mb-2 p-2 flex flex-wrap gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {suggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                className="text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-0.5 hover:border-accent/50 hover:text-accent/80 transition-colors"
                onClick={() => { setInput(s); }}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 主输入框 ── */}
      <div
        className={`glass-panel flex items-center gap-2 px-3 py-2.5 cursor-text transition-all ${
          isAlertPulse ? 'ring-1 ring-rose-400/65 shadow-[0_0_22px_rgba(251,113,133,0.35)]' : ''
        }`}
        onClick={() => setIsOpen(true)}
      >
        {/* AI 图标 */}
        <div className="text-accent text-xs font-mono shrink-0">AI›</div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder='Try: "explode the engine"'
          className="flex-1 bg-transparent text-white text-xs font-mono placeholder-slate-600 outline-none"
          disabled={isAIProcessing}
        />

        {/* 发送按钮 */}
        {input && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleSubmit}
            disabled={isAIProcessing}
            className="text-accent text-xs font-mono hover:opacity-70 transition-opacity shrink-0"
          >
            ↵
          </motion.button>
        )}

        <button
          type="button"
          className="text-slate-400 text-xs px-1 hover:text-slate-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
            setIsTerminalVisible(false)
          }}
          aria-label="Close AI terminal"
        >
          ×
        </button>
      </div>
    </div>
  )
}
