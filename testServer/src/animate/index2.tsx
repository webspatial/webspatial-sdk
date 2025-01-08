import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@xrsdk/react'
import { PopmotionTest } from './PopmotionTest'
import { TeenjsTest } from './TeenjsTest'
import { GSAPTest } from './GSAPTest'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#">Go Back</a>
      </div>

      <div className="m-10">
        <PopmotionTest />

        <TeenjsTest />

        <GSAPTest />
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
