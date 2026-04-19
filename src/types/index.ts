import type * as THREE from 'three'

// ─── 设备零件 ───────────────────────────────────────────────────────────────

/** 设备零件状态 */
export type PartStatus = 'running' | 'warning' | 'stopped'

/** 单个设备零件的元数据 */
export interface MachinePart {
  id: string
  name: string
  displayName: string
  status: PartStatus
  /** 在爆炸图中，该零件相对中心的位移向量（由 ModelProcessor 计算） */
  explodeVector: THREE.Vector3
  /** 原始世界坐标（爆炸动画还原用） */
  originalPosition: THREE.Vector3
}

// ─── 传感器数据 ──────────────────────────────────────────────────────────────

/** 单帧传感器快照 */
export interface SensorSnapshot {
  timestamp: number
  temperature: number   // °C
  pressure: number      // bar
  rpm: number           // 转/分
  vibration: number     // mm/s
  flowRate: number      // m³/h
}

/** 历史数据序列（用于 ECharts 曲线图） */
export interface SensorHistory {
  timestamps: number[]
  temperature: number[]
  pressure: number[]
  rpm: number[]
  vibration: number[]
  flowRate: number[]
}

// ─── AI 命令系统 ─────────────────────────────────────────────────────────────

/** AI 命令动作类型 */
export type ActionType =
  | 'flyTo'           // 相机飞向指定零件
  | 'explode'         // 触发爆炸图
  | 'collapse'        // 收回爆炸图
  | 'reset'           // 复位默认视角与选中状态
  | 'inspect'         // 开始巡检动画
  | 'clip'            // 切换截面切割
  | 'showData'        // 弹出数据面板
  | 'highlight'       // 高亮指定零件
  | 'unknown'         // 无法识别的指令

/** CommandProcessor 输出的动作描述 */
export interface CommandAction {
  type: ActionType
  target?: string       // 零件 id（对于 flyTo / highlight / showData）
  payload?: Record<string, unknown>
  /** 给用户展示的 AI 回复文本 */
  replyText: string
}

/** AI 对话记录条目 */
export interface ChatEntry {
  id: string
  role: 'user' | 'ai'
  text: string
  timestamp: number
  action?: CommandAction
}

// ─── 告警通知 ─────────────────────────────────────────────────────────────────

/** 告警严重级别 */
export type AlertSeverity = 'warn' | 'critical' | 'info'

/** 实时告警条目 */
export interface AlertEntry {
  id: string
  severity: AlertSeverity
  title: string
  detail: string
  zone?: string
  timestamp: number
}

// ─── 巡检路径 ─────────────────────────────────────────────────────────────────

/** 巡检路径节点 */
export interface InspectionWaypoint {
  partId: string
  position: THREE.Vector3
  dwellTime: number   // 停留时长（ms）
}

// ─── 全局 Store ───────────────────────────────────────────────────────────────

/** Zustand 全局状态结构 */
export interface AppState {
  // 加载状态
  isLoaded: boolean
  loadProgress: number

  // 选中零件
  selectedPartId: string | null

  // hover 悬停零件（射线法，用于描边提示）
  hoveredPartId: string | null

  // 爆炸图
  isExploded: boolean
  explodeScale: number  // 0=收回 → 1=完全展开

  // 截面切割
  isClipping: boolean
  clipY: number

  // 巡检动画
  isInspecting: boolean
  inspectingZone: string | null   // 巡检当前停靠的 zone

  // 视角复位触发信号（自增）
  resetViewTick: number

  // 扫描线特效
  isScanActive: boolean

  // 传感器数据
  sensorData: SensorSnapshot | null
  sensorHistory: SensorHistory

  // AI 对话
  chatHistory: ChatEntry[]
  isAIProcessing: boolean

  // 告警通知
  alerts: AlertEntry[]

  // Actions
  setLoaded: (v: boolean) => void
  setLoadProgress: (v: number) => void
  setSelectedPart: (id: string | null) => void
  setHoveredPart: (id: string | null) => void
  setExploded: (v: boolean) => void
  setExplodeScale: (v: number) => void
  setClipping: (v: boolean) => void
  setClipY: (v: number) => void
  setInspecting: (v: boolean) => void
  setInspectingZone: (zone: string | null) => void
  triggerResetView: () => void
  setScanActive: (v: boolean) => void
  updateSensorData: (data: SensorSnapshot) => void
  pushChat: (entry: ChatEntry) => void
  setAIProcessing: (v: boolean) => void
  pushAlert: (entry: AlertEntry) => void
  dismissAlert: (id: string) => void
}
