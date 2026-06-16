import {
  useSpatialOverlay,
  type SpatialOverlayPortalOption,
} from '@webspatial/react-sdk'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React, { useCallback, useMemo, useState } from 'react'
import { getDropdownMenuItemStyle } from '../menuLayout'
import {
  scenario4HostStyle,
  scenario4InnerSurfaceStyle,
  scenario4NoteStyle,
  scenario4ShadowContentStyle,
  scenario4SurfaceBadgeStyle,
  scenario4TriggerStyle,
} from '../scenario4Styles'
import { scenarioDescriptionStyle, scenarioHeadingStyle } from '../pageStyles'
import type { MenuLogFn } from '../types'

type PluginIdentifier = 'drive' | 'screenshot' | 'upload'

type PluginRenderProps = {
  closeMenu: () => void
  menuVisible: boolean
  portalMenuOption: SpatialOverlayPortalOption
}

const PLUGIN_LIST: readonly PluginIdentifier[] = [
  'drive',
  'screenshot',
  'upload',
]

const PLUGIN_LABELS: Record<PluginIdentifier, string> = {
  drive: 'Drive Attachment',
  screenshot: 'Screenshot',
  upload: 'Upload File',
}

function PluginMenuItem({
  identifier,
  onLog,
  ...props
}: {
  identifier: PluginIdentifier
  onLog: MenuLogFn
} & PluginRenderProps) {
  return props.portalMenuOption(
    <DropdownMenu.Item
      className="dropdown-spatial-menu-item"
      data-name={`plugin-item-${identifier}`}
      onSelect={() => {
        onLog(`select: ${identifier}`)
        props.closeMenu()
      }}
      style={getDropdownMenuItemStyle(false)}
    >
      {PLUGIN_LABELS[identifier]}
    </DropdownMenu.Item>,
  )
}

/**
 * Scenario 4 — Plugin-host dual-root menu (flat page, no outer enable-xr)
 *
 * Simulates plugin host on ordinary main-page DOM — no SpatialDiv parent.
 *
 * Structure:
 *   Parent div  (plain panel, NOT enable-xr)
 *
 *   visible root:
 *     Trigger on flat page
 *     Portal → document.body
 *     Content asChild → div enable-xr
 *       standard copy → SpatialOverlay measurement target
 *       spatial portal copy → plugin portal target
 *
 *   shadow root (always open):
 *     Plugin items (Radix logical context)
 *     portalMenuOption → measurement copy + plugin portal target
 */
export function Scenario4PluginHostMenu({ onLog }: { onLog: MenuLogFn }) {
  const portalContainer = useMemo(
    () => (typeof document === 'undefined' ? null : document.body),
    [],
  )
  const { OverlayTarget, portalMenuOption } = useSpatialOverlay({
    portalTargetName: 'scenario4-plugin-portal-target',
  })

  const [visibleOpen, setVisibleOpen] = useState(false)

  const closeMenu = useCallback(() => {
    setVisibleOpen(false)
  }, [])

  const renderProps: PluginRenderProps = useMemo(
    () => ({
      closeMenu,
      menuVisible: visibleOpen,
      portalMenuOption,
    }),
    [closeMenu, portalMenuOption, visibleOpen],
  )

  return (
    <div
      id="scenario-4"
      data-name="Plugin Host Flat Parent"
      style={scenario4HostStyle}
    >
      <h2 style={scenarioHeadingStyle}>
        Scenario 4 — Plugin-host dual-root menu (flat page)
      </h2>
      <p style={{ ...scenarioDescriptionStyle, margin: '0 0 12px' }}>
        No outer <code>enable-xr</code> — plugin host sits on ordinary DOM like
        a main-page toolbar. Visible root owns the menu shell; shadow root owns
        plugin items. <code>portalMenuOption</code> injects items into the menu
        surface's portal-webview target while <code>SpatialOverlay</code>
        mirrors a measurement copy into the standard host.
      </p>

      <div style={scenario4NoteStyle}>
        Portal host is <code>document.body</code> (not{' '}
        <code>useSpatialPortalContainer()</code>) because there is no parent
        SpatialDiv. <code>DropdownMenu.Content asChild</code> makes the menu
        surface itself the Radix Content node, so the main page does not keep a
        separate visible content shell.
      </div>

      <div style={{ marginTop: '18px' }}>
        <DropdownMenu.Root
          open={visibleOpen}
          onOpenChange={nextOpen => {
            setVisibleOpen(nextOpen)
            onLog(`visible root -> ${nextOpen ? 'open' : 'closed'}`)
          }}
          modal={false}
        >
          <DropdownMenu.Trigger asChild>
            <button style={scenario4TriggerStyle}>Open Plugin Host Menu</button>
          </DropdownMenu.Trigger>

          {portalContainer && (
            <DropdownMenu.Portal container={portalContainer}>
              <DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={12}
                collisionPadding={12}
                onCloseAutoFocus={event => event.preventDefault()}
                asChild
              >
                <div
                  enable-xr
                  data-name="scenario4-menu-surface"
                  className="dropdown-spatial-menu"
                  style={scenario4InnerSurfaceStyle}
                >
                  <div style={scenario4SurfaceBadgeStyle}>
                    Content asChild enable-xr surface
                  </div>
                  <div
                    style={{
                      color: '#334155',
                      fontSize: '12px',
                      lineHeight: 1.6,
                    }}
                  >
                    Spatial menu surface on the main page — not wrapped by a
                    parent SpatialDiv.
                  </div>
                  <OverlayTarget />
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          )}
        </DropdownMenu.Root>

        {portalContainer && (
          <DropdownMenu.Root open modal={false}>
            <DropdownMenu.Trigger asChild>
              <button
                aria-hidden="true"
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              >
                shadow trigger
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal container={portalContainer}>
              <DropdownMenu.Content
                data-name="scenario4-shadow-content"
                style={scenario4ShadowContentStyle}
              >
                {PLUGIN_LIST.map(identifier => (
                  <PluginMenuItem
                    key={identifier}
                    identifier={identifier}
                    onLog={onLog}
                    {...renderProps}
                  />
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </div>
  )
}
