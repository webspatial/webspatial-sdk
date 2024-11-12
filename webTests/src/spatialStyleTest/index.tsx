import React from 'react'
import ReactDOM from 'react-dom/client'
import { CSSModelSample } from './CSSModelSample';
import { StyledTitleComponent } from './StyledTitleComponent';
import { SpatialMonitor } from 'web-spatial'
import { SpatialTagComponent } from './SpatialTagComponent';

function App() {
    return (
        <div className='w-screen h-screen  '>

            <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
                <a href="#" onClick={() => history.go(-1)}>Go Back</a>
            </div>

            <SpatialMonitor className='w-screen h-screen  ' >
                <SpatialTagComponent />
                <StyledTitleComponent />
                <CSSModelSample />

            </SpatialMonitor>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)
