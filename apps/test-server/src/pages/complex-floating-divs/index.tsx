import { type BackgroundMaterialType } from '@webspatial/core-sdk'
import { enableDebugTool } from '@webspatial/react-sdk'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'

enableDebugTool()

type PanelConfig = {
  id: string
  title: string
  material: BackgroundMaterialType
  back: number
  depth: number
  tone: string
  transform: string
  detail: string
}

const panels: PanelConfig[] = [
  {
    id: 'metrics',
    title: 'Metrics Stack',
    material: 'thin',
    back: 90,
    depth: 48,
    tone: '#155e75',
    transform: 'rotateY(-8deg)',
    detail: 'Nested stats, toolbar, and child actions.',
  },
  {
    id: 'controls',
    title: 'Control Cluster',
    material: 'regular',
    back: 145,
    depth: 72,
    tone: '#5b21b6',
    transform: 'translateY(18px) rotateX(7deg)',
    detail: 'Offset controls with layered child content.',
  },
  {
    id: 'activity',
    title: 'Activity Rail',
    material: 'translucent',
    back: 210,
    depth: 96,
    tone: '#9f1239',
    transform: 'translateY(-12px) rotateZ(-3deg)',
    detail: 'Overflowing rows and interactive nested items.',
  },
  {
    id: 'summary',
    title: 'Summary Dock',
    material: 'thick',
    back: 120,
    depth: 64,
    tone: '#365314',
    transform: 'translateX(12px) rotateY(9deg)',
    detail: 'Wide content with layered child cards.',
  },
]

const buttonBaseClass =
  'rounded-md border border-white/25 bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25 active:bg-white/35'

function getSpatialStyle(panel: PanelConfig, isActive: boolean): CSSProperties {
  return {
    '--xr-back': isActive ? panel.back + 50 : panel.back,
    '--xr-depth': panel.depth,
    '--xr-background-material': panel.material,
    backgroundColor: panel.tone,
    transform: panel.transform,
  } as CSSProperties
}

function ComplexFloatingDivs() {
  const [activePanel, setActivePanel] = useState(panels[0].id)
  const [pressCount, setPressCount] = useState<Record<string, number>>({})
  const [showNested, setShowNested] = useState(true)

  useEffect(() => {
    document.documentElement.style.setProperty('--spa-bg-color', 'transparent')
    return () => {
      document.documentElement.style.removeProperty('--spa-bg-color')
    }
  }, [])

  const totalPresses = useMemo(
    () => Object.values(pressCount).reduce((sum, count) => sum + count, 0),
    [pressCount],
  )

  const recordPress = (id: string) => {
    setPressCount(current => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }))
  }

  return (
    <div className="min-h-full overflow-visible p-8 text-white">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Complex Floating Divs</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Multiple lifted spatial divs with nested layouts, transforms,
            overflow, and buttons inside every spatial host.
          </p>
        </div>

        <div
          enable-xr
          style={
            {
              '--xr-back': 80,
              '--xr-depth': 36,
              '--xr-background-material': 'thin',
            } as CSSProperties
          }
          className="min-w-[220px] rounded-lg border border-white/15 bg-slate-900/80 p-4"
        >
          <div className="text-xs uppercase text-cyan-200">
            Total button presses
          </div>
          <div className="mt-1 text-3xl font-semibold">{totalPresses}</div>
          <button
            type="button"
            className={`${buttonBaseClass} mt-3 w-full`}
            onClick={() => {
              setPressCount({})
              setActivePanel(panels[0].id)
            }}
          >
            Reset counters
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {panels.map(panel => (
          <button
            key={panel.id}
            type="button"
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              activePanel === panel.id
                ? 'border-cyan-300 bg-cyan-500/30 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800'
            }`}
            onClick={() => setActivePanel(panel.id)}
          >
            {panel.title}
          </button>
        ))}
        <button
          type="button"
          className="rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
          onClick={() => setShowNested(value => !value)}
        >
          {showNested ? 'Hide nested divs' : 'Show nested divs'}
        </button>
      </div>

      <div className="grid min-h-[620px] grid-cols-1 gap-8 overflow-visible min-[1000px]:grid-cols-2">
        {panels.map((panel, panelIndex) => {
          const isActive = activePanel === panel.id
          const spatialStyle = getSpatialStyle(panel, isActive)

          return (
            <div
              key={panel.id}
              className="grid items-start gap-4 overflow-visible min-[1000px]:grid-cols-[minmax(0,1fr)_150px]"
            >
              <div
                enable-xr
                style={spatialStyle}
                className={`relative overflow-visible rounded-lg border p-5 shadow-2xl transition-all ${
                  isActive
                    ? 'border-cyan-200/70 ring-2 ring-cyan-200/40'
                    : 'border-white/15'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase text-white/70">
                      {panel.material} material
                    </div>
                    <h2 className="mt-1 text-xl font-semibold">
                      {panel.title}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-white/75">
                      {panel.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={buttonBaseClass}
                    onClick={() => {
                      recordPress(`${panel.id}-primary`)
                      setActivePanel(panel.id)
                    }}
                  >
                    Lift panel
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {['Back', 'Depth', 'Presses'].map((label, metricIndex) => (
                    <div
                      key={label}
                      className="rounded-md border border-white/10 bg-black/20 p-3"
                    >
                      <div className="text-xs text-white/60">{label}</div>
                      <div className="mt-1 text-lg font-semibold">
                        {metricIndex === 0
                          ? `${panel.back}px`
                          : metricIndex === 1
                            ? `${panel.depth}px`
                            : (pressCount[`${panel.id}-primary`] ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>

                {showNested && (
                  <div className="mt-5 rounded-lg border border-white/15 bg-black/25 p-4">
                    <div className="flex flex-col items-stretch gap-3">
                      <span className="text-sm font-medium">
                        Nested content
                      </span>
                      <button
                        type="button"
                        className={`${buttonBaseClass} w-[160px]`}
                        onClick={() => recordPress(`${panel.id}-nested`)}
                      >
                        Nested action
                      </button>
                    </div>
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {[0, 1, 2, 3].map(item => (
                        <div
                          key={item}
                          className="min-w-[120px] rounded-md border border-white/10 bg-white/10 p-3"
                        >
                          <div className="text-xs text-white/60">
                            Item {item + 1}
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-white/20">
                            <div
                              className="h-2 rounded-full bg-cyan-300"
                              style={{ width: `${35 + item * 15}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {showNested && (
                <div
                  enable-xr
                  style={
                    {
                      '--xr-back': 58 + panelIndex * 10,
                      '--xr-depth': 40,
                      '--xr-background-material': 'regular',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      transform: 'translateY(-10px) rotateZ(2deg)',
                    } as CSSProperties
                  }
                  className="rounded-lg border border-white/15 p-4 shadow-xl"
                >
                  <div className="text-xs text-white/60">Floating badge</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {(pressCount[`${panel.id}-nested`] ?? 0) +
                      (pressCount[`${panel.id}-badge`] ?? 0)}
                  </div>
                  <button
                    type="button"
                    className={`${buttonBaseClass} mt-3 w-full`}
                    onClick={() => recordPress(`${panel.id}-badge`)}
                  >
                    Badge tap
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ComplexFloatingDivs
