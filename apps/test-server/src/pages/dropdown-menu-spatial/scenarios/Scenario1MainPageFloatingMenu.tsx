import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useCallback, useMemo } from 'react'
import { AvatarButton } from '../components/AvatarButton'
import { MenuItems } from '../components/MenuItems'
import { dropdownMenuContentPosition } from '../dropdownMenuContentPosition'
import {
  floatingMenuStyle,
  panelStyle,
  scenarioDescriptionStyle,
  scenarioHeadingStyle,
} from '../pageStyles'
import type { MenuLogFn } from '../types'

/**
 * Scenario 1 — Main page floating menu
 *
 * Structure:
 *   Trigger (main page)
 *   Portal → document.body
 *   Content asChild → div enable-xr  (menu rises as a new spatial surface)
 */
export function Scenario1MainPageFloatingMenu({ onLog }: { onLog: MenuLogFn }) {
  const rootPortalHost = useMemo(
    () => (typeof document === 'undefined' ? null : document.body),
    [],
  )

  const handleOpenChange = useCallback(
    (open: boolean) => onLog(`open change: ${open}`),
    [onLog],
  )

  return (
    <section style={{ ...panelStyle, marginTop: '24px' }}>
      <h2 style={scenarioHeadingStyle}>Scenario 1 — Main page floating menu</h2>
      <p style={scenarioDescriptionStyle}>
        Portal to <code>document.body</code>. Use{' '}
        <code>DropdownMenu.Content asChild</code> with an inner{' '}
        <code>div enable-xr</code>.
      </p>

      <DropdownMenu.Root modal={false} onOpenChange={handleOpenChange}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DropdownMenu.Trigger asChild>
            <AvatarButton />
          </DropdownMenu.Trigger>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
            Avatar on the main page
          </span>
        </div>

        {rootPortalHost && (
          <DropdownMenu.Portal container={rootPortalHost}>
            <DropdownMenu.Content {...dropdownMenuContentPosition} asChild>
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
