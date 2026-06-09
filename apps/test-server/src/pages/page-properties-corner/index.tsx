import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  AttachmentAsset,
  AttachmentEntity,
  BoxEntity,
  Entity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'

type Direction = 'ltr' | 'rtl'

type LogicalCorners = {
  topLeading: number
  topTrailing: number
  bottomLeading: number
  bottomTrailing: number
}

type SpatialStyle = CSSProperties & {
  '--xr-back'?: number | string
  '--xr-depth'?: number | string
}

const HOST_PRESETS: Record<string, LogicalCorners> = {
  balanced: {
    topLeading: 32,
    topTrailing: 32,
    bottomLeading: 32,
    bottomTrailing: 32,
  },
  asymmetric: {
    topLeading: 56,
    topTrailing: 18,
    bottomLeading: 12,
    bottomTrailing: 42,
  },
  tight: {
    topLeading: 10,
    topTrailing: 10,
    bottomLeading: 10,
    bottomTrailing: 10,
  },
}

const SPATIAL_PRESETS: Record<string, LogicalCorners> = {
  matched: HOST_PRESETS.asymmetric,
  card: {
    topLeading: 24,
    topTrailing: 24,
    bottomLeading: 12,
    bottomTrailing: 12,
  },
  capsule: {
    topLeading: 48,
    topTrailing: 48,
    bottomLeading: 48,
    bottomTrailing: 48,
  },
}

const ATTACHMENT_PRESETS: Record<string, LogicalCorners> = {
  matched: SPATIAL_PRESETS.card,
  panel: {
    topLeading: 28,
    topTrailing: 42,
    bottomLeading: 16,
    bottomTrailing: 28,
  },
  sharp: {
    topLeading: 0,
    topTrailing: 0,
    bottomLeading: 0,
    bottomTrailing: 0,
  },
}

const CORNER_FIELDS: Array<{
  key: keyof LogicalCorners
  label: string
}> = [
  { key: 'topLeading', label: 'Top leading' },
  { key: 'topTrailing', label: 'Top trailing' },
  { key: 'bottomLeading', label: 'Bottom leading' },
  { key: 'bottomTrailing', label: 'Bottom trailing' },
]

function toPhysicalCorners(logical: LogicalCorners, direction: Direction) {
  if (direction === 'rtl') {
    return {
      topLeft: logical.topTrailing,
      topRight: logical.topLeading,
      bottomRight: logical.bottomLeading,
      bottomLeft: logical.bottomTrailing,
    }
  }

  return {
    topLeft: logical.topLeading,
    topRight: logical.topTrailing,
    bottomRight: logical.bottomTrailing,
    bottomLeft: logical.bottomLeading,
  }
}

function toBorderRadius(physical: ReturnType<typeof toPhysicalCorners>) {
  return `${physical.topLeft}px ${physical.topRight}px ${physical.bottomRight}px ${physical.bottomLeft}px`
}

function formatLogicalCorners(corners: LogicalCorners) {
  return JSON.stringify(corners, null, 2)
}

function formatPhysicalCorners(corners: ReturnType<typeof toPhysicalCorners>) {
  return JSON.stringify(corners, null, 2)
}

function ControlPanel({
  title,
  description,
  corners,
  onChange,
  onApplyPreset,
  presets,
  panelClassName,
  panelStyle,
  content,
  enableXr = false,
}: {
  title: string
  description: string
  corners: LogicalCorners
  onChange: (key: keyof LogicalCorners, value: number) => void
  onApplyPreset: (corners: LogicalCorners) => void
  presets: Record<string, LogicalCorners>
  panelClassName?: string
  panelStyle?: SpatialStyle | CSSProperties
  content?: React.ReactNode
  enableXr?: boolean
}) {
  const spatialProps = enableXr ? { 'enable-xr': true as const } : {}
  return (
    <section
      style={panelStyle}
      {...spatialProps}
      className={[
        'border border-white/10 p-5 transition-[border-radius] duration-150',
        panelClassName ?? 'bg-white/5',
      ].join(' ')}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(presets).map(([name, preset]) => (
            <button
              key={name}
              className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-200 transition hover:bg-sky-400/20"
              onClick={() => onApplyPreset(preset)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {content ? <div className="mb-5">{content}</div> : null}

      <div className="space-y-4">
        {CORNER_FIELDS.map(field => (
          <label key={field.key} className="block">
            <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
              <span>{field.label}</span>
              <code>{corners[field.key]}px</code>
            </div>
            <input
              className="w-full"
              type="range"
              min={0}
              max={80}
              step={1}
              value={corners[field.key]}
              onChange={event => onChange(field.key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  )
}

export default function PagePropertiesCornerPage() {
  const [direction, setDirection] = useState<Direction>('ltr')
  const [hostCorners, setHostCorners] = useState<LogicalCorners>(
    HOST_PRESETS.asymmetric,
  )
  const [spatialCorners, setSpatialCorners] = useState<LogicalCorners>(
    SPATIAL_PRESETS.card,
  )
  const [attachmentCorners, setAttachmentCorners] = useState<LogicalCorners>(
    ATTACHMENT_PRESETS.panel,
  )

  const hostPhysical = useMemo(
    () => toPhysicalCorners(hostCorners, direction),
    [direction, hostCorners],
  )
  const spatialPhysical = useMemo(
    () => toPhysicalCorners(spatialCorners, direction),
    [direction, spatialCorners],
  )
  const attachmentPhysical = useMemo(
    () => toPhysicalCorners(attachmentCorners, direction),
    [direction, attachmentCorners],
  )

  const hostBorderRadius = useMemo(
    () => toBorderRadius(hostPhysical),
    [hostPhysical],
  )
  const spatialBorderRadius = useMemo(
    () => toBorderRadius(spatialPhysical),
    [spatialPhysical],
  )
  const attachmentBorderRadius = useMemo(
    () => toBorderRadius(attachmentPhysical),
    [attachmentPhysical],
  )

  useEffect(() => {
    const root = document.documentElement
    const prevDir = root.getAttribute('dir')
    const prevBackground = root.style.getPropertyValue('--spa-bg-color')
    const prevTopLeftRadius = root.style.getPropertyValue('border-top-left-radius')
    const prevTopRightRadius = root.style.getPropertyValue('border-top-right-radius')
    const prevBottomRightRadius = root.style.getPropertyValue(
      'border-bottom-right-radius',
    )
    const prevBottomLeftRadius = root.style.getPropertyValue(
      'border-bottom-left-radius',
    )

    root.style.setProperty('--spa-bg-color', '#050816')

    return () => {
      if (prevDir === null) {
        root.removeAttribute('dir')
      } else {
        root.setAttribute('dir', prevDir)
      }

      if (prevBackground) {
        root.style.setProperty('--spa-bg-color', prevBackground)
      } else {
        root.style.removeProperty('--spa-bg-color')
      }

      if (prevTopLeftRadius) {
        root.style.setProperty('border-top-left-radius', prevTopLeftRadius)
      } else {
        root.style.removeProperty('border-top-left-radius')
      }

      if (prevTopRightRadius) {
        root.style.setProperty('border-top-right-radius', prevTopRightRadius)
      } else {
        root.style.removeProperty('border-top-right-radius')
      }

      if (prevBottomRightRadius) {
        root.style.setProperty('border-bottom-right-radius', prevBottomRightRadius)
      } else {
        root.style.removeProperty('border-bottom-right-radius')
      }

      if (prevBottomLeftRadius) {
        root.style.setProperty('border-bottom-left-radius', prevBottomLeftRadius)
      } else {
        root.style.removeProperty('border-bottom-left-radius')
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction)
  }, [direction])

  useEffect(() => {
    const rootStyle = document.documentElement.style
    rootStyle.setProperty('border-top-left-radius', `${hostPhysical.topLeft}px`)
    rootStyle.setProperty('border-top-right-radius', `${hostPhysical.topRight}px`)
    rootStyle.setProperty(
      'border-bottom-right-radius',
      `${hostPhysical.bottomRight}px`,
    )
    rootStyle.setProperty(
      'border-bottom-left-radius',
      `${hostPhysical.bottomLeft}px`,
    )
  }, [hostPhysical])

  const spatialDivStyle: SpatialStyle = {
    minHeight: 420,
    padding: 20,
    borderRadius: spatialBorderRadius,
    background:
      'linear-gradient(145deg, rgba(56,189,248,0.28), rgba(59,130,246,0.14))',
    border: '1px solid rgba(125,211,252,0.35)',
    boxShadow: '0 24px 80px rgba(14, 165, 233, 0.16)',
    '--xr-back': 120,
    '--xr-depth': 100,
  }

  const attachmentPanelStyle: CSSProperties = {
    minHeight: '100%',
    boxSizing: 'border-box',
    borderRadius: attachmentBorderRadius,
    background:
      'linear-gradient(145deg, rgba(45, 212, 191, 0.30), rgba(20, 184, 166, 0.14))',
    border: '1px solid rgba(94, 234, 212, 0.38)',
    boxShadow: '0 22px 70px rgba(20, 184, 166, 0.16)',
  }

  return (
    <div className="min-h-full bg-[#050816] px-8 py-8 text-white">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Page Properties Corner</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-400">
            This page compares two corner-radius ownership paths with directly
            adjustable cards: a host-window styled card that scrolls with the
            page, and a SpatialDiv card that keeps its own local corner radius
            through <code> enable-xr </code>. Use the same logical values on
            both sides to compare direction mapping.
          </p>
        </div>
        <a
          href="#/"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          Go Back
        </a>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          className={`rounded-lg px-4 py-2 text-sm transition ${
            direction === 'ltr'
              ? 'bg-sky-500 text-slate-950'
              : 'bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
          onClick={() => setDirection('ltr')}
        >
          LTR
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm transition ${
            direction === 'rtl'
              ? 'bg-sky-500 text-slate-950'
              : 'bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
          onClick={() => setDirection('rtl')}
        >
          RTL
        </button>
        <button
          className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-400/20"
          onClick={() => setSpatialCorners(hostCorners)}
        >
          Copy host corners to SpatialDiv
        </button>
        <button
          className="rounded-lg border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-200 transition hover:bg-teal-400/20"
          onClick={() => setAttachmentCorners(hostCorners)}
        >
          Copy host corners to Attachment
        </button>
        <button
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          onClick={() => {
            setHostCorners(HOST_PRESETS.asymmetric)
            setSpatialCorners(SPATIAL_PRESETS.card)
            setAttachmentCorners(ATTACHMENT_PRESETS.panel)
            setDirection('ltr')
          }}
        >
          Reset
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
        <div className="grid gap-6 lg:grid-cols-2 xl:col-span-2">
          <ControlPanel
            title="Host Window"
            description="Adjust logical corners directly on this host window card. It stays in normal page flow and can scroll out of view."
            corners={hostCorners}
            presets={HOST_PRESETS}
            onApplyPreset={preset => setHostCorners({ ...preset })}
            onChange={(key, value) =>
              setHostCorners(current => ({ ...current, [key]: value }))
            }
            panelStyle={{ borderRadius: hostBorderRadius }}
            panelClassName="border border-sky-200/25 bg-slate-800/95 p-5 shadow-[0_24px_80px_rgba(14,165,233,0.18)]"
            content={
              <div className="rounded-xl bg-slate-950/80 p-4 text-sm text-slate-300">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Host window</span>
                  <span>{direction.toUpperCase()}</span>
                </div>
                <div>border-top-left-radius: {hostPhysical.topLeft}px</div>
                <div>border-top-right-radius: {hostPhysical.topRight}px</div>
                <div>
                  border-bottom-right-radius: {hostPhysical.bottomRight}px
                </div>
                <div>border-bottom-left-radius: {hostPhysical.bottomLeft}px</div>
              </div>
            }
          />
          <ControlPanel
            title="SpatialDiv"
            description="Adjust logical corners directly on this floating SpatialDiv card."
            corners={spatialCorners}
            presets={SPATIAL_PRESETS}
            onApplyPreset={preset => setSpatialCorners({ ...preset })}
            onChange={(key, value) =>
              setSpatialCorners(current => ({ ...current, [key]: value }))
            }
            enableXr
            panelStyle={spatialDivStyle}
            panelClassName="border border-sky-200/35 shadow-[0_24px_80px_rgba(14,165,233,0.16)]"
            content={
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-100/75">
                  SpatialDiv
                </div>
                <div className="mt-3 text-2xl font-semibold text-sky-50">
                  Runtime-owned corner radius
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-200">
                  Adjust the sliders and compare this floating card with the
                  host window path.
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-100">
                  <div className="rounded-lg bg-black/20 p-3">
                    TL / TR
                    <div className="mt-1 text-sky-100">
                      {spatialPhysical.topLeft}px / {spatialPhysical.topRight}px
                    </div>
                  </div>
                  <div className="rounded-lg bg-black/20 p-3">
                    BL / BR
                    <div className="mt-1 text-sky-100">
                      {spatialPhysical.bottomLeft}px /{' '}
                      {spatialPhysical.bottomRight}px
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          <section className="rounded-2xl border border-teal-200/20 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(20,184,166,0.12)] lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Reality Attachment
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                This scene places an Attachment inside Reality. The sliders are
                rendered inside the Attachment content, so the adjustable card
                is the actual attachment surface.
              </p>
            </div>
            <Reality
              style={{
                width: '100%',
                height: 620,
                borderRadius: 24,
                border: '1px solid rgba(94, 234, 212, 0.24)',
                background:
                  'radial-gradient(circle at 50% 20%, rgba(20,184,166,0.16), rgba(15,23,42,0.92) 48%, rgba(2,6,23,0.96))',
                overflow: 'hidden',
              }}
            >
              <UnlitMaterial id="cornerAttachmentAnchor" color="#14b8a6" />
              <AttachmentAsset name="corner-radius-attachment">
                <ControlPanel
                  title="Attachment"
                  description="Adjust logical corners directly on this Reality attachment card."
                  corners={attachmentCorners}
                  presets={ATTACHMENT_PRESETS}
                  onApplyPreset={preset => setAttachmentCorners({ ...preset })}
                  onChange={(key, value) =>
                    setAttachmentCorners(current => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  panelStyle={attachmentPanelStyle}
                  panelClassName="border border-teal-200/35 shadow-[0_22px_70px_rgba(20,184,166,0.16)]"
                  content={
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-teal-100/75">
                        Attachment
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-teal-50">
                        Reality-owned 2D surface
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-200">
                        The card is rendered through AttachmentAsset and hosted
                        by AttachmentEntity.
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-100">
                        <div className="rounded-lg bg-black/20 p-3">
                          TL / TR
                          <div className="mt-1 text-teal-100">
                            {attachmentPhysical.topLeft}px /{' '}
                            {attachmentPhysical.topRight}px
                          </div>
                        </div>
                        <div className="rounded-lg bg-black/20 p-3">
                          BL / BR
                          <div className="mt-1 text-teal-100">
                            {attachmentPhysical.bottomLeft}px /{' '}
                            {attachmentPhysical.bottomRight}px
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                />
              </AttachmentAsset>
              <SceneGraph>
                <Entity position={{ x: 0, y: 0, z: 0.1 }}>
                  <BoxEntity
                    width={0.12}
                    height={0.12}
                    depth={0.12}
                    materials={['cornerAttachmentAnchor']}
                  />
                  <AttachmentEntity
                    attachment="corner-radius-attachment"
                    position={[0, 0.16, 0]}
                    size={{ width: 460, height: 560 }}
                  />
                </Entity>
              </SceneGraph>
            </Reality>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white">Current payload</h2>
            <p className="mt-1 text-sm text-slate-400">
              In LTR, logical corners map directly to physical corners. In RTL,
              leading and trailing swap before the host or SpatialDiv card
              applies the physical corners.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-black/20 p-4">
                <div className="mb-2 text-sm font-medium text-slate-200">
                  Host logical
                </div>
                <pre className="overflow-auto text-xs text-slate-300">
                  {formatLogicalCorners(hostCorners)}
                </pre>
                <div className="mb-2 mt-4 text-sm font-medium text-slate-200">
                  Host physical
                </div>
                <pre className="overflow-auto text-xs text-slate-300">
                  {formatPhysicalCorners(hostPhysical)}
                </pre>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <div className="mb-2 text-sm font-medium text-slate-200">
                  SpatialDiv logical
                </div>
                <pre className="overflow-auto text-xs text-slate-300">
                  {formatLogicalCorners(spatialCorners)}
                </pre>
                <div className="mb-2 mt-4 text-sm font-medium text-slate-200">
                  SpatialDiv physical
                </div>
                <pre className="overflow-auto text-xs text-slate-300">
                  {formatPhysicalCorners(spatialPhysical)}
                </pre>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <div className="mb-2 text-sm font-medium text-slate-200">
                  Attachment logical
                </div>
                <pre className="overflow-auto text-xs text-slate-300">
                  {formatLogicalCorners(attachmentCorners)}
                </pre>
                <div className="mb-2 mt-4 text-sm font-medium text-slate-200">
                  Attachment physical
                </div>
                <pre className="overflow-auto text-xs text-slate-300">
                  {formatPhysicalCorners(attachmentPhysical)}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
