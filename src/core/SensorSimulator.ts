import type { SensorSnapshot } from '@/types'

const BASE = {
  temperature: 65,
  pressure: 4.2,
  rpm: 2950,
  vibration: 1.2,
  flowRate: 120,
}

let state = { ...BASE }
let alertCooldown = 0

export function generateSensorSnapshot(): SensorSnapshot {
  alertCooldown--

  if (alertCooldown <= 0 && Math.random() < 0.003) {
    state.temperature = BASE.temperature + 18 + Math.random() * 5
    alertCooldown = 20
  }

  state.temperature = clamp(
    state.temperature + gaussRand(0, 0.3),
    alertCooldown > 0 ? 82 : 50,
    alertCooldown > 0 ? 92 : 78,
  )
  state.pressure = clamp(state.pressure + gaussRand(0, 0.05), 3.5, 5.5)
  state.rpm = clamp(state.rpm + gaussRand(0, 20), 2700, 3100)
  state.vibration = clamp(state.vibration + gaussRand(0, 0.08), 0.5, 4.0)
  state.flowRate = clamp(state.flowRate + gaussRand(0, 1.5), 100, 140)

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

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

function round(v: number, decimals: number) {
  return Math.round(v * 10 ** decimals) / 10 ** decimals
}

function gaussRand(mean: number, std: number) {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return mean + z * std
}
