import React, { useState } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

const OPTIONS = ['apple', 'banana', 'cherry'] as const

export default function DropdownMenuTest() {
  const [pageValue, setPageValue] = useState<string>(OPTIONS[0])
  const [spatialValue, setSpatialValue] = useState<string>(OPTIONS[1])

  const spatialCardStyle: React.CSSProperties = {
    width: '280px',
    minHeight: '140px',
    padding: '16px',
    backgroundColor: '#1e3a5f',
    color: 'white',
    '--xr-back': 140 as React.CSSProperties['--xr-back'],
    '--xr-depth': 80 as React.CSSProperties['--xr-depth'],
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch',
    justifyContent: 'center',
  }

  const selectClass =
    'w-full max-w-xs rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white'

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Dropdown menu test</h1>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Native selects on the flat page and inside an{' '}
        <code className="text-gray-300">enable-xr</code> spatial div. Open each
        list and pick options to confirm both work in XR and 2D.
      </p>

      <section className="mb-10 rounded-xl border border-gray-800 bg-[#111] p-6">
        <h2 className="text-lg font-medium text-gray-200 mb-4">Main page</h2>
        <label
          className="block text-sm text-gray-400 mb-2"
          htmlFor="page-select"
        >
          Select (flat DOM)
        </label>
        <select
          id="page-select"
          className={selectClass}
          value={pageValue}
          onChange={e => setPageValue(e.target.value)}
        >
          {OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-gray-500">
          Selected: <span className="text-gray-200">{pageValue}</span>
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-gray-700 p-8 flex justify-center items-center min-h-[220px]">
        <div enable-xr style={spatialCardStyle}>
          <span className="text-sm text-blue-200 font-medium">
            Inside spatial div
          </span>
          <label
            className="block text-xs text-gray-300"
            htmlFor="spatial-select"
          >
            Select (enable-xr host)
          </label>
          <select
            id="spatial-select"
            className={selectClass}
            value={spatialValue}
            onChange={e => setSpatialValue(e.target.value)}
          >
            {OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Selected: <span className="text-white">{spatialValue}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
