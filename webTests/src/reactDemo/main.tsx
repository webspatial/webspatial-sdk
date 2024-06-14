import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import { SpatialDiv } from '../../lib/webSpatialComponents'


function App() {
    return (
        <>
            <div className="flex text-white">
                <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
                    <h1>This is standard HTML</h1>
                </div>
            </div>

            <div className="flex text-white h-64 m-10">
                <SpatialDiv webViewID='A' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 100 }}>
                    <div className="text-white bg-red-300 bg-opacity-20 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center'>Hello world always works</p>
                    </div>
                </SpatialDiv>
                <SpatialDiv webViewID='B' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 50 }}>
                    <div className="text-white bg-green-300  bg-opacity-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center' remote-click="(window).wx.log('trevor here')">Hello world 2</p>
                    </div>
                </SpatialDiv>
                <SpatialDiv webViewID='C' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 25 }}>
                    <div className="text-white bg-blue-300  bg-opacity-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center'>Hello world 5</p>
                    </div>
                </SpatialDiv>
                <SpatialDiv webViewID='D' className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 10 }}>
                    <div className="text-white bg-yellow-300  bg-opacity-10 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                        <p className='text-center'>Hello world</p>
                    </div>
                </SpatialDiv>
            </div>
            <div className="flex m-10 bg-red-300 bg-opacity-5 text-white h-64"></div>
            <div className="flex m-10 bg-red-300 bg-opacity-5 text-white h-64"></div>
            <div className="flex m-10 bg-red-300 bg-opacity-5 text-white h-64"></div>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)

