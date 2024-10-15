import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialStyleComponent } from './SpatialStyleComponent';
import { CSSModelSample } from './CSSModelSample';
import { StyledTitle, StyledTitle2, StyledTitleComponent } from './StyledTitle';
import { FpsView } from 'react-fps';

import { SpatialMonitor } from 'web-spatial'
import { SimpleSpatialComponent } from './SimpleSpatialComponent';

function App() { 
    const array1To100 = Array(1).fill(0).map((_, index) => index + 1);
// console.log(array1To100);
 
    return (
        <>
        {/* <FpsView width={240} height={80} bottom={60} right={80}/> */}
        <SimpleSpatialComponent></SimpleSpatialComponent>
        <SpatialMonitor className='w-screen h-screen  ' >
            {array1To100.map(i => <StyledTitleComponent key={i} ></StyledTitleComponent>)}
            
            {/* <JackComponent isSpatial />  */}
            {/* <StyledTitle  onClick={onClick}  $primary={isPrimary} style={style} > this is style component </StyledTitle> */}

            {/* <StyledTitle  onClick={onClick}  $primary={isPrimary} > this is second style component </StyledTitle> */}

            {/* <CSSModelSample /> */}

            {/* <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
                <a href="#" onClick={() => history.go(-1)}>Go Back</a>
            </div> */}

            {/* <div className="flex flex-col flex-1">
                <SpatialStyleComponent />
            </div> */}

            {/* <JackComponent  > good luck < /JackComponent> */}
        </SpatialMonitor>
        </>
        
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)
