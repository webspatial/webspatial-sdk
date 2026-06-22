/**
 * Shared nav links across spatial-vite-min HTML entry points.
 */
export function FixtureNav() {
  return (
    <nav
      style={{
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <a href="/">Lazy default</a>
      <span aria-hidden="true">|</span>
      <a href="/xr-monitor.html">enable-xr-monitor</a>
      <span aria-hidden="true">|</span>
      <a href="/eager-lean.html">Eager, no boot</a>
    </nav>
  )
}
