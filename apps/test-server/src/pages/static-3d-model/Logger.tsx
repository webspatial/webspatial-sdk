import { useCallback, useEffect, useRef, useState } from 'react'

export function useLogger(initialLog = []) {
  const [logs, setLogs] = useState<string[]>(initialLog)
  const logLine = useCallback(
    (...args: any[]) => {
      const msg = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ')
      setLogs(prev => prev.concat(msg))
    },
    [setLogs],
  )
  const clearLog = () => setLogs([])

  return [logs, logLine, clearLog] as const
}

export type LoggerProps = { logs: String[]; clearLog: () => void }
export function Logger({ logs, clearLog }: LoggerProps) {
  return (
    <>
      <section>
        <h2 className="m-0">Console</h2>
        <button onClick={clearLog}>Clear Log</button>
        <div className="mockup-code max-w-2xl not-prose">
          {logs.map(log => (
            <pre data-prefix="">
              <code>{log}</code>
            </pre>
          ))}
        </div>
      </section>
    </>
  )
}
