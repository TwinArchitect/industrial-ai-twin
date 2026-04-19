import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useStore } from '@/store/useStore'
import type { SensorSnapshot } from '@/types'

/**
 * useWebSocket
 * 职责：连接 Socket.io 后端，接收实时传感器数据并写入 Zustand Store
 * 特性：
 *   - 自动重连（Socket.io 内置）
 *   - 组件卸载时断开连接
 *   - 开发模式下 WS_URL 默认 localhost:3001
 */
export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const updateSensorData = useStore((s) => s.updateSensorData)

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[WS] Connected to sensor server')
    })

    socket.on('sensor:update', (data: SensorSnapshot) => {
      updateSensorData(data)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[WS] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message)
    })

    return () => {
      socket.disconnect()
    }
  }, [updateSensorData])

  return socketRef
}
