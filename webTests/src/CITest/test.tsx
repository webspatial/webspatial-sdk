import { Spatial } from 'web-spatial/src';

import React, { useEffect, useRef, useState, } from 'react'
import ReactDOM from 'react-dom/client'

// document.body.style.background = 'red';

async function createSession() {
    var testResult = []
    var spatial: Spatial | null = new Spatial();
    if (!spatial.isSupported()) {
        spatial = null
    }
    var session;
    if (spatial) {
        session = spatial.requestSession()
        testResult = ["CreateSpatialSession", true]
        return testResult
    }
    else {
        testResult = ["CreateSpatialSession", false, "Spatial not supported"]
        return testResult
    }

}

async function createWebViewJSAPI() {
    var testResult = []
    var spatial = new Spatial()
    let session = await spatial.requestSession()
    if (!spatial.isSupported()) {
        return testResult = ["WebView JS API", false, ""]
    }
    try {
        await session.log("Trying to load webview")

        console.log('a')
        console.log(session)
        var e = await session.createEntity()
        console.log('b')
        e.transform.position.x = 500
        e.transform.position.y = 300
        e.transform.position.z = 300
        await e.setParentWindowGroup(await session.getCurrentWindowGroup())
        await e.updateTransform()

        //create an iframe
        let i = await session.createIFrameComponent()
        await Promise.all([
            i.loadURL("/src/embed/basic.html"),
            i.setScrollEnabled(false),
            i.setInline(true),
            i.setResolution(300, 300),
        ])
        //bind iframe to entity
        await e.setComponent(i)

        //position update
        var loop = (time: DOMHighResTimeStamp) => {
            if (e.isDestroyed()) {
                return
            }
            session.requestAnimationFrame(loop)
            e.transform.position.x = 500 + Math.sin(time / 1000) * 200
            e.updateTransform()
        }
        session.requestAnimationFrame(loop)

        //destory
        await new Promise(resolve => setTimeout(resolve, 5000));
        await e.destroy()
        await i.destroy()
        await session.log("destroy complete")

        testResult = ["WebView JS API", true, ""]
        return testResult
    } catch (e) {
        testResult = ["WebView JS API", false, e]
        return testResult
    }
}
async function changeWebViewStyle() {
    var testResult = []
    var spatial = new Spatial()
    let session = await spatial.requestSession()
    if (!spatial.isSupported()) {
        return testResult = ["WebView JS API", false, ""]
    }
    await (await session.getCurrentIFrameComponent()).setStyle({ glassEffect: true, cornerRadius: 50 })
    document.documentElement.style.backgroundColor = "transparent";
    document.body.style.backgroundColor = "transparent"

    if (document.body.style.backgroundColor === "transparent") {
        testResult = ["SetGlassBackground", true, ""]
        return testResult
    }
    else {
        testResult = ["SetGlassBackground", false, ""]
        return testResult
    }
}

var allTests = [createSession, createWebViewJSAPI, changeWebViewStyle]

function App() {
    const [testResults, setTestResults] = useState([] as Array<any>)
    useEffect(() => {
        (async () => {
            let allResults = [] as Array<any>
            for (let test of allTests) {
                var result = await test()
                allResults.push({ name: result[0], result: result[1] ? "Pass" : "Fail", reason: result[2] })
            }
            setTestResults(allResults)
        })();

        return () => {
        }
    }, [])
    //console.log(testResults)
    return (<>
        <h1>All test</h1>

        {testResults.map((testResult, i) => {
            return (
                <div
                    key={i}
                    style={{ backgroundColor: testResult.result === "Pass" ? "green" : "red" }}
                >
                    <h1>{testResult.name}</h1>
                    {testResult.result}: {testResult.reason}
                </div>
            );
        })}

    </>)
}

var root = document.createElement('div');
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode >,
)

