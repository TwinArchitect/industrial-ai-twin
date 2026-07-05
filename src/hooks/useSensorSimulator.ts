import { useEffect } from 'react'
import { generateSensorSnapshot } from '@/core/SensorSimulator'
import { useStore } from '@/store/useStore'

const SENSOR_INTERVAL_MS = 500

/**
 * Runs the browser-side sensor feed used by the digital twin UI.
 */
export function useSensorSimulator() {
  const updateSensorData = useStore((s) => s.updateSensorData)

  useEffect(() => {
    updateSensorData(generateSensorSnapshot())

    const interval = window.setInterval(() => {
      updateSensorData(generateSensorSnapshot())
    }, SENSOR_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [updateSensorData])
}
