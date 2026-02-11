import React from 'react'
import { Link, useLocation } from 'react-router-dom'
export const routes = [
  { path: '/', label: 'Home' },
  { path: '/animate', label: 'Animations' },
  {
    path: '/reality',
    label: 'Reality',
    children: [
      { path: '/reality', label: 'Basic Reality' },
      { path: '/reality/debug', label: 'Reality Debug' },
      { path: '/reality/dynamic3d', label: 'Dynamic 3D' },
      { path: '/reality/gestures', label: 'Gestures' },
      { path: '/reality/spatial-div', label: 'Spatial Div Dynamic' },
      { path: '/reality/empty', label: 'Empty' },
      { path: '/reality/geometry-entity', label: 'Geometry Entity' },
      { path: '/reality/interactable', label: 'Interactable' },
      { path: '/reality/issue', label: 'Issue' },
      { path: '/reality/low', label: 'Low' },
      { path: '/reality/nested', label: 'Nested' },
      { path: '/reality-test', label: 'Legacy Reality Test' },
    ],
  },
  { path: '/basic-transform', label: 'Basic Transform' },
  { path: '/model-test', label: 'Model Test' },
  { path: '/spatialStyleTest', label: 'Spatial Style' },
  { path: '/canvas-test', label: 'Canvas Test' },
  { path: '/jsapi-test', label: 'JS API Test' },
  {
    path: '/scene',
    label: 'Scene',
    children: [
      { path: '/scene', label: 'Scene Landing' },
      { path: '/scene/hook', label: 'Hook' },
      { path: '/scene/loading', label: 'Loading' },
      { path: '/scene/volume', label: 'Volume' },
      { path: '/scene/volume-hook', label: 'Volume Hook' },
      { path: '/scene/xrapp', label: 'XR App' },
      { path: '/scene/nosdk', label: 'No SDK' },
    ],
  },
  {
    path: '/spatial-drag-gesture',
    label: 'Gestures',
    children: [
      { path: '/spatial-drag-gesture', label: 'Drag' },
      { path: '/spatial-rotation-gesture', label: 'Rotate' },
      { path: '/spatial-magnify-gesture', label: 'Magnify' },
      { path: '/spatial-guesture', label: 'Event Propagation' },
    ],
  },
  {
    path: '/background-material',
    label: 'Misc',
    children: [
      { path: '/background-material', label: 'Background Material' },
      { path: '/fixed-position-test', label: 'Fixed Position' },
      { path: '/android-bringup', label: 'Android Bringup' },
      { path: '/display-test', label: 'Display Test' },
      { path: '/memory-stats', label: 'Memory Stats' },
      { path: '/nested-fix-position', label: 'Nested Fix Position' },
      { path: '/nested-scroll', label: 'Nested Scroll' },
      { path: '/spatial-converter', label: 'Spatial Converter' },
      { path: '/spatial-corner', label: 'Spatial Corner' },
      { path: '/static-3d-model', label: 'Static 3D Model' },
      { path: '/visible-test', label: 'Visible Test' },
    ],
  },
  {
    path: '/cleanup',
    label: 'Cleanup',
    children: [
      { path: '/cleanup/spa', label: 'SPA' },
      { path: '/cleanup/iframe', label: 'Iframe' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const items = routes

  return (
    <div className="w-64 h-screen bg-[#111111] border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="text-xl font-bold text-blue-400">
          WebSpatial SDK
        </Link>
        <div className="text-xs text-gray-500 mt-1">Test Application</div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map(route => (
          <div key={route.path}>
            <Link
              to={route.path}
              className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === route.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {route.label}
            </Link>
            {route.children && (
              <div className="ml-4 mt-1 space-y-1">
                {route.children.map(child => (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`block px-4 py-1.5 rounded-lg text-xs transition-colors ${
                      location.pathname === child.path
                        ? 'bg-blue-900/50 text-blue-200 border border-blue-800'
                        : 'text-gray-500 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <a
          href="https://github.com/webspatial/webspatial-sdk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </div>
  )
}
