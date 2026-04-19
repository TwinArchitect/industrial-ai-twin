import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { ALL_ZONES, ZONE_DISPLAY, type PartZone } from '@/core/PartZoning'

/**
 * ZoneAnnotations
 * 职责：hover 或 selected 时显示 zone 浮动标签
 *   - hover -> 灰色提示标签
 *   - selected -> 青色高亮标签
 *   - 告警状态由 AlertToast 独立负责，此处不展示
 *   - 巡检/爆炸时自动隐藏
 */

interface ZoneAnchor {
  zone: PartZone
  position: THREE.Vector3
}

export default function ZoneAnnotations() {
  const { scene } = useThree()
  const anchorsRef = useRef<ZoneAnchor[]>([])
  const readyRef = useRef(false)

  const selectedPartId = useStore((s) => s.selectedPartId)
  const hoveredPartId = useStore((s) => s.hoveredPartId)
  const inspectingZone = useStore((s) => s.inspectingZone)
  const setSelectedPart = useStore((s) => s.setSelectedPart)
  const isExploded = useStore((s) => s.isExploded)
  const isInspecting = useStore((s) => s.isInspecting)

  useEffect(() => {
    let attempt = 0
    const interval = setInterval(() => {
      attempt++
      const anchors: ZoneAnchor[] = []

      for (const zone of ALL_ZONES) {
        const zoneBox = new THREE.Box3()
        let count = 0
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.userData?.zone === zone) {
            zoneBox.expandByObject(obj)
            count++
          }
        })
        if (count > 0 && !zoneBox.isEmpty()) {
          const center = zoneBox.getCenter(new THREE.Vector3())
          anchors.push({
            zone,
            position: new THREE.Vector3(center.x, zoneBox.max.y + 0.25, center.z),
          })
        }
      }

      if (anchors.length > 0 || attempt > 30) {
        anchorsRef.current = anchors
        readyRef.current = true
        clearInterval(interval)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [scene])

  if (isExploded || !readyRef.current) return null

  // 巡检中：只显示当前站点标签（扫描指示风格）
  // 非巡检：显示 hover 或 selected 标签
  const visibleAnchors = anchorsRef.current.filter(({ zone }) => {
    if (isInspecting) return zone === inspectingZone
    return zone === selectedPartId || zone === hoveredPartId
  })

  if (visibleAnchors.length === 0) return null

  return (
    <>
      {visibleAnchors.map(({ zone, position }) => {
        const isInspectActive = isInspecting && zone === inspectingZone
        const isSelected = !isInspecting && zone === selectedPartId
        const isHovered = !isInspecting && zone === hoveredPartId && !isSelected
        return (
          <Html
            key={zone}
            position={position}
            center
            distanceFactor={12}
            style={{ pointerEvents: isInspecting ? 'none' : 'auto' }}
          >
            <div
              onClick={(e) => {
                if (isInspecting) return
                e.stopPropagation()
                setSelectedPart(isSelected ? null : zone)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '4px',
                background: isInspectActive
                  ? 'rgba(251, 146, 60, 0.15)'
                  : isSelected
                  ? 'rgba(0, 212, 255, 0.18)'
                  : 'rgba(10, 18, 32, 0.72)',
                border: isInspectActive
                  ? '1px solid rgba(251, 146, 60, 0.7)'
                  : isSelected
                  ? '1px solid rgba(0, 212, 255, 0.65)'
                  : isHovered
                  ? '1px solid rgba(148, 163, 184, 0.5)'
                  : '1px solid rgba(100, 116, 139, 0.3)',
                cursor: isInspecting ? 'default' : 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: isInspectActive
                    ? '#fb923c'
                    : isSelected
                    ? '#00d4ff'
                    : '#94a3b8',
                  flexShrink: 0,
                  boxShadow: isInspectActive ? '0 0 6px #fb923c' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: isInspectActive
                    ? '#fb923c'
                    : isSelected
                    ? '#00d4ff'
                    : '#cbd5e1',
                  textTransform: 'uppercase',
                }}
              >
                {ZONE_DISPLAY[zone]}
                {isInspectActive && (
                  <span style={{ marginLeft: '4px', opacity: 0.7, fontSize: '9px' }}>SCANNING</span>
                )}
              </span>
            </div>
          </Html>
        )
      })}
    </>
  )
}