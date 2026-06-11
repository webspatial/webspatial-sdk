import { enableDebugTool } from '@webspatial/react-sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { Scenario1MainPageMenu } from './Scenario1MainPageMenu'
import { Scenario2SpatialFlatMenu } from './Scenario2SpatialFlatMenu'
import { Scenario3ChildOverlayMenu } from './Scenario3ChildOverlayMenu'
import { pageStyle, sectionGridStyle } from './shared'
import './menuLayout.css'

enableDebugTool()

type LogEntry = {
  id: number
  message: string
}

function hasScenario3AutoOpenFlag() {
  if (typeof window === 'undefined') return false

  const directParams = new URLSearchParams(window.location.search)
  if (directParams.get('s3Open') === '1') return true

  const hash = window.location.hash
  const hashQueryStart = hash.indexOf('?')
  if (hashQueryStart >= 0) {
    const hashParams = new URLSearchParams(hash.slice(hashQueryStart + 1))
    if (hashParams.get('s3Open') === '1') return true
  }

  return /(?:[?&#]|%3F|%26)s3Open(?:=|%3D)1/i.test(window.location.href)
}

export default function DropdownMenuSpatialTest() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const scenario3AutoOpen = useMemo(() => hasScenario3AutoOpenFlag(), [])
  const [scenario3Open, setScenario3Open] = useState<boolean | undefined>(
    scenario3AutoOpen ? true : undefined,
  )
  const latestLog = logs[0]?.message ?? 'Menu log'

  const addLog = useCallback((source: string, item: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev =>
      [
        { id: Date.now(), message: `[${time}] ${source}: ${item}` },
        ...prev,
      ].slice(0, 8),
    )
  }, [])

  const logMainFloating = useCallback(
    (item: string) => addLog('main floating', item),
    [addLog],
  )
  const logSpatialFlat = useCallback(
    (item: string) => addLog('spatial flat', item),
    [addLog],
  )
  const logSpatialChildFloating = useCallback(
    (item: string) => addLog('spatial child floating', item),
    [addLog],
  )
  const handleScenario3OpenChange = useCallback(
    (open: boolean) => {
      if (scenario3AutoOpen) {
        setScenario3Open(open)
      }
    },
    [scenario3AutoOpen],
  )

  return (
    <div style={pageStyle}>
      <a href="#" onClick={() => history.go(-1)} style={{ color: '#93c5fd' }}>
        Go Back
      </a>
      <h1 style={{ margin: '20px 0 8px', fontSize: '24px' }}>
        Radix DropdownMenu + SpatialDiv
      </h1>
      <p style={{ maxWidth: '760px', margin: 0, color: '#94a3b8' }}>
        Scenario 1: main-page menu with <code>div enable-xr</code> so the
        dropdown rises as a spatial surface. Scenario 2: menu inside SpatialDiv
        portals to the spatial window via{' '}
        <code>useSpatialPortalContainer()</code>. Scenario 3:{' '}
        <code>SpatialOverlay</code> + Radix so the menu rises as a child surface
        that escapes the parent panel bounds (spatial runtime only).
      </p>
      <div
        style={{
          marginTop: '12px',
          color: '#cbd5e1',
          fontSize: '12px',
        }}
      >
        {latestLog}
      </div>

      <Scenario1MainPageMenu onLog={logMainFloating} />

      <div style={sectionGridStyle}>
        <Scenario2SpatialFlatMenu onLog={logSpatialFlat} />
        <Scenario3ChildOverlayMenu
          onLog={logSpatialChildFloating}
          open={scenario3AutoOpen ? scenario3Open : undefined}
          onOpenChange={handleScenario3OpenChange}
          logAutoOpenProbe={scenario3AutoOpen}
        />
      </div>

      <pre
        style={{
          marginTop: '24px',
          minHeight: '88px',
          padding: '14px',
          borderRadius: '8px',
          background: '#020617',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          fontSize: '12px',
        }}
      >
        {logs.length ? logs.map(log => log.message).join('\n') : latestLog}
      </pre>
    </div>
  )
}
