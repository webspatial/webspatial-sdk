import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialStyleComponent } from './SpatialStyleComponent';
import { CSSModelSample } from './CSSModelSample';
import { StyledTitle, StyledTitle2, StyledTitleComponent } from './StyledTitle';
import { FpsView } from 'react-fps';

import { injectWebSpatialCapability, useMonitorDocumentChange, SpatialMonitor } from 'web-spatial'

const JackComponent = (props: any) => {
    const [isPrimary, setIsPrimary] = useState(true)
    const onClick = () => {
        setIsPrimary(v => !v)
    }

    useEffect(() => {
        console.log('dbg begin JackComponent')
        return () => {
            console.log('dbg end JackComponent')
        }
    }, [])

    const style = {
        background: 'yellow',
        color: isPrimary ? 'red' : 'green',
        back: isPrimary ? 72 : 46
    }

    return <div style={style} onClick={onClick} className='text-blue bg-base-200	bg-clip-border px-6 py-6 '>
        this is JackComponent
        <p> no!! </p>

        {props.children}

    </div>
}

function App() {
    console.log('dbg in App')

    useMonitorDocumentChange()

    const array1To100 = Array(1).fill(0).map((_, index) => index + 1);
// console.log(array1To100);
 
    return (
        <>
        {/* <FpsView width={240} height={80} bottom={60} right={80}/> */}
        <SpatialMonitor className='w-screen h-screen columns-3 gap-4' >
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

// monitorGlobalStyles()
injectWebSpatialCapability()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)
