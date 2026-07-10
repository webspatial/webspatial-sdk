import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  enableDebugTool,
  useSpatialPortalContainer,
} from '@webspatial/react-sdk'
import React, { useState } from 'react'

enableDebugTool()

const OPTIONS = ['apple', 'banana', 'cherry'] as const

const menuContentClass =
  'min-w-[180px] rounded-lg border border-gray-600 bg-[#16213a] p-1 text-sm text-white shadow-xl'
const menuItemClass =
  'cursor-pointer rounded px-3 py-1.5 outline-none data-[highlighted]:bg-blue-600'

/**
 * Radix DropdownMenu with a nested submenu, safe to mount inside an
 * `enable-xr` panel: every Radix Portal part receives the spatial portal
 * container from useSpatialPortalContainer(), so Content AND SubContent
 * render inside the panel's child-webview document instead of being
 * portaled to the flat host page (the default, which puts the submenu in
 * the wrong document and coordinate space). Outside spatial content the
 * hook returns null and Radix falls back to its normal host-body portal,
 * so the same component works in 2D.
 *
 * Known limitation: the menu is clipped to the panel's webview bounds.
 */
function FruitMenu(props: { label: string; onPick: (value: string) => void }) {
  const container = useSpatialPortalContainer()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="rounded-lg bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">
        {props.label}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content className={menuContentClass} sideOffset={4}>
          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={() => props.onPick('apple')}
          >
            Apple
          </DropdownMenu.Item>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={menuItemClass}>
              More fruit →
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal container={container}>
              <DropdownMenu.SubContent
                className={menuContentClass}
                sideOffset={2}
              >
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => props.onPick('cherry')}
                >
                  Cherry
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default function DropdownMenuTest() {
  const [pageValue, setPageValue] = useState<string>(OPTIONS[0])
  const [spatialValue, setSpatialValue] = useState<string>(OPTIONS[1])
  const [radixFlatPick, setRadixFlatPick] = useState<string>('none yet')
  const [radixSpatialPick, setRadixSpatialPick] = useState<string>('none yet')

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
        <div className="mt-6 border-t border-gray-800 pt-4">
          <p className="mb-2 text-sm text-gray-400">
            Radix DropdownMenu + submenu (flat DOM;{' '}
            <code>useSpatialPortalContainer()</code> returns null here, Radix
            uses its default host-body portal)
          </p>
          <FruitMenu label="Fruit menu (flat)" onPick={setRadixFlatPick} />
          <p className="mt-3 text-sm text-gray-500">
            Picked: <span className="text-gray-200">{radixFlatPick}</span>
          </p>
        </div>
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
          <div className="border-t border-blue-900 pt-3">
            <p className="mb-2 text-xs text-gray-300">
              Radix menu + submenu, portaled INTO this panel via{' '}
              <code>useSpatialPortalContainer()</code>. Open “More fruit →
              Cherry”: the submenu must appear inside this panel, not on the
              flat page. (Clipped to panel bounds — known limit.)
            </p>
            <FruitMenu
              label="Fruit menu (spatial)"
              onPick={setRadixSpatialPick}
            />
            <p className="mt-2 text-xs text-gray-400">
              Picked: <span className="text-white">{radixSpatialPick}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
