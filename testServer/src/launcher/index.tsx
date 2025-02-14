import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { getSession } from '@xrsdk/react'
import { SpatialHelper } from '@xrsdk/runtime'

const apps = [
  // { name: "Settings", url: "", icon: "⚙️" },
  // { name: "Browser", url: "", icon: "🌐" },
  { name: 'Home', url: '/', icon: '🏠' },
  {
    name: 'Clock',
    url: '/src/clockApp/index.html',
    icon: '⏰',
    options: { dimensions: { x: 880, y: 200 } },
  },
  {
    name: 'TikTok',
    url: 'http://www.tiktok.com/',
    icon: '▶️',
    options: { dimensions: { x: 400, y: 650 } },
  },
  // { name: "Game", url: "", icon: "🎮" },
  // { name: "Calculator", url: "", icon: "🧮" },
  {
    name: 'Terminal',
    url: '/src/terminal/index.html',
    icon: '💻',
    options: { dimensions: { x: 650, y: 400 } },
  },
  {
    name: 'ModelViewer',
    url: '/src/modelViewer/index.html',
    icon: '📦',
    options: { type: 'volume' },
  },
  {
    name: 'Memory Stats',
    icon: '📊',
    url: '/src/memoryStats/index.html',
    options: {
      dimensions: { x: 300, y: 600 },
    },
  },
]
function App() {
  useEffect(() => {
    ;(async () => {
      if (getSession()) {
        await getSession()
          ?.getCurrentWindowComponent()
          .setStyle({
            cornerRadius: 50,
            material: { type: 'default' },
          })
        document.body.style.backgroundColor = '#22339933'
      }
    })()
  }, [])

  return (
    <div className="h-full p-2 flex gap-4 justify-center">
      {apps.map(({ name, icon, url, options }) => (
        <div
          key={name}
          className={`p-2 flex flex-col items-center cursor-pointer rounded-xl transition-all bg-gray-800"
                        } hover:bg-gray-700`}
          onClick={() => {
            if (options?.type == 'volume') {
              SpatialHelper.instance?.navigation.openVolume(url)
            } else {
              SpatialHelper.instance?.navigation.openPanel(url, options as any)
            }
          }}
        >
          <span className="text-2xl">{icon}</span>
          <span className="text-white text-xs mt-1">{name}</span>
        </div>
      ))}
    </div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
