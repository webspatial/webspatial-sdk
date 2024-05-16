import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import WebSpatial from '../../lib/webSpatial'
import ReactDomServer from 'react-dom/server';

(window as any).wx = WebSpatial
function App() {
    const myDiv = useRef(null);
    useEffect(() => {
        (window as any).updatePanelContent = (str: string) => {
            WebSpatial.log("GOT MESSAGE! :" + str);
            (myDiv.current! as HTMLElement).innerHTML = str
        }
    })
    return (
        <div className='w-screen h-screen' ref={myDiv}>

        </div>
        // <div className="text-white bg-white bg-opacity-10 flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        //     <p className='text-center'>Hello world</p>
        // </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)

