import { useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { parse } from '@/core/CommandProcessor'
import { useExplosion } from './useExplosion'
import type { ChatEntry } from '@/types'

/**
 * useAICommand
 * 职责：连接 CommandProcessor 解析结果与实际场景行为
 * 流程：用户输入 → parse() → CommandAction → 分发到对应 hook/store
 */
export function useAICommand() {
  const pushChat = useStore((s) => s.pushChat)
  const setAIProcessing = useStore((s) => s.setAIProcessing)
  const setScanActive = useStore((s) => s.setScanActive)
  const setInspecting = useStore((s) => s.setInspecting)
  const triggerResetView = useStore((s) => s.triggerResetView)
  const setClipping = useStore((s) => s.setClipping)
  const setClipY = useStore((s) => s.setClipY)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const { explode, collapse } = useExplosion()

  const execute = useCallback(
    async (input: string) => {
      if (!input.trim()) return

      // 记录用户消息
      const userEntry: ChatEntry = {
        id: crypto.randomUUID(),
        role: 'user',
        text: input,
        timestamp: Date.now(),
      }
      pushChat(userEntry)
      setAIProcessing(true)

      // 模拟 AI 思考延迟（Demo 效果：打字机输出前的短暂停顿）
      await new Promise((r) => setTimeout(r, 400))

      const action = parse(input)

      // 触发扫描线特效（任何指令执行时）
      setScanActive(true)

      // 分发动作
      switch (action.type) {
        case 'explode':
          explode()
          break
        case 'collapse':
          collapse()
          break
        case 'reset':
          setInspecting(false)
          setSelectedPart(null)
          triggerResetView()
          break
        case 'inspect':
          setInspecting(true)
          break
        case 'clip':
          setClipping(true)
          setClipY(0.9)
          break
        case 'flyTo':
        case 'highlight':
        case 'showData':
          if (action.target) {
            setSelectedPart(null)
            requestAnimationFrame(() => {
              setSelectedPart(action.target as string)
            })
          }
          break
        case 'unknown':
          break
      }

      // 记录 AI 回复
      const aiEntry: ChatEntry = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: action.replyText,
        timestamp: Date.now(),
        action,
      }
      pushChat(aiEntry)
      setAIProcessing(false)
    },
    [
      pushChat,
      setAIProcessing,
      setScanActive,
      setInspecting,
      triggerResetView,
      setClipping,
      setClipY,
      setSelectedPart,
      explode,
      collapse,
    ],
  )

  return { execute }
}
