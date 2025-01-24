import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@xrsdk/runtime'

const spatial = new Spatial()
const session = spatial.requestSession()

if (session) {
  session.getCurrentWindowComponent().setStyle({
    material: { type: 'default' },
    cornerRadius: 70,
  })
}

function App() {
  return (
    <div className="p-8">
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-8 gap-5 mb-8">
        <a href="/" className="hover:text-blue-400">
          返回首页
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/src/qaTestApp/index.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">3D文字测试</h2>
          <p className="text-sm opacity-80">测试空间文字渲染效果</p>
        </a>

        <a
          href="/src/qaTestApp/domapi.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">DOM API测试</h2>
          <p className="text-sm opacity-80">测试DOM样式和类操作</p>
        </a>
        <a
          href="/src/qaTestApp/materialApiTest/materialapi.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Material API测试</h2>
          <p className="text-sm opacity-80">Tests for Material APIs</p>
        </a>

        <a
          href="/src/qaTestApp/domapiTest/domapi1.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">DOM API Test</h2>
          <p className="text-sm opacity-80">测试DOM样式和类操作</p>
        </a>

        <a
          href="/src/qaTestApp/depthPositionTest/index.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">Depth Position</h2>
          <p className="text-sm opacity-80">测试SpatialDiv depth position</p>
        </a>

        <a
          href="/src/qaTestApp/CssAPITest/cssapi.html"
          className="p-6 bg-blue-500 bg-opacity-25 rounded-xl text-white hover:bg-opacity-40 transition-all"
        >
          <h2 className="text-xl font-bold mb-2">CSS API Test</h2>
          <p className="text-sm opacity-80">测试CSS API</p>
        </a>
      </div>
    </div>
  )
}

// 创建根元素并渲染
const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
