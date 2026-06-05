import { enableDebugTool } from '@webspatial/react-sdk'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StyledNestedSpatialSection } from './StyledNestedSpatialSection'
import { StyledSpatialChildSection } from './StyledSpatialChildSection'
import { StyledSpatialHostSection } from './StyledSpatialHostSection'
import { StyledTitleSection } from './StyledTitleSection'

enableDebugTool()

type DemoTab = 'host' | 'child' | 'title' | 'nested'

const DEMO_TABS: { id: DemoTab; label: string }[] = [
  { id: 'host', label: 'Styled host' },
  { id: 'child', label: 'Styled child' },
  { id: 'title', label: 'Styled title' },
  { id: 'nested', label: 'Nested' },
]

export default function StyledComponentsSpatialTest() {
  const [tab, setTab] = useState<DemoTab>('host')

  useEffect(() => {
    console.log('[test-server-route] mounted StyledComponentsSpatialTest')
  }, [])

  return (
    <div className="p-10 text-white min-h-full max-w-3xl">
      <h1 className="text-2xl mb-2">Styled-components × SpatialDiv</h1>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        Manual matrix for styled-components with WebSpatial. Use visionOS or
        PICO spatial runtime; switch tabs to preview one scenario at a time.
        Compare <strong className="text-gray-300">Styled host</strong> vs{' '}
        <strong className="text-gray-300">Styled child</strong> on device. Host
        and child tabs each show <strong className="text-gray-300">A</strong>{' '}
        (SC <code className="text-gray-400">$opacity</code>) vs{' '}
        <strong className="text-gray-300">B</strong> (CSS variable) under one
        slider to isolate head/class churn. Related:{' '}
        <Link className="text-blue-400 underline" to="/spatialStyleTest">
          Spatial Style (general)
        </Link>
        ,{' '}
        <Link className="text-blue-400 underline" to="/head-style-sync">
          Head style sync
        </Link>
        .
      </p>

      <div
        role="tablist"
        aria-label="Styled-components spatial demos"
        className="mb-6 flex flex-wrap gap-0 border-b border-gray-700"
      >
        {DEMO_TABS.map(t => {
          const selected = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`styled-spatial-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`styled-spatial-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
                selected
                  ? 'border-sky-400 text-white'
                  : 'border-transparent text-gray-500 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="w-full">
        {DEMO_TABS.map(t => (
          <div
            key={t.id}
            role="tabpanel"
            id={`styled-spatial-panel-${t.id}`}
            aria-labelledby={`styled-spatial-tab-${t.id}`}
            hidden={tab !== t.id}
          >
            {tab === t.id && (
              <>
                {t.id === 'host' && <StyledSpatialHostSection />}
                {t.id === 'child' && <StyledSpatialChildSection />}
                {t.id === 'title' && <StyledTitleSection />}
                {t.id === 'nested' && <StyledNestedSpatialSection />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
