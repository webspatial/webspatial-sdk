import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import { Provider } from 'react-redux'
import { initStateWithPrevTab } from 'redux-state-sync';
import { useDispatch, useSelector } from "react-redux";
import store, { increment } from "./store.ts"

console.log("A")
initStateWithPrevTab(store);
console.log("B")

function App() {
    const sharedCount = useSelector((state: any) => state.count.value);
    const dispatch = useDispatch()

    return (
        <>
            <div className="flex text-white">
                <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
                    <h1>Hello Web Spatial</h1>
                </div>
            </div>

            <div className="flex text-white">

                <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">

                    <h1>test: {sharedCount}</h1>
                    <button className="px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                        onClick={async (e) => {
                            dispatch(increment())
                        }}>
                        Incremet
                    </button>
                </div>
            </div>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode >,
)

