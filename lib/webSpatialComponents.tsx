import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import ReactDomServer from 'react-dom/server';
import { Spatial, SpatialEntity, SpatialIFrameComponent, SpatialSession } from './webSpatial';

export function SpatialDebug() {
    return (
        <div>
            debug
        </div>
    )
}
function getInheritedStyle(from: HTMLElement) {
    //https://stackoverflow.com/questions/5612302/which-css-properties-are-inherited
    var inheritStyleProps = [
        [["azimuth"], ["azimuth"]],
        [["border-collapse"], ["borderCollapse"]],
        [["border-spacing"], ["borderSpacing"]],
        [["caption-side"], ["captionSide"]],
        [["color"], ["color"]],
        [["cursor"], ["cursor"]],
        [["direction"], ["direction"]],
        [["elevation"], ["elevation"]],
        [["empty-cells"], ["emptyCells"]],
        [["font-family"], ["fontFamily"]],
        [["font-size"], ["fontSize"]],
        [["font-style"], ["fontStyle"]],
        [["font-variant"], ["fontVariant"]],
        [["font-weight"], ["fontWeight"]],
        [["font"], ["font"]],
        [["letter-spacing"], ["letterSpacing"]],
        [["line-height"], ["lineHeight"]],
        [["list-style-image"], ["listStyleImage"]],
        [["list-style-position"], ["listStylePosition"]],
        [["list-style-type"], ["listStyleType"]],
        [["list-style"], ["listStyle"]],
        [["orphans"], ["orphans"]],
        [["pitch-range"], ["pitchRange"]],
        [["pitch"], ["pitch"]],
        [["quotes"], ["quotes"]],
        [["richness"], ["richness"]],
        [["speak-header"], ["speakHeader"]],
        [["speak-numeral"], ["speakNumeral"]],
        [["speak-punctuation"], ["speakPunctuation"]],
        [["speak"], ["speak"]],
        [["speech-rate"], ["speechRate"]],
        [["stress"], ["stress"]],
        [["text-align"], ["textAlign"]],
        [["text-indent"], ["textIndent"]],
        [["text-transform"], ["textTransform"]],
        [["visibility"], ["visibility"]],
        [["voice-family"], ["voiceFamily"]],
        [["volume"], ["volume"]],
        [["white-space"], ["whiteSpace"]],
        [["widows"], ["widows"]],
        [["word-spacing"], ["wordSpacing"]],
    ]
    var styleString = "width:100%;height:100%;"
    var styleObject = getComputedStyle(from)
    for (var cssName of (inheritStyleProps as any)) {
        if ((styleObject as any)[cssName[1]]) {
            //(to.style as any)[cssName] = (s as any)[cssName]
            styleString += cssName[0] + ": " + ((styleObject as any)[cssName[1]]) + ";"
        }

    }
    return styleString
}

var _currentSession = null as SpatialSession | null
export async function getSessionAsync() {
    if (_currentSession) {
        return _currentSession
    }
    _currentSession = await new Spatial().requestSession()
    return _currentSession
}


let _SpatialDivInstanceIDCounter = 0
export function SpatialIFrame(props: { className: string, src: string, children?: ReactElement | Array<ReactElement> | undefined, spatialOffset?: { x?: number, y?: number, z?: number } }) {
    props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
    if (props.spatialOffset!.x === undefined) {
        props.spatialOffset!.x = 0
    }
    if (props.spatialOffset!.y === undefined) {
        props.spatialOffset!.y = 0
    }
    if (props.spatialOffset!.z === undefined) {
        props.spatialOffset!.z = 0
    }

    // Since we do initialize/cleanup async we need to keep track of state for all instances
    let instanceState = useRef({} as any)
    let currentInstanceID = useRef(0)

    const myStyleDiv = useRef(null);
    const myDiv = useRef(null);
    async function resizeDiv() {
        let rect = (myDiv.current! as HTMLElement).getBoundingClientRect();
        let targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        let targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY

        if (!instanceState.current[currentInstanceID.current].panel) {
            return
        }
        var panel = instanceState.current[currentInstanceID.current].panel as { entity: SpatialEntity, webview: SpatialIFrameComponent }
        var entity = panel.entity
        entity.transform.position.x = targetPosX + props.spatialOffset!.x!
        entity.transform.position.y = targetPosY + props.spatialOffset!.y!
        entity.transform.position.z = props.spatialOffset!.z!
        entity.updateTransform()

        var webview = panel.webview
        await webview.setResolution(rect.width, rect.height)
    }
    async function setContent(savedId: number, str: string) {
        //var start = Date.now()

        var promise = new Promise<{ entity: SpatialEntity, webview: SpatialIFrameComponent }>(async (res, rej) => {
            let entity = await (await getSessionAsync()).createEntity()
            let webview = await (await getSessionAsync()).createIFrameComponent()
            await webview.loadURL(props.src)
            await entity.setComponent(webview)
            res({ entity: entity, webview: webview })
        })

        instanceState.current[savedId].panelP = promise
        instanceState.current[savedId].panel = (await instanceState.current[savedId].panelP) as any;
        // await WebSpatial.updatePanelContent(WebSpatial.getCurrentWindowGroup(), instanceState.current[savedId].panel, str)
        await resizeDiv();
        //var latency = (Date.now() - start) / 1000
        // WebSpatial.log(latency)
    }

    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }
        // We need to be very careful with currentInstanceID as it can get overwritten mid async call, to handle this we create state per new instance and then we must cache the id to align our create/destroy logic
        currentInstanceID.current = ++_SpatialDivInstanceIDCounter
        instanceState.current[currentInstanceID.current] = {
            panel: null,
            panelP: new Promise((res) => { res(null) }),
            createP: new Promise((res) => { res(null) }),
        }
        window.addEventListener("resize", resizeDiv);

        (myDiv.current! as HTMLElement).style.visibility = "visible"
        let innerStr = "<div style=\"" + getInheritedStyle(myStyleDiv.current!) + "\">" + ReactDomServer.renderToString(props.children) + "</div>"
        innerStr = encodeURIComponent(innerStr.replace("remote-click", "onclick"))
        instanceState.current[currentInstanceID.current].createP = setContent(currentInstanceID.current, innerStr);
        (myDiv.current! as HTMLElement).style.visibility = "hidden"

        return () => {
            // Get reference to id so it isn't overwritten when a new instance is created
            var savedId = currentInstanceID.current
            removeEventListener("resize", resizeDiv);
            (async () => {
                await instanceState.current[savedId].createP
                await instanceState.current[savedId].panelP;
                if (!instanceState.current[savedId].panel) {
                    return
                }
                var panel = instanceState.current[savedId].panel as { entity: SpatialEntity, webview: SpatialIFrameComponent }
                panel.entity.destroy()
                panel.webview.destroy()

                //    WebSpatial.destroyWebPanel(WebSpatial.getCurrentWindowGroup(), instanceState.current[savedId].panel)
                delete instanceState.current[savedId]
            })()

        }
    }, [])
    useEffect(() => {
        if (!(window as any).WebSpatailEnabled) {
            return
        }
        resizeDiv()
        return () => {
        }
    }, [props.children])

    return (
        <div ref={myDiv} className={props.className}>
            {props.children}
            <div ref={myStyleDiv}></div>
        </div>
    )
}


// export function SpatialModel(props: { webViewID: string, className: string, children?: ReactElement | Array<ReactElement>, spatialOffset?: { x?: number, y?: number, z?: number } }) {
//     props = { ...{ spatialOffset: { x: 0, y: 0, z: 0 } }, ...props }
//     if (props.spatialOffset!.x === undefined) {
//         props.spatialOffset!.x = 0
//     }
//     if (props.spatialOffset!.y === undefined) {
//         props.spatialOffset!.y = 0
//     }
//     if (props.spatialOffset!.z === undefined) {
//         props.spatialOffset!.z = 0
//     }

//     const myDiv = useRef(null);
//     useEffect(() => {
//         if (!(window as any).WebSpatailEnabled) {
//             return
//         }

//         var resizeDiv = async () => {
//             var element = (myDiv.current! as HTMLElement)
//             var rect = element.getBoundingClientRect();
//             var curPosX = (rect.left + ((rect.right - rect.left) / 2))
//             var curPosY = (rect.bottom + ((rect.top - rect.bottom) / 2)) + window.scrollY
//             await WebSpatial.updateDOMModelPosition(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), props.webViewID, { x: curPosX, y: curPosY, z: props.spatialOffset!.z! })
//         }
//         var setContent = async () => {
//             await WebSpatial.createDOMModel(WebSpatial.getCurrentWindowGroup(), WebSpatial.getCurrentWebPanel(), props.webViewID, "http://testIP:5173/src/assets/FlightHelmet.usdz")
//             await resizeDiv()
//         }
//         setContent()

//         addEventListener("resize", resizeDiv);

//         return () => {
//             removeEventListener("resize", resizeDiv)
//         }
//     }, [])

//     return (
//         <div ref={myDiv} className={props.className}>
//             {((window as any).WebSpatailEnabled) ? <div /> : props.children}
//         </div>
//     )
// }
