/**
 * Transform Verification Page
 *
 * Visual correctness test for --xr-back, CSS transform, and transform-origin
 * combinations on SpatialDiv. Each card applies a specific combination so you
 * can compare the visionOS native rendering against expected behavior.
 *
 * Covers:
 * - Individual transform functions (rotateX/Y/Z, scaleX/Y/Z, translateX/Y/Z, skew)
 * - Composed transforms (rotate + translate, scale + rotate, full combo)
 * - Different transform-origin values (center, top-left, bottom-right, custom %)
 * - Various --xr-back depths (0, small, large)
 * - Nested SpatialDiv with independent transforms
 */
import React, { useState } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

interface TestCase {
  label: string
  description: string
  style: React.CSSProperties
  children?: TestCase[]
}

const SIZE = 160
const COLORS = {
  green: 'rgba(34, 197, 94, 0.85)',
  blue: 'rgba(59, 130, 246, 0.85)',
  red: 'rgba(239, 68, 68, 0.85)',
  purple: 'rgba(168, 85, 247, 0.85)',
  amber: 'rgba(245, 158, 11, 0.85)',
  teal: 'rgba(20, 184, 166, 0.85)',
  pink: 'rgba(236, 72, 153, 0.85)',
  cyan: 'rgba(6, 182, 212, 0.85)',
}

const base = (color: string, xrBack = '50px'): React.CSSProperties => ({
  width: `${SIZE}px`,
  height: `${SIZE}px`,
  backgroundColor: color,
  '--xr-back': xrBack,
})

// ---------------------------------------------------------------------------
// Test case definitions
// ---------------------------------------------------------------------------

const singleRotations: TestCase[] = [
  {
    label: 'rotateX(45deg)',
    description: 'Tilt forward around X axis',
    style: { ...base(COLORS.green), transform: 'rotateX(45deg)' },
  },
  {
    label: 'rotateX(90deg)',
    description: 'Perpendicular to screen via X axis',
    style: { ...base(COLORS.green), transform: 'rotateX(90deg)' },
  },
  {
    label: 'rotateY(45deg)',
    description: 'Tilt sideways around Y axis',
    style: { ...base(COLORS.blue), transform: 'rotateY(45deg)' },
  },
  {
    label: 'rotateY(90deg)',
    description: 'Perpendicular to screen via Y axis',
    style: { ...base(COLORS.blue), transform: 'rotateY(90deg)' },
  },
  {
    label: 'rotateZ(45deg)',
    description: 'In-plane rotation',
    style: { ...base(COLORS.purple), transform: 'rotateZ(45deg)' },
  },
  {
    label: 'rotate3d(1,1,0,45deg)',
    description: 'Diagonal axis rotation',
    style: { ...base(COLORS.amber), transform: 'rotate3d(1,1,0,45deg)' },
  },
]

const singleScales: TestCase[] = [
  {
    label: 'scale(1.5)',
    description: 'Uniform scale up',
    style: { ...base(COLORS.teal), transform: 'scale(1.5)' },
  },
  {
    label: 'scale(0.5)',
    description: 'Uniform scale down',
    style: { ...base(COLORS.teal), transform: 'scale(0.5)' },
  },
  {
    label: 'scaleX(2)',
    description: 'Stretch horizontally',
    style: { ...base(COLORS.cyan), transform: 'scaleX(2)' },
  },
  {
    label: 'scaleY(0.5)',
    description: 'Squash vertically',
    style: { ...base(COLORS.cyan), transform: 'scaleY(0.5)' },
  },
]

const singleTranslates: TestCase[] = [
  {
    label: 'translateX(80px)',
    description: 'Shift right',
    style: { ...base(COLORS.pink), transform: 'translateX(80px)' },
  },
  {
    label: 'translateY(60px)',
    description: 'Shift down',
    style: { ...base(COLORS.pink), transform: 'translateY(60px)' },
  },
  {
    label: 'translateZ(100px)',
    description: 'Push forward (toward viewer)',
    style: { ...base(COLORS.red), transform: 'translateZ(100px)' },
  },
  {
    label: 'translate3d(40px,40px,60px)',
    description: '3D translation',
    style: { ...base(COLORS.red), transform: 'translate3d(40px,40px,60px)' },
  },
]

const composedTransforms: TestCase[] = [
  {
    label: 'rotateX(45deg) translateZ(100px)',
    description: 'Rotate first, then translate along rotated Z',
    style: {
      ...base(COLORS.green),
      transform: 'rotateX(45deg) translateZ(100px)',
    },
  },
  {
    label: 'translateZ(100px) rotateX(45deg)',
    description: 'Translate first, then rotate at new position',
    style: {
      ...base(COLORS.blue),
      transform: 'translateZ(100px) rotateX(45deg)',
    },
  },
  {
    label: 'rotateX(90deg) translateZ(200px)',
    description:
      'Rotate perpendicular, translate along rotated Z (appears as translateY)',
    style: {
      ...base(COLORS.purple),
      transform: 'rotateX(90deg) translateZ(200px)',
    },
  },
  {
    label: 'rotateY(45deg) scale(1.5)',
    description: 'Rotate around Y then scale',
    style: {
      ...base(COLORS.amber),
      transform: 'rotateY(45deg) scale(1.5)',
    },
  },
  {
    label: 'scale(0.8) rotateZ(30deg) translateX(50px)',
    description: 'Scale, rotate in-plane, then shift',
    style: {
      ...base(COLORS.teal),
      transform: 'scale(0.8) rotateZ(30deg) translateX(50px)',
    },
  },
  {
    label: 'rotateX(30deg) rotateY(30deg) rotateZ(30deg)',
    description: 'Euler-like triple rotation',
    style: {
      ...base(COLORS.pink),
      transform: 'rotateX(30deg) rotateY(30deg) rotateZ(30deg)',
    },
  },
]

const originCases: TestCase[] = [
  {
    label: 'origin: center (default)',
    description: 'rotateX(45deg) with default origin',
    style: {
      ...base(COLORS.green),
      transform: 'rotateX(45deg)',
    },
  },
  {
    label: 'origin: top left',
    description: 'rotateX(45deg) from top-left corner',
    style: {
      ...base(COLORS.blue),
      transform: 'rotateX(45deg)',
      transformOrigin: 'top left',
    },
  },
  {
    label: 'origin: bottom right',
    description: 'rotateX(45deg) from bottom-right corner',
    style: {
      ...base(COLORS.purple),
      transform: 'rotateX(45deg)',
      transformOrigin: 'bottom right',
    },
  },
  {
    label: 'origin: center top',
    description: 'rotateX(45deg) from top edge center',
    style: {
      ...base(COLORS.amber),
      transform: 'rotateX(45deg)',
      transformOrigin: 'center top',
    },
  },
  {
    label: 'origin: 25% 75%',
    description: 'rotateZ(45deg) from custom offset',
    style: {
      ...base(COLORS.teal),
      transform: 'rotateZ(45deg)',
      transformOrigin: '25% 75%',
    },
  },
  {
    label: 'origin: left center + rotateY',
    description: 'rotateY(60deg) hinging on left edge',
    style: {
      ...base(COLORS.pink),
      transform: 'rotateY(60deg)',
      transformOrigin: 'left center',
    },
  },
  {
    label: 'origin: right center + rotateY',
    description: 'rotateY(60deg) hinging on right edge',
    style: {
      ...base(COLORS.cyan),
      transform: 'rotateY(60deg)',
      transformOrigin: 'right center',
    },
  },
  {
    label: 'origin: center + scale(1.5)',
    description: 'scale from center (default)',
    style: {
      ...base(COLORS.red),
      transform: 'scale(1.5)',
    },
  },
  {
    label: 'origin: top left + scale(1.5)',
    description: 'scale from top-left corner',
    style: {
      ...base(COLORS.red),
      transform: 'scale(1.5)',
      transformOrigin: 'top left',
    },
  },
]

const xrBackCases: TestCase[] = [
  {
    label: '--xr-back: 0px',
    description: 'No depth offset',
    style: { ...base(COLORS.green, '0px'), transform: 'rotateX(30deg)' },
  },
  {
    label: '--xr-back: 50px',
    description: 'Medium depth offset',
    style: { ...base(COLORS.blue, '50px'), transform: 'rotateX(30deg)' },
  },
  {
    label: '--xr-back: 200px',
    description: 'Large depth offset',
    style: { ...base(COLORS.purple, '200px'), transform: 'rotateX(30deg)' },
  },
  {
    label: '--xr-back: 100px + rotateY(45deg)',
    description:
      'Depth then Y rotation — element should rotate in-place at depth',
    style: { ...base(COLORS.amber, '100px'), transform: 'rotateY(45deg)' },
  },
  {
    label: '--xr-back: 100px + translateZ(50px) + rotateX(45deg)',
    description: 'Back + forward + rotate',
    style: {
      ...base(COLORS.teal, '100px'),
      transform: 'translateZ(50px) rotateX(45deg)',
    },
  },
]

const nestedCases: TestCase = {
  label: 'Nested parent',
  description: 'Parent rotateX(30deg), child has own transform',
  style: {
    width: '300px',
    height: '300px',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    '--xr-back': '80px',
    transform: 'rotateX(30deg)',
  },
  children: [
    {
      label: 'Child: rotateY(45deg)',
      description: 'Independent Y rotation inside rotated parent',
      style: {
        width: '120px',
        height: '120px',
        backgroundColor: COLORS.red,
        '--xr-back': '20px',
        transform: 'translateX(20px) translateY(20px) rotateY(45deg)',
      },
    },
    {
      label: 'Child: scale(0.8) rotateZ(30deg)',
      description: 'Scale + Z rotation inside rotated parent',
      style: {
        width: '120px',
        height: '120px',
        backgroundColor: COLORS.amber,
        '--xr-back': '10px',
        transform:
          'translateX(160px) translateY(20px) scale(0.8) rotateZ(30deg)',
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Card({ tc }: { tc: TestCase }) {
  return (
    <div className="flex flex-col gap-2">
      <div enable-xr style={tc.style} className="rounded-lg">
        {tc.children?.map((child, i) => (
          <div
            key={i}
            enable-xr
            style={child.style}
            className="rounded absolute"
          />
        ))}
      </div>
      <div className="max-w-[180px]">
        <p className="text-xs font-mono text-white/90 break-all">{tc.label}</p>
        <p className="text-xs text-gray-500">{tc.description}</p>
      </div>
    </div>
  )
}

function Section({ title, cases }: { title: string; cases: TestCase[] }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
        {title}
      </h2>
      <div className="flex flex-wrap gap-8">
        {cases.map((tc, i) => (
          <Card key={i} tc={tc} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Interactive playground
// ---------------------------------------------------------------------------

const TRANSFORM_PRESETS = [
  'none',
  'rotateX(45deg)',
  'rotateY(45deg)',
  'rotateZ(45deg)',
  'rotateX(90deg)',
  'rotateX(45deg) translateZ(100px)',
  'translateZ(100px) rotateX(45deg)',
  'scale(1.5) rotateZ(30deg)',
  'rotateX(30deg) rotateY(30deg)',
  'rotate3d(1,1,1,60deg)',
]

const ORIGIN_PRESETS = [
  'center',
  'top left',
  'top right',
  'bottom left',
  'bottom right',
  'center top',
  'center bottom',
  'left center',
  'right center',
  '25% 75%',
  '75% 25%',
]

function Playground() {
  const [transform, setTransform] = useState('rotateX(45deg)')
  const [customTransform, setCustomTransform] = useState('')
  const [origin, setOrigin] = useState('center')
  const [xrBack, setXrBack] = useState(50)

  const activeTransform =
    customTransform.trim() || (transform === 'none' ? undefined : transform)

  const style: React.CSSProperties = {
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    backgroundColor: COLORS.green,
    '--xr-back': `${xrBack}px`,
    transform: activeTransform,
    transformOrigin: origin,
  }

  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
        Interactive Playground
      </h2>

      <div className="flex gap-8 flex-wrap">
        <div className="flex flex-col gap-4 min-w-[300px]">
          <div>
            <label className="text-sm text-gray-400 block mb-1">
              Transform preset
            </label>
            <select
              className="bg-gray-800 text-white text-sm rounded px-3 py-1.5 w-full"
              value={transform}
              onChange={e => {
                setTransform(e.target.value)
                setCustomTransform('')
              }}
            >
              {TRANSFORM_PRESETS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">
              Custom transform (overrides preset)
            </label>
            <input
              className="bg-gray-800 text-white text-sm rounded px-3 py-1.5 w-full font-mono"
              placeholder="e.g. rotateX(60deg) scale(0.8)"
              value={customTransform}
              onChange={e => setCustomTransform(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">
              transform-origin
            </label>
            <select
              className="bg-gray-800 text-white text-sm rounded px-3 py-1.5 w-full"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
            >
              {ORIGIN_PRESETS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">
              --xr-back: {xrBack}px
            </label>
            <input
              type="range"
              min={0}
              max={300}
              value={xrBack}
              onChange={e => setXrBack(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-gray-800/50 p-3 rounded text-xs font-mono text-gray-300">
            <div>transform: {activeTransform ?? 'none'}</div>
            <div>transform-origin: {origin}</div>
            <div>--xr-back: {xrBack}px</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div enable-xr style={style} className="rounded-lg" />
          <p className="text-xs text-gray-500">Live preview</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TransformVerify() {
  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl mb-2">Transform Verification</h1>
      <p className="text-gray-400 mb-8">
        Visual correctness test for <code>--xr-back</code>,{' '}
        <code>transform</code>, and <code>transform-origin</code> on SpatialDiv.
        Compare native rendering against expected behavior.
      </p>

      <Playground />

      <Section title="Single Rotations" cases={singleRotations} />
      <Section title="Single Scales" cases={singleScales} />
      <Section title="Single Translates" cases={singleTranslates} />
      <Section
        title="Composed Transforms (order matters)"
        cases={composedTransforms}
      />
      <Section title="transform-origin Variations" cases={originCases} />
      <Section title="--xr-back Depth Variations" cases={xrBackCases} />

      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
          Nested SpatialDiv
        </h2>
        <Card tc={nestedCases} />
      </div>

      <div className="mt-8 p-4 bg-gray-800/50 rounded text-sm">
        <h3 className="font-semibold mb-2">What to verify</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>
            <strong>Rotation axis</strong>: rotateX tilts forward/backward,
            rotateY tilts left/right, rotateZ spins in-plane
          </li>
          <li>
            <strong>Transform order</strong>:{' '}
            <code>rotateX(45deg) translateZ(100px)</code> should translate along
            the <em>rotated</em> Z axis (not world Z)
          </li>
          <li>
            <strong>transform-origin</strong>: rotation/scale should pivot
            around the specified anchor point
          </li>
          <li>
            <strong>--xr-back</strong>: pushes the element along the{' '}
            <em>parent&apos;s</em> Z axis before CSS transforms are applied
            visually
          </li>
          <li>
            <strong>Nested</strong>: child transforms should compose correctly
            with parent transforms
          </li>
        </ul>
      </div>
    </div>
  )
}
