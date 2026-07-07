import type { LogEntry } from '../types'
import { logPanelStyle } from '../pageStyles'

export function MenuLogPanel({
  logs,
  latestLog,
}: {
  logs: LogEntry[]
  latestLog: string
}) {
  return (
    <pre style={logPanelStyle}>
      {logs.length ? logs.map(log => log.message).join('\n') : latestLog}
    </pre>
  )
}
