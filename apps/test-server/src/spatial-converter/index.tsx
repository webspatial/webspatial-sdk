import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  Spatialized2DElementContainer,
} from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  // const placeHolderContent = <div>this is spatialdiv</div>
  const style = {
    width: '100px',
    height: '200px',
    // background: 'blue',
    borderRadius: '10px',
    '--xr-background-material': 'transparent',
    '--xr-back': '200px',
    transform: 'translateX(100px) rotateY(30deg)',
  }

  return (
    <>
      <div style={{ width: '100px', height: '100px' }}>
        Start of SpatializedContainer
      </div>
      <Spatialized2DElementContainer style={style} component="div">
        this is spatialdiv
        <a href="https://www.baidu.com">this is a link</a>
        <button>this is a button</button>
      </Spatialized2DElementContainer>
      <div> End of SpatializedContainer </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
