import { useCallback, useState } from 'react'
import type { LogEntry } from '../types'

export function useMenuLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const latestLog = logs[0]?.message ?? 'Menu log'

  const addLog = useCallback((source: string, item: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev =>
      [
        { id: Date.now(), message: `[${time}] ${source}: ${item}` },
        ...prev,
      ].slice(0, 14),
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
  const logPluginHost = useCallback(
    (item: string) => addLog('plugin host', item),
    [addLog],
  )
  const logSpatialPluginHost = useCallback(
    (item: string) => addLog('spatial plugin host', item),
    [addLog],
  )

  return {
    logs,
    latestLog,
    logMainFloating,
    logSpatialFlat,
    logSpatialChildFloating,
    logPluginHost,
    logSpatialPluginHost,
  }
}
