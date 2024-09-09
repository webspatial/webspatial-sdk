import React from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialStyleComponent } from './SpatialStyleComponent';

function App() {
    return (
        <div className='w-screen h-screen flex flex-row base-200' >
            <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
                <a href="#" onClick={() => history.go(-1)}>Go Back</a>
            </div>
            <div className="flex flex-col flex-1">
                <SpatialStyleComponent />
            </div>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)