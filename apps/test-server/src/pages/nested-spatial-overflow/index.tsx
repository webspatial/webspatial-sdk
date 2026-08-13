import { CSSProperties, useState } from 'react'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

const PARENT_W = 240
const PARENT_H = 180
const CHILD_LARGE_W = 360
const CHILD_LARGE_H = 260
const CHILD_SMALL_W = 160
const CHILD_SMALL_H = 100

function BoundsLabel({
  title,
  w,
  h,
  color,
}: {
  title: string
  w: number
  h: number
  color: string
}) {
  return (
    <div
      className="text-[11px] font-mono px-2 py-1 border-b shrink-0"
      style={{ color, borderColor: `${color}40` }}
    >
      {title} · {w}×{h}px
    </div>
  )
}

function CornerMarkers({ color }: { color: string }) {
  const corner: CSSProperties = {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: color,
    pointerEvents: 'none',
  }
  return (
    <>
      <span
        style={{
          ...corner,
          top: 0,
          left: 0,
          borderTop: `2px solid ${color}`,
          borderLeft: `2px solid ${color}`,
        }}
      />
      <span
        style={{
          ...corner,
          top: 0,
          right: 0,
          borderTop: `2px solid ${color}`,
          borderRight: `2px solid ${color}`,
        }}
      />
      <span
        style={{
          ...corner,
          bottom: 0,
          left: 0,
          borderBottom: `2px solid ${color}`,
          borderLeft: `2px solid ${color}`,
        }}
      />
      <span
        style={{
          ...corner,
          bottom: 0,
          right: 0,
          borderBottom: `2px solid ${color}`,
          borderRight: `2px solid ${color}`,
        }}
      />
    </>
  )
}

function PanelContent({
  headline,
  body,
  accent,
}: {
  headline: string
  body: string
  accent: string
}) {
  return (
    <div
      className="flex-1 p-3 text-sm leading-relaxed"
      style={{ color: accent }}
    >
      <p className="font-semibold mb-1">{headline}</p>
      <p className="text-xs opacity-80">{body}</p>
    </div>
  )
}

export default function NestedSpatialOverflowDemo() {
  const [childLarge, setChildLarge] = useState(true)
  const [parentOverflowHidden, setParentOverflowHidden] = useState(false)

  const childW = childLarge ? CHILD_LARGE_W : CHILD_SMALL_W
  const childH = childLarge ? CHILD_LARGE_H : CHILD_SMALL_H

  const parentStyle: CSSProperties = {
    width: PARENT_W,
    height: PARENT_H,
    '--xr-background-material': 'thin',
    '--xr-back': 80,
    position: 'relative',
    overflow: parentOverflowHidden ? 'hidden' : 'visible',
    border: '2px dashed #60a5fa',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
  }

  const childStyle: CSSProperties = {
    width: childW,
    height: childH,
    margin: 'auto',
    '--xr-background-material': 'thin',
    '--xr-back': 40,
    position: 'relative',
    border: '2px solid #34d399',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  }

  return (
    <div className="min-h-screen p-6 text-white bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Nested SpatialDiv Overflow</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Parent SpatialDiv is {PARENT_W}×{PARENT_H}px. Child is{' '}
            {childLarge ? 'larger' : 'smaller'} ({childW}×{childH}px). In
            WebSpatial, nested child SpatialDivs render as separate native
            webview layers — parent{' '}
            <code className="text-emerald-300">overflow: hidden</code> does not
            clip the child spatial panel.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
            onClick={() => setChildLarge(v => !v)}
          >
            Toggle child size ({childLarge ? 'large → small' : 'small → large'})
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium"
            onClick={() => setParentOverflowHidden(v => !v)}
          >
            Parent overflow: {parentOverflowHidden ? 'hidden' : 'visible'}
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111] p-6 flex flex-col items-center gap-4">
          <p className="text-xs text-gray-500 self-start">
            Blue dashed = parent bounds · Green solid = child bounds
          </p>

          <div enable-xr style={parentStyle} data-name="overflow-parent">
            <BoundsLabel
              title="Parent SpatialDiv"
              w={PARENT_W}
              h={PARENT_H}
              color="#93c5fd"
            />
            <CornerMarkers color="#60a5fa" />

            <div className="relative flex-1 flex items-center justify-center p-2 min-h-0">
              <div enable-xr style={childStyle} data-name="overflow-child">
                <BoundsLabel
                  title="Child SpatialDiv"
                  w={childW}
                  h={childH}
                  color="#6ee7b7"
                />
                <PanelContent
                  accent="#a7f3d0"
                  headline={
                    childLarge
                      ? 'Child is larger than parent'
                      : 'Child fits inside parent'
                  }
                  body={
                    childLarge
                      ? 'Look for green panel extending past blue dashed corners. Child should NOT be clipped.'
                      : 'Green panel should stay fully inside the blue dashed box.'
                  }
                />
              </div>
            </div>
          </div>

          <ul className="text-xs text-gray-400 space-y-1 self-start list-disc pl-5">
            <li>
              Parent overflow CSS:{' '}
              <span className="text-white font-mono">
                {parentOverflowHidden ? 'hidden' : 'visible'}
              </span>
            </li>
            <li>
              Expected (spatial): child webview renders at full {childW}×
              {childH}
              px regardless of parent overflow
            </li>
            <li>
              Open in visionOS simulator — the 2D browser tab only shows hidden
              host placeholders
            </li>
          </ul>
        </div>

        <section className="rounded-xl border border-white/10 bg-[#111] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">
            Reference: plain HTML (no enable-xr)
          </h2>
          <p className="text-xs text-gray-500">
            Same sizes, but regular divs in the host page. Parent
            overflow:hidden clips the inner div here — contrast with SpatialDiv
            above.
          </p>
          <div
            className="mx-auto relative"
            style={{
              width: PARENT_W,
              height: PARENT_H,
              overflow: parentOverflowHidden ? 'hidden' : 'visible',
              border: '2px dashed #f472b6',
              borderRadius: 12,
              backgroundColor: 'rgba(244, 114, 182, 0.08)',
            }}
          >
            <CornerMarkers color="#f472b6" />
            <div
              style={{
                width: childW,
                height: childH,
                margin: 'auto',
                marginTop: 28,
                border: '2px solid #fb7185',
                borderRadius: 10,
                backgroundColor: 'rgba(251, 113, 133, 0.2)',
                fontSize: 11,
                padding: 8,
                color: '#fecdd3',
              }}
            >
              Plain div {childW}×{childH}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
