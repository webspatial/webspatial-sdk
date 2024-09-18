import { Spatial } from 'web-spatial';

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
        var wc = (await session.getCurrentWindowComponent())
        var ent = await wc.getEntity()
        await e.setParent(ent!)
        await e.updateTransform()

        //create an window
        let i = await session.createWindowComponent()
        await Promise.all([
            i.loadURL("/src/embed/basic.html"),
            i.setScrollEnabled(false),
            e.setCoordinateSpace("Dom"),
            i.setResolution(300, 300),
        ])
        //bind window to entity
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
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    await (await session.getCurrentWindowComponent()).setStyle({ glassEffect: true, cornerRadius: 50 })
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

async function webViewMemoryLeakTest() {
    var testResult = []
    var failure_reasons = ""
    var spatial = new Spatial()
    let session = await spatial.requestSession()
    if (!spatial.isSupported()) {
        return testResult = ["WebView JS API", false, ""]
    }

    await session.log("Trying to load webview")
    if (!spatial.isSupported()) {
        return testResult = ["WebView JS API", false, ""]
    }

    //creating webview 1 and get memory stats
    try {
        await session.log("Trying to load webview 1")

        console.log('a')
        console.log(session)
        var e = await session.createEntity()
        console.log('b')
        e.transform.position.x = 500
        e.transform.position.y = 300
        e.transform.position.z = 300
        var wc = (await session.getCurrentWindowComponent())
        var ent = await wc.getEntity()
        await e.setParent(ent!)
        await e.updateTransform()

        //create an window
        let i = await session.createWindowComponent()
        await Promise.all([
            i.loadURL("/src/embed/basic.html"),
            i.setScrollEnabled(false),
            e.setCoordinateSpace("Dom"),
            i.setResolution(300, 300),
        ])
        //bind window to entity
        await e.setComponent(i)
        var webview1 = await session.getStats()
        session.log("Webview 1 Stats: " + JSON.stringify(webview1))
        const windowArrayLength = webview1.refObjects.windowArray.length
        session.log("Webview Ref Counts: " + windowArrayLength)
        if (windowArrayLength != 2) {
            failure_reasons += "WebView 1 webViewRefs not equal to 2 got " + webview1.data.webViewRefs + "\n"
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        await e.destroy()
        await i.destroy()
        await session.log("WebView 1 destroy complete")
    } catch (e) {
        testResult = ["Error Creating Webview 1 During Mem Leak Test", false, e]
        return testResult
    }

    //creating webview 2 and get memory stats
    try {
        await session.log("Trying to load webview 2")

        console.log('a')
        console.log(session)
        var e = await session.createEntity()
        console.log('b')
        e.transform.position.x = 500
        e.transform.position.y = 300
        e.transform.position.z = 300
        var wc = (await session.getCurrentWindowComponent())
        var ent = await wc.getEntity()
        await e.setParent(ent!)
        await e.updateTransform()

        //create an window
        let i = await session.createWindowComponent()
        await Promise.all([
            i.loadURL("/src/embed/basic.html"),
            i.setScrollEnabled(false),
            e.setCoordinateSpace("Dom"),
            i.setResolution(300, 300),
        ])
        //bind window to entity
        await e.setComponent(i)
        var webview2 = await session.getStats()
        const windowArrayLength = webview1.refObjects.windowArray.length
        session.log("Webview 2 Stats: " + JSON.stringify(webview2))
        session.log("Webview Ref Counts: " + windowArrayLength)
        if (windowArrayLength != 2) {
            failure_reasons += "WebView 2 webViewRefs not equal to 2\n"
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        await e.destroy()
        await i.destroy()
        await session.log("WebView 2 destroy complete")
    } catch (e) {
        testResult = ["Error Creating Webview 2 During Mem Leak Test", false, e]
        return testResult
    }
    if (failure_reasons) {
        testResult = ["WebView Memory Leak Test", false, failure_reasons]
        return testResult
    } else {
        testResult = ["WebView Memory Leak Test", true, ""]
        return testResult
    }
}

var allTests = [createSession, createWebViewJSAPI, changeWebViewStyle, webViewMemoryLeakTest] 

class TestRunner {
    _started = false
    start() {
        this._started = true;
        (async () => {
            for (let test of allTests) {
                var result = await test()
                this._onTestCompleteInternal({ name: result[0], result: result[1] ? "Pass" : "Fail", reason: result[2] })
            }
        })();
    }
    stop() {
        this._started = false
    }
    _onTestCompleteInternal = (tr: any) => {
        if (this._started) {
            this.onTestComplete(tr)
        }

    }
    onTestComplete = (tr: any) => { }
}

function App() {
    const [testResults, setTestResults] = useState([] as Array<any>)

    useEffect(() => {
        let tr = new TestRunner()
        tr.onTestComplete = (testResult) => {
            setTestResults((ol) => [...ol, testResult])
        }
        tr.start();
        return () => {
            tr.stop()
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
    <App />
)

