import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { enableDebugTool } from '@webspatial/react-sdk'
import { spatialDivAnimationRoutes } from './routes'

enableDebugTool()

export const btnCls =
  'select-none px-4 py-2 text-sm font-semibold rounded-lg border border-gray-600 text-gray-200 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors'

export const btnPrimary =
  'select-none px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-colors'

/** Format a possibly-undefined number with fixed precision. */
export function fmtNum(n: number | undefined, digits = 2): string {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : '-'
}

/** Pretty-print whitelisted SpatialDiv animated values for log lines. */
export function fmtValues(values: Record<string, unknown> | undefined): string {
  if (!values) return '-'
  const parts: string[] = []
  const tx = values['transform.translate.x'] as number | undefined
  const ty = values['transform.translate.y'] as number | undefined
  const tz = values['transform.translate.z'] as number | undefined
  if (tx !== undefined || ty !== undefined || tz !== undefined) {
    parts.push(`t=(${fmtNum(tx, 1)}, ${fmtNum(ty, 1)}, ${fmtNum(tz, 1)})`)
  }
  const rx = values['transform.rotate.x'] as number | undefined
  const ry = values['transform.rotate.y'] as number | undefined
  const rz = values['transform.rotate.z'] as number | undefined
  if (rx !== undefined || ry !== undefined || rz !== undefined) {
    parts.push(`r=(${fmtNum(rx, 1)}, ${fmtNum(ry, 1)}, ${fmtNum(rz, 1)})`)
  }
  const sx = values['transform.scale.x'] as number | undefined
  const sy = values['transform.scale.y'] as number | undefined
  const sz = values['transform.scale.z'] as number | undefined
  if (sx !== undefined || sy !== undefined || sz !== undefined) {
    parts.push(`s=(${fmtNum(sx, 2)}, ${fmtNum(sy, 2)}, ${fmtNum(sz, 2)})`)
  }
  const opacity = values['opacity'] as number | undefined
  if (opacity !== undefined) {
    parts.push(`o=${fmtNum(opacity, 2)}`)
  }
  return parts.length ? parts.join(' ') : '-'
}

export function Log({ lines }: { lines: string[] }) {
  return (
    <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-black/40 border border-gray-800 p-3 text-xs font-mono text-gray-400">
      {lines.length === 0 && (
        <span className="text-gray-600">No events yet</span>
      )}
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  )
}

export function useLog() {
  const [lines, setLines] = useState<string[]>([])
  const log = useCallback(
    (msg: string) =>
      setLines(prev => [
        ...prev.slice(-99),
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ]),
    [],
  )
  const clear = useCallback(() => setLines([]), [])
  return { lines, log, clear }
}

export function PlayStateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-700 text-gray-300',
    queued: 'bg-yellow-900 text-yellow-300',
    running: 'bg-green-900 text-green-300',
    paused: 'bg-orange-900 text-orange-300',
    finished: 'bg-blue-900 text-blue-300',
  }
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        colors[state] ?? 'bg-gray-700 text-gray-300'
      }`}
    >
      {state}
    </span>
  )
}

export function SpatialDivAnimationPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-full bg-[#0d0d0d] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="space-y-2">
            <Link
              to="/spatial-div-animation"
              className="inline-flex text-sm text-blue-400 hover:text-blue-300"
            >
              Back to SpatialDiv Animation
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <div className="mt-2 max-w-3xl text-sm text-gray-400">
                {description}
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SpatialDivAnimationOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {spatialDivAnimationRoutes.map(route => (
        <Link
          key={route.path}
          to={route.path}
          className="rounded-2xl border border-gray-800 bg-[#111] p-5 transition-colors hover:border-blue-700 hover:bg-[#141414]"
        >
          <div className="text-lg font-semibold text-gray-100">
            {route.label}
          </div>
          <p className="mt-2 text-sm text-gray-400">{route.description}</p>
        </Link>
      ))}
    </div>
  )
}
