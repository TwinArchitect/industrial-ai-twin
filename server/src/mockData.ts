/**
 * mockData
 * 职责：生成模拟工业传感器数据
 * 模拟真实设备波动：在基准值附近随机游走，偶发告警峰值
 */

interface SensorSnapshot {
  timestamp: number
  temperature: number
  pressure: number
  rpm: number
  vibration: number
  flowRate: number
}

// ─── 基准参数 ────────────────────────────────────────────────────────────────

const BASE = {
  temperature: 65,   // °C（正常范围 50–80）
  pressure: 4.2,     // bar（正常范围 3.5–5.5）
  rpm: 2950,         // r/min（额定 3000）
  vibration: 1.2,    // mm/s（告警 > 4.5）
  flowRate: 120,     // m³/h（额定 125）
}

// ─── 随机游走状态 ────────────────────────────────────────────────────────────

let state = { ...BASE }
let alertCooldown = 0   // 告警事件冷却帧数

/**
 * 生成下一帧传感器快照
 * 每次调用在当前值基础上施加小幅随机扰动
 * 每 ~120 帧随机触发一次短暂过温事件
 */
export function generateSnapshot(): SensorSnapshot {
  alertCooldown--

  // 随机触发过温告警（约每 2 分钟一次，持续约 10 秒）
  if (alertCooldown <= 0 && Math.random() < 0.003) {
    state.temperature = BASE.temperature + 18 + Math.random() * 5
    alertCooldown = 20
  }

  // 随机游走（clamp 在合理范围内）
  state.temperature = clamp(
    state.temperature + gaussRand(0, 0.3),
    alertCooldown > 0 ? 82 : 50,
    alertCooldown > 0 ? 92 : 78,
  )
  state.pressure = clamp(state.pressure + gaussRand(0, 0.05), 3.5, 5.5)
  state.rpm = clamp(state.rpm + gaussRand(0, 20), 2700, 3100)
  state.vibration = clamp(state.vibration + gaussRand(0, 0.08), 0.5, 4.0)
  state.flowRate = clamp(state.flowRate + gaussRand(0, 1.5), 100, 140)

  // 冷却后逐渐恢复正常
  if (alertCooldown <= 0 && state.temperature > BASE.temperature + 5) {
    state.temperature -= 0.5
  }

  return {
    timestamp: Date.now(),
    temperature: round(state.temperature, 1),
    pressure: round(state.pressure, 2),
    rpm: Math.round(state.rpm),
    vibration: round(state.vibration, 2),
    flowRate: round(state.flowRate, 1),
  }
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

function round(v: number, decimals: number) {
  return Math.round(v * 10 ** decimals) / 10 ** decimals
}

/** Box-Muller 正态分布随机数 */
function gaussRand(mean: number, std: number) {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return mean + z * std
}
