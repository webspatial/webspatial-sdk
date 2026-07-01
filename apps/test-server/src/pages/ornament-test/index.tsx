import { type CSSProperties, useEffect, useState } from 'react'
import {
  Model,
  Ornament,
  Reality,
  type BackgroundMaterialType,
  type CornerRadius,
  type OrnamentPoint3D,
  type OrnamentVisibility,
} from '@webspatial/react-sdk'

const POINTS: OrnamentPoint3D[] = [
  'topLeadingFront',
  'topLeading',
  'topLeadingBack',
  'topFront',
  'top',
  'topBack',
  'topTrailingFront',
  'topTrailing',
  'topTrailingBack',
  'leadingFront',
  'leading',
  'leadingBack',
  'front',
  'center',
  'back',
  'trailingFront',
  'trailing',
  'trailingBack',
  'bottomLeadingFront',
  'bottomLeading',
  'bottomLeadingBack',
  'bottomFront',
  'bottom',
  'bottomBack',
  'bottomTrailingFront',
  'bottomTrailing',
  'bottomTrailingBack',
]

const BACKGROUND_MATERIALS: BackgroundMaterialType[] = [
  'none',
  'transparent',
  'translucent',
  'thin',
  'regular',
  'thick',
]

type ContentMode = 'dom' | 'enable-xr' | 'model' | 'reality' | 'mixed'

const CONTENT_MODES: Array<{
  id: ContentMode
  label: string
  expectation: string
}> = [
  {
    id: 'dom',
    label: 'Normal DOM',
    expectation:
      'Plain DOM should render inside Ornament and inherit page CSS.',
  },
  {
    id: 'enable-xr',
    label: 'enable-xr',
    expectation:
      'SpatialDiv marker should degrade to plain DOM and not create a nested spatial div.',
  },
  {
    id: 'model',
    label: 'Model',
    expectation:
      'Model should degrade to the native <model> fallback and not create a spatial Model.',
  },
  {
    id: 'reality',
    label: 'Reality',
    expectation: 'Reality should render null and not create a Reality root.',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    expectation:
      'Mixed mode renders DOM plus all degraded spatial primitive cases together.',
  },
]

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </label>
  )
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        data-testid={id}
        value={value}
        onChange={event => onChange(event.target.value as T)}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  min = 1,
  onChange,
}: {
  id: string
  label: string
  value: number
  min?: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        data-testid={id}
        type="number"
        min={min}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
      />
    </div>
  )
}

function NormalDomContent() {
  return (
    <div
      data-testid="ornament-content-dom"
      className="ornament-demo-card rounded-xl border border-white/20 p-4 text-white shadow-xl"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-white/60">
        Normal DOM
      </div>
      <div className="mt-2 text-lg font-semibold">
        CSS variable inherited from page
      </div>
      <div className="mt-3 rounded-lg bg-black/20 px-3 py-2 text-sm">
        Accent swatch uses <code>--ornament-demo-accent</code>
      </div>
    </div>
  )
}

function EnableXrContent() {
  return (
    <div
      data-testid="ornament-content-enable-xr"
      enable-xr
      style={
        {
          '--xr-back': 80,
          '--xr-background-material': 'thin',
        } as CSSProperties
      }
      className="rounded-xl border border-cyan-300/40 bg-cyan-950/70 p-4 text-cyan-50"
    >
      <div className="text-sm font-semibold">enable-xr content</div>
      <p className="mt-2 text-xs text-cyan-100/80">
        Expected: plain DOM fallback inside Ornament.
      </p>
    </div>
  )
}

function ModelContent() {
  return (
    <div data-testid="ornament-content-model" className="space-y-2">
      <div className="text-sm font-semibold text-white">Model content</div>
      <Model
        enable-xr
        src="/models/ornament-demo.usdz"
        style={{ width: 160, height: 90 }}
        data-testid="ornament-model-fallback"
      />
    </div>
  )
}

function RealityContent() {
  return (
    <div data-testid="ornament-content-reality" className="space-y-2">
      <div className="text-sm font-semibold text-white">
        Reality content wrapper
      </div>
      <Reality data-testid="ornament-reality-fallback">
        <div data-testid="ornament-reality-child">Should not mount</div>
      </Reality>
    </div>
  )
}

function OrnamentContent({ mode }: { mode: ContentMode }) {
  if (mode === 'dom') return <NormalDomContent />
  if (mode === 'enable-xr') return <EnableXrContent />
  if (mode === 'model') return <ModelContent />
  if (mode === 'reality') return <RealityContent />

  return (
    <div data-testid="ornament-content-mixed" className="space-y-3">
      <NormalDomContent />
      <EnableXrContent />
      <ModelContent />
      <RealityContent />
    </div>
  )
}

type OrnamentItem = {
  id: number
  attachmentAnchor: OrnamentPoint3D
  contentAlignment: OrnamentPoint3D
  visibility: OrnamentVisibility
  width: number
  height: number
  cornerRadius: number
  backgroundMaterial: BackgroundMaterialType
  contentMode: ContentMode
}

function createOrnamentItem(id: number): OrnamentItem {
  return {
    id,
    attachmentAnchor: 'bottom',
    contentAlignment: 'back',
    visibility: 'visible',
    width: 240,
    height: 140,
    cornerRadius: 16,
    backgroundMaterial: 'none',
    contentMode: 'dom',
  }
}

function toCornerRadius(value: number): CornerRadius {
  return {
    topLeading: value,
    bottomLeading: value,
    topTrailing: value,
    bottomTrailing: value,
  }
}

export default function OrnamentTestPage() {
  const [items, setItems] = useState<OrnamentItem[]>([createOrnamentItem(1)])
  const [nextId, setNextId] = useState(2)

  useEffect(() => {
    document.documentElement.style.setProperty('--spa-bg-color', '#020617')
    document.documentElement.style.setProperty(
      '--ornament-demo-accent',
      '#38bdf8',
    )
    const style = document.createElement('style')
    style.setAttribute('data-ornament-demo-style', 'true')
    style.textContent = `
      .ornament-demo-card {
        background: linear-gradient(135deg, var(--ornament-demo-accent), rgba(15, 23, 42, 0.92));
      }
    `
    document.head.appendChild(style)
    return () => {
      document.documentElement.style.removeProperty('--spa-bg-color')
      document.documentElement.style.removeProperty('--ornament-demo-accent')
      style.remove()
    }
  }, [])

  const addOrnament = () => {
    setItems(currentItems => [...currentItems, createOrnamentItem(nextId)])
    setNextId(value => value + 1)
  }

  const removeOrnament = () => {
    setItems(currentItems => currentItems.slice(0, -1))
  }

  const updateItem = <K extends keyof OrnamentItem>(
    id: number,
    key: K,
    value: OrnamentItem[K],
  ) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    )
  }

  return (
    <div className="min-h-full overflow-visible bg-slate-950 p-8 text-slate-100">
      <div className="mb-8 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
          WebSpatial Ornament
        </p>
        <h1 className="mt-2 text-3xl font-bold">Ornament component demo</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Switch every public Ornament prop and content mode. This page is
          intentionally selector-friendly for auto tests and device smoke.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ornament list</h2>
            <p className="mt-1 text-xs text-slate-500">
              Each list item renders one live Ornament instance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              data-testid="ornament-count"
              className="rounded-md bg-black/30 px-3 py-2 font-mono text-sm text-slate-300"
            >
              {items.length}
            </span>
            <button
              data-testid="ornament-add"
              type="button"
              onClick={addOrnament}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Add
            </button>
            <button
              data-testid="ornament-remove"
              type="button"
              disabled={items.length === 0}
              onClick={removeOrnament}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        </div>

        <div data-testid="ornament-list" className="mt-5 space-y-4">
          {items.length === 0 ? (
            <div
              data-testid="ornament-empty"
              className="rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-500"
            >
              No Ornament items.
            </div>
          ) : null}

          {items.map((item, index) => (
            <article
              key={item.id}
              data-testid={`ornament-item-${index}`}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Ornament #{index + 1}
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  id:{item.id}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  id={`ornament-item-${index}-attachment-anchor`}
                  label="attachmentAnchor"
                  value={item.attachmentAnchor}
                  options={POINTS}
                  onChange={value =>
                    updateItem(item.id, 'attachmentAnchor', value)
                  }
                />
                <SelectField
                  id={`ornament-item-${index}-content-alignment`}
                  label="contentAlignment"
                  value={item.contentAlignment}
                  options={POINTS}
                  onChange={value =>
                    updateItem(item.id, 'contentAlignment', value)
                  }
                />
                <SelectField
                  id={`ornament-item-${index}-visibility`}
                  label="visibility"
                  value={item.visibility}
                  options={['visible', 'hidden']}
                  onChange={value => updateItem(item.id, 'visibility', value)}
                />
                <NumberField
                  id={`ornament-item-${index}-width`}
                  label="width"
                  value={item.width}
                  onChange={value => updateItem(item.id, 'width', value)}
                />
                <NumberField
                  id={`ornament-item-${index}-height`}
                  label="height"
                  value={item.height}
                  onChange={value => updateItem(item.id, 'height', value)}
                />
                <NumberField
                  id={`ornament-item-${index}-corner-radius`}
                  label="cornerRadius"
                  value={item.cornerRadius}
                  min={0}
                  onChange={value => updateItem(item.id, 'cornerRadius', value)}
                />
                <SelectField
                  id={`ornament-item-${index}-background-material`}
                  label="backgroundMaterial"
                  value={item.backgroundMaterial}
                  options={BACKGROUND_MATERIALS}
                  onChange={value =>
                    updateItem(item.id, 'backgroundMaterial', value)
                  }
                />
                <SelectField
                  id={`ornament-item-${index}-content-mode`}
                  label="content mode"
                  value={item.contentMode}
                  options={CONTENT_MODES.map(mode => mode.id)}
                  onChange={value => updateItem(item.id, 'contentMode', value)}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {items.map(item => (
        <Ornament
          key={item.id}
          attachmentAnchor={item.attachmentAnchor}
          contentAlignment={item.contentAlignment}
          visibility={item.visibility}
          width={item.width}
          height={item.height}
          cornerRadius={toCornerRadius(item.cornerRadius)}
          backgroundMaterial={item.backgroundMaterial}
        >
          <OrnamentContent mode={item.contentMode} />
        </Ornament>
      ))}
    </div>
  )
}
