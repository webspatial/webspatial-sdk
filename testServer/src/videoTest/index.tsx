// @ts-nocheck
import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen  ">
      <video
        enable-xr
        optimized
        style={{
          '--xr-back': 10,
          width: '600px',
          aspectRatio: '16/9',
          transform: 'translateX(100px)',
        }}
        controls
        poster="https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_s5_both.jpg"
      >
        <source
          src="https://archive.org/download/ElephantsDream/ed_hd.avi"
          type="video/avi"
        />
        <source
          src="https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4"
          type="video/mp4"
        />
        Sorry, your browser doesn't support embedded videos, but don't worry,
        you can
        <a
          href="https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4"
          download="ed_1024_512kb.mp4"
        >
          download the MP4
        </a>
        and watch it with your favorite video player!
      </video>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
