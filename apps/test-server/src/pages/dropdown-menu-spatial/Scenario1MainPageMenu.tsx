import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React, { useCallback, useMemo } from 'react'
import {
  dropdownMenuFloatingGeometry,
  dropdownMenuPanelStyle,
} from './menuLayout'
import {
  DropdownTriggerRow,
  LogFn,
  MenuItems,
  dropdownContentDefaults,
  panelStyle,
} from './shared'

const floatingMenuStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
  '--xr-back': dropdownMenuFloatingGeometry.back,
  '--xr-depth': dropdownMenuFloatingGeometry.depth,
  '--xr-background-material': dropdownMenuFloatingGeometry.backgroundMaterial,
}

export function Scenario1MainPageMenu({ onLog }: { onLog: LogFn }) {
  const portalContainer = useMemo(
    () => (typeof document === 'undefined' ? null : document.body),
    [],
  )

  const handleOpenChange = useCallback(
    (open: boolean) => onLog(`open change: ${open}`),
    [onLog],
  )

  return (
    <section style={{ ...panelStyle, marginTop: '24px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>
        Scenario 1 — Main page floating menu
      </h2>
      <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '13px' }}>
        Portal to <code>document.body</code>. Use{' '}
        <code>DropdownMenu.Content asChild</code> with an inner{' '}
        <code>div enable-xr</code>.
      </p>

      <DropdownMenu.Root modal={false} onOpenChange={handleOpenChange}>
        <DropdownTriggerRow label="Avatar on the main page" />

        {portalContainer && (
          <DropdownMenu.Portal container={portalContainer}>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              {...dropdownContentDefaults}
              asChild
            >
              <div
                enable-xr
                className="dropdown-spatial-menu"
                data-name="Dropdown Scenario 1 Menu"
                data-testid="floating-menu-content"
                style={floatingMenuStyle}
              >
                <MenuItems onSelect={onLog} />
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </DropdownMenu.Root>
    </section>
  )
}
