import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialStyleComponent } from './SpatialStyleComponent';
import { CSSModelSample } from './CSSModelSample';
import { StyledTitle, StyledTitle2, StyledTitleComponent } from './StyledTitle';

import { monitorGlobalStyles } from 'web-spatial'

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
        // background: 'blue',
        color: isPrimary ? 'red' : 'green'
    }

    return <div style={style} onClick={onClick} className='text-blue bg-base-200	bg-clip-border px-6 py-6 '>
        this is JackComponent
        <p> no!! </p>

        {props.children}

    </div>
}





function App() {
    console.log('dbg in App')

    return (
        <div className='w-screen h-screen flex flex-row base-200' >
            <StyledTitleComponent></StyledTitleComponent>
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
        </div>
    )
}

monitorGlobalStyles()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)
