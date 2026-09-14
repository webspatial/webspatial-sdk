/* eslint-disable react-refresh/only-export-components */
import {
  enableDebugTool,
  type SpatialContentReadyCallback,
  type SpatialDragEndEvent,
  type SpatialDragStartEvent,
  type SpatialTapEvent,
} from '@webspatial/react-sdk'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './lab.css'
import { spatialDivRoutes } from './routes'

enableDebugTool()

// ---------- Spatial panel: identical markup with/without enable-xr ----------
type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  xr: boolean
  back?: number | null // null = omit inline --xr-back so a stylesheet rule can own it
  depth?: number
  zi?: number
  children?: ReactNode
  onSpatialTap?: (event: SpatialTapEvent) => void
  onSpatialDragStart?: (event: SpatialDragStartEvent) => void
  onSpatialDragEnd?: (event: SpatialDragEndEvent) => void
  onSpatialContentReady?: SpatialContentReadyCallback
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  function Panel(
    { xr, back = 80, depth, zi, className = '', style, children, ...rest },
    ref,
  ) {
    const s = {
      ...style,
      ...(back != null ? { '--xr-back': back } : {}),
      ...(depth != null ? { '--xr-depth': depth } : {}),
      ...(zi != null ? { '--xr-z-index': zi } : {}),
    } as React.CSSProperties
    const xrAttr = xr ? { 'enable-xr': true } : {}
    return (
      <div
        ref={ref}
        {...xrAttr}
        className={`panel ${className}`}
        style={s}
        {...rest}
      >
        {children}
      </div>
    )
  },
)

// ---------- Fixture pair: plain DOM vs enable-xr ----------
export function Pair({
  render,
  height = 280,
}: {
  render: (xr: boolean) => ReactNode
  height?: number
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {[false, true].map(xr => (
        <div key={String(xr)}>
          <div className="text-xs text-gray-500 mb-2">
            {xr ? 'enable-xr' : 'plain DOM (CSS reference)'}
          </div>
          <div
            className="lab-fixture rounded-xl border border-gray-800 bg-[#0e1017] p-4 overflow-visible"
            style={{ minHeight: height }}
          >
            {render(xr)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- Scenario chrome ----------
const CssLogCtx = React.createContext<
  ((control: string, css: string) => void) | null
>(null)

function labelOf(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) return children.map(labelOf).join('')
  return 'control'
}

function CssBlock({ title, text }: { title: string; text: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-cyan-400">{title}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-cyan-900/40 bg-[#0a0b10] p-3 text-xs text-cyan-100">
        {text}
      </pre>
    </div>
  )
}

export function Scenario({
  title,
  expect,
  watch,
  controls,
  css,
  readout,
  children,
}: {
  title: string
  expect: string
  watch: string
  controls?: ReactNode
  css?: string
  readout?: ReactNode
  children: ReactNode
}) {
  const [clicks, setClicks] = useState<string[]>([])
  const logCss = useCallback((control: string, rule: string) => {
    setClicks(l => [`${control}\n  ${rule}`, ...l].slice(0, 12))
  }, [])

  return (
    <div className="text-gray-200">
      <h2 className="text-xl mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="rounded-lg bg-[#132a1c] p-3">
          <span className="text-green-400">Expect (CSS): </span>
          {expect}
        </div>
        <div className="rounded-lg bg-[#2a1a13] p-3">
          <span className="text-orange-400">Watch for (Hybrid): </span>
          {watch}
        </div>
      </div>
      <CssLogCtx.Provider value={logCss}>
        {controls && (
          <div className="flex flex-wrap gap-2 mb-4">{controls}</div>
        )}
        {children}
      </CssLogCtx.Provider>
      <div className="mt-4 space-y-3">
        {css ? <CssBlock title="CSS under test (live)" text={css} /> : null}
        {clicks.length > 0 ? (
          <CssBlock
            title="Control log — what that click changed"
            text={clicks.join('\n\n')}
          />
        ) : null}
        {readout ? (
          <div>
            <div className="mb-1 text-xs font-semibold text-gray-500">
              Event / geometry log
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-[#0a0b10] p-3 text-xs text-gray-400">
              {readout}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Btn({
  on,
  hint,
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  on?: boolean
  hint?: string
}) {
  const logCss = React.useContext(CssLogCtx)
  return (
    <button
      {...rest}
      title={hint}
      onClick={e => {
        onClick?.(e)
        if (hint && logCss) logCss(labelOf(children), hint)
      }}
      className={`px-3 py-1.5 rounded-md text-sm border ${on ? 'bg-blue-700 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
    >
      {children}
    </button>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  hint?: string
}) {
  const logCss = React.useContext(CssLogCtx)
  return (
    <label
      className="flex items-center gap-2 text-sm text-gray-300"
      title={hint}
    >
      {label}{' '}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => {
          const next = Number(e.target.value)
          onChange(next)
          if (hint && logCss) logCss(label, hint)
        }}
      />{' '}
      <span className="w-10 tabular-nums">{value}</span>
    </label>
  )
}

// ---------- Hooks ----------
export function useLog(max = 14) {
  const [lines, setLines] = useState<string[]>([])
  const log = useCallback(
    (s: string) => {
      setLines(l =>
        [`${performance.now().toFixed(0).padStart(6)}ms  ${s}`, ...l].slice(
          0,
          max,
        ),
      )
    },
    [max],
  )
  return [lines.join('\n'), log, () => setLines([])] as const
}

export function SpatialDivPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#07080c] p-8 text-gray-100">
      <Link
        to="/spatial-div"
        className="mb-4 inline-flex text-sm text-blue-400 hover:text-blue-300"
      >
        Back to Spatial Div
      </Link>
      {children}
    </div>
  )
}

export function SpatialDivOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {spatialDivRoutes.map(route => (
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

export function useRect(ref: React.RefObject<HTMLElement | null>, live = true) {
  const [rect, setRect] = useState('')
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = ref.current?.getBoundingClientRect()
      if (r)
        setRect(
          `x=${r.x.toFixed(1)} y=${r.y.toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)}`,
        )
      if (live) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [ref, live])
  return rect
}
