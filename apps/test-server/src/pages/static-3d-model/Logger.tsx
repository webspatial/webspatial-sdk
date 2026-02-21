import { useEffect, useRef, useState } from 'react'

export function useLogger(initialLog = '') {
  const [logs, setLogs] = useState(initialLog)
  const logLine = (...args: any[]) => {
    const msg = args
      .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ')
    setLogs(prev => (prev ? prev + '\n' : '') + msg)
  }
  const clearLog = () => setLogs('')

  return [logs, logLine, clearLog] as const
}

export type LoggerProps = { logs: String; clearLog: () => void }
export function Logger({ logs, clearLog }: LoggerProps) {
  return (
    <section>
      <h2>Console</h2>
      <button onClick={clearLog}>Clear Log</button>
      <pre>{logs}</pre>
    </section>
  )
}
