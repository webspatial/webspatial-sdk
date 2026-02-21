import React, { useState, useEffect, useRef, useCallback } from 'react'

/**
 * proper hook to manage logs
 * @returns { logs, logLine, clearLogs }
 */
export function useLog() {
  const [logs, setLogs] = useState<string>('')

  const logLine = useCallback((...args: any[]) => {
    const msg = args
      .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ')
    setLogs(prev => (prev ? prev + '\n' : '') + msg)
  }, [])

  const clearLogs = useCallback(() => {
    setLogs('')
  }, [])

  return { logs, logLine, clearLogs }
}

interface LogViewerProps {
  logs: string
  onClear?: () => void
  className?: string
}

/**
 * A simple log viewer component that auto-scrolls to the bottom.
 */
export function LogViewer({ logs, onClear, className = '' }: LogViewerProps) {
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const el = logRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [logs])

  return (
    <div
      className={`bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 flex flex-col h-[500px] ${className}`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-400 font-bold">Log</div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <pre
        ref={logRef}
        className="flex-1 overflow-y-auto text-xs font-mono bg-black/40 p-4 rounded-lg whitespace-pre-wrap break-words"
      >
        {logs}
      </pre>
    </div>
  )
}
