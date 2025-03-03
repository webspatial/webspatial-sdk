import React from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@webspatial/core-sdk'
import { SpatialDiv } from '@webspatial/react-sdk'

// 初始化空间会话
const spatial = new Spatial()
const session = spatial.requestSession()

if (session) {
  session.getCurrentWindowComponent().setStyle({
    material: { type: 'translucent' },
    cornerRadius: 70,
  })
}

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 导航栏 */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5">
        <a href="/" className="hover:text-blue-400 transition-colors">
          返回主页
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          返回上一级
        </a>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <SpatialDiv
          spatialStyle={{
            position: { z: 50 }, // z方向凸起50
          }}
          className="text-6xl font-bold text-white p-8 bg-blue-500 rounded-xl"
        >
          Z轴浮起--50
        </SpatialDiv>
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
