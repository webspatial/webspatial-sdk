import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function CaseConverter() {
  return (
    <>
      <div>other content</div>
      <div
        enable-xr
        enablegesture={true}
        style={{
          width: '800px',
          height: '800px',
          transform: 'rotateZ(30deg)',
        }}
      >
        <div
          enable-xr
          enablegesture={true}
          debugName="GreenSpatialDiv"
          onClick={() => {
            console.log('hi tom')
          }}
          style={{
            width: '200px',
            height: '100px',
            position: 'absolute',
            top: 100,
            left: 100,
            '--xr-back': 0,
            // transform: 'rotateZ(90deg)',
            backgroundColor: 'green',
          }}
        >
          GreenSpatialDiv
        </div>

        <div
          enable-xr
          enablegesture={true}
          debugName="BlueSpatialDiv"
          onClick={() => {
            console.log('hi tom')
          }}
          style={{
            width: '200px',
            height: '100px',
            position: 'absolute',
            top: 100,
            left: 100,
            '--xr-back': 0,
            transform: 'translateZ(100px) rotateY(90deg)',
            backgroundColor: 'blue',
          }}
        >
          BlueSpatialDiv
        </div>
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<CaseConverter />)
