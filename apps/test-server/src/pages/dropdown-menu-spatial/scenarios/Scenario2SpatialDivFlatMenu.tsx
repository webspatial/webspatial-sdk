import { useSpatialPortalContainer } from '@webspatial/react-sdk'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useCallback } from 'react'
import { AvatarButton } from '../components/AvatarButton'
import { MenuItems } from '../components/MenuItems'
import { dropdownMenuContentPosition } from '../dropdownMenuContentPosition'
import { dropdownMenuContentStyle } from '../menuLayout'
import {
  scenarioDescriptionStyle,
  scenarioHeadingStyle,
  spatialPanelStyle,
} from '../pageStyles'
import type { MenuLogFn } from '../types'

function Scenario2SpatialDivFlatMenuContent({ onLog }: { onLog: MenuLogFn }) {
  const portalContainer = useSpatialPortalContainer()

  const handleOpenChange = useCallback(
    (open: boolean) => onLog(`open change: ${open}`),
    [onLog],
  )

  return (
    <>
      <h2 style={scenarioHeadingStyle}>Scenario 2 — SpatialDiv flat menu</h2>
      <p style={scenarioDescriptionStyle}>
        Trigger and content stay in the same spatial window. Menu content is
        ordinary DOM (no <code>enable-xr</code> on the menu).
      </p>

      <DropdownMenu.Root onOpenChange={handleOpenChange}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DropdownMenu.Trigger asChild>
            <AvatarButton />
          </DropdownMenu.Trigger>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
            Portal container: nearest SpatialDiv window
          </span>
        </div>

        {portalContainer && (
          <DropdownMenu.Portal container={portalContainer}>
            <DropdownMenu.Content
              {...dropdownMenuContentPosition}
              className="dropdown-spatial-menu"
              data-testid="flat-menu-content"
              style={dropdownMenuContentStyle}
            >
              <MenuItems onSelect={onLog} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </DropdownMenu.Root>
    </>
  )
}

/**
 * Scenario 2 — SpatialDiv flat menu
 *
 * Structure:
 *   Parent div enable-xr  (SpatialDiv panel)
 *   Trigger (inside panel)
 *   Portal → useSpatialPortalContainer()  (same spatial window as trigger)
 *   Content  (plain DOM, no enable-xr on menu)
 */
export function Scenario2SpatialDivFlatMenu({ onLog }: { onLog: MenuLogFn }) {
  return (
    <div
      enable-xr
      data-name="Dropdown Scenario 2 Parent"
      style={spatialPanelStyle}
    >
      <Scenario2SpatialDivFlatMenuContent onLog={onLog} />
    </div>
  )
}
