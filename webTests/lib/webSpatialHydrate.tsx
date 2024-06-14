import ReactDOM from 'react-dom/client'
import React from 'react'
import { SpatialIFrame } from './webSpatialComponents'

var elements = document.querySelectorAll("[custom-spatial]")
var wvCounter = 0
for (var e of elements) {
    ReactDOM.createRoot(e).render(
        <React.StrictMode>
            <SpatialIFrame spatialOffset={{ z: 50 }} className='' src="google.com">
                {/* <div dangerouslySetInnerHTML={{ __html: e.innerHTML }}></div> */}
            </SpatialIFrame>
        </React.StrictMode >,
    )
}