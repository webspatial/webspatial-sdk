import { enableDebugTool } from '@webspatial/react-sdk'
import { CSSProperties, useEffect, useState } from 'react'

enableDebugTool()

type ScrollCheckpoint = {
  label: string
  x: number
  y: number
}

const checkpoints: ScrollCheckpoint[] = [
  { label: 'Origin', x: 0, y: 0 },
  { label: 'Horizontal', x: 0.7, y: 0 },
  { label: 'Vertical', x: 0, y: 0.7 },
  { label: 'Diagonal', x: 0.7, y: 0.7 },
]

const pageStyle: CSSProperties = {
  enableXr: true,
  minHeight: '100vh',
  color: '#e2e8f0',
  background: '#020617',
}

const introStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100vw',
  minHeight: 360,
  padding: '44px 48px 40px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.24)',
  background:
    'radial-gradient(circle at 82% 18%, rgba(56, 189, 248, 0.22), transparent 34%), linear-gradient(135deg, #0f172a, #111827 60%, #172554)',
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: '#38bdf8',
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  maxWidth: 760,
  margin: '12px 0 10px',
  color: '#f8fafc',
  fontSize: 'clamp(34px, 5vw, 62px)',
  lineHeight: 1.02,
  letterSpacing: '-0.04em',
}

const descriptionStyle: CSSProperties = {
  maxWidth: 760,
  margin: 0,
  color: '#94a3b8',
  fontSize: 17,
  lineHeight: 1.6,
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 10,
  marginTop: 28,
}

const buttonStyle: CSSProperties = {
  minHeight: 44,
  padding: '10px 16px',
  border: '1px solid rgba(125, 211, 252, 0.32)',
  borderRadius: 999,
  color: '#e0f2fe',
  background: 'rgba(14, 116, 144, 0.28)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const statusStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 14,
  minHeight: 44,
  marginLeft: 4,
  padding: '9px 16px',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: 999,
  color: '#cbd5e1',
  background: 'rgba(2, 6, 23, 0.68)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 13,
}

const acceptanceStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 12,
  maxWidth: 920,
  margin: '24px 0 0',
  padding: 0,
  listStyle: 'none',
}

const acceptanceItemStyle: CSSProperties = {
  padding: '13px 15px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 12,
  color: '#cbd5e1',
  background: 'rgba(15, 23, 42, 0.62)',
  fontSize: 14,
  lineHeight: 1.45,
}

const surfaceStyle: CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  width: '200vw',
  height: '200vh',
  minWidth: 1600,
  minHeight: 1200,
  overflow: 'visible',
  color: '#f8fafc',
  backgroundColor: '#0f172a',
  backgroundImage:
    'linear-gradient(rgba(148, 163, 184, 0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.13) 1px, transparent 1px), radial-gradient(circle at 15% 18%, rgba(14, 165, 233, 0.7), transparent 28%), radial-gradient(circle at 78% 24%, rgba(168, 85, 247, 0.62), transparent 30%), radial-gradient(circle at 72% 82%, rgba(249, 115, 22, 0.66), transparent 34%)',
  backgroundSize: '64px 64px, 64px 64px, auto, auto, auto',
  boxShadow: 'inset 0 1px rgba(255, 255, 255, 0.08)',
  '--xr-back': 121,
}

const axisXStyle: CSSProperties = {
  position: 'absolute',
  top: 34,
  left: 42,
  right: 42,
  height: 2,
  background: 'linear-gradient(90deg, #38bdf8, #c084fc, #fb923c)',
}

const axisYStyle: CSSProperties = {
  position: 'absolute',
  top: 34,
  bottom: 42,
  left: 42,
  width: 2,
  background: 'linear-gradient(#38bdf8, #34d399, #fb923c)',
}

const axisLabelStyle: CSSProperties = {
  position: 'absolute',
  padding: '7px 11px',
  border: '1px solid rgba(226, 232, 240, 0.24)',
  borderRadius: 999,
  color: '#e2e8f0',
  background: 'rgba(2, 6, 23, 0.76)',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const markerBaseStyle: CSSProperties = {
  position: 'absolute',
  width: 280,
  padding: 22,
  border: '1px solid rgba(255, 255, 255, 0.22)',
  borderRadius: 20,
  background: 'rgba(2, 6, 23, 0.72)',
  boxShadow: '0 22px 70px rgba(2, 6, 23, 0.36)',
  backdropFilter: 'blur(14px)',
}

const markerStyles: CSSProperties[] = [
  { top: 90, left: 90 },
  { top: 120, left: '112vw' },
  { top: '112vh', left: 110 },
  { top: '112vh', left: '112vw' },
]

function App() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition({
        x: Math.round(window.scrollX),
        y: Math.round(window.scrollY),
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, { passive: true })
    return () => window.removeEventListener('scroll', updatePosition)
  }, [])

  const goToCheckpoint = ({ x, y }: ScrollCheckpoint) => {
    const root = document.documentElement
    const maxX = Math.max(0, root.scrollWidth - window.innerWidth)
    const maxY = Math.max(0, root.scrollHeight - window.innerHeight)

    window.scrollTo({
      left: Math.round(maxX * x),
      top: Math.round(maxY * y),
      behavior: 'auto',
    })
  }

  return (
    <div style={pageStyle} data-name="Nested Scroll Test Controls">
      <section style={introStyle}>
        <p style={eyebrowStyle}>SpatialDiv page-scroll regression</p>
        <h1 style={titleStyle}>Two-axis nested scroll matrix</h1>
        <p style={descriptionStyle}>
          Drag directly on the colored SpatialDiv surface. The page and every
          spatial layer should stay aligned while moving horizontally,
          vertically, or diagonally. Use the checkpoints for deterministic
          screenshots and DOM inspection.
        </p>

        <div style={toolbarStyle} aria-label="Scroll checkpoints">
          {checkpoints.map(checkpoint => (
            <button
              key={checkpoint.label}
              type="button"
              style={buttonStyle}
              data-testid={`nested-scroll-${checkpoint.label.toLowerCase()}`}
              onClick={() => goToCheckpoint(checkpoint)}
            >
              {checkpoint.label}
            </button>
          ))}
          <output
            style={statusStyle}
            data-testid="nested-scroll-status"
            data-scroll-x={scrollPosition.x}
            data-scroll-y={scrollPosition.y}
            aria-live="polite"
          >
            <span>X {scrollPosition.x}px</span>
            <span>Y {scrollPosition.y}px</span>
          </output>
        </div>

        <ul style={acceptanceStyle}>
          <li style={acceptanceItemStyle}>
            <strong>Horizontal:</strong> X changes; Y stays stable.
          </li>
          <li style={acceptanceItemStyle}>
            <strong>Vertical:</strong> Y changes; X stays stable.
          </li>
          <li style={acceptanceItemStyle}>
            <strong>Diagonal:</strong> X and Y change together.
          </li>
          <li style={acceptanceItemStyle}>
            <strong>Alignment:</strong> no spatial layer remains behind.
          </li>
        </ul>
      </section>

      <div
        style={surfaceStyle}
        enable-xr
        data-name="Nested Scroll Test Surface"
        data-testid="nested-scroll-surface"
      >
        <div style={axisXStyle} />
        <div style={axisYStyle} />
        <span style={{ ...axisLabelStyle, top: 52, right: 42 }}>X axis →</span>
        <span style={{ ...axisLabelStyle, bottom: 42, left: 58 }}>
          Y axis ↓
        </span>

        {checkpoints.map((checkpoint, index) => (
          <article
            key={checkpoint.label}
            style={{ ...markerBaseStyle, ...markerStyles[index] }}
            data-checkpoint={checkpoint.label.toLowerCase()}
          >
            <p style={{ ...eyebrowStyle, marginBottom: 9 }}>
              Checkpoint {index + 1}
            </p>
            <h2 style={{ margin: 0, fontSize: 28, color: '#f8fafc' }}>
              {checkpoint.label}
            </h2>
            <p
              style={{
                margin: '9px 0 0',
                color: '#94a3b8',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Expected page ratio: X {Math.round(checkpoint.x * 100)}% · Y{' '}
              {Math.round(checkpoint.y * 100)}%
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default App
