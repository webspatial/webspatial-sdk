import {
  useSpatialOverlay,
  useSpatialPortalContainer,
  type SpatialOverlayPortalOption,
} from '@webspatial/react-sdk'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React, { useCallback, useMemo, useState } from 'react'
import { getDropdownMenuItemStyle } from '../menuLayout'
import {
  scenario4InnerSurfaceStyle,
  scenario4NoteStyle,
  scenario4ShadowContentStyle,
  scenario4SurfaceBadgeStyle,
  scenario4TriggerStyle,
} from '../scenario4Styles'
import {
  scenarioDescriptionStyle,
  scenarioHeadingStyle,
  spatialPanelStyle,
} from '../pageStyles'
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

const scenario5ParentStyle: React.CSSProperties = {
  ...spatialPanelStyle,
  minHeight: '300px',
  outline: '2px dashed rgba(56, 189, 248, 0.5)',
  outlineOffset: '-2px',
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
      data-name={`scenario5-plugin-item-${identifier}`}
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

function Scenario5SpatialPluginHostContent({ onLog }: { onLog: MenuLogFn }) {
  const portalContainer = useSpatialPortalContainer()
  const { OverlayTarget, portalMenuOption } = useSpatialOverlay({
    portalTargetName: 'scenario5-plugin-portal-target',
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
    <>
      <h2 style={scenarioHeadingStyle}>
        Scenario 5 — Plugin-host dual-root inside parent SpatialDiv
      </h2>
      <p style={{ ...scenarioDescriptionStyle, margin: '0 0 12px' }}>
        Parent host is a <code>div enable-xr</code>. The visible menu root and
        the plugin shadow root portal into the parent spatial window, while the
        menu surface itself is a child <code>enable-xr</code> surface.
      </p>

      <div style={scenario4NoteStyle}>
        Portal host is <code>useSpatialPortalContainer()</code> from inside the
        parent SpatialDiv. This keeps the trigger, Radix measurement shell, and
        plugin shadow root in the parent spatial window before{' '}
        <code>SpatialOverlay</code> forwards plugin items into the menu surface.
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
            <button style={scenario4TriggerStyle}>
              Open Spatial Plugin Host Menu
            </button>
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
                  data-xr-overlay
                  data-name="scenario5-menu-surface"
                  className="dropdown-spatial-menu"
                  style={scenario4InnerSurfaceStyle}
                >
                  <div style={scenario4SurfaceBadgeStyle}>
                    Content asChild child enable-xr surface
                  </div>
                  <div
                    style={{
                      color: '#334155',
                      fontSize: '12px',
                      lineHeight: 1.6,
                    }}
                  >
                    Spatial menu surface inside a parent SpatialDiv.
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
                data-name="scenario5-shadow-content"
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
    </>
  )
}

/**
 * Scenario 5 — Plugin-host dual-root inside parent SpatialDiv
 *
 * Structure:
 *   Parent div enable-xr  (plugin host is itself spatial)
 *     visible root:
 *       Trigger in parent spatial window
 *       Portal -> useSpatialPortalContainer()
 *       Content asChild -> child div enable-xr
 *         standard copy -> SpatialOverlay measurement target
 *         spatial portal copy -> plugin portal target
 *
 *     shadow root:
 *       Plugin items in parent spatial window
 *       portalMenuOption -> measurement copy + child menu portal target
 */
export function Scenario5SpatialPluginHostMenu({
  onLog,
}: {
  onLog: MenuLogFn
}) {
  return (
    <div
      enable-xr
      data-name="Scenario 5 Spatial Plugin Host Parent"
      style={scenario5ParentStyle}
    >
      <Scenario5SpatialPluginHostContent onLog={onLog} />
    </div>
  )
}
