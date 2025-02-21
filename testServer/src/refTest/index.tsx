// @ts-nocheck
import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'
import { TestClassComponent } from './TestClassComponent'
import { TestStyleComponent } from './TestStyleComponent'
import { TestNestedClassComponent } from './TestNestedClassComponent'
import React from 'react'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>
      <TestStyleComponent />
      <TestClassComponent />
      <TestNestedClassComponent />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
