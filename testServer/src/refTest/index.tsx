import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'
import { TestClassComponent } from './TestClassComponent'
import { TestStyleComponent } from './TestStyleComponent'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#">Go Back</a>
      </div>

      <TestStyleComponent />

      <TestClassComponent />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
