import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { AppState, SensorSnapshot, ChatEntry, AlertEntry } from '@/types'

const HISTORY_MAX = 60 // 保留最近 60 帧传感器历史
const ALERT_MAX = 6 // 屏幕最多保留 6 条告警

export const useStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    // ─── 初始状态 ───────────────────────────────────────────────────────────
    isLoaded: true,
    loadProgress: 0,

    selectedPartId: null,
    hoveredPartId: null,

    isExploded: false,
    explodeScale: 0,

    isClipping: false,
    clipY: 0,

    isInspecting: false,
    inspectingZone: null,
    resetViewTick: 0,
    isScanActive: false,

    sensorData: null,
    sensorHistory: {
      timestamps: [],
      temperature: [],
      pressure: [],
      rpm: [],
      vibration: [],
      flowRate: [],
    },

    chatHistory: [],
    isAIProcessing: false,
    alerts: [],

    // ─── Actions ───────────────────────────────────────────────────────────
    setLoaded: (v) => set({ isLoaded: v }),
    setLoadProgress: (v) => set({ loadProgress: v }),
    setSelectedPart: (id) => set({ selectedPartId: id }),
    setHoveredPart: (id) => set({ hoveredPartId: id }),
    setExploded: (v) => set({ isExploded: v }),
    setExplodeScale: (v) => set({ explodeScale: v }),
    setClipping: (v) => set({ isClipping: v }),
    setClipY: (v) => set({ clipY: v }),
    setInspecting: (v) => set({ isInspecting: v }),
    setInspectingZone: (zone) => set({ inspectingZone: zone }),
    triggerResetView: () => set((state) => ({ resetViewTick: state.resetViewTick + 1 })),
    setScanActive: (v) => set({ isScanActive: v }),
    setAIProcessing: (v) => set({ isAIProcessing: v }),

    updateSensorData: (data: SensorSnapshot) =>
      set((state) => {
        const h = state.sensorHistory
        const trim = (arr: number[]) =>
          arr.length >= HISTORY_MAX ? arr.slice(1) : arr

        return {
          sensorData: data,
          sensorHistory: {
            timestamps: [...trim(h.timestamps), data.timestamp],
            temperature: [...trim(h.temperature), data.temperature],
            pressure: [...trim(h.pressure), data.pressure],
            rpm: [...trim(h.rpm), data.rpm],
            vibration: [...trim(h.vibration), data.vibration],
            flowRate: [...trim(h.flowRate), data.flowRate],
          },
        }
      }),

    pushChat: (entry: ChatEntry) =>
      set((state) => ({
        chatHistory: [...state.chatHistory, entry],
      })),

    pushAlert: (entry: AlertEntry) =>
      set((state) => {
        const next = [...state.alerts, entry]
        return {
          alerts: next.length > ALERT_MAX ? next.slice(next.length - ALERT_MAX) : next,
        }
      }),

    dismissAlert: (id: string) =>
      set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== id),
      })),
  })),
)
