import { MenuLogPanel } from './components/MenuLogPanel'
import { useMenuLogs } from './hooks/useMenuLogs'
import { latestLogStyle, pageStyle, sectionStyle } from './pageStyles'
import { Scenario1MainPageFloatingMenu } from './scenarios/Scenario1MainPageFloatingMenu'
import { Scenario2SpatialDivFlatMenu } from './scenarios/Scenario2SpatialDivFlatMenu'
import { Scenario3ChildFloatingMenu } from './scenarios/Scenario3ChildFloatingMenu'
import { Scenario4PluginHostMenu } from './scenarios/Scenario4PluginHostMenu'
import { Scenario5SpatialPluginHostMenu } from './scenarios/Scenario5SpatialPluginHostMenu'

export function DropdownMenuSpatialPage() {
  const {
    logs,
    latestLog,
    logMainFloating,
    logSpatialFlat,
    logSpatialChildFloating,
    logPluginHost,
    logSpatialPluginHost,
  } = useMenuLogs()

  return (
    <div style={pageStyle}>
      <a href="#" onClick={() => history.go(-1)} style={{ color: '#93c5fd' }}>
        Go Back
      </a>
      <h1 style={{ margin: '20px 0 8px', fontSize: '24px' }}>
        Radix DropdownMenu + SpatialDiv
      </h1>
      <p style={{ maxWidth: '880px', margin: 0, color: '#94a3b8' }}>
        Scenario 1: main-page menu with <code>div enable-xr</code>. Scenario 2:
        flat menu inside SpatialDiv via <code>useSpatialPortalContainer()</code>
        . Scenario 3: nested <code>enable-xr</code> child surface that escapes
        parent bounds. Scenario 4: plugin-host dual-root on a flat page (no
        outer <code>enable-xr</code>), with{' '}
        <code>DropdownMenu.Content asChild</code>
        targeting the menu-only spatial surface. Scenario 5: plugin-host
        dual-root inside a parent <code>enable-xr</code> surface.
      </p>
      <div style={latestLogStyle}>{latestLog}</div>

      <Scenario1MainPageFloatingMenu onLog={logMainFloating} />

      <div style={sectionStyle}>
        <Scenario2SpatialDivFlatMenu onLog={logSpatialFlat} />
        <Scenario3ChildFloatingMenu onLog={logSpatialChildFloating} />
      </div>

      <section style={{ marginTop: '24px' }}>
        {/* <Scenario4PluginHostMenu onLog={logPluginHost} /> */}
      </section>

      <section style={{ marginTop: '24px' }}>
        <Scenario5SpatialPluginHostMenu onLog={logSpatialPluginHost} />
      </section>

      <MenuLogPanel logs={logs} latestLog={latestLog} />
    </div>
  )
}
