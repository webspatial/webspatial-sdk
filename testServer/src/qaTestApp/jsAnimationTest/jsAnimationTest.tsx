// @ts-nocheck
import React, { useRef, useState, useEffect, CSSProperties } from 'react'
import ReactDOM from 'react-dom/client'
import { PopmotionTest } from './popMotion.tsx'
import { ReactSpringTest } from './reactSpringTest.tsx'
import { GSAPTest } from './GSAPTest.tsx'
import { TeenjsTest } from './teenjsTest.tsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 p-44">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <div
          enable-xr
          style={{
            position: { z: 50 }, // Bulge 50 in the z direction
          }}
          className="text-6xl font-bold text-white p-8 rounded-xl"
        >
          JS Animation Tests
        </div>
      </h1>
      {/* Navigation Bar */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a href="/" className="hover:text-blue-400 transition-colors">
          Return to home page
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Go back
        </a>
      </div>

      <PopmotionTest />
      <ReactSpringTest />
      <GSAPTest />
      <TeenjsTest />
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
