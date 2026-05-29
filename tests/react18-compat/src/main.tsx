import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

function App() {
  return (
    <main enable-xr>
      <section
        enable-xr
        style={{ '--xr-depth': '24px', '--xr-background-material': 'glass' }}
        onSpatialTap={() => undefined}
      >
        React 18 compatibility
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
