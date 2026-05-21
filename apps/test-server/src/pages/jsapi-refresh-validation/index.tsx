import { enableDebugTool } from '@webspatial/react-sdk'
import { CSSProperties, useEffect, useMemo, useState } from 'react'

enableDebugTool()

type SnapshotSummary = {
  cycle: number
  time: string
  seedChildCount: number
  childrenCount: number | null
  child2DCount: number | null
  spatialObjectCount: number | null
  currentPageGeneration: number | null
  childrenIds: string[]
  sceneSpatialObjectIds: string[]
  raw: any
}

type ValidationAPI = {
  inspect: () => Promise<SnapshotSummary | null>
  run: () => Promise<SnapshotSummary | null>
  clearHistory: () => void
}

declare global {
  interface Window {
    wsRefreshValidation?: ValidationAPI
    inspectCurrentSpatialScene?: () => Promise<any>
  }
}

const HISTORY_KEY = 'ws-refresh-validation-history'
const CYCLE_KEY = 'ws-refresh-validation-cycle'
const AUTO_RUN_KEY = 'ws-refresh-validation-auto-run'
const CHILD_COUNT_KEY = 'ws-refresh-validation-child-count'
const AUTO_SYNC_DELAY_MS = 800

let hasAutoRunForThisPageLoad = false

function delay(ms: number) {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function readHistory(): SnapshotSummary[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(history: SnapshotSummary[]) {
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-10)))
}

function nextCycle() {
  const previous = Number(sessionStorage.getItem(CYCLE_KEY) ?? '0')
  const next = previous + 1
  sessionStorage.setItem(CYCLE_KEY, String(next))
  return next
}

function readChildCount() {
  const parsed = Number(sessionStorage.getItem(CHILD_COUNT_KEY) ?? '2')
  if (!Number.isFinite(parsed)) {
    return 2
  }
  return Math.min(MAX_CHILDREN, Math.max(0, Math.trunc(parsed)))
}

function writeChildCount(count: number) {
  sessionStorage.setItem(CHILD_COUNT_KEY, String(count))
}

function snapshotKey(snapshot: SnapshotSummary) {
  return `${snapshot.cycle}-${snapshot.time}`
}

function childDelta(snapshot: SnapshotSummary) {
  if (snapshot.childrenCount === null) {
    return null
  }
  return snapshot.childrenCount - snapshot.seedChildCount
}

function toSummary(raw: any, cycle: number, seedChildCount: number): SnapshotSummary {
  const childrenMap =
    raw?.children && typeof raw.children === 'object' ? raw.children : null
  const childrenArray = Array.isArray(raw?.children) ? raw.children : null
  const childValues = childrenArray ?? Object.values(childrenMap ?? {})
  const childKeysFromMap = childrenMap ? Object.keys(childrenMap) : []
  const explicitChildrenIds = Array.isArray(raw?.childrenIds)
    ? raw.childrenIds.filter((value: unknown): value is string => typeof value === 'string')
    : []
  const childrenIds =
    explicitChildrenIds.length > 0
      ? explicitChildrenIds
      : childKeysFromMap.length > 0
        ? childKeysFromMap
        : childValues
            .map(
              (child: any) =>
                child?.id ?? child?.key ?? child?.name ?? child?.title ?? null,
            )
            .filter((value: unknown): value is string => typeof value === 'string')

  const typed2DChildren = childValues.filter((child: any) => {
    const type = String(child?.type ?? child?.kind ?? '')
    return (
      type.includes('Spatialized2DElement') ||
      type.includes('2DElement') ||
      type.includes('2D')
    )
  }).length
  // VisionOS inspect currently returns `children` as an object map and may omit
  // explicit type fields. In this validation page all attached children are 2D.
  const child2DCount =
    typed2DChildren > 0 ? typed2DChildren : childrenIds.length
  const sceneSpatialObjectIds = Array.isArray(raw?.sceneSpatialObjectIds)
    ? raw.sceneSpatialObjectIds.filter(
        (value: unknown): value is string => typeof value === 'string',
      )
    : []

  return {
    cycle,
    time: new Date().toLocaleTimeString(),
    seedChildCount,
    childrenCount: childrenIds.length,
    child2DCount,
    spatialObjectCount:
      typeof raw?.spatialObjectCount === 'number' ? raw.spatialObjectCount : null,
    currentPageGeneration:
      typeof raw?.currentPageGeneration === 'number'
        ? raw.currentPageGeneration
        : null,
    childrenIds,
    sceneSpatialObjectIds,
    raw,
  }
}

const parentStyle: CSSProperties = {
  position: 'relative',
  width: '220px',
  height: '220px',
  borderRadius: '18px',
  background:
    'linear-gradient(135deg, rgba(37,99,235,0.9), rgba(30,64,175,0.72))',
  color: 'white',
  padding: '14px',
  boxSizing: 'border-box',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)',
  '--xr-back': 35,
  transform: 'translate3d(40px, 20px, 0)',
} as CSSProperties

const MAX_CHILDREN = 6
const childPalette = [
  {
    left: '92px',
    top: '68px',
    width: '150px',
    height: '150px',
    borderRadius: '16px',
    background: 'rgba(15, 23, 42, 0.88)',
    color: 'white',
    padding: '12px',
    '--xr-back': 10,
  },
  {
    left: '68px',
    top: '28px',
    width: '100px',
    height: '100px',
    borderRadius: '14px',
    background: 'rgba(22, 163, 74, 0.92)',
    color: '#052e16',
    padding: '10px',
    '--xr-back': 16,
  },
  {
    left: '130px',
    top: '18px',
    width: '90px',
    height: '90px',
    borderRadius: '14px',
    background: 'rgba(249, 115, 22, 0.92)',
    color: '#431407',
    padding: '10px',
    '--xr-back': 22,
  },
  {
    left: '24px',
    top: '110px',
    width: '88px',
    height: '88px',
    borderRadius: '14px',
    background: 'rgba(168, 85, 247, 0.9)',
    color: '#f5f3ff',
    padding: '10px',
    '--xr-back': 26,
  },
  {
    left: '148px',
    top: '118px',
    width: '78px',
    height: '78px',
    borderRadius: '12px',
    background: 'rgba(14, 165, 233, 0.92)',
    color: '#082f49',
    padding: '8px',
    '--xr-back': 30,
  },
  {
    left: '14px',
    top: '14px',
    width: '74px',
    height: '74px',
    borderRadius: '12px',
    background: 'rgba(244, 63, 94, 0.92)',
    color: '#fff1f2',
    padding: '8px',
    '--xr-back': 34,
  },
] as const

function getChildStyle(index: number): CSSProperties {
  const preset = childPalette[index % childPalette.length]
  return {
    position: 'absolute',
    boxSizing: 'border-box',
    ...preset,
  } as CSSProperties
}

function IdList({
  ids,
  emptyLabel = '(empty)',
  className = '',
}: {
  ids: string[]
  emptyLabel?: string
  className?: string
}) {
  if (ids.length === 0) {
    return <div className="text-gray-500 text-xs">{emptyLabel}</div>
  }

  return (
    <ul
      className={`max-h-24 overflow-auto space-y-1 pr-1 text-xs text-gray-300 ${className}`.trim()}
    >
      {ids.map(id => (
        <li
          key={id}
          className="rounded bg-[#191919] border border-gray-800 px-2 py-1 break-all"
        >
          {id}
        </li>
      ))}
    </ul>
  )
}

function SnapshotDetails({
  snapshot,
  title,
  showRaw = true,
  subtitle,
}: {
  snapshot: SnapshotSummary | null
  title: string
  showRaw?: boolean
  subtitle?: string
}) {
  return (
    <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 min-h-0">
      <h2 className="text-xl font-medium mb-4">{title}</h2>
      {subtitle ? (
        <div className="text-sm text-gray-400 mb-4">{subtitle}</div>
      ) : null}
      {snapshot ? (
        <div className="space-y-4 text-sm min-h-0">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Cycle</div>
              <div>{snapshot.cycle}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Captured</div>
              <div>{snapshot.time}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Seed Children</div>
              <div>{snapshot.seedChildCount}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Generation</div>
              <div>{String(snapshot.currentPageGeneration)}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Objects</div>
              <div>{String(snapshot.spatialObjectCount)}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Children</div>
              <div>{String(snapshot.childrenCount)}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">2D Children</div>
              <div>{String(snapshot.child2DCount)}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800">
              <div className="text-gray-400 text-xs mb-1">Children Delta</div>
              <div>
                {childDelta(snapshot) ?? '(unknown)'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800 min-h-0">
              <div className="text-gray-400 text-xs mb-2">Children IDs</div>
              <IdList ids={snapshot.childrenIds} className="max-h-36" />
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-gray-800 min-h-0">
              <div className="text-gray-400 text-xs mb-2">
                Scene Spatial Object IDs
              </div>
              <IdList ids={snapshot.sceneSpatialObjectIds} className="max-h-36" />
            </div>
          </div>

          {showRaw ? (
            <details
              className="bg-[#111111] rounded-lg border border-gray-800"
              open
            >
              <summary className="cursor-pointer px-4 py-3 text-sm text-gray-300">
                Raw Inspect JSON
              </summary>
              <pre className="max-h-72 overflow-auto border-t border-gray-800 p-4 text-xs">
                {JSON.stringify(snapshot.raw, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : (
        <div className="text-gray-400">
          No snapshot yet. Use Seed + Inspect or reload the page.
        </div>
      )}
    </div>
  )
}

function RefreshValidationSeed({ childCount }: { childCount: number }) {
  return (
    <div className="pointer-events-none select-none">
      <div enable-xr style={parentStyle}>
        <div className="text-xs uppercase tracking-wide text-blue-100/80">
          Parent Spatial Div
        </div>
        <div className="mt-2 text-sm font-medium">React + enable-xr seed</div>
        <div className="mt-2 text-xs text-blue-100/80">
          Reload to verify the scene does not accumulate stale 2D elements.
        </div>

        {Array.from({ length: childCount }, (_, index) => (
          <div key={`seed-child-${index}`} enable-xr style={getChildStyle(index)}>
            <div className="text-[11px] uppercase tracking-wide">
              Child {index + 1}
            </div>
            <div className="mt-1 text-[11px] leading-4">
              Declarative overlay {index + 1}.
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SpatialDivRefreshValidation() {
  const [history, setHistory] = useState<SnapshotSummary[]>(() => readHistory())
  const [current, setCurrent] = useState<SnapshotSummary | null>(null)
  const [status, setStatus] = useState('Idle')
  const [busy, setBusy] = useState(false)
  const [seedRevision, setSeedRevision] = useState(0)
  const [childCount, setChildCount] = useState(() => readChildCount())
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<string | null>(null)

  const cycleCount = useMemo(
    () => Number(sessionStorage.getItem(CYCLE_KEY) ?? '0'),
    [history.length, current?.cycle],
  )
  const selectedSnapshot =
    history.find(item => snapshotKey(item) === selectedHistoryKey) ?? current

  async function inspectOnly() {
    const cycle = Number(sessionStorage.getItem(CYCLE_KEY) ?? '0')
    const raw = await window.inspectCurrentSpatialScene?.()
    if (!raw) {
      return null
    }
    const summary = toSummary(raw, cycle, childCount)
    setCurrent(summary)
    return summary
  }

  async function syncCurrentSnapshot(nextChildCount = childCount) {
    const raw = await window.inspectCurrentSpatialScene?.()
    if (!raw) {
      return null
    }
    const cycle = Number(sessionStorage.getItem(CYCLE_KEY) ?? '0')
    const summary = toSummary(raw, cycle, nextChildCount)
    setCurrent(summary)
    return summary
  }

  async function runScenario() {
    setBusy(true)
    const cycle = nextCycle()
    setStatus(`Cycle ${cycle}: rendering declarative spatial divs`)
    setSeedRevision(previous => previous + 1)
    // Give the runtime a moment to create and attach the React-driven SpatialDivs.
    await delay(1200)
    setStatus(`Cycle ${cycle}: inspecting scene`)
    const raw = await window.inspectCurrentSpatialScene?.()
    if (!raw) {
      setStatus(`Cycle ${cycle}: inspect returned empty result`)
      setBusy(false)
      return null
    }
    const summary = toSummary(raw, cycle, childCount)
    const nextHistory = [...readHistory(), summary]
    writeHistory(nextHistory)
    setHistory(nextHistory)
    setCurrent(summary)
    setSelectedHistoryKey(snapshotKey(summary))
    setStatus(`Cycle ${cycle}: captured scene snapshot`)
    setBusy(false)
    return summary
  }

  function clearHistory() {
    sessionStorage.removeItem(HISTORY_KEY)
    sessionStorage.removeItem(CYCLE_KEY)
    sessionStorage.removeItem(AUTO_RUN_KEY)
    setHistory([])
    setCurrent(null)
    setSelectedHistoryKey(null)
    setStatus('Cleared session history')
  }

  function updateChildCount(nextCount: number) {
    const normalized = Math.min(MAX_CHILDREN, Math.max(0, Math.trunc(nextCount)))
    writeChildCount(normalized)
    setChildCount(normalized)
  }

  useEffect(() => {
    window.wsRefreshValidation = {
      inspect: inspectOnly,
      run: runScenario,
      clearHistory,
    }
    return () => {
      delete window.wsRefreshValidation
    }
  }, [])

  useEffect(() => {
    if (selectedHistoryKey) {
      const hasSelected = history.some(item => snapshotKey(item) === selectedHistoryKey)
      if (hasSelected) {
        return
      }
    }
    const latest = history.at(-1)
    setSelectedHistoryKey(latest ? snapshotKey(latest) : null)
  }, [history, selectedHistoryKey])

  useEffect(() => {
    if (hasAutoRunForThisPageLoad) {
      return
    }
    hasAutoRunForThisPageLoad = true
    sessionStorage.setItem(AUTO_RUN_KEY, '1')
    runScenario().catch(error => {
      console.error('JSAPI refresh validation failed', error)
      setStatus(`Auto run failed: ${String(error)}`)
      setBusy(false)
    })
  }, [])

  useEffect(() => {
    if (busy) {
      return
    }

    const timer = window.setTimeout(() => {
      syncCurrentSnapshot(childCount).catch(error => {
        console.error('Failed to sync current snapshot', error)
        setStatus(`Current snapshot sync failed: ${String(error)}`)
      })
    }, AUTO_SYNC_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [childCount, busy])

  return (
    <div className="p-10 text-white min-h-full space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-3">
          Spatial Div Refresh Validation
        </h1>
        <p className="text-gray-300 max-w-4xl">
          This page renders one parent and a configurable set of nested child
          spatial divs with
          {' `enable-xr` '}
          only, waits for React-driven creation to settle, then records a scene
          snapshot. Refresh the page several times and compare cycle history to
          see whether scene state drifts upward.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-stretch">
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-medium mb-4">Declarative Seed</h2>
          <div className="rounded-xl border border-dashed border-gray-700 bg-[#111111] p-4 min-h-[280px] overflow-hidden">
            <RefreshValidationSeed key={`${seedRevision}-${childCount}`} childCount={childCount} />
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 space-y-4">
          <h2 className="text-xl font-medium">Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                runScenario()
              }}
            >
              Seed + Inspect
            </button>
            <button
              className="px-4 py-2 bg-indigo-700 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              disabled={busy || childCount >= MAX_CHILDREN}
              onClick={() => {
                updateChildCount(childCount + 1)
                setStatus('Added one declarative child')
              }}
            >
              Add Child
            </button>
            <button
              className="px-4 py-2 bg-amber-700 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              disabled={busy || childCount <= 0}
              onClick={() => {
                updateChildCount(childCount - 1)
                setStatus('Removed one declarative child')
              }}
            >
              Remove Child
            </button>
            <button
              className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                inspectOnly()
              }}
            >
              Inspect Only
            </button>
            <button
              className="px-4 py-2 bg-emerald-700 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                window.location.reload()
              }}
            >
              Reload Page
            </button>
            <button
              className="px-4 py-2 bg-rose-700 rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
              disabled={busy}
              onClick={clearHistory}
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-[#111111] p-4 border border-gray-800">
              <div className="text-gray-400 mb-1">Status</div>
              <div>{busy ? 'Running...' : status}</div>
            </div>
            <div className="rounded-lg bg-[#111111] p-4 border border-gray-800">
              <div className="text-gray-400 mb-1">Session Cycles</div>
              <div>{cycleCount}</div>
            </div>
            <div className="rounded-lg bg-[#111111] p-4 border border-gray-800">
              <div className="text-gray-400 mb-1">Current Child Count</div>
              <div>{childCount}</div>
            </div>
            <div className="rounded-lg bg-[#111111] p-4 border border-gray-800">
              <div className="text-gray-400 mb-1">Child Count Range</div>
              <div>0 - {MAX_CHILDREN}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-stretch">
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 h-[780px] flex flex-col min-h-0">
          <h2 className="text-xl font-medium mb-2">Cycle History</h2>
          <div className="text-sm text-gray-400 mb-4">
            History stores full snapshots, including the raw inspect payload. Select
            any cycle to inspect it on the right.
          </div>
          {history.length > 0 ? (
            <div className="space-y-2 overflow-auto pr-1 min-h-0">
              {history
                .slice()
                .reverse()
                .map(item => {
                  const isSelected = snapshotKey(item) === selectedHistoryKey
                  return (
                    <button
                      key={snapshotKey(item)}
                      type="button"
                      className={`w-full text-left bg-[#111111] p-3 rounded-lg border text-xs space-y-2 transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-[#151d2f]'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedHistoryKey(snapshotKey(item))
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-sm">
                          Cycle {item.cycle}
                        </div>
                        <div className="text-gray-400">{item.time}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-300">
                        <div>Seed: {item.seedChildCount}</div>
                        <div>Gen: {String(item.currentPageGeneration)}</div>
                        <div>Children: {String(item.childrenCount)}</div>
                        <div>2D: {String(item.child2DCount)}</div>
                        <div>Objects: {String(item.spatialObjectCount)}</div>
                        <div>
                          Diff:{' '}
                          {item.childrenCount === null
                            ? '(unknown)'
                            : item.childrenCount - item.seedChildCount}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          ) : (
            <div className="text-gray-400">
              History is empty. Reload the page a few times to accumulate cycles.
            </div>
          )}
        </div>

        <div className="h-[780px] flex flex-col gap-6 min-h-0">
          <div className="shrink-0">
            <SnapshotDetails
              snapshot={current}
              title="Current Snapshot"
              showRaw={false}
              subtitle="Auto-syncs after Add Child / Remove Child / page reload to reflect the current declarative tree."
            />
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <SnapshotDetails
              snapshot={selectedSnapshot}
              title="Selected Snapshot Detail"
              subtitle="History stores full snapshots. Pick any cycle on the left to inspect its full payload."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
