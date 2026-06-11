import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useSpatialPortalContainer } from '@webspatial/react-sdk'
import React, { useCallback } from 'react'
import { dropdownMenuContentStyle } from './menuLayout'
import {
  DropdownTriggerRow,
  LogFn,
  MenuItems,
  dropdownContentDefaults,
  spatialPanelStyle,
} from './shared'

export function Scenario2SpatialFlatMenu({ onLog }: { onLog: LogFn }) {
  const portalContainer = useSpatialPortalContainer()

  const handleOpenChange = useCallback(
    (open: boolean) => onLog(`open change: ${open}`),
    [onLog],
  )

  return (
    <div
      enable-xr
      data-name="Dropdown Scenario 2 Parent"
      style={spatialPanelStyle}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>
        Scenario 2 — SpatialDiv flat menu
      </h2>
      <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '13px' }}>
        Trigger and content stay in the same spatial window. Menu content is
        ordinary DOM (no <code>enable-xr</code> on the menu).
      </p>

      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <DropdownTriggerRow label="Portal container: nearest SpatialDiv window" />

        {portalContainer && (
          <DropdownMenu.Portal container={portalContainer}>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              {...dropdownContentDefaults}
              className="dropdown-spatial-menu"
              data-testid="flat-menu-content"
              style={dropdownMenuContentStyle}
            >
              <MenuItems onSelect={onLog} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </DropdownMenu.Root>
    </div>
  )
}
